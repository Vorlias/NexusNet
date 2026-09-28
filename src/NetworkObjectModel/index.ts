import { ClientListenerEvent, ClientSenderEvent } from "../Client/ClientNetworkTypes";
import { ServerListenerEvent, ServerSenderEvent } from "../Server/ServerNetworkTypes";
import { NetworkType } from "../Types/NetworkType";

export enum RemoteRunContext {
	Server,
	Client,
	Both,
}

export const enum ConfigFlags {
	None = 0,
	VerboseDebugging = 1 << 0,
}

export const enum NetworkingFlags {
	None = 0,
}

export namespace NOM {
	export interface Config {
		readonly Flags?: ConfigFlags;
	}

	export interface EventConfig extends Config {
		/**
		 * Compress the event stream - only use this if it's something large like voxel data
		 */
		readonly Compression?: CastsToEnum<Enum.CompressionAlgorithm>;
	}

	export interface EventDeclaration<TRunContext extends RemoteRunContext, _TArgs extends ReadonlyArray<unknown>> {
		readonly Type: "Event";
		readonly RunContext: TRunContext;
		readonly Unreliable: boolean;
		readonly Arguments: NetworkType.ToTypeArray<_TArgs> | undefined;
		readonly Flags: NetworkingFlags;
		readonly Config: EventConfig;
	}

	export interface ServerEventDeclaration<_TArgs extends ReadonlyArray<unknown>> extends EventDeclaration<
		RemoteRunContext.Server,
		_TArgs
	> {}

	export interface ClientEventDeclaration<_TArgs extends ReadonlyArray<unknown>> extends EventDeclaration<
		RemoteRunContext.Client,
		_TArgs
	> {}

	export type Declaration = ServerEventDeclaration<any> | ClientEventDeclaration<any>;

	export type DeclarationRecord = { [P in string]: Declaration };

	export interface ClientBuilder<TClient> {
		OnClient(configuration: Config): TClient;
	}

	export interface ServerBuilder<TServer> {
		OnServer(configuration: Config): TServer;
	}

	export type InferServer<T> = T extends ServerBuilder<infer O> ? O : never;
	export type InferClient<T> = T extends ClientBuilder<infer O> ? O : never;

	export type FilterServerDeclarations<T extends DeclarationRecord> = {
		[K in ExtractKeys<T, EventDeclaration<any, any>>]: T[K];
	};

	export type FilterClientDeclarations<T extends DeclarationRecord> = {
		[K in ExtractKeys<T, EventDeclaration<any, any>>]: T[K];
	};

	export type InferServerRemote<T> =
		T extends ServerEventDeclaration<infer A>
			? ServerSenderEvent<A>
			: T extends ClientEventDeclaration<infer A>
				? ServerListenerEvent<A>
				: never;

	export type InferClientRemote<T> =
		T extends ClientEventDeclaration<infer A>
			? ClientSenderEvent<A>
			: T extends ServerEventDeclaration<infer A>
				? ClientListenerEvent<A>
				: never;

	type ServerContext<T> = { [P in keyof T]: InferServerRemote<T[P]> };
	type ClientContext<T> = { [P in keyof T]: InferClientRemote<T[P]> };

	export interface Model<T extends DeclarationRecord> {
		readonly Server: ServerContext<T>;
		readonly Client: ClientContext<T>;
	}
}
