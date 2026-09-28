import { NexusEventBuilder } from "./Builders/EventBuilder";
import { NetworkObjectModelBuilder } from "./Builders/ModelBuilder";
import { NexusInlineClient, NexusInlineServer } from "./Inline";
import { NOM } from "./NetworkObjectModel";
import { NetworkType } from "./Types/NetworkType";

export { NetworkType as NexusType } from "./Types/NetworkType";
export { NexusServerEvent } from "./Server/ServerEvent";
export { NexusClientEvent } from "./Client/ClientEvent";

export namespace Nexus {
	export function BuildObjectModel(config?: Partial<NOM.Config>) {
		const model = new NetworkObjectModelBuilder<{}>();

		if (config) {
			model.configuration = { ...NOM.ConfigDefaults, ...config };
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

	/** Creates a server remote singleton */
	export function Server<const T extends NOM.Declaration>(
		name: string,
		object: NOM.ServerBuilder<T>,
		configuration?: NOM.Config,
	) {
		return NexusInlineServer(name, object, configuration);
	}

	/** Creates a client remote singleton */
	export function Client<const T extends NOM.Declaration>(
		name: string,
		object: NOM.ClientBuilder<T>,
		configuration?: NOM.Config,
	) {
		return NexusInlineClient(name, object, configuration);
	}
}
