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

	readonly EnforceArgumentCount?: boolean;
}

export enum RemoteRunContext {
	Server,
	Client,
}

export interface ServerBuilder<TServer> {
	OnServer(configuration: NetworkModelConfiguration): TServer;
}
export type InferServer<T> = T extends ServerBuilder<infer O> ? O : never;

export interface ClientBuilder<TClient> {
	OnClient(configuration: NetworkModelConfiguration): TClient;
}
export type InferClient<T> = T extends ClientBuilder<infer O> ? O : never;

export interface ScopeBuilder<TDeclarations extends RemoteDeclarations> {
	AsScope(configuration?: Partial<NetworkModelConfiguration>): ScopeObjectModelDeclaration<TDeclarations>;
}

export interface ScopeObjectModelDeclaration<TDeclarations extends RemoteDeclarations> {
	readonly Type: "Scope";
	readonly Declarations: TDeclarations;
	readonly Configuration: NetworkModelConfiguration;
}

export interface EventDeclaration<TRunContext extends RemoteRunContext, _TArgs extends ReadonlyArray<unknown>> {
	readonly Type: "Event";
	// readonly UseBufferSerialization: boolean;
	// readonly Debugging: boolean;
	readonly RunContext: TRunContext;

	readonly Unreliable: boolean;
	readonly Arguments: StaticNetworkType<any>[] | undefined;

	readonly Flags: NetworkingFlags;
}

export interface FunctionDeclaration<
	TRunContext extends RemoteRunContext,
	_TArgs extends ReadonlyArray<unknown>,
	_TRet,
> {
	readonly RunContext: TRunContext;
	readonly Type: "Function";
	// readonly UseBufferSerialization: boolean;
	// readonly Debugging: boolean;
	readonly Flags: NetworkingFlags;

	readonly Arguments: StaticNetworkType[];
	readonly Returns: StaticNetworkType;
}

export const enum NetworkingFlags {
	None = 0,

	UseBufferSerialization = 1 << 0,
	EnforceArgumentCount = 1 << 1,
	Logging = 1 << 2,
	Debugging = 1 << 3,

	Default = EnforceArgumentCount,
}

export interface CrossServerEventDeclaration<_TArgs extends ReadonlyArray<unknown>> {
	readonly Type: "Messaging";
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

export type NetworkObjectDeclaration =
	| ServerEventDeclaration<never>
	| ClientEventDeclaration<never>
	| ClientFunctionDeclaration<never, never>
	| ServerFunctionDeclaration<never, never>
	| CrossServerEventDeclaration<any>;

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
	): ContextNetworkObject<InferServerRemote<TDeclarations[K]>, InferClientRemote<TDeclarations[K]>>;
}

interface NetworkObjectBuilder {
	unreliable: boolean;
	useBuffer: boolean;
	arguments: StaticNetworkType[] | undefined;

	AsUnreliable(): this;
	SetUseBuffer(useBuffer: boolean): this;
}

export interface ServerMiddleware<TIn extends ReadonlyArray<unknown>, TOut extends ReadonlyArray<unknown>> {
	readonly ClientCallback: ClientCallbackMiddleware<TIn, TOut> | undefined;
	readonly ServerInvoke: ServerInvokeMiddleware<TIn, TOut> | undefined;
}

export interface ServerMiddlewareBuilder<TArgs extends ReadonlyArray<unknown>> {
	OnClientCallback(this: void, callback: ClientCallbackMiddleware<TArgs>): ServerMiddlewareBuilder<TArgs>;
	OnServerInvoke(this: void, callback: ServerInvokeMiddleware<TArgs>): ServerMiddlewareBuilder<TArgs>;
}

export interface ClientMiddlewareBuilder<TArgs extends ReadonlyArray<unknown>> {
	OnServerCallback(this: void, callback: ServerCallbackMiddleware<TArgs>): ClientMiddlewareBuilder<TArgs>;
	OnClientInvoke(this: void, callback: ClientInvokeMiddleware<TArgs>): ClientMiddlewareBuilder<TArgs>;
}

export interface NetworkServerEventBuilder<TArgs extends ReadonlyArray<unknown>>
	extends ServerBuilder<ServerEventDeclaration<TArgs>>,
		NetworkObjectBuilder {
	/**
	 * Will
	 * @param mwb
	 */
	WithServerMiddleware(
		mwb: (builder: ServerMiddlewareBuilder<TArgs>) => ServerMiddlewareBuilder<TArgs>,
	): NetworkServerEventBuilder<TArgs>;
}

export interface NetworkClientEventBuilder<TArgs extends ReadonlyArray<unknown>>
	extends ClientBuilder<ClientEventDeclaration<TArgs>>,
		NetworkObjectBuilder {
	WithClientMiddleware(
		mwb: (builder: ClientMiddlewareBuilder<TArgs>) => ClientMiddlewareBuilder<TArgs>,
	): NetworkClientEventBuilder<TArgs>;
}

export interface NetworkEventBuilder<TArgs extends ReadonlyArray<unknown>>
	extends NetworkServerEventBuilder<TArgs>,
		NetworkClientEventBuilder<TArgs>,
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
