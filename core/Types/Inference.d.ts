import { ClientSenderEvent, ClientListenerEvent, ClientInvokeFunction } from "./Client/NetworkObjects";
import {
	ServerEventDeclaration,
	ClientEventDeclaration,
	ServerFunctionDeclaration,
	ContextNetworkModel,
	NetworkObjectModelBuilder,
} from "./NetworkObjectModel";
import { ServerSenderEvent, ServerListenerEvent, ServerListenerFunction } from "./Server/NetworkObjects";

export type InferServerRemote<T> = T extends ServerEventDeclaration<infer TArgs>
	? ServerSenderEvent<TArgs>
	: T extends ClientEventDeclaration<infer TArgs>
	? ServerListenerEvent<TArgs>
	: T extends ServerFunctionDeclaration<infer TArgs, infer TRet>
	? ServerListenerFunction<TArgs, TRet>
	: never;

export type InferClientRemote<T> = T extends ClientEventDeclaration<infer TArgs>
	? ClientSenderEvent<TArgs>
	: T extends ServerEventDeclaration<infer TArgs>
	? ClientListenerEvent<TArgs>
	: T extends ServerFunctionDeclaration<infer TArgs, infer TRet>
	? ClientInvokeFunction<TArgs, TRet>
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
