import { NexusNetworkBehaviour } from "@Vorlias/NexusNet/Components/NexusNetworkBehaviour";
import { Command } from "@Vorlias/NexusNet/Components/ServerRpc";
import { SyncArray } from "@Vorlias/NexusNet/DataTypes/SyncArray";
import { NexusTypes } from "@Vorlias/NexusNet/Framework";

export default class TestNetworkable extends NexusNetworkBehaviour {
	public testNum2 = new SyncArray(NexusTypes.String);

	@Command()
	public Test(): void {}

	protected OnStartServer(): void {
		print("[SERVER] Started");
	}

	protected OnStartClient(): void {
		print("[CLIENT] Started");
	}
}

const str = new SyncArray(NexusTypes.String);
