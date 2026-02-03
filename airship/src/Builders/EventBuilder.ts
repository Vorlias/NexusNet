import {
	ClientEventDeclaration,
	NetworkClientEventBuilder,
	NetworkEventBuilder,
	NetworkModelConfiguration,
	NetworkServerEventBuilder,
	RemoteRunContext,
	ServerEventDeclaration,
	ServerMiddlewareBuilder,
	ClientMiddlewareBuilder,
	SharedBuilder,
	BidirectionalEventDeclaration,
} from "../Core/Types/NetworkObjectModel";
import { NetworkType, ToNetworkArguments } from "../Core/Types/NetworkTypes";
import { NexusConfiguration } from "../Core/Configuration";
import {
	ClientEventCallbackMiddleware,
	ClientEventInvokeMiddleware,
	ServerEventCallbackMiddleware,
	ServerEventInvokeMiddleware,
} from "../Core/Middleware/Types";

import { NexusNetworkBehaviour } from "../Components/NexusNetworkBehaviour";
import { NexusTypes } from "../Framework/AirshipTypes";
import { NetworkEventAuthority } from "../Objects/Internal/NetworkEvent";
import { createRateLimitMiddleware, RateLimitOptions } from "../Core/Middleware/RateLimit";
import { Player } from "@Easy/Core/Shared/Player/Player";
import { Game } from "@Easy/Core/Shared/Game";
import { NexusSentinel } from "../Framework/Events";

