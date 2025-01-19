import NetworkAPI, { NetworkChannel } from "@Easy/Core/Shared/Network/NetworkAPI";
import { Player } from "@Easy/Core/Shared/Player/Player";
import inspect from "@Easy/Core/Shared/Util/Inspect";
import { GetAsNetEventId } from "./InternalId";

export class NetworkedEvent<TArgs extends unknown[] = unknown[]> {
	public Name = "ASRemoteEvnet";

	private readonly id: number;
	public constructor(
		name: string,
		private readonly channel = NetworkChannel.Reliable,
		public readonly debug = false,
	) {
		this.id = GetAsNetEventId(name);
	}

	/**
	 * @internal
	 */
	public FireAllClients(...args: TArgs) {
		assert(RunCore.IsServer());
		NetworkAPI.fireAllClients(this.id, args, this.channel);
	}

	/**
	 * @internal
	 */
	public FireExcept(ignorePlayer: Player, ...args: TArgs) {
		assert(RunCore.IsServer());
		NetworkAPI.fireExcept(this.id, ignorePlayer, args, this.channel);
	}

	/**
	 * @internal
	 */
	public FireClient(player: Player, ...args: TArgs) {
		assert(RunCore.IsServer());

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
		assert(RunCore.IsServer());
		NetworkAPI.fireClients(this.id, players, args, this.channel);
	}

	/**
	 * @internal
	 */
	public FireServer(...args: TArgs) {
		assert(RunCore.IsClient());
		NetworkAPI.fireServer(this.id, args, this.channel);
	}

	/**
	 * @internal
	 */
	public OnServerEvent<T extends TArgs>(callback: (...args: T) => void) {
		assert(RunCore.IsClient());
		return NetworkAPI.connect(false, this.id, (...args) => {
			callback(...(args as T));
		});
	}

	/**
	 * @internal
	 */
	public OnClientEvent<T extends TArgs>(callback: (player: Player, ...args: T) => void) {
		assert(RunCore.IsServer());
		return NetworkAPI.connect(true, this.id, (player: Player, ...args: T) => {
			callback(player, ...(args as T));
		});
	}
}
