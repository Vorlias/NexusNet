import {
	DeserializationContext,
	NetworkDeserializer,
	NetworkSerializableType,
	NetworkSerializer,
	NetworkType,
	NetworkTypeSerialization,
	StaticNetworkType,
} from "../Types/NetworkTypes";

export function NetIsSerializer<T>(value: StaticNetworkType<T>): value is NetworkSerializableType<T, unknown> {
	return "Serializer" in value && typeIs(value.Serialization, "table");
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

type DeserializeResultTuple =
	| LuaTuple<[success: true, arguments: Array<unknown>]>
	| LuaTuple<[success: false, err: DeserializeError]>;

export const enum DeserializeErrorType {
	NoNetworkTypesSpecified,
	DeserializationException,
}

export interface DeserializationException {
	readonly type: DeserializeErrorType.DeserializationException;
	/**
	 * The argument index of this exception
	 */
	readonly argIndex: number;
	/**
	 * The value that failed to deserialize */
	readonly value: unknown;
	/**
	 * The error associated with the exception
	 */
	readonly error: unknown;
	/**
	 * The network type that failed to deserialize
	 */
	readonly networkType: StaticNetworkType;
	/**
	 * The serializer
	 */
	readonly serialization: NetworkTypeSerialization<unknown, unknown>;
}

export type DeserializeError =
	| { readonly type: DeserializeErrorType.NoNetworkTypesSpecified }
	| DeserializationException;

export function NetDeserializeArgumentsWithExceptionHandler(
	networkTypes: StaticNetworkType<any>[] | undefined,
	args: unknown[],
): DeserializeResultTuple {
	if (networkTypes === undefined) {
		return $tuple(false, {
			type: DeserializeErrorType.NoNetworkTypesSpecified,
		} satisfies DeserializeError);
	}

	const serializers = NetworkType.TypesToSerializers(...networkTypes);

	const newArgs: unknown[] = table.clone(args);
	for (let i = 0; i < networkTypes.size(); i++) {
		const arg = args[i];
		const serializer = serializers[i];

		if (serializer) {
			try {
				newArgs[i] = serializer.Deserialize(arg);
			} catch (exception) {
				return $tuple(false, {
					type: DeserializeErrorType.DeserializationException,
					argIndex: i,
					value: arg,
					error: exception,
					networkType: networkTypes[i],
					serialization: serializer,
				} satisfies DeserializeError);
			}
		}
	}
	return $tuple(true, newArgs);
}
