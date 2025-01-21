import type { Player } from "@Easy/Core/Shared/Player/Player";
import type { AirshipScriptConnection } from "../Objects/NetConnection";
import type { ServerEvent } from "../Objects/Server/ServerEvent";
import type { ClientEvent } from "../Objects/Client/ClientEvent";
import type { ToNetworkArguments } from "../Core/Types/NetworkTypes";
import { AirshipNetworkObjectModelBuilder } from "../Builders/ObjectModelBuilder";
import { AirshipEventBuilder } from "../Builders/EventBuilder";
export { NexusTypes } from "./AirshipTypes";

declare module "../Core/Types/Dist" {
	export interface ModuleTypes {
		NetworkPlayer: Player;
		Connection: AirshipScriptConnection;
		NetworkServerEvent: ServerEvent<unknown[]>;
		NetworkClientEvent: ClientEvent<unknown[]>;
	}
}

/**
 * NexusNet runtime for Airship
 * @version Airship-1.0
 */
namespace Nexus {
	/**
	 * Build an object model
	 */
	export function BuildObjectModel(): AirshipNetworkObjectModelBuilder {
		return new AirshipNetworkObjectModelBuilder();
	}

	/**
	 * Define a remote object
	 * @returns The builder for a remote
	 */
	export function Event(): AirshipEventBuilder<[]>;
	export function Event<T extends ReadonlyArray<unknown>>(...values: ToNetworkArguments<T>): AirshipEventBuilder<T>;
	export function Event<T extends ReadonlyArray<unknown>>(...values: ToNetworkArguments<T>): AirshipEventBuilder<[]> {
		if (values.size() > 0) {
			return new AirshipEventBuilder().WithArguments(...values);
		}

		return new AirshipEventBuilder();
	}
}

export default Nexus;
