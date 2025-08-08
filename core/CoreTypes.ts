/* eslint-disable roblox-ts/no-array-pairs */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { float32, float64, int16, int32, int8, NetworkBuffers, uint16, uint32, uint8 } from "./Buffers";
import { NexusHashTable__EXPERIMENTAL } from "./NetworkTypes/HashTable";
import NexusSerialization from "./Serialization";
import { NetIsSerializer } from "./Serialization/Serializer";
import {
	NetworkBuffer,
	NetworkSerializableType,
	NetworkSerializer,
	NetworkType,
	StaticNetworkType,
} from "./Types/NetworkTypes";
import { hashstring } from "./Utils/hash";

type Out<TType> = NexusSerialization.Output<TType>;
type In<TType> = NexusSerialization.Input<TType>;

export const NexusRawBuffer: NetworkType<buffer> = {
	Name: "buffer",
	Validation: {
		Validate(value): value is buffer {
			return typeIs(value, "buffer" as keyof CheckableTypes);
		},
	},
	Encoding: {
		WriteData(data, writer) {
			writer.SetBuffer(data);
		},
		ReadData(reader) {
			return reader.GetBuffer();
		},
	},
};

/**
 * A network string type
 */
export const NexusString: NetworkType<string> = {
	Name: "string",
	Validation: {
		Validate(value): value is string {
			return typeIs(value, "string");
		},
		ValidateError: (_, value) => "Expected string, got " + typeOf(value),
	},
	Encoding: NetworkBuffers.String,
};

type Literal = string | number | boolean;
export function NexusLiteral<T extends Array<Literal>>(...items: T): NetworkSerializableType<T[number], number> {
	return {
		Name: items
			.map((value) => {
				if (typeIs(value, "string")) {
					return `"${value}"`;
				} else {
					return tostring(value);
				}
			})
			.join(" | "),
		Validation: {
			ValidateError: (networkType, value) => {
				return `${typeIs(value, "string") ? `"${value}"` : value} is not in one of ${networkType.Name}`;
			},
			Validate(value): value is T[number] {
				return items.includes(value as Literal);
			},
		},
		Serialization: {
			Serialize(value) {
				print("serialize", value, "to", items.indexOf(value));
				return items.indexOf(value);
			},
			Deserialize(value) {
				return items[value];
			},
		},
		Encoding: NetworkBuffers.UInt8,
	};
}

type IntegerBits = 8 | 16 | 32;
type FloatBits = 32 | 64;

const intEncoders = {
	[8]: NetworkBuffers.Int8,
	[16]: NetworkBuffers.Int16,
	[32]: NetworkBuffers.Int32,
};
const NexusInt: (bits?: IntegerBits) => NetworkType<number> = (bits = 32) => {
	const encoder = intEncoders[bits];

	const UPPER_BOUND = 2 ** (bits - 1) - 1;
	const LOWER_BOUND = -(2 ** (bits - 1));

	const name = `Int${bits}`;
	return {
		Name: name,
		Validation: {
			Validate(value): value is number {
				if (!typeIs(value, "number")) return false;
				if (value % 1 !== 0) {
					warn(`[${name}] Number is not a ${bits}-bit integer`);
					return false;
				}

				if (value > UPPER_BOUND) {
					warn(`[${name}] Number exceeds the maximum ${bits}-bit integer and may overflow`);
				} else if (value < LOWER_BOUND) {
					warn(`[${name}] Number exceeds the minimum ${bits}-bit integer and may underflow`);
				}

				return true;
			},
			ValidateError: (value) => {
				return `Expected ${name}, got ${typeOf(value)}`;
			},
		},
		Encoding: encoder,
	};
};
export const NexusInt8 = NexusInt(8);
export const NexusInt16 = NexusInt(16);
export const NexusInt32 = NexusInt(32);

