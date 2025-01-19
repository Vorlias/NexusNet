import { ToNetworkArguments } from "./Core/Types/NetworkTypes";
import { EventBuilder } from "./Builders/EventBuilder";
import { RobloxNetworkObjectModelBuilder } from "./Builders/ObjectModelBuilder";
export { NexusTypes } from "./RobloxTypes";

declare module "./Core/Types/Dist" {
	export interface ModuleTypes {
		NetworkPlayer: Player;
		Connection: RBXScriptConnection;
	}
}

/**
 * NexusNet for Roblox
 * @version Roblox-1.0
 */
namespace Nexus {
	/**
	 * Build an object model
	 */
	export function BuildObjectModel(): RobloxNetworkObjectModelBuilder {
		return new RobloxNetworkObjectModelBuilder();
	}

	/**
	 * Define a remote object
	 * @returns The builder for a remote
	 */
	export function Event(): EventBuilder<[]>;
	export function Event<T extends ReadonlyArray<unknown>>(...values: ToNetworkArguments<T>): EventBuilder<T>;
	export function Event<T extends ReadonlyArray<unknown>>(...values: ToNetworkArguments<T>): EventBuilder<[]> {
		if (values.size() > 0) {
			return new EventBuilder().WithArguments(...values);
		}

		return new EventBuilder();
	}
}

export default Nexus;
