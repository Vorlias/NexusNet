import { NetworkBuffers } from "../Buffers";
import NexusSerialization from "../Serialization";
import { NetworkBuffer, NetworkSerializableType, NetworkType, StaticNetworkType } from "./NetworkTypes";

type Out<TType> = NexusSerialization.Output<TType>;
type In<TType> = NexusSerialization.Input<TType>;

export interface NetworkSetType<TIn, TOut> extends NetworkSerializableType<Set<TIn>, readonly TOut[]> {}
export function NexusSet<T extends NetworkSerializableType<any, any> | NetworkType<any>>(
	valueType: T,
): NetworkSetType<In<T>, Out<T>> {
	return {
		Name: `Set<${valueType.Name}>`,
		Validation: {
			ValidateError: (networkType, value) => {
				return "Expected " + networkType.Name + ", got " + typeOf(value);
			},
			Validate(value): value is Set<In<T>> {
				if (!typeIs(value, "table")) return false;
				for (const [k, v] of pairs(value)) {
					if (!valueType.Validation.Validate(k)) return false;
					if (!typeIs(v, "boolean")) return false;
				}

				return true;
			},
		},
		Serialization: {
			Serialize(set) {
				const newArray = new Array<defined>();

				for (const value of set) {
					newArray.push(NexusSerialization.Serialize(valueType, value));
				}

				return newArray as Array<Out<T>>;
			},
			Deserialize(array) {
				const set = new Set<defined>();

				for (const value of array) {
					set.add(NexusSerialization.Deserialize(valueType, value));
				}

				return set as Set<In<T>>;
			},
		},
		Encoding: NetworkBuffers.Array(valueType.Encoding),
	};
}

export interface NetworkMapType<K, V> extends NetworkSerializableType<Map<In<K>, In<V>>, readonly [Out<K>, Out<V>][]> {}
export function NexusMap<K extends StaticNetworkType, V extends StaticNetworkType>(
	keyType: K,
	valueType: V,
): NetworkMapType<K, V> {
	return {
		Name: `Map<${keyType.Name}, ${valueType.Name}>`,
		Validation: {
			ValidateError: (networkType, value) => {
				return "Expected " + networkType.Name + ", got " + typeOf(value);
			},
			Validate(value): value is Map<In<K>, In<V>> {
				if (!typeIs(value, "table")) return false;
				for (const [k, v] of pairs(value)) {
					if (!keyType.Validation.Validate(k)) return false;
					if (!valueType.Validation.Validate(v)) return false;
				}

				return true;
			},
		},
		Serialization: {
			Serialize(map) {
				const arr = new Array<[Out<K>, Out<V>]>();

				for (const [key, value] of map) {
					const keyEncoded = NexusSerialization.Serialize(keyType, key);
					const valueEncoded = NexusSerialization.Serialize(valueType, value);
					arr.push([keyEncoded, valueEncoded]);
				}

				return arr;
			},
			Deserialize(kvPairs) {
				const map = new Map<defined, defined>();

				for (const pair of kvPairs) {
					const [k, v] = pair as [defined, defined];

					map.set(
						NexusSerialization.Deserialize(keyType, k as Out<K>),
						NexusSerialization.Deserialize(valueType, v as Out<V>),
					);
				}

				return map as Map<In<K>, In<V>>;
			},
		},
		Encoding: {
			ReadData(reader) {
				const length = reader.ReadUInt32(); // read length
				const arr = new Array<[Out<K>, Out<V>]>();

				for (let i = 0; i < length; i++) {
					const k = keyType.Encoding.ReadData(reader) as Out<K>;
					const v = valueType.Encoding.ReadData(reader) as Out<V>;

					arr.push([k, v]);
				}

				return arr;
			},
			WriteData(data, writer) {
				writer.WriteUInt32(data.size()); // write length

				for (const pair of data) {
					const [k, v] = pair as [defined, defined];

					keyType.Encoding.WriteData(k, writer);
					valueType.Encoding.WriteData(v, writer);
				}
			},
		},
	};
}

function isArrayLike(value: unknown): value is defined[] {
	return typeIs(value, "table") && (next(value)[0] === undefined || typeIs(next(value)[0], "number"));
}

/**
 * Creates an array network type with the given inner network type as the array type
 * @param valueType The inner network type
 * @returns An array network type of the given inner type
 */
export function NexusArray<T extends StaticNetworkType<defined, defined>>(
	valueType: T,
): NetworkSerializableType<In<T>[], Out<T>[]> {
	const valueValidator = valueType.Validation;

	return {
		Name: valueType.Name + "[]",
		Validation: {
			Validate(value: unknown): value is In<T>[] {
				return isArrayLike(value) && value.every((v) => valueValidator.Validate(v));
			},
			ValidateError: "Expected Array<" + valueType.Name + ">",
		},
		Encoding: NetworkBuffers.Array(valueType.Encoding) as NetworkBuffer<Out<T>[]>, // 'cause of roblox-ts
		Serialization: {
			Serialize(value) {
				assert(value, "No value");

				return value.map((item: In<T>) => NexusSerialization.Serialize(valueType, item));
			},
			Deserialize(value) {
				return (value as Out<T & unknown>[]).map((item) => NexusSerialization.Deserialize(valueType, item));
			},
		},
	};
}

export type MapCheckArrayIn<T> = NexusSerialization.InputInterface<T>;
export type MapCheckArrayOut<T> = NexusSerialization.OutputInterface<T>;
export function NexusTuple<const T extends ReadonlyArray<NetworkSerializableType<any, any> | NetworkType<any>>>(
	...items: T
): NetworkSerializableType<MapCheckArrayIn<T>, MapCheckArrayOut<T>> {
	const tupleSize = items.size();
	const buffer = NetworkBuffers.FixedArray(...items.map((v) => v.Encoding)) as NetworkBuffer<MapCheckArrayOut<T>>;

	return {
		Name: `[ ${items.map((v) => v.Name).join(", ")} ]`,
		Validation: {
			Validate(value): value is MapCheckArrayIn<T> {
				return isArrayLike(value);
			},
			ValidateError: `Expected a tuple of [ ${items.map((v) => v.Name).join(", ")} ]`,
		},
		Encoding: buffer,
		Serialization: {
			Serialize(value) {
				const newTuple = [] as Writable<MapCheckArrayOut<T>>;

				for (let i = 0; i < tupleSize; i++) {
					const valueAt = (value as unknown[])[i];

					const typeLike: NetworkSerializableType<unknown, unknown> | NetworkType<unknown> = items[i];
					newTuple[i] = NexusSerialization.Serialize(typeLike, valueAt);
				}

				return newTuple;
			},
			Deserialize(value) {
				const newTuple = [] as Writable<MapCheckArrayIn<T>>;

				for (let i = 0; i < tupleSize; i++) {
					const valueAt = (value as unknown[])[i];

					const typeLike: NetworkSerializableType<unknown, unknown> | NetworkType<unknown> = items[i];
					newTuple[i] = NexusSerialization.Deserialize(typeLike, valueAt);
				}

				return newTuple;
			},
		},
	};
}
