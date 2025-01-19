/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import {
	ClientCallbackMiddleware,
	ClientInvokeMiddleware,
	ServerCallbackMiddleware,
	ServerInvokeMiddleware,
} from "../Middleware/Types";
import {
	AnyClientNetworkObject,
	AnyServerNetworkObject,
	DeclarationRemoteKeys,
	FilterClientDeclarations,
	FilterServerDeclarations,
} from "./Declarations";
import { InferClientRemote, InferServerRemote } from "./Inference";
import { StaticNetworkType, ToNetworkArguments } from "./NetworkTypes";
import { MergeIdentity, Named } from "./Utility";

export type RemoteDeclarations = Record<string, NetworkObjectDeclaration>;

export interface NetworkModelConfiguration {
	readonly Debugging: boolean;
	readonly UseBuffers: boolean;
	readonly Logging: boolean;

	readonly ServerCallbackMiddleware?: ServerCallbackMiddleware[];
	readonly ClientCallbackMiddleware?: ClientCallbackMiddleware[];
}

export enum RemoteRunContext {
	Server,
	Client,
}

export interface ServerBuilder<TServer> {
	OnServer(configuration: NetworkModelConfiguration): TServer;
}

export interface ClientBuilder<TClient> {
	OnClient(configuration: NetworkModelConfiguration): TClient;
}

interface EventDeclaration<TRunContext extends RemoteRunContext, _TArgs extends ReadonlyArray<unknown>> {
	readonly Type: "Event";
	readonly UseBufferSerialization: boolean;
	readonly Debugging: boolean;
	readonly RunContext: TRunContext;

	readonly Unreliable: boolean;
	readonly Arguments?: StaticNetworkType<any>[];
}

interface FunctionDeclaration<TRunContext extends RemoteRunContext, _TArgs extends ReadonlyArray<unknown>, _TRet> {
	readonly Type: "Function";
	readonly UseBufferSerialization: boolean;
	readonly Debugging: boolean;
}

export interface ServerEventDeclaration<_TArgs extends ReadonlyArray<unknown>>
	extends EventDeclaration<RemoteRunContext.Server, _TArgs> {
	readonly CallbackMiddleware: ServerCallbackMiddleware[];
	readonly InvokeMiddleware: ServerInvokeMiddleware[];
}

export interface ClientEventDeclaration<_TArgs extends ReadonlyArray<unknown>>
	extends EventDeclaration<RemoteRunContext.Client, _TArgs> {
	readonly CallbackMiddleware: ClientCallbackMiddleware[];
	readonly InvokeMiddleware: ClientInvokeMiddleware[];
}

export interface ServerFunctionDeclaration<_TArgs extends ReadonlyArray<unknown>, _TRet>
	extends FunctionDeclaration<RemoteRunContext.Server, _TArgs, _TRet> {}
export interface ClientFunctionDeclaration<_TArgs extends ReadonlyArray<unknown>, _TRet>
	extends FunctionDeclaration<RemoteRunContext.Client, _TArgs, _TRet> {}

type NetworkObjectDeclaration =
	| ServerEventDeclaration<never>
	| ClientEventDeclaration<never>
	| ClientFunctionDeclaration<never, never>
	| ServerFunctionDeclaration<never, never>;

export interface ContextNetworkObject<TServer extends AnyServerNetworkObject, TClient extends AnyClientNetworkObject> {
	/**
	 * Use this network object in the server context
	 */
	Server: TServer;
	/**
	 * Use this network object in the client context
	 */
	Client: TClient;
}

export interface ContextNetworkModel<TDeclarations extends RemoteDeclarations> {
	Get<K extends DeclarationRemoteKeys<TDeclarations>>(
		k: K,
	): ContextNetworkObject<
		InferServerRemote<FilterServerDeclarations<TDeclarations>[K]>,
		InferClientRemote<FilterClientDeclarations<TDeclarations>[K]>
	>;
}

interface NetworkObjectBuilder {
	unreliable: boolean;
	useBuffer: boolean;

	AsUnreliable(): this;
	SetUseBuffer(useBuffer: boolean): this;
}

export interface NetworkEventBuilder<TArgs extends ReadonlyArray<unknown>>
	extends ServerBuilder<ServerEventDeclaration<TArgs>>,
		ClientBuilder<ClientEventDeclaration<TArgs>>,
		NetworkObjectBuilder {
	WithArguments<T extends ReadonlyArray<unknown> = TArgs>(...values: ToNetworkArguments<T>): NetworkEventBuilder<T>;
}

export interface NetworkFunctionBuilder<TArgs extends ReadonlyArray<unknown>, TRet>
	extends ServerBuilder<ServerFunctionDeclaration<TArgs, TRet>>,
		ClientBuilder<ClientFunctionDeclaration<TArgs, TRet>>,
		NetworkObjectBuilder {
	WithArguments<T extends ReadonlyArray<unknown> = TArgs>(
		...values: ToNetworkArguments<T>
	): NetworkFunctionBuilder<T, TRet>;

	WhichReturns<R>(returnValue: StaticNetworkType<R>): NetworkFunctionBuilder<TArgs, R>;
}

export interface NetworkObjectModelBuilder<TDeclarations extends RemoteDeclarations = defined> {
	/**
	 * Adds a server-based network object
	 *
	 * This is for events that the server fires, as well as functions the server handles
	 * @param id The id of this server owned object
	 * @param declaration The declaration of the server owned object
	 */
	AddServer<TName extends string, TNomRemote extends NetworkObjectDeclaration>(
		id: TName,
		declaration: ServerBuilder<TNomRemote>,
	): NetworkObjectModelBuilder<MergeIdentity<Named<TName, TNomRemote>, TDeclarations>>;
	/**
	 * Adds a client-based network object
	 *
	 * This is for events that the client fires
	 * @param id The id of this server owned object
	 * @param declaration The declaration of the server owned object
	 */
	AddClient<TName extends string, TNomRemote extends NetworkObjectDeclaration>(
		id: TName,
		declaration: ClientBuilder<TNomRemote>,
	): NetworkObjectModelBuilder<MergeIdentity<Named<TName, TNomRemote>, TDeclarations>>;

	SetConfiguration(configuration: Partial<NetworkModelConfiguration>): this;

	Build(): ContextNetworkModel<TDeclarations>;
}
