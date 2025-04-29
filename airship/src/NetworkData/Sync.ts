import { Bin } from "@Easy/Core/Shared/Util/Bin";
import { NetworkSerializableType, NetworkType, StaticNetworkType } from "@Vorlias/NexusNet/Core/Types/NetworkTypes";
import Nexus, { NexusTypes } from "@Vorlias/NexusNet/Framework";
import { ClientEventDeclaration, ServerEventDeclaration } from "@Vorlias/NexusNet/Core/Types/NetworkObjectModel";
import { Signal } from "@Easy/Core/Shared/Util/Signal";
import { Game } from "@Easy/Core/Shared/Game";

type InlineClientEvent<T extends readonly unknown[]> = Nexus.InlineContext<ClientEventDeclaration<T>>;
type InlineServerEvent<T extends readonly unknown[]> = Nexus.InlineContext<ServerEventDeclaration<T>>;
type TableNetworkType<T> = { [P in keyof T]: NetworkSerializableType<T[P], any> | NetworkType<T[P]> };
type FactoryOrStruct<T> = T | (() => T);
type StateUpdate<T> = ((old: T) => T) | Partial<T>;
type Observer<T> = (nextState: T, prevState: T) => void | (() => void);

export abstract class NexusSyncable<T extends object> {
	protected bin = new Bin();
	protected networkIdentity: NetworkIdentity;
	protected data: T;

	protected requestSnapshot: InlineClientEvent<[nid: NetworkIdentity]>;
	protected serverSendSnapshot: InlineServerEvent<[nid: NetworkIdentity, data: T]>;

	protected requiresInitialSnapshotData = true;

	public readonly stateChanged = new Signal<[next: T, prev: T]>();

	public constructor(protected readonly networkType: StaticNetworkType<T>) {}

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
			disconnectFn = observer(this.data, this.data);
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
				disconnectFn = observer(this.data, this.data);
			}

			return this.stateChanged.Connect((nextState, prevState) => {
				if (typeIs(disconnectFn, "function")) {
					disconnectFn();
				}

				disconnectFn = observer(nextState, prevState);
			});
		}
	}

	public abstract BindIdentity(identity: NetworkIdentity, id: string): void;
}
