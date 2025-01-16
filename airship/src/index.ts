import { Player as AirshipPlayer } from "@Easy/Core/Shared/Player/Player";
import { NetworkEventBuilder, NetworkObjectModelBuilder } from "./Core/Types/NetworkObjectModel";
import { ToNetworkArguments } from "./Core/Types/NetworkTypes";

declare module "./Core/Types/Dist" {
	export interface ModuleTypes {
		NetworkPlayer: AirshipPlayer;
	}
}


/**
 * NexusNet for Airship
 * @version Airship-0.1
 */
namespace Nexus {
    /**
     * Build an object model
     */
    export function BuildObjectModel(): NetworkObjectModelBuilder {
        throw `TODO`;
    }

    /**
     * Define a remote object
     * @returns The builder for a remote
     */
    export function Event(): NetworkEventBuilder<[]>;
    export function Event<T extends ReadonlyArray<unknown>>(...values: ToNetworkArguments<T>): NetworkEventBuilder<T>;
    export function Event<T extends ReadonlyArray<unknown>>(...values: ToNetworkArguments<T>): NetworkEventBuilder<[]> {
        throw `TODO`;
    }
}

export = Nexus;

