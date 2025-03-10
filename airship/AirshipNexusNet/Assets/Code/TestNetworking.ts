import { Game } from "@Easy/Core/Shared/Game";
import { NexusNetwork } from "./Network";
import { Airship } from "@Easy/Core/Shared/Airship";
import Nexus, { NexusTypes } from "@Vorlias/NexusNet/Framework";
import { NexusTesting } from "@Vorlias/NexusNet/Framework/Tests";
import { ServerEvent } from "@Vorlias/NexusNet/Objects/Server/ServerEvent";
import { RemoteRunContext } from "@Vorlias/NexusNet/Core/Types/NetworkObjectModel";
import inspect from "@Easy/Core/Shared/Util/Inspect";
import NexusSerialization from "@Vorlias/NexusNet/Core/Serialization";

const Tests = Nexus.BuildObjectModel()
	.AddServer("ServerExpects", Nexus.Event()) //
	.Build();

export default class TestNetworking extends AirshipBehaviour {
	protected StartServer() {}
	protected StartClient() {}

	override Start(): void {
		NexusTesting.Test("Basic Transport", (test) => {
			const EXPECTED_VALUE = "Hello, World!";

			const test2 = test.ServerEventWithArgs(false, NexusTypes.String);
			test2.ExpectArgsEqual(test2.SendAndWaitForRecieved(undefined!, EXPECTED_VALUE), [EXPECTED_VALUE]);
		});

		NexusTesting.Test("Array Transportation", (test) => {
			const arr = ["Hello", "World", ":-)"];

			const serializedEvent = test.ServerEventWithArgs(false, NexusTypes.ArrayOf(NexusTypes.String));
			serializedEvent.ExpectArgsEqual(serializedEvent.SendAndWaitForRecieved(undefined!, arr), [arr]);

			const bufferedEvent = test.ServerEventWithArgs(true, NexusTypes.ArrayOf(NexusTypes.String));
			bufferedEvent.ExpectArgsEqual(serializedEvent.SendAndWaitForRecieved(undefined!, arr), [arr]);
		});

		NexusTesting.Test("Interface Serialization", async (test) => {
			interface TestCharacterDto {
				Name: string;
				Class: "Warrior" | "Mage" | "Cleric";
				Level: number;
			}

			const struct = NexusTypes.Interface<TestCharacterDto>({
				Name: NexusTypes.String,
				Class: NexusTypes.Literal("Warrior", "Mage", "Cleric"),
				Level: NexusTypes.UInt16,
			});

			const sendCharacterDto = test.ServerEventWithArgs(true, struct);
			const [result] = sendCharacterDto.SendAndWaitForRecieved(undefined!, {
				Name: "Testing",
				Class: "Cleric",
				Level: 20,
			});

			assert(result.Name === "Testing");
			assert(result.Class === "Cleric");
			assert(result.Level === 20);
		});

		NexusTesting.Test("Literal Serialization", (test) => {
			const literals = NexusTypes.Literal("A", "B", "C");

			const serializedA = NexusSerialization.Serialize(literals, "A");
			assert(serializedA === 0, "Serialized to wrong value for literal A");

			const serializedB = NexusSerialization.Serialize(literals, "B");
			assert(serializedB === 1, "Serialized to wrong value for literal B");

			const serializedC = NexusSerialization.Serialize(literals, "C");
			assert(serializedC === 2, "Serialized to wrong value for literal C");

			const a = NexusSerialization.Deserialize(literals, serializedA);
			assert(a === "A", "expected A");

			const b = NexusSerialization.Deserialize(literals, serializedB);
			assert(b === "B", "expected B");

			const c = NexusSerialization.Deserialize(literals, serializedC);
			assert(c === "C", "expected C");
		});
	}

	override OnDestroy(): void {}
}
