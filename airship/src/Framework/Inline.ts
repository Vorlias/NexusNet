import Nexus from ".";
import { AnyNetworkDeclaration } from "../Core/Types/Declarations";
import { InferServerRemote, InferClientRemote } from "../Core/Types/Inference";
import {
	ClientBuilder,
	ClientEventDeclaration,
	NetworkModelConfiguration,
	ServerBuilder,
	ServerEventDeclaration,
} from "../Core/Types/NetworkObjectModel";
import { ClientEvent } from "../Objects/Client/ClientEvent";
import { ServerEvent } from "../Objects/Server/ServerEvent";

export function NexusInlineServer<const T extends AnyNetworkDeclaration>(
	name: string,
	network: ServerBuilder<T>,
	configuration?: Partial<NetworkModelConfiguration>,
): Nexus.InlineContext<T> {
	const declaration = network.OnServer({
		Debugging: false,
		UseBuffers: false,
		Logging: false,
		...configuration,
	});

	return {
		server: new ServerEvent(name, declaration as ServerEventDeclaration<any>) as unknown as InferServerRemote<T>,
		client: new ClientEvent(name, declaration as ClientEventDeclaration<any>) as InferClientRemote<T>,
	};
}

/**
 * Creates an inline client network object
 */
export function NexusInlineClient<const T extends AnyNetworkDeclaration>(
	name: string,
	network: ClientBuilder<T>,
	configuration?: Partial<NetworkModelConfiguration>,
): Nexus.InlineContext<T> {
	//const [n, l, s, f, a] = debug.info(2, "nlsfa");

	// if (!name) {
	// 	assert(n === "constructor", "Inline declarations can only be used inside components");
	// 	name = `${s}:${l}#${n}`;
	// }

	const declaration = network.OnClient({
		Debugging: false,
		UseBuffers: false,
		Logging: false,
		...configuration,
	});

	return {
		server: new ServerEvent(name, declaration as ServerEventDeclaration<any>) as unknown as InferServerRemote<T>,
		client: new ClientEvent(name, declaration as ClientEventDeclaration<any>) as InferClientRemote<T>,
	};
}
