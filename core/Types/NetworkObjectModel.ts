/* eslint-disable @typescript-eslint/no-empty-object-type */
import {
	AnyClientNetworkObject,
	AnyServerNetworkObject,
	DeclarationRemoteKeys,
	FilterClientDeclarations,
	FilterServerDeclarations,
} from "./Declarations";
import { InferClientRemote, InferServerRemote } from "./Inference";
import { MergeIdentity, Named } from "./Utility";

export type RemoteDeclarations = Record<string, NetworkObjectDeclaration>;

export interface NetworkModelConfiguration {
	readonly Debugging: boolean;
	readonly UseBuffers: boolean;
	readonly Logging: boolean;
}

export interface ServerBuilder<TServer> {
	OnServer(configuration: NetworkModelConfiguration): TServer;
}

export interface ClientBuilder<TClient> {
	OnClient(configuration: NetworkModelConfiguration): TClient;
}

interface EventDeclaration<_TArgs extends ReadonlyArray<unknown>> {
	readonly Type: "Event";
	readonly UseBufferSerialization: boolean;
	readonly Debugging: boolean;
}

interface FunctionDeclaration<_TArgs extends ReadonlyArray<unknown>, _TRet> {
	readonly Type: "Function";
	readonly UseBufferSerialization: boolean;
	readonly Debugging: boolean;
}

export interface ServerEventDeclaration<_TArgs extends ReadonlyArray<unknown>> extends EventDeclaration<_TArgs> {}
export interface ClientEventDeclaration<_TArgs extends ReadonlyArray<unknown>> extends EventDeclaration<_TArgs> {}

export interface ServerFunctionDeclaration<_TArgs extends ReadonlyArray<unknown>, _TRet>
	extends FunctionDeclaration<_TArgs, _TRet> {}
export interface ClientFunctionDeclaration<_TArgs extends ReadonlyArray<unknown>, _TRet>
	extends FunctionDeclaration<_TArgs, _TRet> {}

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
		NetworkObjectBuilder {}

export interface NetworkFunctionBuilder<TArgs extends ReadonlyArray<unknown>, TRet>
	extends ServerBuilder<ServerFunctionDeclaration<TArgs, TRet>>,
		ClientBuilder<ClientFunctionDeclaration<TArgs, TRet>>,
		NetworkObjectBuilder {}

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

	// Add<TName extends string, TNomRemote extends NetworkObjectDeclaration>(
	// 	id: TName,
	// 	declaration: TNomRemote,
	// ): NetworkObjectModelBuilder<MergeIdentity<Named<TName, TNomRemote>, TDeclarations>>;

	Build(): ContextNetworkModel<TDeclarations>;
}
