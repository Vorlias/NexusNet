import { Game } from "@Easy/Core/Shared/Game";
import { NetworkBehaviour } from "@Vorlias/NexusNet/Components/NetworkableBehaviour";
import { Broadcast } from "@Vorlias/NexusNet/Components/ServerRpc";
import Nexus, { NexusTypes } from "@Vorlias/NexusNet/Framework";

@NetworkBehaviour()
export default class TestNetworkable extends AirshipBehaviour {
	override OnDestroy(): void {}

	@Broadcast(NexusTypes.String)
	public Test(message: string) {
		print("Recieved", message, Game.IsServer());
	}

	override Start(): void {
		assert(this.gameObject.GetAirshipComponent<NetworkIdentity>());
		if (Game.IsServer()) {
			task.delay(5, () => {
				this.Test("Hello, World!");
			});
		}
	}
}
