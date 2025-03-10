import { ClientCallbackMiddleware, ServerCallbackMiddleware } from "../Middleware/Types";
import { NetworkPlayer } from "../Types/Dist";
import { StaticNetworkType } from "../Types/NetworkTypes";
import { TransformArgsToBuffer, TransformBufferToArgs } from "./BufferEncoding";
import { NetDeserializeArguments, NetSerializeArguments } from "./Serializer";

export function ParseServerCallbackArgs<TArgs extends unknown[]>(
	useBuffers: boolean,
	transformers: StaticNetworkType<any>[],
	args: TArgs,
) {
	if (useBuffers && transformers.size() > 0) {
		const [buffer] = args;
		const data = TransformBufferToArgs(transformers, buffer as buffer);
		const transformedArgs = NetDeserializeArguments(transformers, data);
		return transformedArgs;
	} else {
		return NetDeserializeArguments(transformers, args); //  wtf ???
	}
}

interface ServerEventCallback<TArgs extends ReadonlyArray<unknown>> {
	readonly UseBuffers: boolean;
	readonly EnforceArguments: boolean;
	readonly NetworkTypes: StaticNetworkType<any>[];
	readonly Callback: (player: NetworkPlayer, ...args: TArgs) => void;
	readonly CallbackMiddleware: ServerCallbackMiddleware[];
}
type AnyServerCallback<T extends readonly unknown[] = readonly unknown[]> = (player: NetworkPlayer, ...args: T) => void;
export function CreateServerEventCallback<TArgs extends ReadonlyArray<unknown> = ReadonlyArray<unknown>>(
	options: ServerEventCallback<TArgs>,
): AnyServerCallback {
	const useBuffers = options.UseBuffers;
	const enforceArgs = options.EnforceArguments;
	const networkTypes = options.NetworkTypes;
	let callback = options.Callback;

	for (const mw of options.CallbackMiddleware) callback = mw(callback as AnyServerCallback, undefined!);

	if (useBuffers && networkTypes.size() > 0) {
		return ((player: NetworkPlayer, buffer: buffer) => {
			const data = TransformBufferToArgs(networkTypes, buffer);
			const transformedArgs = NetDeserializeArguments(networkTypes, data);

			if (enforceArgs && data.size() !== networkTypes.size()) {
				warn("[NexusNet] Argument count mismatch, expected " + networkTypes.size() + " got " + data.size());
				return;
			}

			// Receiving from client needs validation
			for (let i = 0; i < networkTypes.size(); i++) {
				const networkType = networkTypes[i];
				if (!networkType.Validate(transformedArgs[i])) {
					const msg = typeIs(networkType.Message, "function")
						? networkType.Message(transformedArgs[i], networkType.Name)
						: networkType.Message;

					warn("[ServerEventCallback] Failed validation at index " + i + ": " + msg);
					return;
				}
			}

			callback(player, ...(transformedArgs as unknown as TArgs));
		}) as AnyServerCallback;
	} else if (networkTypes.size() > 0) {
		return (player: NetworkPlayer, ...args: unknown[]) => {
			const transformedArgs = NetDeserializeArguments(networkTypes, args);
			if (enforceArgs && args.size() !== networkTypes.size()) {
				warn("[NexusNet] Argument count mismatch, expected " + networkTypes.size() + " got " + args.size());
				return;
			}

			// Receiving from client needs validation
			for (let i = 0; i < networkTypes.size(); i++) {
				const networkType = networkTypes[i];
				if (!networkType.Validate(transformedArgs[i])) {
					const msg = typeIs(networkType.Message, "function")
						? networkType.Message(transformedArgs[i], networkType.Name)
						: networkType.Message;

					warn("[ServerEventCallback] Failed validation at index " + i + ": " + msg);
					return;
				}
			}

			callback(player, ...(transformedArgs as unknown as TArgs));
		};
	} else {
		return callback as AnyServerCallback;
	}
}

