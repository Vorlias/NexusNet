/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	ClientRemoteContext,
	NexusClientContext,
	NexusServerContext,
	RemoteContext,
	ServerRemoteContext,
} from "../Core/Generators/RemoteContext";
import { AnyNetworkDeclaration, DeclarationRemoteKeys } from "../Core/Types/Declarations";
import {
	ClientBuilder,
	ContextNetworkModel,
	NetworkObjectModelBuilder,
	RemoteDeclarations,
	ServerBuilder,
} from "../Core/Types/NetworkObjectModel";
import { Identity, MergeIdentity, Named } from "../Core/Types/Utility";
import { ClientEvent } from "../Objects/Client/ClientEvent";
import { ServerEvent } from "../Objects/Server/ServerEvent";
import { RobloxNetworkModelConfiguration } from "../Types/NetworkObjectModel";

export class RobloxNetworkObjectModelBuilder<TDeclarations extends RemoteDeclarations = defined>
	implements NetworkObjectModelBuilder<TDeclarations>
{
	public declarations = {} as TDeclarations;
	public configuration: Writable<RobloxNetworkModelConfiguration> = {
		Debugging: false,
		Logging: game.GetService("RunService").IsStudio(),
		UseBuffers: false,
	};

	AddServer<TName extends string, TNomRemote extends AnyNetworkDeclaration>(
		id: TName,
		declaration: ServerBuilder<TNomRemote>,
	): RobloxNetworkObjectModelBuilder<MergeIdentity<Identity<Named<TName, TNomRemote>>, TDeclarations>> {
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
	): RobloxNetworkObjectModelBuilder<MergeIdentity<Identity<Named<TName, TNomRemote>>, TDeclarations>> {
		const definition = declaration.OnClient(this.configuration);
		this.declarations = {
			...this.declarations,
			[id]: definition,
		};

		return this as never;
	}

	SetConfiguration(configuration: Partial<RobloxNetworkModelConfiguration>): this {
		this.configuration = {
			...this.configuration,
			...configuration,
		};
		return this;
	}

	Build(): ContextNetworkModel<TDeclarations> {
		const runService = game.GetService("RunService");

		const objectCache = new Map<keyof TDeclarations, RemoteContext<TDeclarations, any>>();

		const clientContext: ClientRemoteContext<TDeclarations> = new NexusClientContext(
			runService.IsClient(),
			{
				event: ClientEvent,
				function: undefined!,
			},
			this.declarations,
			this.configuration,
		);
		const serverContext: ServerRemoteContext<TDeclarations> = new NexusServerContext(
			runService.IsServer(),
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

				const isHost = runService.IsServer() && runService.IsClient();

				const context = {
					Server:
						runService.IsServer() || isHost
							? serverContext.Get(key as never)
							: ContextError(`Server remotes can only be used on a host or server`),
					Client:
						runService.IsClient() || isHost
							? clientContext.Get(key as never)
							: ContextError("Client remotes can only be used by a host or client"),
				} as RemoteContext<TDeclarations, K>;
				return context;
			},
		};
	}
}
