import { Game } from "@Easy/Core/Shared/Game";
import Nexus, { NexusTypes } from "@Vorlias/NexusNet/Framework";
import { NexusTesting } from "@Vorlias/NexusNet/Framework/Tests";
import NexusSerialization from "@Vorlias/NexusNet/Core/Serialization";
import { NetworkingFlags, RemoteRunContext } from "@Vorlias/NexusNet/Core/Types/NetworkObjectModel";
import { NexusServerContext } from "@Vorlias/NexusNet/Core/Generators/RemoteContext";
import { ServerEvent } from "@Vorlias/NexusNet/Objects/Server/ServerEvent";

export default class TestNetworking extends AirshipBehaviour {
	protected StartServer() {}
	protected StartClient() {}

	override Start(): void {
		const [, failed] = NexusTesting.RunTests([
			NexusTesting.Test("Basic Transport", (test) => {
				const EXPECTED_VALUE = "Hello, World!";
				const test2 = test.ServerEventWithArgs(false, NexusTypes.String);
				test2.ExpectArgsEqual(test2.SendAndWaitForRecieved(undefined!, EXPECTED_VALUE), [EXPECTED_VALUE]);
			}),

			NexusTesting.Test("Array Transportation", (test) => {
				const arr = ["Hello", "World", ":-)"];

				const serializedEvent = test.ServerEventWithArgs(false, NexusTypes.ArrayOf(NexusTypes.String));
				serializedEvent.ExpectArgsEqual(serializedEvent.SendAndWaitForRecieved(undefined!, arr), [arr]);

				const bufferedEvent = test.ServerEventWithArgs(true, NexusTypes.ArrayOf(NexusTypes.String));
				bufferedEvent.ExpectArgsEqual(serializedEvent.SendAndWaitForRecieved(undefined!, arr), [arr]);
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
			}),

			NexusTesting.Test("Network Object Model", () => {
				const model = Nexus.BuildObjectModel()
					.SetConfiguration({ UseBuffers: true })
					.AddServer("Test", Nexus.Event())
					.SetConfiguration({ UseBuffers: false })
					.AddClient("Test2", Nexus.Event())
					.AddServer("Test3", Nexus.Event().SetUseBuffer(true))
					.AddServer("TestUnreliable", Nexus.Event().AsUnreliable())
					.AddScope(
						"Scope",
						Nexus.BuildObjectModel()
							.AddServer("TestScoped", Nexus.Event()) //
							.AsScope(),
					);
				const testDeclaration = model.declarations.Test;
				assert(testDeclaration.RunContext === RemoteRunContext.Server);

				const test2Declaration = model.declarations.Test2;
				assert(test2Declaration.RunContext === RemoteRunContext.Client);

				const test3Declaration = model.declarations.Test3;
				assert(test3Declaration.RunContext === RemoteRunContext.Server);

				const testUnreliable = model.declarations.TestUnreliable;
				assert(testUnreliable.Unreliable, "Expected unreliable event");

				const scoped = model.declarations["Scope/TestScoped"];
				assert(scoped);

				assert(
					(testDeclaration.Flags & NetworkingFlags.UseBufferSerialization) !== 0,
					"Expected UseBufferSerialization, flags are " + testDeclaration.Flags,
				);

				assert(
					(test2Declaration.Flags & NetworkingFlags.UseBufferSerialization) === 0,
					"Expected no UseBufferSerialization, flags are " + testDeclaration.Flags,
				);

				assert(
					(test3Declaration.Flags & NetworkingFlags.UseBufferSerialization) !== 0,
					"Expected UseBufferSerialization, flags are " + test3Declaration.Flags,
				);

				assert(
					(testDeclaration.Flags & NetworkingFlags.EnforceArgumentCount) !== 0,
					"Expected EnforceArgumentCount, flags are " + testDeclaration.Flags,
				);
			}),
		]);

		if (failed.size() > 0) return;
		if (Game.IsServer()) this.StartServer();
		if (Game.IsClient()) this.StartClient();
	}

	override OnDestroy(): void {}
}
