import { Game } from "@Easy/Core/Shared/Game";
import Nexus, { NexusTypes } from "@Vorlias/NexusNet/Framework";
import { NexusTesting } from "@Vorlias/NexusNet/Framework/Tests";
import NexusSerialization from "@Vorlias/NexusNet/Core/Serialization";
import { NetworkingFlags, RemoteRunContext } from "@Vorlias/NexusNet/Core/Types/NetworkObjectModel";
import { NexusHashTable__EXPERIMENTAL } from "@Vorlias/NexusNet/Core/NetworkTypes/HashTable";
import { BufferWriter } from "@Vorlias/NexusNet/Core/Buffers/BufferWriter";
import { BufferReader } from "@Vorlias/NexusNet/Core/Buffers/BufferReader";
import { expressionToAst } from "@Vorlias/NexusNet/Inference";
import ObjectUtils from "@Easy/Core/Shared/Util/ObjectUtils";
import inspect from "@Easy/Core/Shared/Util/Inspect";
import { Airship } from "@Easy/Core/Shared/Airship";

export default class TestNetworking extends AirshipBehaviour {
	private data = Nexus.BuildObjectModel()
		.AddServer("Test", Nexus.Event(NexusTypes.String))
		.AddServer("Test2", Nexus.Function([], NexusTypes.String))
		.Build();

	protected StartServer() {
		Airship.Players.ObservePlayers((player) => {
			this.data.Get("Test").Server.SendToPlayer(player, "Hello, World!");
		});

		this.data.Get("Test2").Server.SetCallback((player) => {
			return "Hello, " + player.username + "!";
		});
	}
	protected StartClient() {
		this.data.Get("Test").Client.Connect((message) => {
			print("got message", message);
		});

		this.data
			.Get("Test2")
			.Client.SendToServerAsync()
			.then((message) => {
				print("Invoked server and got", message);
			});
	}

