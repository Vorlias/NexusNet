import { NexusCrossServerEventBuilder } from "./Builders/CrossServerEventBuilder";
import { NexusEventBuilder } from "./Builders/EventBuilder";
import { NexusFunctionBuilder } from "./Builders/FunctionBuilder";
import { NetworkObjectModelBuilder } from "./Builders/ModelBuilder";
import { NexusInlineClient, NexusInlineServer } from "./Inline";
import { NOM } from "./NetworkObjectModel";
import { NetworkType } from "./Types/NetworkType";
import { NexusString } from "./Types/PrimitiveTypes";

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

	export function Function<R extends unknown>(returns: NetworkType.OfType<R>): NexusFunctionBuilder<R, []>;
	export function Function<R extends unknown, T extends ReadonlyArray<unknown>>(
		returns: NetworkType.OfType<R>,
		args: NetworkType.ToTypeArray<T>,
	): NexusFunctionBuilder<R, T>;
	export function Function<R extends unknown, T extends ReadonlyArray<unknown>>(
		returns: NetworkType.OfType<R>,
		args?: NetworkType.ToTypeArray<T>,
	) {
		const result = new NexusFunctionBuilder<R, T>(returns);

		if (args) {
			result.arguments = args;
		}

		return result;
	}

	export function CrossServerEvent(): NexusCrossServerEventBuilder<[]> {
		return new NexusCrossServerEventBuilder();
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
