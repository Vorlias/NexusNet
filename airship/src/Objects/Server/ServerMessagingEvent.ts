import { Connection } from "@Vorlias/NexusNet/Core/Types/Dist";
import { CrossServerEventDeclaration } from "@Vorlias/NexusNet/Core/Types/NetworkObjectModel";
import { ServerBroadcaster } from "@Vorlias/NexusNet/Core/Types/Server/NetworkObjects";
import { AirshipScriptConnection } from "../NetConnection";
import { Platform } from "@Easy/Core/Shared/Airship";
import { Game } from "@Easy/Core/Shared/Game";
import { Signal } from "@Easy/Core/Shared/Util/Signal";

interface ServerBroadcastMessage {
	readonly sourceServerId: string;
	readonly targetServerId: string | undefined;
	readonly args: unknown[];
}

export function isServerBroadcastMessage(value: unknown): value is ServerBroadcastMessage {
	return typeIs(value, "table") && "sourceServerId" in value && "args" in value;
}

export class ServerMessagingEvent<TArgs extends unknown[]> implements ServerBroadcaster<TArgs> {
	private readonly topic: string;
	private readonly onMockBroadcast = new Signal<[data: ServerBroadcastMessage]>();

	public constructor(name: string, declaration: CrossServerEventDeclaration<TArgs>) {
		this.topic = `nexus-${name.gsub("/", "-")[0]}`;
	}

	private GetBroadcastData(targetServerId: string | undefined, args: TArgs): ServerBroadcastMessage {
		let data: ServerBroadcastMessage = {
			sourceServerId: Game.serverId,
			targetServerId,
			args,
		};
		return data;
	}

	public BroadcastAllServers(...message: TArgs): void {
		if (Game.IsEditor()) {
			this.onMockBroadcast.Fire(this.GetBroadcastData(undefined, message));
		} else {
			Platform.Server.Messaging.Publish(this.topic, this.GetBroadcastData(undefined, message));
		}
	}

	public BroadcastToServer(serverId: string, ...message: TArgs): void {
		if (Game.IsEditor()) {
			this.onMockBroadcast.Fire(this.GetBroadcastData(serverId, message));
		} else {
			Platform.Server.Messaging.Publish(this.topic, this.GetBroadcastData(serverId, message));
		}
	}

	public Connect(callback: (serverId: string, ...message: TArgs) => void): Connection {
		if (Game.IsEditor()) {
			const unsubscribe = this.onMockBroadcast.Connect((data) => {});
			return new AirshipScriptConnection(unsubscribe);
		} else {
			const subscription = Platform.Server.Messaging.Subscribe(this.topic, (data) => {
				if (!isServerBroadcastMessage(data)) return;

				if (data.targetServerId === undefined || data.targetServerId === Game.serverId) {
					callback(data.sourceServerId, ...(data.args as TArgs));
				}
			});

			return new AirshipScriptConnection(() => {
				subscription.unsubscribe();
			});
		}
	}
}
