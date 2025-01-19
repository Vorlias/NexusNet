import { Connection } from "../Dist";

export interface ClientListenerEvent<CallArguments extends ReadonlyArray<unknown>> {
	/**
	 * Connects a callback function to this event, in which if any events are recieved by the server will be called.
	 * @param callback The callback function
	 */
	Connect(callback: (...args: CallArguments) => void): Connection;
}

/**
 * Interface for client sender events
 */
export interface ClientSenderEvent<CallArguments extends ReadonlyArray<unknown>> {
	/**
	 * Sends an event to the server with the specified arguments
	 * @param args The arguments
	 */
	SendToServer(...args: CallArguments): void;
}

export type ClientEventLike = ClientListenerEvent<never> | ClientSenderEvent<never>;

/**
 * Interface for client sender events
 */
export interface ClientInvokeFunction<CallArguments extends ReadonlyArray<unknown>, TRet extends unknown> {
	/**
	 * Sends an event to the server with the specified arguments
	 * @param args The arguments
	 */
	SendToServer(...args: CallArguments): TRet;
	SendToServerAsync(...args: CallArguments): Promise<TRet>;
}
