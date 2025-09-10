import { Connection, NetworkPlayer } from "@Vorlias/NexusNet/Core/Types/Dist";
import { ServerListenerEvent, ServerSenderEvent } from "@Vorlias/NexusNet/Core/Types/Server/NetworkObjects";
import { NetworkedEvent } from "../Internal/NetworkEvent";
import { NetworkingFlags, ServerEventDeclaration } from "@Vorlias/NexusNet/Core/Types/NetworkObjectModel";
import {
	CreateServerEventCallback,
	ParseServerCallbackArgs,
} from "@Vorlias/NexusNet/Core/Serialization/CallbackHandlers";
import { NexusEventConnection } from "../NetConnection";
import { StaticNetworkType } from "@Vorlias/NexusNet/Core/Types/NetworkTypes";
import { ServerEventCallbackMiddleware, ServerEventInvokeMiddleware } from "@Vorlias/NexusNet/Core/Middleware/Types";
import { ParseServerInvokeArgs, RunServerInvokeMiddleware } from "@Vorlias/NexusNet/Core/Serialization/InvokeHandlers";
import { Player } from "@Easy/Core/Shared/Player/Player";
import { Airship } from "@Easy/Core/Shared/Airship";
import { ValidateArguments, ValidateResult } from "@Vorlias/NexusNet/Core/Serialization/Arguments";
import { Collection, NexusCollectionUtils } from "@Vorlias/NexusNet/Core/Utils/Collections";

export class ServerEvent<TArgs extends Array<unknown> = unknown[]>
	implements ServerSenderEvent<TArgs>, ServerListenerEvent<TArgs>
{
	private instance: NetworkedEvent;

	private argumentHandlers?: StaticNetworkType<any>[];
	private useBuffers: boolean;
	private debugging: boolean;
	private argCountCheck: boolean;

	private invokeMiddleware: ServerEventInvokeMiddleware[];
	private callbackMiddleware: ServerEventCallbackMiddleware[];

	constructor(private readonly name: string, declaration: ServerEventDeclaration<TArgs>) {
		this.instance = new NetworkedEvent(name);
		this.argumentHandlers = declaration.Arguments;
		this.useBuffers = (declaration.Flags & NetworkingFlags.UseBufferSerialization) !== 0;
		this.callbackMiddleware = declaration.CallbackMiddleware;
		this.invokeMiddleware = declaration.InvokeMiddleware;
		this.debugging = (declaration.Flags & NetworkingFlags.Debugging) !== 0;
		this.argCountCheck = (declaration.Flags & NetworkingFlags.EnforceArgumentCount) !== 0;

		table.freeze(this);
	}

	public Predict(player: NetworkPlayer, ...args: TArgs) {
		if (!RunServerInvokeMiddleware(this.name, [player], this.invokeMiddleware, args)) return;
		const serverInvoked = ParseServerInvokeArgs(
			this.name,
			this.useBuffers,
			this.argumentHandlers ?? [],
			this.invokeMiddleware,
			args,
			this.argCountCheck,
		);

		this.instance.onClientEvent.Fire(player, ...serverInvoked);
	}

	public Wait(): TArgs {
		const result = this.instance.onClientEvent.Wait();
		const [player] = result;
		let args = select(2, ...result);

		let callback = (pl: Player, ...newArgs: unknown[]) => {
			transformedArgs = newArgs as TArgs;
		};
		for (const mw of this.callbackMiddleware) {
			callback = mw(callback, this);
		}

		let transformedArgs = ParseServerCallbackArgs(
			this.name,
			this.useBuffers,
			this.argumentHandlers ?? [],
			args,
			true,
		) as TArgs;

		callback(player, ...transformedArgs);

		const [validateResult, data] = ValidateArguments(transformedArgs, this.argumentHandlers ?? [], false);
		if (validateResult !== ValidateResult.Ok) {
			switch (validateResult) {
				case ValidateResult.ArgCountMismatch:
					throw `[NexusNet] Call to ${this.name} expected ${data.expectedCount} arguments, got ${data.argCount}`;
				case ValidateResult.ValidationError:
					throw `[NexusNet] Validation failed at index ${data.index}: ${data.message}`;
			}
		}

		return transformedArgs;
	}

	public Once(callback: (player: NetworkPlayer, ...args: TArgs) => void): Connection {
		const overloadCallback = CreateServerEventCallback(this.name, {
			UseBuffers: this.useBuffers,
			NetworkTypes: this.argumentHandlers ?? [],
			EnforceArguments: this.argCountCheck,
			Callback: callback,
			CallbackMiddleware: this.callbackMiddleware,
		});

		return new NexusEventConnection(this.instance.onClientEvent.Once(overloadCallback));
	}

	public Connect(callback: (player: NetworkPlayer, ...args: TArgs) => void): Connection {
		const overloadCallback = CreateServerEventCallback(this.name, {
			UseBuffers: this.useBuffers,
			NetworkTypes: this.argumentHandlers ?? [],
			EnforceArguments: this.argCountCheck,
			Callback: callback,
			CallbackMiddleware: this.callbackMiddleware,
		});

		return new NexusEventConnection(this.instance.onClientEvent.Connect(overloadCallback));
	}

	public SendToAllPlayers(...args: TArgs): void {
		if (!RunServerInvokeMiddleware(this.name, Airship.Players.GetPlayers(), this.invokeMiddleware, args)) return;
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
		if (!RunServerInvokeMiddleware(this.name, [] /** TODO: Fix */, this.invokeMiddleware, args)) return;
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
		if (!RunServerInvokeMiddleware(this.name, [player], this.invokeMiddleware, args)) return;
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
		if (!RunServerInvokeMiddleware(this.name, players, this.invokeMiddleware, args)) return;
		for (const player of players) {
			this.SendToPlayer(player, ...args);
		}
	}

	Fire(target: NetworkPlayer | Collection<NetworkPlayer>, ...args: TArgs) {
		if (NexusCollectionUtils.IsArrayLike(target)) {
			for (const player of target) {
				this.SendToPlayer(player, ...args);
			}
		} else if (NexusCollectionUtils.IsSetLike(target)) {
			for (const player of target) {
				this.SendToPlayer(player, ...args);
			}
		} else {
			this.SendToPlayer(target, ...args);
		}
	}

	FireExcept(blacklist: NetworkPlayer | Collection<NetworkPlayer>, ...args: TArgs) {
		if (NexusCollectionUtils.IsArrayLike(blacklist)) {
			for (const player of Airship.Players.GetPlayers()) {
				if (blacklist.includes(player)) continue;
				this.SendToPlayer(player, ...args);
			}
		} else if (NexusCollectionUtils.IsSetLike(blacklist)) {
			for (const player of Airship.Players.GetPlayers()) {
				if (blacklist.has(player)) continue;
				this.SendToPlayer(player, ...args);
			}
		} else {
			for (const player of Airship.Players.GetPlayers()) {
				if (blacklist.userId === player.userId) continue;
				this.SendToPlayer(player, ...args);
			}
		}
	}

	Broadcast(...args: TArgs) {
		this.SendToAllPlayers(...args);
	}
}
