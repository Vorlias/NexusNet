import {
	ClientSenderEvent,
	ClientListenerEvent,
	ClientInvokeFunction,
	ClientBidirectionalEvent,
} from "./Client/NetworkObjects";
import {
	ServerEventDeclaration,
	ClientEventDeclaration,
	ServerFunctionDeclaration,
	ContextNetworkModel,
	NetworkObjectModelBuilder,
	CrossServerEventDeclaration,
	BidirectionalEventDeclaration,
} from "./NetworkObjectModel";
import {
	ServerSenderEvent,
	ServerListenerEvent,
	ServerListenerFunction,
	ServerBroadcaster,
	ServerBidirectionalEvent,
} from "./Server/NetworkObjects";

export type InferServerRemoteNoBroadcast<T> = T extends ServerEventDeclaration<infer TArgs>
	? ServerSenderEvent<TArgs>
	: T extends ClientEventDeclaration<infer TArgs>
	? ServerListenerEvent<TArgs>
	: T extends ServerFunctionDeclaration<infer TArgs, infer TRet>
	? ServerListenerFunction<TArgs, TRet>
	: never;

export type InferServerRemote<T> = T extends BidirectionalEventDeclaration<infer TArgs>
	? ServerBidirectionalEvent<TArgs>
	: T extends ServerEventDeclaration<infer TArgs>
	? ServerSenderEvent<TArgs>
	: T extends ClientEventDeclaration<infer TArgs>
	? ServerListenerEvent<TArgs>
	: T extends ServerFunctionDeclaration<infer TArgs, infer TRet>
	? ServerListenerFunction<TArgs, TRet>
	: T extends CrossServerEventDeclaration<infer TArgs>
	? ServerBroadcaster<TArgs>
	: never;

export type InferClientRemote<T> = T extends BidirectionalEventDeclaration<infer TArgs>
	? ClientBidirectionalEvent<TArgs>
	: T extends ClientEventDeclaration<infer TArgs>
	? ClientSenderEvent<TArgs>
	: T extends ServerEventDeclaration<infer TArgs>
	? ClientListenerEvent<TArgs>
	: T extends ServerFunctionDeclaration<infer TArgs, infer TRet>
	? ClientInvokeFunction<TArgs, TRet>
	: T extends CrossServerEventDeclaration<infer _>
	? never
	: never;

/**
 * Infers the Network Model declarations from {@link T | `T`}, where `T` is a {@link ContextNetworkModel | `ContextNetworkModel`} or {@link NetworkObjectModelBuilder | `NetworkObjectModelBuilder`}
 *
 * This can be useful if you want a type for the network declaration, e.g.
 * ```ts
 * type Network = ContextNetworkModel<typeof Network>;
 * ```
 * where `Network` is your {@link ContextNetworkModel | `ContextNetworkModel`}
 */
export type InferNOMDeclarations<T extends object> = T extends ContextNetworkModel<infer TContextModel>
	? TContextModel
	: T extends NetworkObjectModelBuilder<infer TBuilderModel>
	? TBuilderModel
	: never;
