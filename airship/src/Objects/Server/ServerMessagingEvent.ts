import { Connection } from "@Vorlias/NexusNet/Core/Types/Dist";
import { CrossServerEventDeclaration } from "@Vorlias/NexusNet/Core/Types/NetworkObjectModel";
import { ServerBroadcaster } from "@Vorlias/NexusNet/Core/Types/Server/NetworkObjects";

export class ServerMessagingEvent<TArgs extends unknown[]> implements ServerBroadcaster<TArgs> {
	public constructor(private readonly name: string, declaration: CrossServerEventDeclaration<TArgs>) {
		throw `Not yet implemented on the Airship side`; // jonah is working on this anyhow.
	}

	BroadcastAllServers(...message: TArgs): void {}

	BroadcastToServer(serverId: string, ...message: TArgs): void {}

	Connect(callback: (serverId: string, ...message: TArgs) => void): Connection {
		throw `TODO: Implement`;
	}
}
