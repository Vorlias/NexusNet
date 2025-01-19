import { ClientInvokeMiddleware, ServerInvokeMiddleware } from "../Middleware/Types";
import { TransformArgsToBuffer } from "./BufferEncoding";
import { StaticNetworkType } from "../Types/NetworkTypes";
import { NetSerializeArguments } from "./Serializer";

export function ParseClientInvokeArgs<TArgs extends unknown[]>(
	useBuffers: boolean,
	transformers: StaticNetworkType<any>[],
	invokeMiddleware: ClientInvokeMiddleware[],
	args: TArgs,
) {
	if (transformers.size() > 0) {
		const serializedArgs = NetSerializeArguments(transformers, args);

		if (useBuffers) {
			const buf = TransformArgsToBuffer(transformers, serializedArgs);
			return [buf];
		}

		return serializedArgs as TArgs;
	} else {
		return args;
	}
}

export function ParseServerInvokeArgs<TArgs extends unknown[]>(
	useBuffers: boolean,
	transformers: StaticNetworkType<any>[],
	invokeMiddleware: ServerInvokeMiddleware[],
	args: TArgs,
) {
	if (transformers.size() > 0) {
		const serializedArgs = NetSerializeArguments(transformers, args);

		if (useBuffers) {
			const buf = TransformArgsToBuffer(transformers, serializedArgs);
			return [buf];
		}

		return serializedArgs as TArgs;
	} else {
		return args;
	}
}
