import Nexus, { NexusTypes } from "@rbxts/nexus";

export const Network = Nexus.BuildObjectModel()
	.AddServer("HelloFromServer", Nexus.Event<[message: string]>(NexusTypes.String)) //
	.AddClient("HelloFromClient", Nexus.Event<[test: number]>(NexusTypes.Float32))
	.Build();

const Network2 = Nexus.Net4.BuildDefinition().AddServerOwned("test", Nexus.Net4.Remote()).Build();
