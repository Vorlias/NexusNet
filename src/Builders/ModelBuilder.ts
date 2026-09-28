import { NexusClientEvent } from "../Client/ClientEvent";
import { NOM } from "../NetworkObjectModel";
import { NOMFactory } from "../NetworkObjectModel/Factory";
import { NexusServerEvent } from "../Server/ServerEvent";
import { ServerMessagingEvent } from "../Server/ServerMessagingEvent";
import { Identity, MergeIdentity } from "../Types/Utility";
import { ArraySlice } from "../Utility/Arrays";

export type Named<K extends string, T> = { [P in K]: T };

type Scoped<T extends string, U extends NOM.Declaration> = T extends `${infer K}/${infer Rest}`
	? { [key in K]: NOM.NamespaceDeclaration<Scoped<Rest, U>> }
	: { [key in T]: U };

type test = Scoped<"a/b/c", NOM.Declaration>;

const runService = game.GetService("RunService");
export class NetworkObjectModelBuilder<TDeclarations extends NOM.DeclarationRecord> {
	public declarations = {} as TDeclarations;

	public configuration = { ...NOM.ConfigDefaults };

	private *_Scopes(scopes: string[], root: NOM.DeclarationRecord): Generator<NOM.DeclarationRecord> {
		if (scopes.size() <= 1) return;
		yield root;
	}

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

	// AddServerScoped<TName extends string, TDecl extends NOM.Declaration>(
	// 	name: TName,
	// 	declaration: NOM.ServerBuilder<TDecl>,
	// ): NetworkObjectModelBuilder<MergeIdentity<Scoped<TName, TDecl>, TDeclarations>> {
	// 	const parts = name.split("/");
	// 	if (parts.size() > 1) {
	// 		const named = ArraySlice(parts, 0, parts.size() - 1);
	// 		const actualName = parts[parts.size() - 1];
	// 	}

	// 	const definition = declaration.OnServer(this.configuration);
	// 	this.declarations = {
	// 		...this.declarations,
	// 		[name]: definition,
	// 	};
	// 	return this as never;
	// }

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

	AddScope<TName extends string, NDeclarations extends NOM.DeclarationRecord>(
		name: TName,
		ns: NetworkObjectModelBuilder<NDeclarations>,
	): NetworkObjectModelBuilder<
		MergeIdentity<Identity<Named<TName, NOM.NamespaceDeclaration<NDeclarations>>>, TDeclarations>
	> {
		const define = {
			Type: "Namespace",
			Declarations: ns.declarations,
		} satisfies NOM.NamespaceDeclaration<NDeclarations>;
		this.declarations = {
			...this.declarations,
			[name]: define,
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
				serverModel[name] = NOMFactory.CreateServerObject(name, declaration);
			}
		}

		if (runService.IsClient()) {
			for (const [name, declaration] of pairs(this.declarations) as IterableFunction<
				LuaTuple<[string, NOM.Declaration]>
			>) {
				clientModel[name] = NOMFactory.CreateClientObject(name, declaration);
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
