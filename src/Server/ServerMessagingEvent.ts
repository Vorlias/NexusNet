import { NOM } from "../NetworkObjectModel";

const messagingService = game.GetService("MessagingService");
const TOPIC = "NexusMessaging";

export interface ServerBroadcastMessage {
	readonly EventId: string;
	readonly SourceServerId: string;
	readonly TargetServerId: string | undefined;
	readonly Arguments: ReadonlyArray<unknown>;
}
function isServerBroadcastMessage(value: unknown): value is ServerBroadcastMessage {
	return typeIs(value, "table") && "Event" in value && "Data" in value;
}

export class ServerMessagingEvent<TArgs extends readonly unknown[]> {
	public constructor(
		public readonly name: string,
		declaration: NOM.CrossServerEventDeclaration<TArgs>,
	) {}

	BroadcastToAllServers(...args: TArgs) {
		messagingService.PublishAsync(TOPIC, {
			EventId: this.name,
			SourceServerId: game.JobId,
			TargetServerId: undefined,
			Arguments: args,
		} satisfies ServerBroadcastMessage);
	}

	BroadcastToServer(targetServerId: string, ...args: TArgs) {
		messagingService.PublishAsync(TOPIC, {
			EventId: this.name,
			SourceServerId: game.JobId,
			TargetServerId: targetServerId,
			Arguments: args,
		} satisfies ServerBroadcastMessage);
	}

	Connect(callback: (serverId: string, ...args: TArgs) => void): RBXScriptConnection {
		return messagingService.SubscribeAsync(TOPIC, (message) => {
			const data = message.Data;
			if (!isServerBroadcastMessage(data)) return;

			if (data.TargetServerId === undefined || data.TargetServerId === game.JobId) {
				callback(data.SourceServerId, ...(data.Arguments as TArgs));
			}
		});
	}
}