const unsignedEncoders = {
	[8]: NetworkBuffers.UInt8,
	[16]: NetworkBuffers.UInt16,
	[32]: NetworkBuffers.UInt32,
};
const NexusUInt: (bits?: IntegerBits) => NetworkType<number> = (bits = 32) => {
	const encoder = unsignedEncoders[bits];
	const UPPER_BOUND = 2 ** bits - 1;

	const name = `UInt${bits}`;
	return {
		Name: name,
		Validation: {
			Validate(value): value is number {
				if (!typeIs(value, "number")) return false;
				if (value % 1 !== 0) {
					warn(`[${name}] Number is not a ${bits}-bit unsigned integer`);
					return false;
				}

				if (value > UPPER_BOUND) {
					warn(`[${name}] Number exceeds the maximum ${bits}-bit unsigned integer and may overflow`);
				} else if (value < 0) {
					warn(`[${name}] Number exceeds the minimum ${bits}-bit unsigned integer and may underflow`);
				}

				return true;
			},
			ValidateError: (value) => "Expected UInt" + bits + ", got " + typeOf(value) + " " + value,
		},
		Encoding: encoder,
	};
};
export const NexusUInt8 = NexusUInt(8);
export const NexusUInt16 = NexusUInt(16);
export const NexusUInt32 = NexusUInt(32);

const floatEncoders = {
	[32]: NetworkBuffers.Float32,
	[64]: NetworkBuffers.Float64,
};
const NexusFloat: (bits?: FloatBits) => NetworkType<number> = (bits = 32) => {
	const encoder = floatEncoders[bits];

	return {
		Name: `Float${bits}`,
		Validation: {
			Validate(value): value is number {
				return typeIs(value, "number");
			},
			ValidateError: (value) => "Expected Float" + bits + ", got " + typeOf(value) + " " + value,
		},
		Encoding: encoder,
	};
};
export const NexusFloat32 = NexusFloat(32);
export const NexusFloat64 = NexusFloat(64);

export const NexusBoolean: NetworkType<boolean> = {
	Name: "boolean",
	Validation: {
		Validate(value): value is boolean {
			return typeIs(value, "boolean");
		},
		ValidateError: (value) => "Expected boolean, got " + typeOf(value),
	},
	Encoding: NetworkBuffers.Boolean,
};

const Undefined: NetworkType<undefined> = {
	Name: "None",
	Validation: {
		Validate(value): value is undefined {
			return false;
		},
		ValidateError: "Expected undefined",
	},
	Encoding: {
		WriteData(data, writer) {},
		ReadData(reader) {
			return undefined;
		},
	},
};

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
): NetworkSerializableType<readonly In<T>[], readonly Out<T>[]> {
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

type MapCheckArrayIn<T> = NexusSerialization.InputInterface<T>;
type MapCheckArrayOut<T> = NexusSerialization.OutputInterface<T>;
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
					newTuple[i] = NetIsSerializer(typeLike) //
						? typeLike.Serialization.Serialize(valueAt) //
						: valueAt;
				}

				return newTuple;
			},
			Deserialize(value) {
				const newTuple = [] as Writable<MapCheckArrayIn<T>>;

				for (let i = 0; i < tupleSize; i++) {
					const valueAt = (value as unknown[])[i];

					const typeLike: NetworkSerializableType<unknown, unknown> | NetworkType<unknown> = items[i];
					newTuple[i] = NetIsSerializer(typeLike) //
						? typeLike.Serialization.Deserialize(valueAt) //
						: valueAt;
				}

				return newTuple;
			},
		},
	};
}

export function NexusIsOptionalType<TIn, TOut>(
	value: StaticNetworkType<TIn | undefined, TOut | undefined>,
): value is NetworkOptionalType<TIn, TOut> {
	return "Optional" in value;
}

export interface NetworkOptionalType<TIn, TOut> extends NetworkSerializableType<TIn | undefined, TOut | undefined> {
	Optional: true;
}
/**
 * Creates an optional network type with the given inner type as the optional value
 * @param typeLike The optional value type
 * @returns An optional static network type
 */
