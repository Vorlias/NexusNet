/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientSenderEvent, ClientListenerEvent, ClientInvokeFunction } from "./Client/NetworkObjects";
import {
	ClientEventDeclaration,
	ClientFunctionDeclaration,
	RemoteDeclarations,
	ServerEventDeclaration,
	ServerFunctionDeclaration,
} from "./NetworkObjectModel";
import { ServerSenderEvent, ServerListenerEvent, ServerListenerFunction } from "./Server/NetworkObjects";

export type OrderedRemoteDeclarations = Array<readonly [name: string, definition: AnyNetworkDeclaration]>;

export type AnyNetworkDeclaration =
	| ServerEventDeclaration<any>
	| ClientEventDeclaration<any>
	| ServerFunctionDeclaration<any, any>
	| ClientFunctionDeclaration<any, any>;

export type AnyServerNetworkObject =
	| ServerSenderEvent<any>
	| ServerListenerEvent<any>
	| ServerListenerFunction<any, any>;

export type AnyClientNetworkObject = ClientSenderEvent<any> | ClientListenerEvent<any> | ClientInvokeFunction<any, any>;

export type FilterServerDeclarations<T extends RemoteDeclarations, U = AnyNetworkDeclaration> = {
	[K in ExtractKeys<T, U>]: T[K];
};

export type FilterClientDeclarations<T extends RemoteDeclarations, U = AnyNetworkDeclaration> = {
	[K in ExtractKeys<T, U>]: T[K];
};

export type DeclarationRemoteKeys<T extends RemoteDeclarations> = keyof FilterServerDeclarations<T>;
