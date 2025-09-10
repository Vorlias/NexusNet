import { MapUtil } from "@Easy/Core/Shared/Util/MapUtil";
import { ClientFunctionInvokeMiddleware, ServerFunctionCallbackMiddleware } from "./Types";
import { Airship } from "@Easy/Core/Shared/Airship";
import { NexusTimeSpan } from "../Types/Time";

class MemoizedValue {
	private lastRequestTime = -math.huge;
	private cachedValue: unknown;

	public constructor(public readonly cacheSeconds: number) {}

	public Get<T>(callback: () => T): T {
		if (Time.time >= this.lastRequestTime + this.cacheSeconds) {
			const value = callback();
			this.cachedValue = value;
			this.lastRequestTime = Time.time;
			return value;
		} else {
			return this.cachedValue as T;
		}
	}
}

export const enum CacheType {
	Global,
	PerPlayer,
}
export interface CachingOptions {
	readonly time: NexusTimeSpan;
	readonly type: CacheType;
}

interface NexusFunctionCacheMiddleware {
	readonly serverCallback: ServerFunctionCallbackMiddleware;
}

export function createCachingMiddleware(options: CachingOptions): NexusFunctionCacheMiddleware {
	const seconds = options.time.seconds;

	if (options.type === CacheType.PerPlayer) {
		const playerMemoizer = new Map<string, MemoizedValue>();

		Airship.Players.onPlayerDisconnected.Connect((player) => {
			playerMemoizer.delete(player.userId);
		});

		return {
			serverCallback: (invoke) => {
				return (sender, ...args) => {
					const memoized = MapUtil.GetOrCreate(
						playerMemoizer,
						sender.userId,
						() => new MemoizedValue(seconds),
					);
					return memoized.Get(() => invoke(sender, ...args));
				};
			},
		};
	} else {
		const memoized = new MemoizedValue(seconds);
		// global memoization
		return {
			serverCallback: (invoke) => {
				return (sender, ...args) => {
					return memoized.Get(() => invoke(sender, ...args));
				};
			},
		};
	}
}
