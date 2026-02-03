import { Connection } from "@Vorlias/NexusNet/Core/Types/Dist";
import { CrossServerEventDeclaration } from "@Vorlias/NexusNet/Core/Types/NetworkObjectModel";
import { ServerBroadcaster } from "@Vorlias/NexusNet/Core/Types/Server/NetworkObjects";
import { NexusEventConnection } from "../NetConnection";
import { Platform } from "@Easy/Core/Shared/Airship";
import { Game } from "@Easy/Core/Shared/Game";
import { Signal } from "@Easy/Core/Shared/Util/Signal";
import { ParseServerInvokeArgs } from "@Vorlias/NexusNet/Core/Serialization/InvokeHandlers";
import { NetworkType } from "@Vorlias/NexusNet/Core/Types/NetworkTypes";
import { TransformArgsToBuffer, TransformBufferToArgs } from "@Vorlias/NexusNet/Core/Serialization/BufferEncoding";
import { ParseServerCallbackArgs } from "@Vorlias/NexusNet/Core/Serialization/CallbackHandlers";

interface ServerBroadcastMessage {
	readonly sourceServerId: string;
	readonly targetServerId: string | undefined;
	readonly data: unknown;
}

export function isServerBroadcastMessage(value: unknown): value is ServerBroadcastMessage {
	return typeIs(value, "table") && "sourceServerId" in value && "data" in value;
}

export class ServerMessagingEvent<TArgs extends unknown[]> implements ServerBroadcaster<TArgs> {
	private readonly topic: string;
	private readonly onMockBroadcast = new Signal<[data: ServerBroadcastMessage]>();
	private arguments: NetworkType.Any[];
	private useBuffer: boolean;

	public constructor(name: string, declaration: CrossServerEventDeclaration<TArgs>) {
		assert(name, "Name expected");
		this.topic = `nexus-${name.gsub("%p", "-")[0].lower()}`;
		this.arguments = declaration.Arguments;
		this.useBuffer = declaration.UseBuffer;
	}

	private ToBroadcastMessage(targetServerId: string | undefined, args: TArgs): ServerBroadcastMessage {
		if (this.useBuffer) {
			let data: ServerBroadcastMessage = {
				sourceServerId: Game.serverId,
				targetServerId,
				data: buffer.tostring(TransformArgsToBuffer(this.topic, this.arguments, args)),
			};
			return data;
		} else {
			let data: ServerBroadcastMessage = {
				sourceServerId: Game.serverId,
				targetServerId,
				data: ParseServerInvokeArgs(this.topic, false, this.arguments, [], args, true),
			};
			return data;
		}
	}

	private DecodeBroadcastData(message: ServerBroadcastMessage): TArgs | undefined {
		if (!isServerBroadcastMessage(message)) return undefined;
		if (this.useBuffer) {
			const bufferRes = buffer.fromstring(message.data as string);
			return TransformBufferToArgs(this.topic, this.arguments, bufferRes) as TArgs;
		} else {
			return ParseServerCallbackArgs(
				this.topic,
				this.useBuffer,
				this.arguments,
				message.data as unknown[],
				true,
			) as TArgs;
		}
	}

	public BroadcastAllServers(...message: TArgs) {
		if (Game.IsEditor()) {
			this.onMockBroadcast.Fire(this.ToBroadcastMessage(undefined, message));
		} else {
			return Platform.Server.Messaging.Publish(this.topic, this.ToBroadcastMessage(undefined, message));
		}
	}

	public BroadcastToServer(targetServerId: string, ...message: TArgs): void {
		if (Game.IsEditor()) {
			this.onMockBroadcast.Fire(this.ToBroadcastMessage(targetServerId, message));
		} else {
			Platform.Server.Messaging.Publish(this.topic, this.ToBroadcastMessage(targetServerId, message));
		}
	}

	private InvokeCallback(callback: (serverId: string, ...message: TArgs) => void, message: ServerBroadcastMessage) {
		const args = this.DecodeBroadcastData(message);
		if (!args) return;

		const targetServerId = message.targetServerId;
		if (targetServerId === undefined || targetServerId === Game.serverId) {
			callback(message.sourceServerId, ...args);
		}
	}

	public Connect(callback: (sourceServerId: string, ...message: TArgs) => void): Connection {
		if (Game.IsEditor()) {
			const unsubscribe = this.onMockBroadcast.Connect((message) => {
				if (!isServerBroadcastMessage(message)) return;
				this.InvokeCallback(callback, message);
			});
			return new NexusEventConnection(unsubscribe);
		} else {
			const subscription = Platform.Server.Messaging.Subscribe(this.topic, (message) => {
				if (!isServerBroadcastMessage(message)) return;
				this.InvokeCallback(callback, message);
			});

			return new NexusEventConnection(() => {
				subscription.unsubscribe();
			});
		}
	}
}
