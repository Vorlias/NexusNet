// export class ServerReplicatedSignal<T extends readonly StaticNetworkType[]> {
// 	public networkedSignal: Nexus.InlineContext<ServerEventDeclaration<T>>;
// 	public signal = new Signal<[...Nexus.ToValueTypes<T>]>();

// 	public constructor(id: string, ...types: T) {
// 		this.networkedSignal = Nexus.Server(id, Nexus.Event(...types));
// 		this.signal = new Signal();
// 	}

// 	public Connect(callback: SignalCallback<Nexus.ToValueTypes<T>>) {
// 		if (Game.IsServer()) {
// 			return new NexusEventConnection(this.signal.Connect(callback));
// 		} else {
// 			return this.networkedSignal.client.Connect((...args) => {
// 				callback(...(args as never));
// 			});
// 		}
// 	}

// 	public Once(callback: SignalCallback<Nexus.ToValueTypes<T>>) {
// 		let done = false;
// 		const c = this.Connect((...args) => {
// 			if (done) return;
// 			done = true;
// 			c.Disconnect();
// 			callback(...args);
// 		});
// 		return c;
// 	}

// 	/**
// 	 * Yields the current thread until the next invocation of the
// 	 * signal occurs. The invoked arguments will be returned.
// 	 */
// 	public Wait() {
// 		const thread = coroutine.running();
// 		this.Once((...args) => {
// 			task.spawn(thread, ...args);
// 		});
// 		return coroutine.yield() as LuaTuple<[...Nexus.ToValueTypes<T>]>;
// 	}

// 	public Fire(...values: Nexus.ToValueTypes<T>) {
// 		if (Game.IsServer()) {
// 			this.signal.Fire(...(values as never));
// 			this.networkedSignal.server.SendToAllPlayers(...values);
// 		} else {
// 			this.signal.Fire(...(values as never));
// 		}
// 	}
// }
