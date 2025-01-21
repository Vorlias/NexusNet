import { NexusEventFactories } from "../Core/Generators/Factories";
import { ClientEvent } from "../Objects/Client/ClientEvent";
import { ServerEvent } from "../Objects/Server/ServerEvent";

export const fac: NexusEventFactories = {
	Server: ServerEvent,
	Client: ClientEvent,
};
