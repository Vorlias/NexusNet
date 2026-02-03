import Nexus, { NexusTypes } from "@rbxts/nexus";
import { hashstring } from "@rbxts/nexus/out/Core/Utils/hash";
import { ServerEvent } from "@rbxts/nexus/out/Objects/Server/ServerEvent";
import { TestNetwork } from "shared/module";
import { NexusTesting } from "shared/Tests";

TestNetwork.Server.Get("TestFunction").SetCallback((player) => {
	return "Hello, " + player.Name + "!";
});

NexusTesting.RunTests([
	NexusTesting.Test("Basic Transport", (test) => {
		const EXPECTED_VALUE = "Hello, World!";
		const test2 = test.ServerEventWithArgs(false, NexusTypes.String);
		test2.ExpectArgsEqual(test2.SendAndWaitForRecieved(undefined!, EXPECTED_VALUE), [EXPECTED_VALUE]);
	}),
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

		// const serialized = struct.Serializer.Serialize({
		// 	Name: "hi",
		// 	Class: "Cleric",
		// 	Level: 10,
		// });
		// print(inspect(serialized));

		const sendCharacterDto = test.ServerEventWithArgs(true, struct);
		const [result] = sendCharacterDto.SendAndWaitForRecieved(undefined!, {
			Name: "Testing",
			Class: "Cleric",
			Level: 20,
		});

		assert(result.Name === "Testing");
		assert(result.Class === "Cleric");
		assert(result.Level === 20);
	}),
	NexusTesting.Test("String Enum Serialization", () => {
		enum TestEnum {
			Bob = "Bob",
			Alice = "Alice",
			Max = "Max",
		}
		const TestEnumType = NexusTypes.StringEnum(TestEnum);

		const hashValueOfAlice = hashstring(TestEnum.Alice);
		const serializedAlice = TestEnumType.Serializer.Serialize(TestEnum.Alice);
		print("check", hashValueOfAlice, serializedAlice);
		assert(
			hashValueOfAlice === serializedAlice,
			`hashValueOfAlice(${hashValueOfAlice}) != serializedAlice(${serializedAlice})`,
		);

		const decode = TestEnumType.Serializer.Deserialize(serializedAlice);
		assert(decode === TestEnum.Alice, "Expected Alice!");
	}),
	NexusTesting.Test("Receive signal from client", (test) => {
		const evt = TestNetwork.Get("TestClientSend").Server as ServerEvent<unknown[]>;
		const [player, message] = evt.Wait();
		assert(message === "Hello, World!");
		TestNetwork.Get("TestServerSend").Server.SendToPlayer(player, `Server got '${message}'`);
	}),
]);
