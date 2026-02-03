import Nexus, { NexusTypes } from ".";
import { AirshipEventBuilder } from "../Builders/EventBuilder";
import { NetworkType } from "../Core/Types/NetworkTypes";

export namespace NexusX {
	export function RegisterType<T>(serializer: NetworkType.OfType<T>) {
		throw `This macro requires the NexusX transformer to work!`;
	}

	export function Event<T extends unknown[]>(): AirshipEventBuilder<T> {
		throw `This macro requires the NexusX transformer to work!`;
	}

	export const Framework = Nexus;
	export const Types = NexusTypes;

	export const UserTypes: Record<string | number, NetworkType.Any> = {};
}
