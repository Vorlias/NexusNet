import { NexusSentinel } from "@Vorlias/NexusNet/Framework/Events";
import {
	ClientEventCallbackMiddleware,
	ServerEventCallbackMiddleware,
	ServerFunctionCallbackMiddleware,
} from "../Middleware/Types";
import { NetworkPlayer } from "../Types/Dist";
import { NetworkType } from "../Types/NetworkTypes";
import { ValidateArguments, ValidateResult } from "./Arguments";
import { TransformArgsToBuffer, TransformBufferToArgs } from "./BufferEncoding";
import {
	DeserializeError,
	DeserializeErrorType,
	NetDeserializeArguments,
	NetDeserializeArgumentsWithExceptionHandler,
	NetSerializeArguments,
} from "./Serializer";

export function ParseServerCallbackArgs<TArgs extends unknown[]>(
	name: string,
	useBuffers: boolean,
	transformers: NetworkType.Any[],
	args: TArgs,
	argCheck: boolean,
) {
	if (useBuffers && transformers.size() > 0) {
		const [buffer] = args;
		const data = TransformBufferToArgs(name, transformers, buffer as buffer);
		const transformedArgs = NetDeserializeArguments(transformers, data);

		if (argCheck) {
			const [result, data] = ValidateArguments(transformedArgs, transformers, false);
			if (result !== ValidateResult.Ok) {
				switch (result) {
					case ValidateResult.ArgCountMismatch:
						throw `[NexusNet] Call to ${name} expected ${data.expectedCount} arguments, got ${data.argCount}`;
					case ValidateResult.ValidationError:
						throw `[NexusNet] Validation failed at index ${data.index}: ${data.message}`;
				}
			}
		}

		return table.freeze(transformedArgs);
	} else {
		const transformedArgs = NetDeserializeArguments(transformers, args);

		if (argCheck) {
			const [result, data] = ValidateArguments(transformedArgs, transformers, false);
			if (result !== ValidateResult.Ok) {
				switch (result) {
					case ValidateResult.ArgCountMismatch:
						throw `[NexusNet] Call to ${name} expected ${data.expectedCount} arguments, got ${data.argCount}`;
					case ValidateResult.ValidationError:
						throw `[NexusNet] Validation failed at index ${data.index}: ${data.message}`;
				}
			}
		}

		return table.freeze(transformedArgs); //  wtf ???
	}
}

interface ServerEventCallback<TArgs extends ReadonlyArray<unknown>> {
	readonly UseBuffers: boolean;
	readonly EnforceArguments: boolean;
	readonly NetworkTypes: NetworkType.Any[];
	readonly Callback: (player: NetworkPlayer, ...args: TArgs) => void;
	readonly CallbackMiddleware: ServerEventCallbackMiddleware[];
}
type AnyServerCallback<T extends readonly unknown[] = readonly unknown[]> = (player: NetworkPlayer, ...args: T) => void;
export function CreateServerEventCallback<TArgs extends ReadonlyArray<unknown> = ReadonlyArray<unknown>>(
	name: string,
	options: ServerEventCallback<TArgs>,
): AnyServerCallback {
	const useBuffers = options.UseBuffers;
	const enforceArgs = options.EnforceArguments;
	const networkTypes = options.NetworkTypes;
	let callback = options.Callback;
	const useSentinel = NexusSentinel.IsEnabled();

	print("mw count is ", options.CallbackMiddleware.size());
	for (const mw of options.CallbackMiddleware) callback = mw(callback as AnyServerCallback, undefined!);

	if (useBuffers && networkTypes.size() > 0) {
		return ((player: NetworkPlayer, buffer: buffer) => {
			let data: unknown[];

			try {
				data = TransformBufferToArgs(name, networkTypes, buffer);
			} catch (e) {
				if (useSentinel) NexusSentinel.onServerBufferDecodeError.Fire(player, name, networkTypes, e);
				throw e; // rethrow
			}

			const transformedArgs = NetDeserializeArguments(networkTypes, data);

			if (enforceArgs) {
				const [result, data] = ValidateArguments(transformedArgs, networkTypes, false);
				if (result !== ValidateResult.Ok) {
					switch (result) {
						case ValidateResult.ArgCountMismatch:
							if (useSentinel)
								NexusSentinel.onServerArgumentMismatch.Fire(
									player,
									true,
									name,
									data.argCount,
									data.expectedCount,
								);
							throw `[NexusNet] Call to ${name} expected ${data.expectedCount} arguments, got ${data.argCount}`;
						case ValidateResult.ValidationError:
							if (useSentinel)
								NexusSentinel.onServerValidationError.Fire(
									player,
									true,
									name,
									networkTypes[data.index],
									transformedArgs[data.index],
									data.index,
								);
							throw `[NexusNet] Validation failed at index ${data.index}: ${data.message}`;
					}
				}
			}

			callback(player, ...(transformedArgs as unknown as TArgs));
		}) as AnyServerCallback;
	} else if (networkTypes.size() > 0) {
		return (player: NetworkPlayer, ...args: unknown[]) => {
			const transformedArgs = NetDeserializeArguments(networkTypes, args);

			if (enforceArgs) {
				const [result, data] = ValidateArguments(transformedArgs, networkTypes, false);
				if (result !== ValidateResult.Ok) {
					switch (result) {
						case ValidateResult.ArgCountMismatch:
							if (useSentinel)
								NexusSentinel.onServerArgumentMismatch.Fire(
									player,
									false,
									name,
									data.argCount,
									data.expectedCount,
								);
							throw `[NexusNet] Call to ${name} expected ${data.expectedCount} arguments, got ${data.argCount}`;
						case ValidateResult.ValidationError:
							if (useSentinel)
								NexusSentinel.onServerValidationError.Fire(
									player,
									false,
									name,
									networkTypes[data.index],
									transformedArgs[data.index],
									data.index,
								);
							throw `[NexusNet] Validation failed at index ${data.index}: ${data.message}`;
					}
				}
			}

			// Receiving from client needs validation
			for (let i = 0; i < networkTypes.size(); i++) {
				const networkType = networkTypes[i];

				const [valid, err] = NetworkType.Check(networkType, transformedArgs[i]);
				if (!valid) {
					warn("[ServerEventCallback] Failed validation at index", `${i}:`, err);
					return;
				}
			}

			callback(player, ...(transformedArgs as unknown as TArgs));
		};
	} else {
		return callback as AnyServerCallback;
	}
}

