import { ServerEventDeclaration } from "../Core/Types/NetworkObjectModel";
import { ServerEvent } from "../Objects/Server/ServerEvent";
import { ToNetworkArguments } from "../Core/Types/NetworkTypes";
import { Player } from "@Easy/Core/Shared/Player/Player";
import ObjectUtils from "@Easy/Core/Shared/Util/ObjectUtils";
import inspect from "@Easy/Core/Shared/Util/Inspect";
import { OnUpdate } from "@Easy/Core/Shared/Util/Timer";
import Nexus from ".";
import { ServerCallbackMiddleware, ServerInvokeMiddleware } from "../Core/Middleware/Types";

export namespace NexusTesting {
	let index = 0;
	class ServerEventTest<T extends Array<unknown>> {
		private readonly event: ServerEvent<T>;
		public constructor(declaration: ServerEventDeclaration<T>, private readonly parentTest: NexusTest) {
			this.event = new ServerEvent(`___TEST_${index++}`, declaration);
		}

		public SendAndWaitForRecieved(player: Player, ...args: T) {
			task.defer(() => {
				this.event.Predict(player, ...args);
			});

			const result = this.event.Wait();
			return result;
		}

		public InjectInvokeMiddleware(invokeMiddleware: ServerInvokeMiddleware<T>) {
			this.event["invokeMiddleware"].push(invokeMiddleware as ServerInvokeMiddleware);
		}

		public InjectCallbackMiddleware(callbackMiddleware: ServerCallbackMiddleware<T>) {
			this.event["callbackMiddleware"].push(callbackMiddleware as unknown as ServerCallbackMiddleware);
		}

		public ExpectArgsEqual<T extends ReadonlyArray<unknown>>(value: T, expected: T) {
			for (let i = 0; i < expected.size(); i++) {
				const expectedValue = expected[i];
				const gotValue = value[i];

				if (typeOf(expectedValue) !== typeOf(gotValue)) {
					assert(false, "Type Mismatch");
				}

				if (typeIs(expectedValue, "table")) {
					assert(
						ObjectUtils.deepEquals(expectedValue, gotValue as defined),
						"Value mismatch at index " +
							i +
							" expected " +
							inspect(expected[i]) +
							" got " +
							inspect(value[i]),
					);
				} else {
					assert(
						value[i] === expected[i],
						"Value mismatch at index " + i + " expected " + expected[i] + " got " + value[i],
					);
				}
			}
		}
	}

	class NexusTest {
		public constructor(public readonly name: string) {}

		public ServerEventWithArgs<T extends Array<unknown>>(
			buffered: boolean,
			...values: ToNetworkArguments<T>
		): ServerEventTest<T> {
			const networkType = Nexus.Event<T>(...values);
			const test = new ServerEventTest<T>(
				networkType.OnServer({ Debugging: true, UseBuffers: buffered, Logging: false }),
				this,
			);
			return test;
		}

		public IsOk() {
			return true;
		}
	}

	interface Test {
		readonly name: string;
		readonly execute: () => void;
	}

	export function Test(name: string, invoker: (test: NexusTest) => void | Promise<void>): Test {
		const test = new NexusTest(name);

		return {
			name,
			execute: () => {
				const result = invoker(test);
				if (Promise.is(result)) result.expect(); // wait for any promises
			},
		};
	}

	export function RunTests(
		tests: Test[],
	): [passedTests: string[], failedTests: [failedTest: string, reason: string][]] {
		print(`<color=#A877F7>==== Running ${tests.size()} tests ====</color>`);

		let timer = 0;
		let stopTimer = OnUpdate.Connect((dt) => {
			timer += dt;
		});

		let succeeded = 0;
		let failed = 0;

		let passedTests = new Array<string>();
		let failedTests = new Array<[string, string]>();

		for (const test of tests) {
			const startTime = timer;
			const [success, value] = pcall(test.execute);

			if (success) {
				print("✅<color=#77f777>", test.name, string.format("%.2f ms", (timer - startTime) * 1000), "</color>");
				passedTests.push(test.name);
				succeeded += 1;
			} else {
				warn("❌<color=#ff534a>", test.name, tostring(value), "</color>");
				failedTests.push([test.name, tostring(value)]);
				failed += 1;
			}
		}

		stopTimer();
		print(
			`<color=#A877F7>${tests.size()} tests</color>, <color=#77f777>${succeeded} passed</color>, <color=#ff534a>${failed} failed</color>`,
		);
		print("<color=#A877F7>=======================================</color>");

		return [passedTests, failedTests];
	}
}
