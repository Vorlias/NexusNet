/* eslint-disable @typescript-eslint/no-explicit-any */
import { ServerCallbackMiddleware } from "../../Core/Middleware/Types";
import { CreateServerEventCallback } from "../../Core/Serialization/CallbackHandlers";
import { ParseServerInvokeArgs } from "../../Core/Serialization/InvokeHandlers";
import { Connection, NetworkPlayer } from "../../Core/Types/Dist";
import { NetworkingFlags, ServerEventDeclaration } from "../../Core/Types/NetworkObjectModel";
import { StaticNetworkType } from "../../Core/Types/NetworkTypes";
import { ServerListenerEvent, ServerSenderEvent } from "../../Core/Types/Server/NetworkObjects";
import { RemotesFolder } from "../../Internal";
import { GetRbxNetEventId } from "../Internal/InternalId";

export class ServerEvent<T extends Array<unknown>> implements ServerSenderEvent<T>, ServerListenerEvent<T> {
	private instance: RemoteEvent<Callback>;

	private argumentHandlers?: StaticNetworkType<any>[];
	private useBuffers = false;
	private debugging = false;
	private argCountCheck: boolean;

	private callbackMiddleware: ServerCallbackMiddleware[];

	constructor(
		private readonly name: string,
		declaration: ServerEventDeclaration<T>,
	) {
		const instance = new Instance("RemoteEvent");
		instance.Name = string.format("%.X", GetRbxNetEventId(name));
		instance.Parent = RemotesFolder;

		this.instance = instance;

		this.argumentHandlers = declaration.Arguments;
		this.useBuffers = (declaration.Flags & NetworkingFlags.UseBufferSerialization) !== 0;
		this.callbackMiddleware = declaration.CallbackMiddleware as ServerCallbackMiddleware[];
		this.debugging = (declaration.Flags & NetworkingFlags.Debugging) !== 0;
		this.argCountCheck = (declaration.Flags & NetworkingFlags.EnforceArgumentCount) !== 0;
		table.freeze(this);
	}

	Connect(callback: (player: NetworkPlayer, ...args: T) => void): Connection {
		const overloadCallback = CreateServerEventCallback({
			UseBuffers: this.useBuffers,
			Callback: callback,
			EnforceArguments: this.argCountCheck,
			CallbackMiddleware: this.callbackMiddleware ?? [],
			NetworkTypes: this.argumentHandlers ?? [],
		});

		return this.instance.OnServerEvent.Connect(overloadCallback);
	}

	SendToAllPlayers(...args: T): void {
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

	SendToAllPlayersExcept(targetOrTargets: NetworkPlayer | Array<NetworkPlayer>, ...args: T): void {
		const transformedArgs = ParseServerInvokeArgs(
			this.name,
			this.useBuffers,
			this.argumentHandlers ?? [],
			[],
			args,
			this.argCountCheck,
		);
		if (!transformedArgs) return;

		const players = new Set<Player>(game.GetService("Players").GetPlayers());

		if (typeIs(targetOrTargets, "Instance")) {
			players.delete(targetOrTargets);
		} else {
			targetOrTargets.forEach((target) => players.delete(target));
		}

		for (const player of players) {
			this.instance.FireClient(player, ...transformedArgs);
		}
	}

	SendToPlayer(target: NetworkPlayer, ...args: T): void {
		const transformedArgs = ParseServerInvokeArgs(
			this.name,
			this.useBuffers,
			this.argumentHandlers ?? [],
			[],
			args,
			this.argCountCheck,
		);
		if (!transformedArgs) return;

		return this.instance.FireClient(target, ...transformedArgs);
	}

	SendToPlayers(targets: Array<NetworkPlayer>, ...args: T): void {
		const transformedArgs = ParseServerInvokeArgs(
			this.name,
			this.useBuffers,
			this.argumentHandlers ?? [],
			[],
			args,
			this.argCountCheck,
		);
		if (!transformedArgs) return;

		for (const player of targets) {
			this.instance.FireClient(player, ...transformedArgs);
		}
	}
}
