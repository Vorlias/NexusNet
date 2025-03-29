import { ClientInvokeMiddleware, ServerInvokeMiddleware } from "../Middleware/Types";
import { TransformArgsToBuffer } from "./BufferEncoding";
import { StaticNetworkType } from "../Types/NetworkTypes";
import { NetSerializeArguments } from "./Serializer";

export function ParseClientInvokeArgs<TArgs extends unknown[]>(
	name: string,
	useBuffers: boolean,
	transformers: StaticNetworkType<any>[],
	invokeMiddleware: ClientInvokeMiddleware[],
	args: TArgs,
	enforceArgCount: boolean,
) {
	if (enforceArgCount && transformers.size() !== args.size()) {
		throw `[NexusNet] Call to ${name} expected ${transformers.size()} arguments, got ${args.size()}`;
	}

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
	name: string,
	useBuffers: boolean,
	transformers: StaticNetworkType<any>[],
	invokeMiddleware: ServerInvokeMiddleware[],
	args: TArgs,
	enforceArgCount: boolean,
) {
	if (enforceArgCount && transformers.size() !== args.size()) {
		throw `[NexusNet] Call to ${name} expected ${transformers.size()} arguments, got ${args.size()}`;
	}

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
