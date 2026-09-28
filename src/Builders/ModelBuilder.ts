import { NexusClientEvent } from "../Client/ClientEvent";
import { NOM } from "../NetworkObjectModel";
import { NexusServerEvent } from "../Server/ServerEvent";
import { Identity } from "../Types/NetworkType";
import { ServerEventBuilder } from "./EventBuilder";

export type Named<K extends string, T> = { [P in K]: T };
export type MergeIdentity<T, U> = Identity<T & U>;

const runService = game.GetService("RunService");
export class NetworkObjectModelBuilder<TDeclarations extends NOM.DeclarationRecord> {
	public declarations = {} as TDeclarations;
	public configuration = { ...NOM.ConfigDefaults };

	AddServer<TName extends string, TDecl extends NOM.Declaration>(
		id: TName,
		declaration: NOM.ServerBuilder<TDecl>,
	): NetworkObjectModelBuilder<MergeIdentity<Identity<Named<TName, TDecl>>, TDeclarations>> {
		const definition = declaration.OnServer(this.configuration);
		this.declarations = {
			...this.declarations,
			[id]: definition,
		};
		return this as never;
	}

	AddClient<TName extends string, TDecl extends NOM.Declaration>(
		id: TName,
		declaration: NOM.ClientBuilder<TDecl>,
	): NetworkObjectModelBuilder<MergeIdentity<Identity<Named<TName, TDecl>>, TDeclarations>> {
		const definition = declaration.OnClient(this.configuration);
		this.declarations = {
			...this.declarations,
			[id]: definition,
		};
		return this as never;
	}

	Build(): NOM.Model<TDeclarations> {
		const serverModel = {} as Record<string, defined>;
		const clientModel = {} as Record<string, defined>;

		if (runService.IsServer()) {
			for (const [name, declaration] of pairs(this.declarations) as IterableFunction<
				LuaTuple<[string, NOM.Declaration]>
			>) {
				if (declaration.Type === "Event") {
					const evt = new NexusServerEvent(name, declaration as NOM.ServerEventDeclaration<never>);
					serverModel[name] = evt;
				}
			}
		}

		if (runService.IsClient()) {
			for (const [name, declaration] of pairs(this.declarations) as IterableFunction<
				LuaTuple<[string, NOM.Declaration]>
			>) {
				if (declaration.Type === "Event") {
					const evt = new NexusClientEvent(name, declaration as NOM.ClientEventDeclaration<never>);
					clientModel[name] = evt;
				}
			}
		}

		table.freeze(serverModel);
		table.freeze(clientModel);
		return table.freeze({
			Server: serverModel,
			Client: clientModel,
		}) as NOM.Model<TDeclarations>;
	}
}