export class AirshipEventBuilder<TArgs extends ReadonlyArray<unknown>>
	implements NetworkEventBuilder<TArgs>, SharedBuilder<BidirectionalEventDeclaration<TArgs>>
{
	unreliable = false;
	useBuffer = false;
	echo = false;

	arguments: NetworkType.Any[] | undefined;
	private callbackMiddleware: Callback[] = [];
	private invokeMiddleware: Callback[] = [];

	SetUseBuffer(useBuffer: boolean): this {
		this.useBuffer = useBuffer;
		return this;
	}

	AsUnreliable(): this {
		this.unreliable = true;
		return this;
	}

	Bidirectional(this: SharedBuilder<BidirectionalEventDeclaration<TArgs>>) {
		// essentially a type conversion lol
		return this;
	}

	/**
	 * Binds this network event to a specific network object
	 * @param object The network object to bind to
	 * @param requiresOwnership Whether or not it requires ownership to invoke this method
	 * @returns
	 */
	BindIdentity(this: NetworkClientEventBuilder<TArgs>, object: NexusNetworkBehaviour, requiresOwnership = false) {
		(this.arguments ??= []).unshift(NexusTypes.Identity);

		let boundNetworkIdentity: NetworkIdentity | undefined;
		return (this as unknown as NetworkClientEventBuilder<[id: NetworkIdentity, ...TArgs]>).WithClientMiddleware(
			(middleware) =>
				middleware.OnServerCallback((send, i) => {
					if (boundNetworkIdentity === undefined)
						boundNetworkIdentity =
							object["networkIdentity"] ?? object.gameObject.GetComponent<NetworkIdentity>();

					return (player, identity, ...args) => {
						if (boundNetworkIdentity?.netId !== identity.netId) return;
						if (
							requiresOwnership &&
							boundNetworkIdentity.connectionToClient?.connectionId !== player.connectionId
						) {
							return;
						}

						send(player, identity, ...args);
					};
				}),
		);
	}

	public WithArguments<T extends ReadonlyArray<unknown> = TArgs>(
		...values: ToNetworkArguments<T>
	): AirshipEventBuilder<T> {
		this.arguments = values as NetworkType.OfType<TArgs>[];
		return this as never as AirshipEventBuilder<T>;
	}

	/**
	 * Adds a client request rate limiter per minute with the given request cap
	 * @param requestsPerMinute The maximum requests per minute.
	 *
	 * If you want to control the timeframe, use the `RateLimitOptions` overload of this function.
	 * @deprecated Experimental
	 */
	WithClientRateLimit(requestsPerMinute: number): NetworkClientEventBuilder<TArgs>;
	/**
	 * Adds a client request rate limiter with the given options
	 * @param rateLimitOptions The rate limiter options
	 *
	 * @deprecated Experimental
	 */
	WithClientRateLimit(rateLimitOptions: RateLimitOptions): NetworkClientEventBuilder<TArgs>;
	WithClientRateLimit(rateLimitOptions: RateLimitOptions | number): NetworkClientEventBuilder<TArgs> {
		const middleware = createRateLimitMiddleware<TArgs>(
			typeIs(rateLimitOptions, "number")
				? {
						timeoutSeconds: 60,
						requestsPerTimeout: rateLimitOptions,
				  }
				: rateLimitOptions,
		);
		this.callbackMiddleware.push(middleware.serverCallback);
		this.invokeMiddleware.push(middleware.clientInvoke);
		return this;
	}

	/**
	 * Define a predicate that only allows certain players to invoke this event
	 *
	 * Example:
	 * ```ts
	 * Nexus.Event().WithClientFilter((player) => {
	 * 		return player.orgRoleName === "Developer"; // allow only developers
	 * })
	 * ```
	 * @param predicate The predicate to filter valid vs invalid players
	 * @deprecated Experimental
	 */
	WithClientFilter(predicate: (player: Player) => boolean): NetworkClientEventBuilder<TArgs> {
		this.callbackMiddleware.push(((invoke) => {
			return (player, ...args) => {
				if (!predicate(player)) {
					NexusSentinel.onServerPredicateFalse.Fire(player);
					return;
				}

				invoke(player, ...args);
			};
		}) satisfies ServerEventCallbackMiddleware<TArgs>);
		this.invokeMiddleware.push(() => predicate(Game.localPlayer));

		return this;
	}

	WithServerMiddleware(
		build: (builder: ServerMiddlewareBuilder<TArgs>) => ServerMiddlewareBuilder<TArgs>,
	): NetworkServerEventBuilder<TArgs> {
		const builder: ServerMiddlewareBuilder<TArgs> = {
			OnClientCallback: (callback: ClientEventCallbackMiddleware<TArgs>) => {
				this.callbackMiddleware.push(callback);
				return builder as unknown as ServerMiddlewareBuilder<TArgs>;
			},
			OnServerInvoke: (callback: ServerEventInvokeMiddleware<TArgs>) => {
				this.invokeMiddleware.push(callback);
				return builder as unknown as ServerMiddlewareBuilder<TArgs>;
			},
		};

		build(builder);
		return this as never as NetworkServerEventBuilder<TArgs>;
	}

	WithClientMiddleware(
		build: (builder: ClientMiddlewareBuilder<TArgs>) => ClientMiddlewareBuilder<TArgs>,
	): NetworkClientEventBuilder<TArgs> {
		const builder: ClientMiddlewareBuilder<TArgs> = {
			OnServerCallback: <TOut extends ReadonlyArray<unknown> = TArgs>(
				callback: ServerEventCallbackMiddleware<TArgs, TOut>,
			) => {
				this.callbackMiddleware.push(callback);
				return builder as unknown as ClientMiddlewareBuilder<TOut>;
			},
			OnClientInvoke: (callback: ClientEventInvokeMiddleware<TArgs>) => {
				this.invokeMiddleware.push(callback);
				return builder as unknown as ClientMiddlewareBuilder<TArgs>;
			},
		};

		build(builder);
		return this as never as NetworkClientEventBuilder<TArgs>;
	}

	OnServer(configuration: NetworkModelConfiguration): ServerEventDeclaration<TArgs> {
		const flags = NexusConfiguration.EncodeConfigFlags({
			UseBufferSerialization: configuration.UseBuffers || this.useBuffer,
			EnforceArgumentCount: configuration.EnforceArgumentCount ?? true,
			Debugging: configuration.Debugging,
			Logging: configuration.Logging,
		});

		const declaration: ServerEventDeclaration<TArgs> = {
			Type: "Event",
			EventContext: NetworkEventAuthority.ServerAuthority,
			Flags: flags,
			RunContext: RemoteRunContext.Server,
			Arguments: this.arguments,
			CallbackMiddleware: this.callbackMiddleware,
			InvokeMiddleware: [],
			Unreliable: this.unreliable,
		};

		return table.freeze(declaration);
	}

	OnClient(configuration: NetworkModelConfiguration): ClientEventDeclaration<TArgs> {
		const flags = NexusConfiguration.EncodeConfigFlags({
			UseBufferSerialization: configuration.UseBuffers && this.useBuffer,
			EnforceArgumentCount: configuration.EnforceArgumentCount ?? true,
			Debugging: configuration.Debugging,
			Logging: configuration.Logging,
		});

		const declaration: ClientEventDeclaration<TArgs> = {
			Type: "Event",
			Flags: flags,
			RunContext: RemoteRunContext.Client,
			EventContext: NetworkEventAuthority.ClientAuthority,
			CallbackMiddleware: this.callbackMiddleware,
			InvokeMiddleware: [],
			Arguments: this.arguments,
			Unreliable: this.unreliable,
		};

		return table.freeze(declaration);
	}

	OnShared(configuration: NetworkModelConfiguration): BidirectionalEventDeclaration<TArgs> {
		const flags = NexusConfiguration.EncodeConfigFlags({
			UseBufferSerialization: configuration.UseBuffers && this.useBuffer,
			EnforceArgumentCount: configuration.EnforceArgumentCount ?? true,
			Debugging: configuration.Debugging,
			Logging: configuration.Logging,
		});

		const declaration: BidirectionalEventDeclaration<TArgs> = {
			Type: "Event",
			Flags: flags,
			RunContext: RemoteRunContext.Both,
			EventContext: NetworkEventAuthority.Both,
			Arguments: this.arguments,
			Unreliable: this.unreliable,
		};

		return table.freeze(declaration);
	}
}
