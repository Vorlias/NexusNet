import { BufferReader } from "../Buffers/BufferReader";
import { BufferWriter } from "../Buffers/BufferWriter";
import {
	TransformFromBuffer,
	TransformFromNetworkArguments,
	TransformToBuffer,
	TransformToNetworkArguments,
} from "../Buffers/Transform";
import { RemotesFolder } from "../Internal";
import { GetRbxNetEventId } from "../Internal/InternalId";
import { ConfigFlags, NOM } from "../NetworkObjectModel";
import { NetworkSerialization } from "../Serialization";
import { NetworkType, NetworkTypeFlags } from "../Types/NetworkType";
import { TypeChecker } from "../Validation";
import { ServerListenerEvent, ServerSenderEvent } from "./ServerNetworkTypes";

/** @internal */
export function CreateServerEventCallback<T extends ReadonlyArray<unknown>>(
	argl: NetworkType.ToTypeArray<T>,
	callback: (player: Player, ...args: T) => void,
	compression: CastsToEnum<Enum.CompressionAlgorithm> | undefined,
) {
	return (player: Player, buffer: buffer, data: defined[] | undefined) => {
		assert(typeIs(buffer, "buffer"));
		assert(data === undefined || typeIs(data, "table"));

		const args = TransformFromNetworkArguments(buffer, data, argl, compression);
		callback(player, ...(args as T));
	};
}

const RunService = game.GetService("RunService");

export class NexusServerEvent<T extends Array<unknown>> implements ServerSenderEvent<T>, ServerListenerEvent<T> {
	private readonly instance!: RemoteEvent<(buffer: buffer, xData: defined[] | undefined) => void>;
	private readonly declaration: NOM.ServerEventDeclaration<T>;
	private readonly compression?: CastsToEnum<Enum.CompressionAlgorithm>;

	private readonly arguments: NetworkType.ToTypeArray<T>;

	public constructor(name: string, declaration: NOM.ServerEventDeclaration<T>) {
		this.declaration = declaration;

		name = NOM.hasConfigFlag(declaration.Config.Flags, ConfigFlags.RuntimeHashNames)
			? string.format("%.X", GetRbxNetEventId(name))
			: name;

		this.instance = RunService.IsServer()
			? new Instance("RemoteEvent")
			: (RemotesFolder.WaitForChild(name) as RemoteEvent);
		assert(this.instance.IsA("RemoteEvent"));
		this.instance.Name = name;
		this.instance.Parent = RemotesFolder;
		this.arguments = declaration.Arguments as NetworkType.ToTypeArray<T>;

		this.compression = declaration.Config.Compression;

		table.freeze(this);
	}

	public Connect(callback: (player: Player, ...args: T) => void): RBXScriptConnection {
		const cb = CreateServerEventCallback<T>(this.arguments, callback, this.compression);
		return this.instance.OnServerEvent.Connect(cb as Callback);
	}

	public SendToAllPlayers(...args: T): void {
		const [buffer, xData] = TransformToNetworkArguments(args as never, this.arguments, this.compression);
		this.instance.FireAllClients(buffer, xData);
	}

	public SendToAllPlayersExcept(targetOrTargets: Player | Array<Player>, ...args: T): void {
		const players = game.GetService("Players").GetPlayers();

		if (TypeChecker.isArrayLike(targetOrTargets)) {
			for (const player of players) {
				if (targetOrTargets.includes(player)) continue;
				this.SendToPlayer(player, ...args);
			}
		} else {
			for (const player of players) {
				if (targetOrTargets === player) continue;
				this.SendToPlayer(player, ...args);
			}
		}
	}

	public SendToPlayer(target: Player, ...args: T): void {
		const [buffer, xData] = TransformToNetworkArguments(args as never, this.arguments, this.compression);
		this.instance.FireClient(target, buffer, xData);
	}

	public SendToPlayers(targets: Array<Player>, ...args: T): void {
		for (const player of targets) {
			this.SendToPlayer(player, ...args);
		}
	}
}