	override Start(): void {
		if (Game.IsServer()) this.StartServer();
		if (Game.IsClient()) this.StartClient();

		const [, failed] = NexusTesting.RunTests([
			NexusTesting.Test("Basic Transport", (test) => {
				const EXPECTED_VALUE = "Hello, World!";
				const test2 = test.ServerEventWithArgs(false, NexusTypes.String);
				test2.ExpectArgsEqual(test2.SendAndWaitForRecieved(undefined!, EXPECTED_VALUE), [EXPECTED_VALUE]);
			}),

			NexusTesting.Test("Array Transportation", (test) => {
				const arr = ["Hello", "World", ":-)"];

				const serializedEvent = test.ServerEventWithArgs(false, NexusTypes.Array(NexusTypes.String));
				serializedEvent.ExpectArgsEqual(serializedEvent.SendAndWaitForRecieved(undefined!, arr), [arr]);

				const bufferedEvent = test.ServerEventWithArgs(true, NexusTypes.Array(NexusTypes.String));
				bufferedEvent.ExpectArgsEqual(serializedEvent.SendAndWaitForRecieved(undefined!, arr), [arr]);

				const t = NexusTypes.Map(
					NexusTypes.String,
					NexusTypes.Interface({ a: NexusTypes.String, b: NexusTypes.Set(NexusTypes.String) }),
				);
			}),

			NexusTesting.Test("Hash Table Objects", () => {
				interface Test {
					Name: string;
					Class: "Warrior" | "Mage" | "Cleric";
					Level: number;
					IsCool: boolean;
				}
				const TestHashTableType = NexusHashTable__EXPERIMENTAL<Test>({
					Name: NexusTypes.String,
					Class: NexusTypes.Literal("Warrior", "Mage", "Cleric"),
					Level: NexusTypes.UInt16,
					IsCool: NexusTypes.Boolean,
				});

				let rawData: Test = {
					Name: "test",
					Class: "Cleric",
					Level: 10,
					IsCool: true,
				};

				const encoded = TestHashTableType.Serializer.Serialize(rawData);

				const [test, level, cclass, isCool] = encoded;
				// print("encoded is", inspect(encoded));

				assert(test === "test"); // Name is first
				assert(level === 10); // Level is second
				assert(cclass === 2); // Class is third
				assert(isCool === true); // IsCool is fourth

				const writer = new BufferWriter(0);
				TestHashTableType.BufferEncoder.WriteData(encoded, writer);

				const reader = new BufferReader(writer.ToBuffer());
				const encodedBufferDecoded = TestHashTableType.BufferEncoder.ReadData(reader);
				const decoded = TestHashTableType.Serializer.Deserialize(encodedBufferDecoded);
				assert(ObjectUtils.deepEquals(decoded, rawData), "not equal");
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

			NexusTesting.Test("Literal Serialization", (test) => {
				const literals = NexusTypes.Literal("A", "B", "C");

				const serializedA = NexusSerialization.Serialize(literals, "A");
				assert(serializedA === 0, "Serialized to wrong value for literal A - got " + serializedA);

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

			NexusTesting.Test("Server Invoke Middleware", (test) => {
				const testing = test.ServerEventWithArgs(false);

				let ranMiddleware = false;
				testing.InjectInvokeMiddleware((whoInvoked, ...args) => {
					print("Run middleware", inspect(whoInvoked));
					ranMiddleware = true;
				});

				testing.SendAndWaitForRecieved(undefined!);
				assert(ranMiddleware, "Did not run middleware!");
			}),

			NexusTesting.Test("Server Callback Middleware", (test) => {
				{
					const testing = test.ServerEventWithArgs(false, NexusTypes.String);

					let ranMiddleware = false;
					testing.InjectCallbackMiddleware((fire, instance) => {
						return (sender, ...args) => {
							ranMiddleware = true;
							fire(sender, ...args);
						};
					});

					const result = testing.SendAndWaitForRecieved(undefined!, "Hello, World!");
					assert(ranMiddleware, "Did not run middleware!");
				}
				{
					const testNoModify = test.ServerEventWithArgs(false, NexusTypes.String);
					testNoModify.InjectCallbackMiddleware((fire, instance) => {
						return (sender, ...args) => {
							fire(sender, 10 as never as string);
						};
					});

					const [success, result] = pcall(() => testNoModify.SendAndWaitForRecieved(undefined!, "test"));
					assert(!success, "Fire modification passsed somehow???");
				}
			}),

			NexusTesting.Test("Inline Test", (test) => {}),

			NexusTesting.Test("String Enum Serialization", () => {
				enum TestEnum {
					Bob = "Bob",
					Alice = "Alice",
					Max = "Max",
				}
				const TestEnumType = NexusTypes.StringEnum(TestEnum);

				const hashValueOfAlice = string.hash(TestEnum.Alice);
				const serializedAlice = TestEnumType.Serializer.Serialize(TestEnum.Alice);
				print("check", hashValueOfAlice, serializedAlice);
				assert(
					hashValueOfAlice === serializedAlice,
					`hashValueOfAlice(${hashValueOfAlice}) != serializedAlice(${serializedAlice})`,
				);

				const decode = TestEnumType.Serializer.Deserialize(serializedAlice);
				assert(decode === TestEnum.Alice, "Expected Alice!");
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

			NexusTesting.Test("Expression parsing", (test) => {
				const booleanTest = expressionToAst("boolean");
				assert(booleanTest.kind === "type" && booleanTest.value === "boolean");

				const optionalBooleanTest = expressionToAst("string?");
				assert(
					optionalBooleanTest.kind === "optional" &&
						optionalBooleanTest.children.kind === "type" &&
						optionalBooleanTest.children.value === "string",
				);

				const arrayBooleanTest = expressionToAst("Identity[]");
				assert(
					arrayBooleanTest.kind === "array" &&
						arrayBooleanTest.children.kind === "type" &&
						arrayBooleanTest.children.value === "Identity",
				);

				const optionalArrayBooleanTest = expressionToAst("number[]?");
				assert(
					optionalArrayBooleanTest.kind === "optional" &&
						optionalArrayBooleanTest.children.kind === "array" &&
						optionalArrayBooleanTest.children.children.kind === "type" &&
						optionalArrayBooleanTest.children.children.value === "number",
				);

				const arrayOfOptionalBooleans = expressionToAst("Character?[]");
				assert(
					arrayOfOptionalBooleans.kind === "array" &&
						arrayOfOptionalBooleans.children.kind === "optional" &&
						arrayOfOptionalBooleans.children.children.kind === "type" &&
						arrayOfOptionalBooleans.children.children.value === "Character",
				);

				const optionalArrayOfOptionalBooleans = expressionToAst("Inventory?[]?");
				assert(
					optionalArrayOfOptionalBooleans.kind === "optional" &&
						optionalArrayOfOptionalBooleans.children.kind === "array" &&
						optionalArrayOfOptionalBooleans.children.children.kind === "optional" &&
						optionalArrayOfOptionalBooleans.children.children.children.kind === "type" &&
						optionalArrayOfOptionalBooleans.children.children.children.value === "Inventory",
				);
			}),

			NexusTesting.Test("Optional params", (test) => {
				const testOptional = test.ServerEventWithArgs(false, NexusTypes.Optional(NexusTypes.String));

				const [got] = testOptional.SendAndWaitForRecieved(undefined!, undefined);
				print("value received should be ", got);
			}),

			NexusTesting.Test("Callback", (test) => {
				const getMessage = test.Function(false, [], NexusTypes.String);

				const expected = "Hello, World!";
				const getMessagePredict = getMessage.PredictCallback(() => {
					return expected;
				});

				const result = getMessagePredict();
				assert(result === expected, `Expected '${expected}' got '${result}'`);
				print("message result is", result);
			}),
		]);

		if (failed.size() > 0) return;
	}

	override OnDestroy(): void {}
}