interface ClientEventCallback<TArgs extends ReadonlyArray<unknown>> {
	readonly UseBuffers: boolean;
	readonly EnforceArguments: boolean;
	readonly NetworkTypes: StaticNetworkType<any>[];
	readonly Callback: (...args: TArgs) => void;
	readonly CallbackMiddleware: ClientCallbackMiddleware[];
}
type AnyClientCallback<T extends readonly unknown[] = readonly unknown[]> = (...args: T) => void;
export function CreateClientEventCallback<TArgs extends ReadonlyArray<unknown> = ReadonlyArray<unknown>>(
	options: ClientEventCallback<TArgs>,
): AnyClientCallback {
	const useBuffers = options.UseBuffers;
	const networkTypes = options.NetworkTypes;
	let callback = options.Callback;

	for (const mw of options.CallbackMiddleware) callback = mw(callback as AnyClientCallback, undefined!);

	if (useBuffers && networkTypes.size() > 0) {
		return ((buffer: buffer) => {
			const data = TransformBufferToArgs(networkTypes, buffer);
			const transformedArgs = NetDeserializeArguments(networkTypes, data);
			callback(...(transformedArgs as unknown as TArgs));
		}) as AnyClientCallback;
	} else if (networkTypes.size() > 0) {
		return (...args: unknown[]) => {
			const transformedArgs = NetDeserializeArguments(networkTypes, args);
			callback(...(transformedArgs as unknown as TArgs));
		};
	} else {
		return callback as AnyClientCallback;
	}
}

interface ServerFunctionCallback<TArgs extends ReadonlyArray<unknown>, TRet extends unknown> {
	readonly UseBuffers: boolean;
	readonly NetworkTypes: StaticNetworkType<any>[];
	readonly NetworkReturnType: StaticNetworkType<any>;
	readonly Callback: (player: NetworkPlayer, ...args: TArgs) => TRet;
	// readonly CallbackMiddleware: ServerCallbackMiddleware[];
}
type AnyServerFunctionCallback<T extends readonly unknown[] = readonly unknown[], TRet extends unknown = unknown> = (
	player: NetworkPlayer,
	...args: T
) => TRet;
export function CreateServerFunctionCallback<
	TArgs extends ReadonlyArray<unknown> = ReadonlyArray<unknown>,
	TRet extends unknown = unknown,
>(options: ServerFunctionCallback<TArgs, TRet>): AnyServerFunctionCallback {
	const useBuffers = options.UseBuffers;
	const networkTypes = options.NetworkTypes;
	const networkReturnType = options.NetworkReturnType;
	assert(networkReturnType, "Missing return type");

	let callback = options.Callback;

	if (useBuffers && networkTypes.size() > 0) {
		return ((player: NetworkPlayer, buffer: buffer) => {
			const data = TransformBufferToArgs(networkTypes, buffer);
			const transformedArgs = NetDeserializeArguments(networkTypes, data);

			// Receiving from client needs validation
			for (let i = 0; i < networkTypes.size(); i++) {
				const networkType = networkTypes[i];
				if (!networkType.Validate(transformedArgs[i])) {
					const msg = typeIs(networkType.Message, "function")
						? networkType.Message(transformedArgs[i], networkType.Name)
						: networkType.Message;

					warn("[ServerEventCallback] Failed validation at index " + i + ": " + msg);
					return;
				}
			}

			const result = callback(player, ...(transformedArgs as unknown as TArgs));
			const resultTransformed = NetSerializeArguments([networkReturnType], [result]);
			const resultBuffer = TransformArgsToBuffer([networkReturnType], resultTransformed);
			return resultBuffer;
		}) as AnyServerCallback;
	} else {
		return (player: NetworkPlayer, ...args: unknown[]) => {
			const transformedArgs = NetDeserializeArguments(networkTypes, args);

			// Receiving from client needs validation
			for (let i = 0; i < networkTypes.size(); i++) {
				const networkType = networkTypes[i];
				if (!networkType.Validate(transformedArgs[i])) {
					const msg = typeIs(networkType.Message, "function")
						? networkType.Message(transformedArgs[i], networkType.Name)
						: networkType.Message;

					warn("[ServerEventCallback] Failed validation at index " + i + ": " + msg);
					return;
				}
			}

			const result = callback(player, ...(transformedArgs as unknown as TArgs));
			const [resultTransformed] = NetSerializeArguments([networkReturnType], [result]);
			return resultTransformed;
		};
	}
}
