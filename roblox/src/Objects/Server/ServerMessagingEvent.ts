import { Connection } from "../../Core/Types/Dist";
import { CrossServerEventDeclaration } from "../../Core/Types/NetworkObjectModel";
import { ServerBroadcaster } from "../../Core/Types/Server/NetworkObjects";

const messagingService = game.GetService("MessagingService");
const TOPIC = "NexusNetMessaging";

export interface ServerBroadcastMessage {
	readonly EventId: string;
	readonly SourceServerId: string;
	readonly TargetServerId: string | undefined;
	readonly Arguments: unknown[];
}
function isServerBroadcastMessage(value: unknown): value is ServerBroadcastMessage {
	return typeIs(value, "table") && "Event" in value && "Data" in value;
}

export interface ISubscriptionMessage {
	Data: unknown;
	Sent: number;
}
declare global {
	interface MessagingService extends Instance {
		SubscribeAsync(name: string, callback: (data: ISubscriptionMessage) => void): RBXScriptConnection;
	}
}

export class ServerMessagingEvent<TArgs extends unknown[]> implements ServerBroadcaster<TArgs> {
	public constructor(
		private readonly name: string,
		declaration: CrossServerEventDeclaration<TArgs>,
	) {}

	BroadcastToServer(jobId: string, ...args: TArgs) {
		messagingService.PublishAsync(TOPIC, {
			EventId: this.name,
			SourceServerId: game.JobId,
			TargetServerId: jobId,
			Arguments: args,
		} satisfies ServerBroadcastMessage);
	}

	BroadcastAllServers(...args: TArgs): void {
		messagingService.PublishAsync(TOPIC, {
			EventId: this.name,
			SourceServerId: game.JobId,
			TargetServerId: undefined,
			Arguments: args,
		} satisfies ServerBroadcastMessage);
	}

	Connect(callback: (serverId: string, ...args: TArgs) => void): Connection {
		return messagingService.SubscribeAsync(TOPIC, (message) => {
			const { Data: data, Sent } = message;
			if (!isServerBroadcastMessage(data)) return;

			if (data.TargetServerId === undefined || data.TargetServerId === game.JobId) {
				callback(data.SourceServerId, ...(data.Arguments as TArgs));
			}
		});
	}
}
