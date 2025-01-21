import { luahashstring } from "@Vorlias/NexusNet/Core/Utils/hash";
import { getPlatform } from "@Vorlias/NexusNet/Core/Utils/platform";

export default class TestHashes extends AirshipBehaviour {
	override Start(): void {
		print(luahashstring("somePropertyName"), string.hash("somePropertyName"));
		print("platform should be airship", getPlatform());
	}

	override OnDestroy(): void {}
}
