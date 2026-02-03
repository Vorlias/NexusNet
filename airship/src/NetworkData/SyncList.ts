import { Game } from "@Easy/Core/Shared/Game";
import { ClientEventDeclaration, ServerEventDeclaration } from "../Core/Types/NetworkObjectModel";
import { NetworkType } from "../Core/Types/NetworkTypes";
import Nexus, { NexusTypes } from "../Framework";
import { NexusSyncable } from "./Sync";

type InlineClientEvent<T extends readonly unknown[]> = Nexus.InlineContext<ClientEventDeclaration<T>>;
type InlineServerEvent<T extends readonly unknown[]> = Nexus.InlineContext<ServerEventDeclaration<T>>;
export class NexusSyncList<T extends defined> extends NexusSyncable<T[]> {
	protected serverDeltaChange: InlineServerEvent<[nid: NetworkIdentity, deltaChanges: [index: number, value: T]]>;

	constructor(networkType: NetworkType.OfType<T>) {
		super(NexusTypes.Array(networkType) as NetworkType.OfType<T[]>);
	}

	public BindIdentity(identity: NetworkIdentity, id: string): void {
		this.networkIdentity = identity;

		this.serverSendSnapshot = Nexus.Server(
			"NexusList/Snapshot/" + id,
			Nexus.Event(NexusTypes.Identity, this.networkType).SetUseBuffer(true),
		);
		this.requestSnapshot = Nexus.Client(
			"NexusList/RequestSnapshot/" + id,
			Nexus.Event(NexusTypes.Identity).SetUseBuffer(true),
		);

		if (Game.IsServer()) {
			this.bin.Add(
				this.requestSnapshot.server.Connect((player, nid) => {
					if (nid.netId !== this.networkIdentity.netId) return;
					this.serverSendSnapshot.server.SendToPlayer(player, nid, this.data);
				}),
			);
		}

		if (Game.IsClient()) {
			this.bin.Add(
				this.serverSendSnapshot.client.Connect((nid, data) => {
					if (nid.netId !== this.networkIdentity.netId) return;

					this.requiresInitialSnapshotData = false;
					this.stateChanged.Fire(data, this.data);
					this.data = data;
				}),
			);
		}
	}

	public Add(item: T) {
		const idx = this.data.push(item) - 1;
		// this.serverDeltaChange.server.SendToAllPlayers(this.networkIdentity, [idx, item]);
	}

	public Count(): number {
		return this.data.size();
	}

	public Get(index: number) {
		return this.data[index];
	}

	public Set(index: number, update: ((value: T | undefined) => T) | T) {
		if (typeIs(update, "function")) {
			this.data[index] = update(this.data[index]);
		} else {
			this.data[index] = update;
		}
	}

	public Remove(itemOrIndex: T | number) {
		if (typeIs(itemOrIndex, "number")) {
			// Remove item by index
		} else {
			// TODO: Remove item by item
		}
	}

	public IndexOf(item: T): number {
		return this.data.indexOf(item);
	}

	public Values(): T[] {
		return table.clone(this.data);
	}
}

const names = new NexusSyncList(NexusTypes.String);
for (const name of names.Values()) {
}
