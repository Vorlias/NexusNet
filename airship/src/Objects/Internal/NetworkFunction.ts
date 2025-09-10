import { NetworkChannel } from "@Easy/Core/Shared/Network/NetworkAPI";
import { Game } from "@Easy/Core/Shared/Game";
import { Player } from "@Easy/Core/Shared/Player/Player";
import { GetAsNetEventId } from "./InternalId";
import { NetworkedEvent } from "./NetworkEvent";

export class NetworkedFunction<TArgs extends unknown[] = unknown[], TRet extends unknown = unknown> {
	private disconnect?: () => void;
	private reqId = 0;

	private sender: NetworkedEvent<[requestId: number, ...args: TArgs]>;
	private reciever: NetworkedEvent<[requestId: number, ret: TRet]>;

	public Name = "ASRemoteFunction";

	private readonly yieldingThreads = new Map<number, thread>();

	private readonly id: number;
	public constructor(private readonly name: string, private readonly timeoutSeconds: number) {
		this.id = GetAsNetEventId(name);

		this.sender = new NetworkedEvent(name + ":Sender", NetworkChannel.Reliable);
		this.reciever = new NetworkedEvent(name + ":Reciever", NetworkChannel.Reliable);
	}

	private listening = false;
	private Listen(requestId: number) {
		if (this.listening) return;

		let startTime = Time.time;
		let timeout = this.timeoutSeconds;

		// task.spawn(() => {
		// 	while (this.yieldingThreads.has(requestId) && Time.time < startTime + timeout) {
		// 		task.wait();
		// 	}

		// 	if (this.yieldingThreads.has(requestId)) {

		// 	}
		// });

		this.reciever.OnServerEvent((incomingRequestId, retValue) => {
			const thread = this.yieldingThreads.get(incomingRequestId);
			if (thread) {
				task.spawn(thread, retValue);
			}

			this.yieldingThreads.delete(incomingRequestId);
		});
	}

	public FireServer(...args: TArgs) {
		assert(Game.IsClient());

		const reqId = this.reqId++;
		this.Listen(reqId);

		const thread = coroutine.running();
		this.yieldingThreads.set(reqId, thread);

		this.sender.FireServer(reqId, ...args);
		return coroutine.yield() as unknown as TRet;
	}

	public SetServerCallback(fn: (player: Player, ...args: TArgs) => TRet) {
		assert(Game.IsServer());

		if (this.disconnect) {
			this.disconnect();
		}

		this.disconnect = this.sender.OnClientEvent((player, requestId: number, ...args: unknown[]) => {
			const result = fn(player, ...(args as TArgs));
			if (Promise.is(result)) {
				result.then((value) => {
					this.reciever.FireClient(player, requestId, value as TRet);
				});
			} else {
				this.reciever.FireClient(player, requestId, result as TRet);
			}
		});

		return this.disconnect;
	}
}
