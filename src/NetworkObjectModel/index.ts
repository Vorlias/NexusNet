import { NexusClientEvent } from "../Client/ClientEvent";
import { ClientInvokeFunction, ClientListenerEvent, ClientSenderEvent } from "../Client/ClientNetworkTypes";
import { NexusServerEvent } from "../Server/ServerEvent";
import { ServerMessagingEvent } from "../Server/ServerMessagingEvent";
import { ServerListenerEvent, ServerListenerFunction, ServerSenderEvent } from "../Server/ServerNetworkTypes";
import { NetworkType } from "../Types/NetworkType";
import { Identity } from "../Types/Utility";

export enum RemoteRunContext {
	Server = "S",
	Client = "C",
	Both = "SC",
}

export const enum ConfigFlags {
	None = 0,
	VerboseDebugging = 1 << 0,
	RuntimeHashNames = 1 << 1,
}

export const enum NetworkingFlags {
	None = 0,
	/** @internal @deprecated Pass all arguments as values rather than via a buffer */
	ArgumentsByValue = 1 << 0,
	/** @internal @deprecated Treat the remote as a type-only remote, no checks */
	RbxNet3BackwardsCompat = 1 << 1,
}

const runService = game.GetService("RunService");
export namespace NOM {
	export interface Config {
		readonly Flags?: ConfigFlags;
	}

	export const ConfigDefaults: Config = {
		Flags: runService.IsStudio() ? ConfigFlags.RuntimeHashNames : 0,
	};

	export function hasConfigFlag(flags: ConfigFlags | undefined, flag: ConfigFlags) {
		return flags !== undefined && (flags & flag) !== 0;
	}

	export function CreateNamespace(): NOM.NamespaceDeclaration<{}> {
		return {
			Type: "Namespace",
			Declarations: {},
		};
	}

	export function PushNamespace(
		namespace: NOM.NamespaceDeclaration<NOM.DeclarationRecord>,
		name: string,
	): NOM.NamespaceDeclaration<NOM.DeclarationRecord> | undefined {
		const decl = namespace.Declarations[name];

		if (decl === undefined) {
			const newNamespace = CreateNamespace();
			namespace.Declarations[name] = decl;
			print("create scoped", name);
			return newNamespace;
		} else if (decl.Type === "Namespace") {
			return decl;
		}
	}

	export interface EventConfig extends Config {
		/**
		 * Compress the event stream - only use this if it's something large like voxel data
		 */
		readonly Compression?: CastsToEnum<Enum.CompressionAlgorithm>;
	}

	export interface FunctionConfig extends Config {}

	export interface EventDeclaration<TRunContext extends RemoteRunContext, _TArgs extends ReadonlyArray<unknown>> {
		readonly Type: "Event";
		readonly RunContext: TRunContext;
		readonly Unreliable: boolean;
		readonly Arguments: NetworkType.ToTypeArray<_TArgs> | undefined;
		readonly Flags: NetworkingFlags;
		readonly Config: EventConfig;
	}

	export interface CrossServerEventDeclaration<_TArgs extends ReadonlyArray<unknown>> {
		readonly Type: "Messaging";
		readonly Arguments: NetworkType.Any[];
	}

	export interface NamespaceDeclaration<_TDeclarations extends DeclarationRecord> {
		readonly Type: "Namespace";
		readonly Declarations: _TDeclarations;
	}

	export interface ServerEventDeclaration<_TArgs extends ReadonlyArray<unknown>> extends EventDeclaration<
		RemoteRunContext.Server,
		_TArgs
	> {}

	export interface ClientEventDeclaration<_TArgs extends ReadonlyArray<unknown>> extends EventDeclaration<
		RemoteRunContext.Client,
		_TArgs
	> {}

	export interface FunctionDeclaration<
		TRunContext extends RemoteRunContext,
		_TArgs extends ReadonlyArray<unknown>,
		_TRet,
	> {
		readonly RunContext: TRunContext;
		readonly Type: "Function";
		readonly Flags: NetworkingFlags;

		readonly Arguments: NetworkType.Any[];
		readonly Returns: NetworkType.Any;

		readonly Config: FunctionConfig;
	}

	export interface ServerFunctionDeclaration<
		_TArgs extends ReadonlyArray<unknown>,
		_TRet,
	> extends FunctionDeclaration<RemoteRunContext.Server, _TArgs, _TRet> {
		// readonly ServerCallbackMiddleware: ServerFunctionCallbackMiddleware[];
	}

	// export interface ClientFunctionDeclaration<
	// 	_TArgs extends ReadonlyArray<unknown>,
	// 	_TRet,
	// > extends FunctionDeclaration<RemoteRunContext.Client, _TArgs, _TRet> {

	// }

	export type Declaration =
		| ServerEventDeclaration<any>
		| ClientEventDeclaration<any>
		| ServerFunctionDeclaration<any, any>
		| CrossServerEventDeclaration<any>
		| NamespaceDeclaration<any>;

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
		[
			K in ExtractKeys<
				T,
				| ServerEventDeclaration<any>
				| ClientEventDeclaration<any>
				| ServerFunctionDeclaration<any, any>
				// | ClientFunctionDeclaration<any, any>
				| CrossServerEventDeclaration<any>
				| NamespaceDeclaration<any>
			>
		]: T[K];
	};

	export type FilterClientDeclarations<T extends DeclarationRecord> = {
		[
			K in ExtractKeys<
				T,
				| ServerEventDeclaration<any>
				| ClientEventDeclaration<any>
				| ServerFunctionDeclaration<any, any>
				// | ClientFunctionDeclaration<any, any>
				| NamespaceDeclaration<any>
			>
		]: T[K];
	};

	export type InferServerRemote<T> =
		T extends ServerEventDeclaration<infer A>
			? ServerSenderEvent<A>
			: T extends ClientEventDeclaration<infer A>
				? ServerListenerEvent<A>
				: T extends ServerFunctionDeclaration<infer A, infer R>
					? ServerListenerFunction<A, R>
					: T extends CrossServerEventDeclaration<infer A>
						? ServerMessagingEvent<A>
						: never;

	export type InferClientRemote<T> =
		T extends ClientEventDeclaration<infer A>
			? ClientSenderEvent<A>
			: T extends ServerFunctionDeclaration<infer A, infer R>
				? ClientInvokeFunction<A, R>
				: T extends ServerEventDeclaration<infer A>
					? ClientListenerEvent<A>
					: never;

	type RemoveNever<T> = { [P in keyof T as T[P] extends never ? never : P]: T[P] };
	export type ServerContext<T> = RemoveNever<{
		[P in keyof T]: T[P] extends NamespaceDeclaration<infer N> ? ServerContext<N> : InferServerRemote<T[P]>;
	}>;
	export type ClientContext<T> = RemoveNever<{
		[P in keyof T]: T[P] extends NamespaceDeclaration<infer N> ? ClientContext<N> : InferClientRemote<T[P]>;
	}>;

	export interface Model<T extends DeclarationRecord> {
		readonly Server: Identity<ServerContext<T>>;
		readonly Client: Identity<ClientContext<T>>;
	}
}
