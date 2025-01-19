import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";

import Nexus, { NexusTypes } from "@Vorlias/Net/Framework";

/*
 * These are example remote events. They don't do anything and are just here as an example.
 */
export const Network = {
	ClientToServer: {
		HelloFromClient: new NetworkSignal<[test: number]>("HelloFromClient"),
	},
	ServerToClient: {
		HelloFromServer: new NetworkSignal<[message: string]>("HelloFromServer"),
	},
};

export const Network2 = Nexus.BuildObjectModel()
	.AddServer("HelloFromServer", Nexus.Event<[message: string]>(NexusTypes.String)) //
	.AddClient("HelloFromClient", Nexus.Event<[test: number]>(NexusTypes.Float32))
	.Build();
  