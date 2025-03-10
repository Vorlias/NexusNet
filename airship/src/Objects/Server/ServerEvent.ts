import { Connection, NetworkPlayer } from "@Vorlias/NexusNet/Core/Types/Dist";
import { ServerListenerEvent, ServerSenderEvent } from "@Vorlias/NexusNet/Core/Types/Server/NetworkObjects";
import { NetworkedEvent } from "../Internal/NetworkEvent";
import { NetworkingFlags, ServerEventDeclaration } from "@Vorlias/NexusNet/Core/Types/NetworkObjectModel";
import {
	CreateServerEventCallback,
	ParseServerCallbackArgs,
} from "@Vorlias/NexusNet/Core/Serialization/CallbackHandlers";
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
	private useBuffers: boolean;
	private debugging: boolean;
	private argCountCheck: boolean;

	private invokeMiddleware: ServerInvokeMiddleware[];
	private callbackMiddleware: ServerCallbackMiddleware[];

	constructor(private readonly name: string, declaration: ServerEventDeclaration<TArgs>) {
		this.instance = new NetworkedEvent(name);
		this.argumentHandlers = declaration.Arguments;
		this.useBuffers = (declaration.Flags & NetworkingFlags.UseBufferSerialization) !== 0;
		this.callbackMiddleware = declaration.CallbackMiddleware as ServerCallbackMiddleware[];
		this.debugging = (declaration.Flags & NetworkingFlags.Debugging) !== 0;
		this.argCountCheck = (declaration.Flags & NetworkingFlags.EnforceArgumentCount) !== 0;
		table.freeze(this);
	}

	public Predict(player: NetworkPlayer, ...args: TArgs) {
		const serverInvoked = ParseServerInvokeArgs(
			this.name,
			this.useBuffers,
			this.argumentHandlers ?? [],
			[], // server middleware lol
			args,
			this.argCountCheck,
		);

		this.instance.onClientEvent.Fire(player, ...serverInvoked);
	}

	public Wait(): TArgs {
		const result = this.instance.onClientEvent.Wait();
		const [player] = result;
		const args = select(2, ...result);
		const transformedArgs = ParseServerCallbackArgs(this.useBuffers, this.argumentHandlers ?? [], args) as TArgs;
		return transformedArgs;
	}

	public Once(callback: (player: NetworkPlayer, ...args: TArgs) => void): Connection {
		const overloadCallback = CreateServerEventCallback({
			UseBuffers: this.useBuffers,
			NetworkTypes: this.argumentHandlers ?? [],
			EnforceArguments: this.argCountCheck,
			Callback: callback,
			CallbackMiddleware: this.callbackMiddleware,
		});

		return new AirshipScriptConnection(this.instance.onClientEvent.Once(overloadCallback));
	}

	public Connect(callback: (player: NetworkPlayer, ...args: TArgs) => void): Connection {
		const overloadCallback = CreateServerEventCallback({
			UseBuffers: this.useBuffers,
			NetworkTypes: this.argumentHandlers ?? [],
			EnforceArguments: this.argCountCheck,
			Callback: callback,
			CallbackMiddleware: this.callbackMiddleware,
		});

		return new AirshipScriptConnection(this.instance.onClientEvent.Connect(overloadCallback));
	}

	public SendToAllPlayers(...args: TArgs): void {
		const transformedArgs = ParseServerInvokeArgs(
			this.name,
			this.useBuffers,
			this.argumentHandlers ?? [],
			[],
			args,
			this.argCountCheck,
		);
		if (!transformedArgs) return;

		return this.instance.FireAllClients(...transformedArgs);
	}

	public SendToAllPlayersExcept(targetOrTargets: NetworkPlayer | Array<NetworkPlayer>, ...args: TArgs): void {
		const transformedArgs = ParseServerInvokeArgs(
			this.name,
			this.useBuffers,
			this.argumentHandlers ?? [],
			[],
			args,
			this.argCountCheck,
		);
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
		const handledArgs = ParseServerInvokeArgs(
			this.name,
			this.useBuffers,
			this.argumentHandlers ?? [],
			[],
			args,
			this.argCountCheck,
		);
		if (!handledArgs) return;

		this.instance.FireClient(player, ...handledArgs);
	}

	public SendToPlayers(players: Array<NetworkPlayer>, ...args: TArgs): void {
		for (const player of players) {
			this.SendToPlayer(player, ...args);
		}
	}

	// Send(
	// 	targetOrTargets: ReadonlySet<NetworkPlayer> | NetworkPlayer | ReadonlyArray<NetworkPlayer>,
	// 	...args: TArgs
	// ): void {
	// 	const handledArgs = ParseServerInvokeArgs(
	// 		this.name,
	// 		this.useBuffers,
	// 		this.argumentHandlers ?? [],
	// 		[],
	// 		args,
	// 		this.argCountCheck,
	// 	);
	// 	if (!handledArgs) return;

	// 	if (this.isPlayer(targetOrTargets)) {
	// 		this.instance.FireClient(targetOrTargets as Player, ...handledArgs);
	// 	} else {
	// 		if (isArrayLike(targetOrTargets)) {
	// 			for (const target of targetOrTargets) this.instance.FireClient(target, ...handledArgs);
	// 		} else {
	// 			for (const target of targetOrTargets) this.instance.FireClient(target, ...handledArgs);
	// 		}
	// 	}
	// }

	// Broadcast(...args: TArgs): void {
	// 	this.SendToAllPlayers(...args);
	// }
}