function onDeserializationError(result: DeserializeError) {
	if (result.type === DeserializeErrorType.DeserializationException) {
		const exception = result.serialization.OnDeserializeException;
		if (typeIs(exception, "function")) {
			exception(result);
		} else {
			warn(
				"[NexusNet] Failed to deserialize",
				result.networkType.Name,
				"at position",
				result.argIndex + ":",
				tostring(result.error),
			);
		}
	} else {
		warn("[NexusNet] Failed to deserialize with exception", result.type);
	}
}

interface ClientEventCallback<TArgs extends ReadonlyArray<unknown>> {
	readonly UseBuffers: boolean;
	readonly EnforceArguments: boolean;
	readonly NetworkTypes: NetworkType.Any[];
	readonly Callback: (...args: TArgs) => void;
	readonly CallbackMiddleware: ClientEventCallbackMiddleware[];
}
type AnyClientCallback<T extends readonly unknown[] = readonly unknown[]> = (...args: T) => void;
export function CreateClientEventCallback<TArgs extends ReadonlyArray<unknown> = ReadonlyArray<unknown>>(
	name: string,
	options: ClientEventCallback<TArgs>,
): AnyClientCallback {
	const useBuffers = options.UseBuffers;
	const networkTypes = options.NetworkTypes;
	let callback = options.Callback;

	for (const mw of options.CallbackMiddleware) callback = mw(callback as AnyClientCallback, undefined!);

	if (useBuffers && networkTypes.size() > 0) {
		return ((buffer: buffer) => {
			const data = TransformBufferToArgs(name, networkTypes, buffer);
			const [success, result] = NetDeserializeArgumentsWithExceptionHandler(networkTypes, data);
			if (success) {
				callback(...(result as unknown as TArgs));
			} else {
				// TODO: Handle lol
			}
		}) as AnyClientCallback;
	} else if (networkTypes.size() > 0) {
		return (...args: unknown[]) => {
			const [success, result] = NetDeserializeArgumentsWithExceptionHandler(networkTypes, args);

			if (success) {
				callback(...(result as unknown as TArgs));
			} else {
				onDeserializationError(result);
			}
		};
	} else {
		return callback as AnyClientCallback;
	}
}

interface ServerFunctionCallback<TArgs extends ReadonlyArray<unknown>, TRet extends unknown> {
	readonly UseBuffers: boolean;
	readonly NetworkTypes: NetworkType.Any[];
	readonly NetworkReturnType: NetworkType.Any;
	readonly Callback: (player: NetworkPlayer, ...args: TArgs) => TRet;
	readonly CallbackMiddleware: ServerFunctionCallbackMiddleware[];
}
type AnyServerFunctionCallback<T extends readonly unknown[] = readonly unknown[], TRet extends unknown = unknown> = (
	player: NetworkPlayer,
	...args: T
) => TRet;
export function CreateServerFunctionCallback<
	TArgs extends ReadonlyArray<unknown> = ReadonlyArray<unknown>,
	TRet extends unknown = unknown,
>(name: string, options: ServerFunctionCallback<TArgs, TRet>): AnyServerFunctionCallback {
	const useBuffers = options.UseBuffers;
	const networkTypes = options.NetworkTypes;
	const networkReturnType = options.NetworkReturnType;
	assert(networkReturnType, "Missing return type");

	let callback = options.Callback as AnyServerFunctionCallback;
	for (const mw of options.CallbackMiddleware) callback = mw(callback as AnyServerFunctionCallback);

	if (useBuffers && networkTypes.size() > 0) {
		return ((player: NetworkPlayer, buffer: buffer) => {
			const data = TransformBufferToArgs(name, networkTypes, buffer);
			const transformedArgs = NetDeserializeArguments(networkTypes, data);

			// Receiving from client needs validation
			for (let i = 0; i < networkTypes.size(); i++) {
				const networkType = networkTypes[i];

				const [valid, err] = NetworkType.Check(networkType, transformedArgs[i]);
				if (!valid) {
					warn("[ServerEventCallback] Failed validation at index", `${i}:`, err);
					return;
				}
			}

			const result = callback(player, ...(transformedArgs as unknown as TArgs));

			const resultTransformed = NetSerializeArguments([networkReturnType], [result]);
			const resultBuffer = TransformArgsToBuffer(name, [networkReturnType], resultTransformed);
			return resultBuffer;
		}) as AnyServerCallback;
	} else {
		return (player: NetworkPlayer, ...args: unknown[]) => {
			const transformedArgs = NetDeserializeArguments(networkTypes, args);

			// Receiving from client needs validation
			for (let i = 0; i < networkTypes.size(); i++) {
				const networkType = networkTypes[i];

				const [valid, err] = NetworkType.Check(networkType, transformedArgs[i]);
				if (!valid) {
					warn("[ServerEventCallback] Failed validation at index", `${i}:`, err);
					return;
				}
			}

			const result = callback(player, ...(transformedArgs as unknown as TArgs));
			const [resultTransformed] = NetSerializeArguments([networkReturnType], [result]);
			return resultTransformed;
		};
	}
}
