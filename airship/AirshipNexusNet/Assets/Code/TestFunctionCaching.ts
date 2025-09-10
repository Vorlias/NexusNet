import { Game } from "@Easy/Core/Shared/Game";
import Nexus, { NexusTimeSpan, NexusTypes } from "@Vorlias/NexusNet/Framework";

export default class TestFunctionCaching extends AirshipBehaviour {
	private testFn = Nexus.Server(
		"TestFunctionCache",
		Nexus.Function([NexusTypes.Number], NexusTypes.String).WithCachedCallback(NexusTimeSpan.seconds(5)),
	);

	override Start(): void {
		if (Game.IsServer()) {
			this.testFn.server.SetCallback((player, i) => {
				print("returns", "test:" + player.username + ":" + i);
				return "test:" + player.username + ":" + i;
			});
		}

		if (Game.IsClient()) {
			task.delay(2, () => {
				for (const i of $range(1, 10)) {
					const result = this.testFn.client.SendToServer(i);
					print("result is", i, result ?? "<no return value>");
					task.wait(1);
				}
			});
		}
	}
}
