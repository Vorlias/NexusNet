import { NetworkSerializableType, NetworkType, StaticNetworkType } from "../Types/NetworkTypes";

export function NetIsSerializer<T>(value: StaticNetworkType<T>): value is NetworkSerializableType<T, unknown> {
	return "Serializer" in value && typeIs(value.Serializer, "table");
}

export function NetSerializeArguments(networkTypes: StaticNetworkType<any>[] | undefined, args: unknown[]): unknown[] {
	if (networkTypes === undefined) return args;
	const serializers = NetworkType.TypesToSerializers(...networkTypes);

	const newArgs: unknown[] = table.clone(args);
	for (let i = 0; i < networkTypes.size(); i++) {
		const arg = args[i];

		const serializer = serializers[i];
		if (serializer) newArgs[i] = serializer.Serialize(arg);
	}
	return newArgs;
}

export function NetDeserializeArguments(
	networkTypes: StaticNetworkType<any>[] | undefined,
	args: unknown[],
): unknown[] {
	if (networkTypes === undefined) return args;
	const serializers = NetworkType.TypesToSerializers(...networkTypes);

	const newArgs: unknown[] = table.clone(args);
	for (let i = 0; i < networkTypes.size(); i++) {
		const arg = args[i];

		const serializer = serializers[i];
		if (serializer) newArgs[i] = serializer.Deserialize(arg);
	}
	return newArgs;
}
