import { Game } from "@Easy/Core/Shared/Game";
import inspect from "@Easy/Core/Shared/Util/Inspect";
import { NexusNetworkBehaviour } from "@Vorlias/NexusNet/Components/NexusNetworkBehaviour";
import { Command } from "@Vorlias/NexusNet/Components/ServerRpc";
import { NexusTypes } from "@Vorlias/NexusNet/Framework";
import { NexusSyncState } from "@Vorlias/NexusNet/NetworkData/SyncState";

interface Test {
	Test: string;
}

export default class TestNetworkable extends NexusNetworkBehaviour {
	public state = new NexusSyncState<Test>(
		{
			Test: NexusTypes.String,
		},
		{
			Test: "initial value",
		},
	);

	protected Start(): void {
		// this.state.BindIdentity(this.networkIdentity!, "test");
		// this.state.Observe((state) => {
		// 	print(Game.IsHosting() ? "HOSTING" : Game.IsServer() ? "SERVER" : "CLIENT", "state is", inspect(state));
		// });
		// this.state.ObserveSelector(
		// 	(v) => v.Test,
		// 	(state) => {
		// 		print("Test value is", state);
		// 	},
		// );
	}

	@Command()
	public Test(): void {}

	protected OnStartServer(): void {
		// print("[SERVER] Started");
		// task.delay(5, () => {
		// 	this.state.SetState({
		// 		Test: "New value!",
		// 	});
		// });
	}

	protected OnStartClient(): void {
		print("[CLIENT] Started");
	}
}
