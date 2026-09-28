import { NexusEventBuilder } from "./Builders/EventBuilder";
import { NetworkObjectModelBuilder } from "./Builders/ModelBuilder";
import { NOM } from "./NetworkObjectModel";
import { NetworkType } from "./Types/NetworkType";

export { NetworkType as NexusType } from "./Types/NetworkType";
export { NexusServerEvent } from "./Server/ServerEvent";
export { NexusClientEvent } from "./Client/ClientEvent";

export namespace Nexus {
	export function BuildObjectModel(config?: NOM.Config) {
		const model = new NetworkObjectModelBuilder<{}>();

		if (config) {
			model.configuration = config;
		}

		return model;
	}

	export function Event(): NexusEventBuilder<[]>;
	export function Event<T extends ReadonlyArray<unknown>>(...args: NetworkType.ToTypeArray<T>): NexusEventBuilder<T>;
	export function Event<T extends ReadonlyArray<unknown>>(...args: NetworkType.ToTypeArray<T>) {
		const builder = new NexusEventBuilder();

		if (args !== undefined) {
			builder.arguments = args;
		}

		return builder;
	}
}
