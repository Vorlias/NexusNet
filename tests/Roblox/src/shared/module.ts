import Nexus, { NexusTypes } from "@rbxts/nexus";

export const TestNetwork = Nexus.BuildObjectModel()
	.AddServer("testServerEvent", Nexus.Event(NexusTypes.String)) //
	.AddClient("TestClientSend", Nexus.Event(NexusTypes.String))
	.AddServer("TestServerSend", Nexus.Event(NexusTypes.String))
	.AddServer("TestFunction", Nexus.Function([], NexusTypes.String))
	.Build();
