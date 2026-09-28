import { NexusClientEvent } from "./Client/ClientEvent";
import { NOM } from "./NetworkObjectModel";
import { NexusServerEvent } from "./Server/ServerEvent";

export interface NexusInlineContext<T> {
	readonly Server: NOM.InferServerRemote<T>;
	readonly Client: NOM.InferClientRemote<T>;
}

/** @internal */
export function NexusInlineServer<const T extends NOM.Declaration>(
	name: string | undefined,
	object: NOM.ServerBuilder<T>,
	config?: NOM.Config,
): NexusInlineContext<T> {
	const declaration = object.OnServer({ ...NOM.ConfigDefaults, ...config });

	const [s, l] = debug.info(3, "sl");
	name = name ? `${s}@${name}` : `${s}:${l}`;

	if (declaration.Type === "Event") {
		return {
			Server: new NexusServerEvent(name, declaration as NOM.ServerEventDeclaration<any>) as never,
			Client: new NexusClientEvent(name, declaration as NOM.ClientEventDeclaration<any>) as never,
		};
	} else {
		throw `Invalid declaration type: ${declaration.Type}`;
	}
}

/** @internal */
export function NexusInlineClient<const T extends NOM.Declaration>(
	name: string | undefined,
	object: NOM.ClientBuilder<T>,
	config?: NOM.Config,
): NexusInlineContext<T> {
	const declaration = object.OnClient({ ...NOM.ConfigDefaults, ...config });
	const [s, l] = debug.info(3, "sl");
	name = name ? `${s}@${name}` : `${s}:${l}`;

	if (declaration.Type === "Event") {
		return {
			Server: new NexusServerEvent(name, declaration as NOM.ServerEventDeclaration<any>) as never,
			Client: new NexusClientEvent(name, declaration as NOM.ClientEventDeclaration<any>) as never,
		};
	} else {
		throw `Invalid declaration type: ${declaration.Type}`;
	}
}
