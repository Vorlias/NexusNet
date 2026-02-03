import { Bin } from "@Easy/Core/Shared/Util/Bin";
import Nexus, { NexusTypes } from "@Vorlias/NexusNet/Framework/index";
import { ClientEventDeclaration, ServerEventDeclaration } from "@Vorlias/NexusNet/Core/Types/NetworkObjectModel";
import { NetworkSerializableType, NetworkType } from "@Vorlias/NexusNet/Core/Types/NetworkTypes";
import { Signal } from "@Easy/Core/Shared/Util/Signal";
import { Game } from "@Easy/Core/Shared/Game";
import ObjectUtils from "@Easy/Core/Shared/Util/ObjectUtils";

type FactoryOrStruct<T> = T | (() => T);
type StateUpdate<T> = ((old: T) => T) | Partial<T>;
type Observer<T> = (nextState: T, prevState: T) => void | (() => void);

type InlineClientEvent<T extends readonly unknown[]> = Nexus.InlineContext<ClientEventDeclaration<T>>;
type InlineServerEvent<T extends readonly unknown[]> = Nexus.InlineContext<ServerEventDeclaration<T>>;
type TableNetworkType<T> = { [P in keyof T]: NetworkSerializableType<T[P], any> | NetworkType<T[P]> };

/**
 * A lightweight alternative to NetworkSync
 */
export class NexusSyncState<T extends object> {
	private bin = new Bin();

	private state: T;
	private id: number;
	private networkIdentity: NetworkIdentity;

	private serverAuthSnapshot: InlineServerEvent<[nid: NetworkIdentity, data: T]>;
	private clientAuthSnapshot: InlineClientEvent<[nid: NetworkIdentity, data: T]>;

	private requestSnapshot: InlineClientEvent<[nid: NetworkIdentity]>;
	private requiresInitialSnapshotData = true;

	public readonly stateChanged = new Signal<[next: T, prev: T]>();

	public constructor(
		private readonly networkType: TableNetworkType<T>,
		private readonly factory: FactoryOrStruct<T>,
	) {
		this.state = this.GetDefaultValue();
	}

	/**
	 * Gets the default value for this particular state
	 * @returns The default
	 */
	public GetDefaultValue(): T {
		if (typeIs(this.factory, "function")) {
			return this.factory();
		} else if (typeIs(this.factory, "table")) {
			return table.clone(this.factory);
		} else {
			return this.factory;
		}
	}

	/**
	 * Sets the state with an update function OR update object
	 * @param update
	 */
	public SetState(update: StateUpdate<T>) {
		const oldState = this.state;

		if (typeIs(update, "function")) {
			this.state = update(this.state);
		} else {
			this.state = { ...this.state, ...update };
		}

		if (!ObjectUtils.deepEquals(this.state, oldState)) {
			this.stateChanged.Fire(this.state, oldState);
		}
	}

	/**
	 * Gets the current state
	 * @returns
	 */
	public GetState(): Readonly<T> {
		return this.state;
	}

	/**
	 * Observes the state of the state
	 *
	 * On the client, it will fetch an initial snapshot; on the server it will invoke immediately.
	 * @param observer The observer function
	 * @returns A disconnect function
	 */
	public Observe(observer: Observer<T>) {
		let disconnectFn: (() => void) | void;

		if (Game.IsServer()) {
			disconnectFn = observer(this.state, this.state);
			return this.stateChanged.Connect((nextState, prevState) => {
				if (typeIs(disconnectFn, "function")) {
					disconnectFn();
				}

				disconnectFn = observer(nextState, prevState);
			});
		} else {
			if (this.requiresInitialSnapshotData) {
				this.requestSnapshot.client.SendToServer(this.networkIdentity);
			} else {
				disconnectFn = observer(this.state, this.state);
			}

			return this.stateChanged.Connect((nextState, prevState) => {
				if (typeIs(disconnectFn, "function")) {
					disconnectFn();
				}

				disconnectFn = observer(nextState, prevState);
			});
		}
	}

	public ObserveSelector<R>(selector: (value: T) => R, observer: Observer<R>) {
		let disconnectFn: (() => void) | void;

		if (Game.IsServer()) {
			const initialValue = selector(this.state);

			disconnectFn = observer(initialValue, initialValue);
			return this.stateChanged.Connect((nextState, prevState) => {
				const prevValue = selector(prevState);
				const newValue = selector(nextState);

				if (prevValue !== newValue) {
					if (typeIs(disconnectFn, "function")) {
						disconnectFn();
					}

					disconnectFn = observer(newValue, prevValue);
				}
			});
		} else {
			if (this.requiresInitialSnapshotData) {
				this.requestSnapshot.client.SendToServer(this.networkIdentity);
			} else {
				const initialValue = selector(this.state);
				disconnectFn = observer(initialValue, initialValue);
			}

			return this.stateChanged.Connect((nextState, prevState) => {
				const prevValue = selector(prevState);
				const newValue = selector(nextState);

				if (newValue !== prevValue) {
					if (typeIs(disconnectFn, "function")) {
						disconnectFn();
					}

					disconnectFn = observer(newValue, prevValue);
				}
			});
		}
	}

	/**
	 * Binds and activates this state object on the given NetworkIdentity
	 * @param identity The network identity to bind this state to
	 * @param id A unique id for this particular state
	 */
	public BindIdentity(identity: NetworkIdentity, id: string) {
		const stateId = id.hash();
		this.id = stateId;
		this.networkIdentity = identity;

		this.serverAuthSnapshot = Nexus.Server(
			"NexusState/Snapshot/" + id,
			Nexus.Event(NexusTypes.Identity, NexusTypes.Interface(this.networkType)).SetUseBuffer(true),
		);
		this.requestSnapshot = Nexus.Client(
			"NexusState/RequestSnapshot/" + id,
			Nexus.Event(NexusTypes.Identity).SetUseBuffer(true),
		);

		if (Game.IsServer()) {
			this.requiresInitialSnapshotData = false;
			this.bin.Add(
				this.requestSnapshot.server.Connect((player, nid) => {
					if (nid.netId !== this.networkIdentity.netId) return;

					this.serverAuthSnapshot.server.SendToPlayer(player, nid, this.state);
				}),
			);

			this.bin.Add(
				this.stateChanged.Connect((newState) => {
					this.serverAuthSnapshot.server.SendToAllPlayers(this.networkIdentity, newState);
				}),
			);
		}

		if (Game.IsClient()) {
			// bind client
			this.bin.Add(
				this.serverAuthSnapshot.client.Connect((nid, data) => {
					if (nid.netId !== this.networkIdentity.netId) return;

					this.requiresInitialSnapshotData = false;
					this.stateChanged.Fire(data, this.state);
					this.state = data;
				}),
			);
		}
	}
}
