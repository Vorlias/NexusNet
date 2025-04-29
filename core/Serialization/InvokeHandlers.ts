import { ClientInvokeMiddleware, ServerInvokeMiddleware } from "../Middleware/Types";
import { TransformArgsToBuffer } from "./BufferEncoding";
import { StaticNetworkType } from "../Types/NetworkTypes";
import { NetSerializeArguments } from "./Serializer";
import { NetworkPlayer } from "../Types/Dist";
import { NexusIsOptionalType, NexusOptional } from "../CoreTypes";
import { NexusTypes } from "@Vorlias/NexusNet/Framework";
import { ValidateResult, ValidateArguments } from "./Arguments";

export function ParseClientInvokeArgs<TArgs extends unknown[]>(
	name: string,
	useBuffers: boolean,
	transformers: StaticNetworkType<any>[],
	invokeMiddleware: ClientInvokeMiddleware[],
	args: TArgs,
	enforceArgCount: boolean,
) {
	const encoders = transformers.map((v) => v.BufferEncoder);

	if (enforceArgCount && transformers.size() !== args.size()) {
		throw `[NexusNet] Call to ${name} expected ${transformers.size()} arguments, got ${args.size()}`;
	}

	if (transformers.size() > 0) {
		const serializedArgs = NetSerializeArguments(transformers, args);

		if (useBuffers) {
			const buf = TransformArgsToBuffer(name, transformers, serializedArgs);
			return [buf] as const;
		}

		return serializedArgs as TArgs;
	} else {
		return args;
	}
}

export function RunServerInvokeMiddleware<TArgs extends unknown[]>(
	name: string,
	targets: NetworkPlayer[],
	invokeMiddleware: ServerInvokeMiddleware[],
	args: TArgs,
): boolean {
	for (const middleware of invokeMiddleware) {
		const res = middleware(targets, ...args);
		if (typeIs(res, "boolean") && !res) return false;
	}

	return true;
}

export function ParseServerInvokeArgs<TArgs extends unknown[]>(
	name: string,
	useBuffers: boolean,
	networkTypes: StaticNetworkType<any>[],
	invokeMiddleware: ServerInvokeMiddleware[],
	args: TArgs,
	enforceArguments: boolean,
) {
	if (enforceArguments) {
		const [result, data] = ValidateArguments(args, networkTypes, false);
		if (result !== ValidateResult.Ok) {
			switch (result) {
				case ValidateResult.ArgCountMismatch:
					throw `[NexusNet] Call to ${name} expected ${data.expectedCount} arguments, got ${data.argCount}`;
				case ValidateResult.ValidationError:
					throw `[NexusNet] Validation failed at index ${data.index}: ${data.message}`;
			}
		}
	}

	if (networkTypes.size() > 0) {
		const serializedArgs = NetSerializeArguments(networkTypes, args);

		if (useBuffers) {
			const buf = TransformArgsToBuffer(name, networkTypes, serializedArgs);
			return [buf] as const;
		}

		return serializedArgs as TArgs;
	} else {
		return args;
	}
}
