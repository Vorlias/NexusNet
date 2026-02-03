import { NexusEventFactories } from "../Core/Generators/Factories";
import { NexusX } from "../Core/NexusX";
import { ClientEvent } from "../Objects/Client/ClientEvent";
import { ServerEvent } from "../Objects/Server/ServerEvent";

export const fac: NexusEventFactories = {
	Server: ServerEvent,
	Client: ClientEvent,
};
