/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientSenderEvent, ClientListenerEvent, ClientInvokeFunction } from "./Client/NetworkObjects";
import {
	ClientEventDeclaration,
	ClientFunctionDeclaration,
	CrossServerEventDeclaration,
	EventDeclaration,
	FunctionDeclaration,
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
	| ClientFunctionDeclaration<any, any>
	| CrossServerEventDeclaration<any>;

export type AnyServerNetworkObject =
	| ServerSenderEvent<any>
	| ServerListenerEvent<any>
	| ServerListenerFunction<any, any>;

export type AnyClientNetworkObject = ClientSenderEvent<any> | ClientListenerEvent<any> | ClientInvokeFunction<any, any>;

export type FilterServerDeclarations<T extends RemoteDeclarations> = {
	[K in ExtractKeys<
		T,
		EventDeclaration<any, any> | FunctionDeclaration<any, any, any> | CrossServerEventDeclaration<any>
	>]: T[K];
};

export type FilterClientDeclarations<T extends RemoteDeclarations> = {
	[K in ExtractKeys<T, EventDeclaration<any, any> | FunctionDeclaration<any, any, any>>]: T[K];
};

export type DeclarationRemoteKeys<T extends RemoteDeclarations> = keyof FilterServerDeclarations<T>;
