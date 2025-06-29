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
import { StaticNetworkType, ToNetworkArguments } from "../Core/Types/NetworkTypes";
import { NexusConfiguration } from "../Core/Configuration";
import {
	ClientCallbackMiddleware,
	ClientInvokeMiddleware,
	ServerCallbackMiddleware,
	ServerInvokeMiddleware,
} from "../Core/Middleware/Types";
// import { NexusTypes } from "../Framework";
import { NexusNetworkBehaviour } from "../Components/NexusNetworkBehaviour";
import { NexusTypes } from "../Framework/AirshipTypes";

export class AirshipEventBuilder<TArgs extends ReadonlyArray<unknown>>
	implements NetworkEventBuilder<TArgs>, SharedBuilder<BidirectionalEventDeclaration<TArgs>>
{
	unreliable = false;
	useBuffer = false;
	echo = false;

	arguments: StaticNetworkType[] | undefined;
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
		this.arguments = values as StaticNetworkType<TArgs>[];
		return this as never as AirshipEventBuilder<T>;
	}

	WithServerMiddleware(
		build: (builder: ServerMiddlewareBuilder<TArgs>) => ServerMiddlewareBuilder<TArgs>,
	): NetworkServerEventBuilder<TArgs> {
		const builder: ServerMiddlewareBuilder<TArgs> = {
			OnClientCallback: (callback: ClientCallbackMiddleware<TArgs>) => {
				this.callbackMiddleware.push(callback);
				return builder as unknown as ServerMiddlewareBuilder<TArgs>;
			},
			OnServerInvoke: (callback: ServerInvokeMiddleware<TArgs>) => {
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
				callback: ServerCallbackMiddleware<TArgs, TOut>,
			) => {
				this.callbackMiddleware.push(callback);
				return builder as unknown as ClientMiddlewareBuilder<TOut>;
			},
			OnClientInvoke: (callback: ClientInvokeMiddleware<TArgs>) => {
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
			Arguments: this.arguments,
			Unreliable: this.unreliable,
		};

		return table.freeze(declaration);
	}
}
