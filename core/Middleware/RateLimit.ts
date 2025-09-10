import { Airship } from "@Easy/Core/Shared/Airship";
import { ClientEventInvokeMiddleware, ServerEventCallbackMiddleware } from "./Types";
import { Player } from "@Easy/Core/Shared/Player/Player";
import { NexusSentinel } from "@Vorlias/NexusNet/Framework/Events";
import { Game } from "@Easy/Core/Shared/Game";
import { SetTimeout } from "@Easy/Core/Shared/Util/Timer";

class RequestCounter {
	private _counter = new Map<string, number>();

	Increment(player: Player): number {
		let value = this.Get(player) + 1;
		this._counter.set(player.userId, value);
		return value;
	}

	Get(player: Player): number {
		return this._counter.get(player.userId) ?? 0;
	}

	Clear(player: Player) {
		this._counter.set(player.userId, 0);
	}

	ClearAll(): void {
		this._counter.clear();
	}
}

interface NexusRateLimitMiddleware<TArgs extends readonly unknown[]> {
	serverCallback: ServerEventCallbackMiddleware<TArgs>;
	clientInvoke: ClientEventInvokeMiddleware<TArgs>;
}

export interface RateLimitOptions {
	readonly timeoutSeconds: number;
	readonly requestsPerTimeout: number;
}

export function createRateLimitMiddleware<TArgs extends readonly unknown[]>(
	options: RateLimitOptions,
): NexusRateLimitMiddleware<TArgs> {
	const timeout = options.timeoutSeconds;
	const requests = options.requestsPerTimeout;

	const counter = new RequestCounter();
	if (Game.IsServer()) {
		// Clear request counter every X time period
		task.deferDetached(() => {
			while (true) {
				task.wait(timeout);
				counter.ClearAll();
			}
		});
	}

	const callback: ServerEventCallbackMiddleware<TArgs> = (invoke, instance) => {
		return (player, ...args) => {
			let count = counter.Increment(player);

			// if exceeds request count
			if (count >= requests) {
				NexusSentinel.onRateLimitExceeded.Fire(player, "", count, options);
				counter.Increment(player);
				return;
			}

			invoke(player, ...args);
		};
	};

	const invoke: ClientEventInvokeMiddleware<TArgs> = (...args) => {
		// const lastRequest = MapUtil.GetOrCreate(lastRequestTime, Game.localPlayer.userId, 0);
		// if (lastRequest + timeout > Time.time) return false;
		// lastRequestTime.set(Game.localPlayer.userId, Time.time);
	};

	return {
		serverCallback: callback,
		clientInvoke: invoke,
	};
}
