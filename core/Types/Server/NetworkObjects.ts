import { Connection, NetworkPlayer } from "../Dist";

export interface ServerListenerEvent<CallArguments extends ReadonlyArray<unknown>> {
	/**
	 * Connects a callback function to this event, in which if any events are recieved by the client will be called.
	 * @param callback The callback function
	 */
	Connect(callback: (player: NetworkPlayer, ...args: CallArguments) => void): Connection;

	// Once(callback: (player: NetworkPlayer, ...args: CallArguments) => void): Connection;

	// Predict(player: NetworkPlayer, ...args: CallArguments): void;
}

/**
 * Interface for server sender events
 */
export interface ServerSenderEvent<CallArguments extends ReadonlyArray<unknown>> {
	/**
	 * Sends an event to all players on the server
	 * @param args The arguments to send to the players
	 */
	SendToAllPlayers(...args: CallArguments): void;

	/**
	 * Sends an event to all players on the server except the specified player
	 * @param targetOrTargets The blacklist
	 * @param args The arguments
	 */
	SendToAllPlayersExcept(targetOrTargets: NetworkPlayer | Array<NetworkPlayer>, ...args: CallArguments): void;

	/**
	 * Sends an event to the specified player
	 * @param target The player
	 * @param args The arguments to send to the player
	 */
	SendToPlayer(target: NetworkPlayer, ...args: CallArguments): void;

	/**
	 * Sends an event to the specified players on the server
	 * @param targets The players
	 * @param args The arugments to send to these players
	 * @deprecated
	 */
	SendToPlayers(targets: Array<NetworkPlayer>, ...args: CallArguments): void;

	// Send(target: NetworkPlayer, ...args: CallArguments): void;
	// Send(targets: ReadonlyArray<NetworkPlayer>, ...args: CallArguments): void;
	// Send(targets: ReadonlySet<NetworkPlayer>, ...args: CallArguments): void;

	// Broadcast(...args: CallArguments): void;
}

export type ServerEventLike = ServerListenerEvent<never> | ServerSenderEvent<never>;
export type ServerFunctionLike = ServerListenerFunction<never, never>;

/**
 * Interface for client listening events
 */
export interface ServerListenerFunction<CallArguments extends ReadonlyArray<unknown>, TRet> {
	/**
	 * Connects a callback function to this event, in which if any events are recieved by the server will be called.
	 * @param callback The callback function
	 */
	SetCallback(callback: (target: NetworkPlayer, ...args: CallArguments) => TRet): () => void;
}

export interface ServerBroadcaster<TMessage extends ReadonlyArray<unknown>> {
	Broadcast(...message: TMessage): void;
	BroadcastToServer(serverId: string, ...message: TMessage): void;
	Connect(callback: (serverId: string, ...message: TMessage) => void): Connection;
}
