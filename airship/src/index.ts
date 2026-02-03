import { default as NexusLib, NexusTypes } from "./Framework";

namespace Nexus {
	export const CrossServerEvent = NexusLib.CrossServerEvent;
	export const Function = NexusLib.Function;
	export const Event = NexusLib.Event;
	export const BuildObjectModel = NexusLib.BuildObjectModel;

	export const Server = NexusLib.Server;
	export const Shared = NexusLib.Shared;
	export const Client = NexusLib.Client;

	export const Sentinel = NexusLib.Sentinel;
	export const Types = NexusTypes;
	export const VERSION = NexusLib.VERSION;
}

export = Nexus;
