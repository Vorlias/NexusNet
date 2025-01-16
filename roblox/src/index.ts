import { NetworkEventBuilder, NetworkObjectModelBuilder } from "./Core/Types/NetworkObjectModel";
import { ToNetworkArguments } from "./Core/Types/NetworkTypes";
import { EventBuilder } from "./ObjectBuilders/EventBuilder";
import { RobloxNetworkObjectModelBuilder } from "./ObjectBuilders/ObjectModelBuilder";

declare module "./Core/Types/Dist" {
	export interface ModuleTypes {
		NetworkPlayer: Player;
	}
}

/**
 * NexusNet for Roblox
 * @version Roblox-4.0
 */
namespace Nexus {
	/**
	 * Build an object model
	 */
	export function BuildObjectModel(): NetworkObjectModelBuilder {
		return new RobloxNetworkObjectModelBuilder();
	}

	/**
	 * Define a remote object
	 * @returns The builder for a remote
	 */
	export function Event(): NetworkEventBuilder<[]>;
	export function Event<T extends ReadonlyArray<unknown>>(...values: ToNetworkArguments<T>): NetworkEventBuilder<T>;
	export function Event<T extends ReadonlyArray<unknown>>(...values: ToNetworkArguments<T>): NetworkEventBuilder<[]> {
		if (values.size() > 0) {
			return new EventBuilder().WithArguments(...values);
		}

		return new EventBuilder();
	}
}

export = Nexus;
