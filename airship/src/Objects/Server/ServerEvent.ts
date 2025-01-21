import { Connection, NetworkPlayer } from "@Vorlias/NexusNet/Core/Types/Dist";
import { ServerListenerEvent, ServerSenderEvent } from "@Vorlias/NexusNet/Core/Types/Server/NetworkObjects";
import { NetworkedEvent } from "../Internal/NetworkEvent";
import { ServerEventDeclaration } from "@Vorlias/NexusNet/Core/Types/NetworkObjectModel";
import { CreateServerEventCallback } from "@Vorlias/NexusNet/Core/Serialization/CallbackHandlers";
import { AirshipScriptConnection } from "../NetConnection";
import { StaticNetworkType } from "@Vorlias/NexusNet/Core/Types/NetworkTypes";
import { ServerCallbackMiddleware, ServerInvokeMiddleware } from "@Vorlias/NexusNet/Core/Middleware/Types";
import { ParseServerInvokeArgs } from "@Vorlias/NexusNet/Core/Serialization/InvokeHandlers";
import { Player } from "@Easy/Core/Shared/Player/Player";
import { Airship } from "@Easy/Core/Shared/Airship";

export class ServerEvent<TArgs extends Array<unknown> = unknown[]>
	implements ServerSenderEvent<TArgs>, ServerListenerEvent<TArgs>
{
	private instance: NetworkedEvent;

	private argumentHandlers?: StaticNetworkType<any>[];
	private useBuffers = false;
	private debugging = false;

	private invokeMiddleware: ServerInvokeMiddleware[];
	private callbackMiddleware: ServerCallbackMiddleware[];

	constructor(private readonly name: string, declaration: ServerEventDeclaration<TArgs>) {
		this.instance = new NetworkedEvent(name);
		this.argumentHandlers = declaration.Arguments;
		this.useBuffers = declaration.UseBufferSerialization;
		this.callbackMiddleware = declaration.CallbackMiddleware as ServerCallbackMiddleware[];
		this.debugging = declaration.Debugging;
	}

	public Connect(callback: (player: NetworkPlayer, ...args: TArgs) => void): Connection {
		const overloadCallback = CreateServerEventCallback({
			UseBuffers: this.useBuffers,
			NetworkTypes: this.argumentHandlers ?? [],
			Callback: callback,
			CallbackMiddleware: this.callbackMiddleware,
		});

		return new AirshipScriptConnection(this.instance.OnClientEvent(overloadCallback));
	}

	public SendToAllPlayers(...args: TArgs): void {
		const transformedArgs = ParseServerInvokeArgs(this.useBuffers, this.argumentHandlers ?? [], [], args);
		if (!transformedArgs) return;

		return this.instance.FireAllClients(...transformedArgs);
	}

	public SendToAllPlayersExcept(targetOrTargets: NetworkPlayer | Array<NetworkPlayer>, ...args: TArgs): void {
		const transformedArgs = ParseServerInvokeArgs(this.useBuffers, this.argumentHandlers ?? [], [], args);
		if (!transformedArgs) return;

		if (targetOrTargets instanceof Player) {
			this.instance.FireExcept(targetOrTargets, ...transformedArgs);
		} else {
			this.instance.FireClients(
				Airship.Players.GetPlayers().filter((f) => !targetOrTargets.includes(f)),
				...transformedArgs,
			);
		}
	}

	public SendToPlayer(player: NetworkPlayer, ...args: TArgs): void {
		const handledArgs = ParseServerInvokeArgs(this.useBuffers, this.argumentHandlers ?? [], [], args);
		if (!handledArgs) return;

		this.instance.FireClient(player, ...handledArgs);
	}

	public SendToPlayers(players: Array<NetworkPlayer>, ...args: TArgs): void {
		const handledArgs = ParseServerInvokeArgs(this.useBuffers, this.argumentHandlers ?? [], [], args);
		if (!handledArgs) return;

		for (const player of players) {
			this.SendToPlayer(player, ...args);
		}
	}
}
