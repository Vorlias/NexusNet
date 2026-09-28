import { NOM } from ".";
import { NexusClientEvent } from "../Client/ClientEvent";
import { NexusServerEvent } from "../Server/ServerEvent";
import { ServerMessagingEvent } from "../Server/ServerMessagingEvent";

/** @internal */
export namespace NOMFactory {
	/** @internal */
	export function CreateServerObject<N extends string, D extends NOM.Declaration>(
		name: N,
		declaration: D,
	): NexusServerEvent<any> | ServerMessagingEvent<any> | NOM.ServerContext<NOM.DeclarationRecord> {
		if (declaration.Type === "Event") {
			return new NexusServerEvent(name, declaration as NOM.ServerEventDeclaration<never>);
		} else if (declaration.Type === "Messaging") {
			const evt = new ServerMessagingEvent(name, declaration);
			return evt;
		} else if (declaration.Type === "Namespace") {
			const record = {} as Record<string, defined>;
			const inner = declaration.Declarations;
			for (const [name, value] of pairs(inner) as IterableFunction<LuaTuple<[string, NOM.Declaration]>>) {
				print("Create record", name);
				record[name] = CreateServerObject(name, value);
			}

			return record as NOM.ServerContext<NOM.DeclarationRecord>;
		}

		throw `TODO`;
	}

	/** @internal */
	export function CreateClientObject<N extends string, D extends NOM.Declaration>(
		name: N,
		declaration: D,
	): NexusClientEvent<any> | NOM.ClientContext<NOM.DeclarationRecord> {
		if (declaration.Type === "Event") {
			return new NexusClientEvent(name, declaration as NOM.ClientEventDeclaration<never>);
		} else if (declaration.Type === "Namespace") {
			const record = {} as Record<string, defined>;
			const inner = declaration.Declarations;
			for (const [name, value] of pairs(inner) as IterableFunction<LuaTuple<[string, NOM.Declaration]>>) {
				print("Create record", name);
				record[name] = CreateClientObject(name, value);
			}

			return record as NOM.ClientContext<NOM.DeclarationRecord>;
		}

		throw `TODO`;
	}
}
