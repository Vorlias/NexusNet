import { ClientEventLike, ClientInvokeFunction } from "../Types/Client/NetworkObjects";
import {
	ClientEventDeclaration,
	ClientFunctionDeclaration,
	CrossServerEventDeclaration,
	ServerEventDeclaration,
	ServerFunctionDeclaration,
} from "../Types/NetworkObjectModel";
import { ServerBroadcaster, ServerEventLike, ServerListenerFunction } from "../Types/Server/NetworkObjects";

export type ServerEventFactory = new <T extends unknown[]>(
	name: string,
	declaration: ServerEventDeclaration<T>,
) => ServerEventLike;

export type ClientEventFactory = new <T extends unknown[]>(
	name: string,
	declaration: ClientEventDeclaration<T>,
) => ClientEventLike;

export type ServerFunctionFactory = new <T extends unknown[], R>(
	name: string,
	declaration: ServerFunctionDeclaration<T, R>,
) => ServerListenerFunction<T, R>;

export type ServerMessagingFactory = new <T extends unknown[]>(
	name: string,
	declaration: CrossServerEventDeclaration<T>,
) => ServerBroadcaster<T>;

export type ClientFunctionFactory = new <T extends unknown[], R>(
	name: string,
	declaration: ClientFunctionDeclaration<T, R>,
) => ClientInvokeFunction<T, R>;

export interface NexusEventFactories {
	Server: ServerEventFactory;
	Client: ClientEventFactory;
}

export interface NexusFunctionFactories {
	Client: ClientFunctionFactory;
	Server: ServerFunctionFactory;
}
