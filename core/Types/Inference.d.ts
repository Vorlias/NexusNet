import { ClientSenderEvent, ClientListenerEvent, ClientInvokeFunction } from "./Client/NetworkObjects";
import { ServerEventDeclaration, ClientEventDeclaration, ServerFunctionDeclaration } from "./NetworkObjectModel";
import { ServerSenderEvent, ServerListenerEvent, ServerListenerFunction } from "./Server/NetworkObjects";

export type InferServerRemote<T> =
	T extends ServerEventDeclaration<infer TArgs>
		? ServerSenderEvent<TArgs>
		: T extends ClientEventDeclaration<infer TArgs>
			? ServerListenerEvent<TArgs>
			: T extends ServerFunctionDeclaration<infer TArgs, infer TRet>
				? ServerListenerFunction<TArgs, TRet>
				: never;

export type InferClientRemote<T> =
	T extends ClientEventDeclaration<infer TArgs>
		? ClientSenderEvent<TArgs>
		: T extends ServerEventDeclaration<infer TArgs>
			? ClientListenerEvent<TArgs>
			: T extends ServerFunctionDeclaration<infer TArgs, infer TRet>
				? ClientInvokeFunction<TArgs, TRet>
				: never;
