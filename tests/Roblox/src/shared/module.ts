import Nexus, { NexusTypes } from "@rbxts/nexus-net";

Nexus.BuildObjectModel()
	.AddServer("testServerEvent", Nexus.Event(NexusTypes.String)) //
	.Build();