export function NexusOptional<T extends NetworkSerializableType<any, any> | NetworkType<any, any>>(
	typeLike: T,
): NetworkOptionalType<In<T>, Out<T>> {
	return {
		Optional: true,
		Name: "" + typeLike.Name + "?",
		Validation: {
			Validate(value): value is In<T> | undefined {
				return (value as unknown) === undefined || typeLike.Validation.Validate(value);
			},
			ValidateError: "Expected " + typeLike.Name + " | undefined",
		},
		Serialization: {
			Serialize(value) {
				if ((value as unknown) === undefined) return undefined;
				return (NetIsSerializer(typeLike) ? typeLike.Serialization.Serialize(value as In<T>) : value) as Out<T>;
			},
			Deserialize(value) {
				if ((value as unknown) === undefined) return undefined;
				return (
					NetIsSerializer(typeLike) ? typeLike.Serialization.Deserialize(value as Out<T>) : value
				) as In<T>;
			},
		},

		Encoding: NetworkBuffers.Nullable(typeLike.Encoding),
	};
}

export interface NetworkSetType<TIn, TOut> extends NetworkSerializableType<ReadonlySet<TIn>, readonly TOut[]> {}
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

export interface NetworkMapType<K, V>
	extends NetworkSerializableType<ReadonlyMap<In<K>, In<V>>, readonly [Out<K>, Out<V>][]> {}
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
			Validate(value): value is ReadonlyMap<In<K>, In<V>> {
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

type Interface<T> = { [P in keyof T]: NetworkSerializableType<T[P], any> | NetworkType<T[P]> };
type InTypes<T> = NexusSerialization.InputInterface<T>;
type OutTypes<T> = NexusSerialization.OutputInterface<T>;

function getHashSortedKeys<T extends { [P in string]: NetworkType<any> }>(obj: T): Array<[string, NetworkBuffer<any>]> {
	const arr = new Array<[string, NetworkBuffer<any>]>();

	for (const [key, value] of pairs(obj) as IterableFunction<LuaTuple<[string, NetworkType<any>]>>) {
		arr.push([key, value.Encoding]);
	}

	return arr.sort((a, b) => hashstring(tostring(a[0])) < hashstring(tostring(b[0])));
}

export type Serialized<T> = T extends string | boolean | number ? T : { [P in keyof T]: unknown };

type StringEnumLike<T> = { [P in keyof T]: T[P] & string };
type IntEnumLike<T> = { [P in keyof T]: T[P] & number };
type ValueOf<T extends object> = { [P in keyof T]: T[P] }[keyof T];

export function NexusStringEnum<T extends object>(
	enumObject: StringEnumLike<T>,
): NetworkSerializableType<T[keyof T], int32> {
	const hashToKey = new Map<number, string>();

	const valueToKey = new Map<string, string>();
	const keyToHash = new Map<string, number>();

	for (const [key, value] of pairs<{ [P in string]: string }>(enumObject)) {
		const keyHash = hashstring(value); // will give us the key
		hashToKey.set(keyHash, key);
		keyToHash.set(key, keyHash);
		valueToKey.set(value, key);
	}

	return {
		Name: "enum<string>",
		Validation: {
			Validate(value): value is T[keyof T] {
				return typeIs(value, "string") && valueToKey.has(value);
			},
			ValidateError: (networkType, value) => {
				return "Expected valid enum value";
			},
		},
		Serialization: {
			Serialize(value: T[keyof T]): int32 {
				const key = valueToKey.get(value as string);
				assert(key !== undefined, `Failed to get key for '${value}'`);

				const hash = keyToHash.get(key);
				assert(hash !== undefined, `Failed to get hash for key '${value}'`);
				return hash;
			},
			Deserialize(value: int32): T[keyof T] {
				const key = hashToKey.get(value);
				assert(key !== undefined, `Failed to get key matching hash: ${value}`);
				return enumObject[key as keyof typeof enumObject];
			},
		},
		Encoding: NetworkBuffers.Int32,
	};
}

export function NexusIntEnum<const T>(value: IntEnumLike<T>, isFlags: boolean = false): NetworkType<T, int32> {
	let validator: (value: number) => boolean;

	if (isFlags) {
		// flags kind of can be any number
		validator = () => true;
	} else {
		const values = new Array<number>();
		for (const [k, v] of pairs(value)) {
			values.push(v as number);
		}

		validator = (value: number) => {
			return values.includes(value);
		};
	}

	return {
		Name: "enum<int32>",
		Encoding: NetworkBuffers.Int32,
		Validation: {
			Validate(value): value is T {
				return typeIs(value, "number") && value % 1 === 0 && validator(value);
			},
			ValidateError(this: void, networkType, value) {
				if (typeIs(value, "number")) {
					if (value % 1 !== 0) {
						return `Expected integer value`;
					} else {
						return `${value} is not a valid value for this integer enum`;
					}
				} else {
					return `Expected valid enum value, got ${typeOf(value)}`;
				}
			},
		},
	};
}

type InferInType<T> = T extends NetworkType<infer A> ? A : never;
type InferOutType<T> = T extends NetworkSerializableType<infer _, infer O>
	? O
	: T extends NetworkType<infer I>
	? I
	: never;

type ToInUnion<T extends ReadonlyArray<StaticNetworkType>> = {
	[P in keyof T]: InferInType<T[P]>;
}[number];

type ToOutUnion<T extends ReadonlyArray<StaticNetworkType>> = {
	[P in keyof T]: InferOutType<T[P]>;
}[number];

export function NexusUnion<T extends ReadonlyArray<StaticNetworkType>>(
	...types: T
): NetworkSerializableType<ToInUnion<T>, [int32, ToOutUnion<T>]> {
	const validators = types.map((f) => f.Validation);
	return {
		Name: types.map((v) => v.Name).join(" | "),
		Encoding: {
			WriteData(data, writer) {
				const [idx, value] = data;
				writer.WriteInt32(idx);
				types[idx].Encoding.WriteData(value, writer);
			},
			ReadData(reader) {
				const idx = reader.ReadInt32();
				const value = types[idx].Encoding.ReadData(reader);
				return value;
			},
		},
		Validation: {
			Validate(value): value is ToInUnion<T> {
				return validators.some((v) => v.Validate(value));
			},
		},
		Serialization: {
			Serialize(value) {
				const idx = validators.findIndex((f) => f.Validate(value));
				if (idx === -1) {
					throw `Invalid type`;
				}

				const networkType = types[idx];
				const serializedData = NexusSerialization.Serialize(networkType, value);
				return [idx, serializedData];
			},
			Deserialize(value) {
				const [idx, serializedData] = value;
				const networkType = types[idx];
				const data = NexusSerialization.Deserialize(networkType, serializedData);
				return data;
			},
		},
	};
}

export function NexusRangeFloat32(min: number, max: number): NetworkType<float32> {
	const float = NexusFloat32;

	return {
		...float,
		Validation: {
			Validate(value): value is float32 {
				return typeIs(value, "number") && value >= min && value <= max;
			},
		},
	};
}

export function NexusRange<T extends number>(numericType: NetworkType<T>) {
	return (min: T, max: T): NetworkType<T> => {
		return {
			...numericType,
			Validation: {
				Validate(value): value is T {
					return numericType.Validation.Validate(value) && value >= min && value <= max;
				},
			},
		};
	};
}

/**
 * Creates a Network Interface
 * @param objectInterface The static interface of this object
 * @param customLabel A custom label for this interface
 * @returns A custom serializer for this interface
 */
export function NexusObject<T>(
	objectInterface: Interface<T>,
	customLabel?: string,
): NetworkSerializableType<InTypes<typeof objectInterface>, OutTypes<typeof objectInterface>> {
	// We need to create a guaranteed ordered map
	const ordinalMap = getHashSortedKeys(objectInterface);

	return {
		Name: customLabel ?? `interface { ${ordinalMap.map((value) => value[0]).join("; ")} }`,
		Encoding: NetworkBuffers.StringHashMap(ordinalMap),
		Validation: {
			ValidateError: (networkType, value) => {
				if (!typeIs(value, "table")) {
					return `Expected object got ${typeOf(value)}`;
				}

				for (const [key, value] of pairs(objectInterface) as IterableFunction<
					LuaTuple<[string, NetworkType<any>]>
				>) {
					const matchingValue = value[key as keyof typeof value] as unknown;
					const result = value.Validation.Validate(matchingValue);
					if (!result) return `Expected ${value.Name} for key '${key}' for ${networkType.Name}`;
				}

				return "Expected interface";
			},
			Validate(value): value is InTypes<typeof objectInterface> {
				if (!typeIs(value, "table")) {
					return false;
				}

				for (const [key, value] of pairs(objectInterface) as IterableFunction<
					LuaTuple<[string, NetworkType<any>]>
				>) {
					const matchingValue = value[key as keyof typeof value] as unknown;
					const result = value.Validation.Validate(matchingValue);
					if (!result) return false;
				}

				return true;
			},
		},
		Serialization: {
			Serialize(value) {
				const newObj = {} as Serialized<T>;

				// We have to actually serialize the inner values...
				for (const [key] of pairs(objectInterface) as IterableFunction<LuaTuple<[keyof T, unknown]>>) {
					const kvPair = objectInterface[key];

					const [success, err] = NetworkType.Check(kvPair, value[key]);
					if (!success) {
						error(err, 2);
					}

					if (NetIsSerializer(kvPair)) {
						newObj[key] = kvPair.Serialization.Serialize(value[key]) as never;
					} else {
						newObj[key] = value[key] as never;
					}
				}

				return newObj as OutTypes<typeof objectInterface>;
			},
			Deserialize(value) {
				const newObj = {} as T;

				// We have to actually deserialize the inner values...
				for (const [key] of pairs(objectInterface) as IterableFunction<LuaTuple<[keyof T, unknown]>>) {
					const kvPair = objectInterface[key];

					if (NetIsSerializer(kvPair)) {
						newObj[key] = kvPair.Serialization.Deserialize(value[key] as defined);
					} else {
						newObj[key] = value[key] as T[keyof T];
					}
				}

				return newObj as InTypes<typeof objectInterface>;
			},
		},
	};
}

interface NexusCorePrimitives {
	/**
	 * A string primitive
	 */
	readonly String: NetworkType<string>;

	/**
	 * A 8-bit signed integer
	 */
	readonly Int8: NetworkType<int8>;
	/**
	 * A 16-bit signed integer
	 */
	readonly Int16: NetworkType<int16>;
	/**
	 * A 32-bit signed integer
	 */
	readonly Int32: NetworkType<int32>;

	/**
	 * A 8-bit unsigned integer
	 */
	readonly UInt8: NetworkType<uint8>;
	/**
	 * A 16-bit unsigned integer
	 */
	readonly UInt16: NetworkType<uint16>;
	/**
	 * A 32-bit unsigned integer
	 */
	readonly UInt32: NetworkType<uint32>;

	/**
	 * A 32-bit floating point number
	 */
	readonly Float32: NetworkType<float32>;
	/**
	 * A 64-bit floating point number
	 */
	readonly Float64: NetworkType<float64>;

	/**
	 * Represents any number, equivalent to `Float32`.
	 */
	readonly Number: NetworkType<number, float32>;

	/**
	 * A boolean primitive
	 */
	readonly Boolean: NetworkType<boolean>;

	/**
	 * Nothing
	 */
	readonly Undefined: typeof Undefined;

	/**
	 * Raw buffer data (you will need to validate this yourself)
	 */
	readonly Buffer: NetworkType<buffer>;
}

interface NexusCoreTypeOps {
	/**
	 * A collection of literals - over the network this is represented by an integer of what value it is
	 */
	Literal<T extends Array<Literal>>(this: void, ...values: T): NetworkSerializableType<T[number], number>;
	/**
	 * An array of a type `T[]`
	 * @param valueType The value type of the array
	 */
	Array<T extends StaticNetworkType>(
		this: void,
		valueType: T,
	): NetworkSerializableType<readonly In<T>[], readonly Out<T>[]>;
	/**
	 * A fixed array of a type `[T, ...]`
	 * @param valueTypes The value types of the tuple
	 */
	Tuple<T extends ReadonlyArray<StaticNetworkType>>(
		this: void,
		...valueTypes: T
	): NetworkSerializableType<MapCheckArrayIn<T>, MapCheckArrayOut<T>>;
	/**
	 * An optional type (`T | undefined`)
	 */
	Optional<T extends StaticNetworkType>(this: void, valueType: T): NetworkOptionalType<In<T>, Out<T>>;
	// /**
	//  * An interface that's serialized using a hash table
	//  */
	// Interface<T>(
	// 	this: void,
	// 	objectInterface: Interface<T>,
	// 	customLabel?: string,
	// ): NetworkSerializableType<InTypes<typeof objectInterface>, OutTypes<typeof objectInterface>>;

	/**
	 * A set of the given value type
	 * @param valueType The value type
	 */
	Set<T extends StaticNetworkType>(
		this: void,
		valueType: T,
	): NetworkSerializableType<ReadonlySet<In<T>>, readonly Out<T>[]>;

	/**
	 * A map of the given key type to value type
	 * @param keyType The key type
	 * @param valueType The value type
	 */
	Map<K extends StaticNetworkType, V extends StaticNetworkType>(
		this: void,
		keyType: K,
		valueType: V,
	): NetworkSerializableType<ReadonlyMap<In<K>, In<V>>, readonly [Out<K>, Out<V>][]>;

	/**
	 * An enum with string values
	 *
	 * - Serializes to the string hash of the item
	 */
	StringEnum<const T extends object>(
		this: void,
		enumObject: StringEnumLike<T>,
	): NetworkSerializableType<T[keyof T], int32>;

	/**
	 * An enum with integer values
	 */
	IntEnum<const T>(this: void, value: IntEnumLike<T>): NetworkType<IntEnumLike<T>[keyof T], int32>;

	/**
	 * An enum with integer values
	 * @param isFlagEnum Whether or not this is a flag integer enum
	 */
	IntEnum<const T>(
		this: void,
		value: IntEnumLike<T>,
		isFlagEnum: boolean,
	): NetworkType<IntEnumLike<T>[keyof T], int32>;

	/**
	 * An object that's serialized using a hash table
	 *
	 * #### *NOTE:* This should be use for NETWORKING **only**!
	 */
	Interface: typeof NexusHashTable__EXPERIMENTAL;

	IntConstrained: (min: int32, max: int32) => NetworkType<int32>;
	NumberConstrained: (min: float32, max: float32) => NetworkType<int32>;
}

export interface NexusCoreTypes extends NexusCoreTypeOps, NexusCorePrimitives {}

export const NexusCoreTypes: NexusCoreTypes = {
	String: NexusString,
	Buffer: NexusRawBuffer,

	NumberConstrained: NexusRange(NexusFloat32),
	IntConstrained: NexusRange(NexusInt32),
	// CastsToInt: <const T extends int32>() => NexusInt32 as NetworkType<T, int32>,

	Int8: NexusInt(8),
	Int16: NexusInt(16),
	Int32: NexusInt(32),

	UInt8: NexusUInt(8),
	UInt16: NexusUInt(8),
	UInt32: NexusUInt(8),

	Float32: NexusFloat(32),
	Float64: NexusFloat(64),
	Number: NexusFloat(32),

	Boolean: NexusBoolean,
	Undefined,

	StringEnum: NexusStringEnum,
	IntEnum: NexusIntEnum,

	Set: NexusSet,
	Map: NexusMap,
	Literal: NexusLiteral,
	Array: NexusArray,
	Tuple: NexusTuple,
	Optional: NexusOptional,
	Interface: NexusHashTable__EXPERIMENTAL,
};
