import NetworkAPI, { NetworkChannel } from "@Easy/Core/Shared/Network/NetworkAPI";
import inspect from "@Easy/Core/Shared/Util/Inspect";
import { GetAsNetEventId } from "./InternalId";
import { Signal } from "@Easy/Core/Shared/Util/Signal";
import { Player } from "@Easy/Core/Shared/Player/Player";
import { Game } from "@Easy/Core/Shared/Game";

export const enum NetworkEventAuthority {
	ServerAuthority = 1 << 0,
	ClientAuthority = 1 << 1,
	Both = ServerAuthority | ClientAuthority,
}

export class NetworkedEvent<TArgs extends unknown[] = unknown[]> {
	public readonly onClientEvent = new Signal<[player: Player, ...unknown[]]>();
	public readonly onServerEvent = new Signal<unknown[]>();

	private readonly id: number;
	public constructor(
		name: string,
		private readonly channel = NetworkChannel.Reliable,
		private readonly authority = NetworkEventAuthority.Both,
		public readonly debug = false,
	) {
		this.id = GetAsNetEventId(name);
		table.freeze(this);

		if (Game.IsClient()) {
			NetworkAPI.connect(false, this.id, (...args: TArgs[]) => {
				this.onServerEvent.Fire(...(args as TArgs));
			});
		}

		if (Game.IsServer()) {
			// OnClientEvent
			NetworkAPI.connect(true, this.id, (player: Player, ...args: TArgs[]) => {
				this.onClientEvent.Fire(player, ...args);
			});
		}
	}

	/**
	 * @internal
	 */
	public FireAllClients(...args: TArgs) {
		assert(RunCore.IsServer() && (this.authority & NetworkEventAuthority.ServerAuthority) !== 0);
		NetworkAPI.fireAllClients(this.id, args, this.channel);
	}

	/**
	 * @internal
	 */
	public FireExcept(ignorePlayer: Player, ...args: TArgs) {
		assert(RunCore.IsServer() && (this.authority & NetworkEventAuthority.ServerAuthority) !== 0);
		NetworkAPI.fireExcept(this.id, ignorePlayer, args, this.channel);
	}

	/**
	 * @internal
	 */
	public FireClient(player: Player, ...args: TArgs) {
		assert(RunCore.IsServer() && (this.authority & NetworkEventAuthority.ServerAuthority) !== 0);

		const [success, err] = pcall(() => {
			NetworkAPI.fireClient(this.id, player, args, this.channel);
		});

		if (!success) {
			warn(
				"error",
				debug.traceback(tostring(err)),
				"with arguments",
				inspect(args),
				"while trying to send to player",
				player.username,
			);
		}
	}

	/**
	 * @internal
	 */
	public FireClients(players: Player[], ...args: TArgs) {
		assert(RunCore.IsServer() && (this.authority & NetworkEventAuthority.ServerAuthority) !== 0);
		NetworkAPI.fireClients(this.id, players, args, this.channel);
	}

	/**
	 * @internal
	 */
	public FireServer(...args: TArgs) {
		assert(RunCore.IsClient() && (this.authority & NetworkEventAuthority.ClientAuthority) !== 0);
		NetworkAPI.fireServer(this.id, args, this.channel);
	}

	public PredictServer(player: Player, ...args: unknown[]) {}
	public PredictClient(...args: unknown[]) {}

	/**
	 * @internal
	 */
	public OnServerEvent<T extends TArgs>(callback: (...args: T) => void) {
		assert(RunCore.IsClient() && (this.authority & NetworkEventAuthority.ClientAuthority) !== 0);
		return this.onServerEvent.Connect((...args) => {
			callback(...(args as T));
		});
	}

	/**
	 * @internal
	 */
	public OnClientEvent<T extends TArgs>(callback: (player: Player, ...args: T) => void) {
		assert(RunCore.IsServer() && (this.authority & NetworkEventAuthority.ServerAuthority) !== 0);
		return this.onClientEvent.Connect((player, ...args) => {
			callback(player, ...(args as T));
		});
	}
}
