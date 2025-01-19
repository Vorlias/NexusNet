import { NetworkSerializableType, StaticNetworkType } from "../Types/NetworkTypes";

export function NetIsSerializer<T>(value: StaticNetworkType<T>): value is NetworkSerializableType<T, unknown> {
	return "Serialize" in value && typeIs(value.Serialize, "function") && typeIs(value.Deserialize, "function");
}

export function NetSerializeArguments(transformers: StaticNetworkType<any>[] | undefined, args: unknown[]): unknown[] {
	if (transformers === undefined) return args;

	const newArgs: unknown[] = table.clone(args);
	for (let i = 0; i < transformers.size(); i++) {
		const arg = args[i];
		const transformer = transformers[i];
		if (NetIsSerializer(transformer)) {
			newArgs[i] = transformer.Serialize(arg);
		}
	}
	return newArgs;
}

export function NetDeserializeArguments(
	transformers: StaticNetworkType<any>[] | undefined,
	args: unknown[],
): unknown[] {
	if (transformers === undefined) return args;

	const newArgs: unknown[] = table.clone(args);
	for (let i = 0; i < transformers.size(); i++) {
		const arg = args[i];
		const transformer = transformers[i];
		if (NetIsSerializer(transformer)) {
			newArgs[i] = transformer.Deserialize(arg);
		}
	}
	return newArgs;
}
