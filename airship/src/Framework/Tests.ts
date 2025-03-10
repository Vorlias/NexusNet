import { ServerEventDeclaration } from "../Core/Types/NetworkObjectModel";
import { ServerEvent } from "../Objects/Server/ServerEvent";
import { ToNetworkArguments } from "../Core/Types/NetworkTypes";
import { AirshipEventBuilder } from "../Builders/EventBuilder";
import { Player } from "@Easy/Core/Shared/Player/Player";
import ObjectUtils from "@Easy/Core/Shared/Util/ObjectUtils";
import inspect from "@Easy/Core/Shared/Util/Inspect";

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
			const event = new AirshipEventBuilder().WithArguments(...values);
			const declaration = event.OnServer({
				Debugging: true,
				UseBuffers: buffered,
				Logging: false,
			});

			const test = new ServerEventTest<T>(declaration, this);
			return test;
		}

		public IsOk() {
			return true;
		}
	}

	export function Test(name: string, invoker: (test: NexusTest) => void | Promise<void>) {
		const test = new NexusTest(name);

		try {
			const result = invoker(test);
			if (Promise.is(result)) result.expect(); // wait for any promises

			print("✅", name);
		} catch (err) {
			warn("❌", name, tostring(err));
		}
	}
}
