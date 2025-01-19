import { Game } from "@Easy/Core/Shared/Game";
import {
	ClientBuilder,
	ContextNetworkModel,
	NetworkModelConfiguration,
	NetworkObjectModelBuilder,
	RemoteDeclarations,
	ServerBuilder,
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
import { AirshipNetworkModelConfiguration } from "../Types/NetworkObjectModel";

export class AirshipNetworkObjectModelBuilder<TDeclarations extends RemoteDeclarations = defined>
	implements NetworkObjectModelBuilder<TDeclarations>
{
	public declarations = {} as TDeclarations;
	public configuration: Writable<AirshipNetworkModelConfiguration> = {
		Debugging: false,
		Logging: Game.IsEditor(),
		UseBuffers: false,
	};

	AddServer<TName extends string, TNomRemote extends AnyNetworkDeclaration>(
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

	AddClient<TName extends string, TNomRemote extends AnyNetworkDeclaration>(
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

	SetConfiguration(configuration: Partial<AirshipNetworkModelConfiguration>): this {
		this.configuration = {
			...this.configuration,
			...configuration,
		};
		return this;
	}

	Build(): ContextNetworkModel<TDeclarations> {
		const objectCache = new Map<keyof TDeclarations, RemoteContext<TDeclarations, any>>();

		const clientContext: ClientRemoteContext<TDeclarations> = new NexusClientContext(
			Game.IsClient(),
			{
				event: ClientEvent,
				function: undefined!,
			},
			this.declarations,
			this.configuration,
		);
		const serverContext: ServerRemoteContext<TDeclarations> = new NexusServerContext(
			Game.IsServer(),
			{
				event: ServerEvent,
				function: undefined!,
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
