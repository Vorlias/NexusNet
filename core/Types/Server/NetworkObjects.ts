import { Connection, NetworkPlayer } from "../Dist";

export interface ServerListenerEvent<CallArguments extends ReadonlyArray<unknown>> {
	/**
	 * Connects a callback function to this event, in which if any events are recieved by the client will be called.
	 * @param callback The callback function
	 */
	Connect(callback: (player: NetworkPlayer, ...args: CallArguments) => void): Connection;

	Once(callback: (player: NetworkPlayer, ...args: CallArguments) => void): Connection;
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
}

export type ServerEventLike = ServerListenerEvent<never> | ServerSenderEvent<never>;

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
