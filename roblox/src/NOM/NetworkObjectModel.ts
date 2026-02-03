import { NetworkModelConfiguration } from "../Core/Types/NetworkObjectModel";

export interface RobloxNetworkModelConfiguration extends NetworkModelConfiguration {
	/**
	 * Whether or not `Client.Get(...)` should yield for the remote to exist
	 *
	 * If `true` - Will yield until the remote exists, or error after 60 seconds.
	 *
	 * If `false` - Will error if the remote does not exist.
	 *
	 * @default true
	 */
	readonly ClientGetShouldYield?: boolean;

	/**
	 * Add a microprofiler debug label to each callback
	 */
	readonly MicroprofileCallbacks?: boolean;
}
