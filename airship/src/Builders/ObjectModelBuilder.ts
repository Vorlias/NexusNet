import { Game } from "@Easy/Core/Shared/Game";
import {
	ClientBuilder,
	ContextNetworkModel,
	NetworkModelConfiguration,
	NetworkObjectModelBuilder,
	RemoteDeclarations,
	ScopeBuilder,
	ScopeObjectModelDeclaration,
	ServerBuilder,
	SharedBuilder,
} from "../Core/Types/NetworkObjectModel";
import { Identity, MergeIdentity, Named } from "../Core/Types/Utility";
import { AnyNetworkDeclaration, DeclarationRemoteKeys } from "../Core/Types/Declarations";
import {
	ClientRemoteContext,
	NexusClientContext,
	NexusServerContext,
	RemoteContext,
	ServerRemoteContext,
} from "../Core/Generators/RemoteContext";
import { ServerEvent } from "../Objects/Server/ServerEvent";
import { ClientEvent } from "../Objects/Client/ClientEvent";
import { AirshipNetworkModelConfiguration } from "../NOM/NetworkObjectModel";
import { ServerFunction } from "../Objects/Server/ServerFunction";
import { ClientFunction } from "../Objects/Client/ClientFunction";
import { ServerMessagingEvent } from "../Objects/Server/ServerMessagingEvent";

type Scoped<K extends string, T extends RemoteDeclarations> = { [P in keyof T as `${K}/${P & string}`]: T[P] };

export interface AirshipContextNetworkModel<TDeclarations extends RemoteDeclarations>
	extends ContextNetworkModel<TDeclarations> {}

export class AirshipNetworkObjectModelBuilder<TDeclarations extends RemoteDeclarations = defined>
	implements NetworkObjectModelBuilder<TDeclarations>, ScopeBuilder<TDeclarations>
{
	public declarations = {} as TDeclarations;
	public configuration: Writable<AirshipNetworkModelConfiguration> = {
		Debugging: false,
		Logging: Game.IsEditor(),
		UseBuffers: false,
	};

	/**
	 * Converts the object model into a scoped model declaration
	 */
	AsScope(configuration?: Partial<NetworkModelConfiguration>): ScopeObjectModelDeclaration<TDeclarations> {
		const scoped = {
			Type: "Scope",
			Declarations: table.freeze({ ...this.declarations }),
			Configuration: table.freeze({ ...this.configuration, ...configuration }),
		} satisfies ScopeObjectModelDeclaration<TDeclarations>;

		return table.freeze(scoped);
	}

	/**
	 * Adds a scoped network object model
	 * @param scope
	 * @param scoped
	 * @returns
	 */
	AddScope<const KScope extends string, UDeclarations extends RemoteDeclarations>(
		scope: KScope,
		scoped: ScopeObjectModelDeclaration<UDeclarations>,
	) {
		if (scoped instanceof AirshipNetworkObjectModelBuilder) {
			for (const [key, value] of pairs(scoped.declarations) as IterableFunction<
				LuaTuple<[string, RemoteDeclarations[number]]>
			>) {
				(this.declarations as RemoteDeclarations)[`${scope}/${key}`] = table.freeze({ ...value });
			}

			return this as never as AirshipNetworkObjectModelBuilder<
				MergeIdentity<Scoped<KScope, UDeclarations>, TDeclarations>
			>;
		} else {
			for (const [key, value] of pairs(scoped.Declarations) as IterableFunction<
				LuaTuple<[string, RemoteDeclarations[number]]>
			>) {
				(this.declarations as RemoteDeclarations)[`${scope}/${key}`] = table.freeze({ ...value });
			}

			return this as never as AirshipNetworkObjectModelBuilder<
				MergeIdentity<Scoped<KScope, UDeclarations>, TDeclarations>
			>;
		}
	}

	/**
	 * Adds a network object handled by the server
	 * @param id The id of the server-handled network object
	 * @param declaration The declaration of the network object
	 * @returns
	 */
	AddServer<const TName extends string, TNomRemote extends AnyNetworkDeclaration>(
		id: TName,
		declaration: ServerBuilder<TNomRemote>,
	): AirshipNetworkObjectModelBuilder<MergeIdentity<Identity<Named<TName, TNomRemote>>, TDeclarations>> {
		const definition = declaration.OnServer(this.configuration);
		this.declarations = {
			...this.declarations,
			[id]: definition,
		};

		return this as never;
	}

	/**
	 * Adds a network object handled by the client
	 * @param id The id of the client-handled network object
	 * @param declaration The declaration of the network object
	 * @returns
	 */
	AddClient<const TName extends string, TNomRemote extends AnyNetworkDeclaration>(
		id: TName,
		declaration: ClientBuilder<TNomRemote>,
	): AirshipNetworkObjectModelBuilder<MergeIdentity<Identity<Named<TName, TNomRemote>>, TDeclarations>> {
		const definition = declaration.OnClient(this.configuration);
		this.declarations = {
			...this.declarations,
			[id]: definition,
		};

		return this as never;
	}

	/**
	 * Adds a network object that can be handled by either the server or client
	 * @param id The id of the network object
	 * @param declaration The declaration of the network object
	 * @returns
	 */
	AddBidirectional<const TName extends string, TNomRemote extends AnyNetworkDeclaration>(
		id: TName,
		declaration: SharedBuilder<TNomRemote>,
	): AirshipNetworkObjectModelBuilder<MergeIdentity<Identity<Named<TName, TNomRemote>>, TDeclarations>> {
		const definition = declaration.OnShared(this.configuration);
		this.declarations = {
			...this.declarations,
			[id]: definition,
		};

		return this as never;
	}

	SetConfiguration(configuration: Partial<AirshipNetworkModelConfiguration>): this {
		this.configuration = {
			...this.configuration,
			...configuration,
		};
		return this;
	}

	Build(): AirshipContextNetworkModel<TDeclarations> {
		const objectCache = new Map<keyof TDeclarations, RemoteContext<TDeclarations, any>>();

		const clientContext: ClientRemoteContext<TDeclarations> = new NexusClientContext(
			Game.IsClient(),
			{
				event: ClientEvent,
				function: ClientFunction,
			},
			this.declarations,
			this.configuration,
		);
		const serverContext: ServerRemoteContext<TDeclarations> = new NexusServerContext(
			Game.IsServer(),
			{
				event: ServerEvent,
				function: ServerFunction,
				messaging: ServerMessagingEvent,
			},
			this.declarations,
			this.configuration,
		);

		return {
			Get<K extends DeclarationRemoteKeys<TDeclarations>>(key: K) {
				if (objectCache.has(key)) return objectCache.get(key) as RemoteContext<TDeclarations, K>;

				const ContextError = (message: string) =>
					setmetatable(
						{},
						{
							__index: (_, index) => error(`Attempt to index '${index}': ` + message),
						},
					);

				const context = {
					Server:
						Game.IsHosting() || Game.IsServer()
							? serverContext.Get(key as never)
							: ContextError(`Server remotes can only be used on a host or server`),
					Client:
						Game.IsHosting() || Game.IsClient()
							? clientContext.Get(key as never)
							: ContextError("Client remotes can only be used by a host or client"),
				} as RemoteContext<TDeclarations, K>;
				return context;
			},
		};
	}
}
