import Nexus, { NexusTypes } from "@rbxts/nexus-net";

export const Network = Nexus.BuildObjectModel()
	.AddServer("HelloFromServer", Nexus.Event<[message: string]>(NexusTypes.String)) //
	.AddClient("HelloFromClient", Nexus.Event<[test: number]>(NexusTypes.Float32))
	.Build();
