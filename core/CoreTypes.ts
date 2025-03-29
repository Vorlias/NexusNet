/* eslint-disable roblox-ts/no-array-pairs */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { float32, float64, int16, int32, int8, NetworkBuffers, uint16, uint32, uint8 } from "./Buffers";
import NexusSerialization from "./Serialization";
import { NetIsSerializer } from "./Serialization/Serializer";
import { NetworkBuffer, NetworkSerializableType, NetworkType, StaticNetworkType } from "./Types/NetworkTypes";
import { hashstring } from "./Utils/hash";

type Out<TType> = NexusSerialization.Output<TType>;
type In<TType> = NexusSerialization.Input<TType>;

/**
 * A network string type
 */
export const NexusString: NetworkType<string> = {
	Name: "string",
	Validate(value): value is string {
		return typeIs(value, "string");
	},
	ValidateError: (value) => "Expected string, got " + typeOf(value),
	NetworkBuffer: NetworkBuffers.String,
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
		ValidateError: (networkType, value) => {
			return `${typeIs(value, "string") ? `"${value}"` : value} is not in one of ${networkType.Name}`;
		},
		Validate(value): value is T[number] {
			return items.includes(value as Literal);
		},
		Serialize(value) {
			return items.indexOf(value);
		},
		Deserialize(value) {
			return items[value];
		},
		NetworkBuffer: NetworkBuffers.Int32,
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
		NetworkBuffer: encoder,
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
		NetworkBuffer: encoder,
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
		Validate(value): value is number {
			return typeIs(value, "number");
		},
		ValidateError: (value) => "Expected Float" + bits + ", got " + typeOf(value) + " " + value,
		NetworkBuffer: encoder,
	};
};
export const NexusFloat32 = NexusFloat(32);
export const NexusFloat64 = NexusFloat(64);

export const NexusBoolean: NetworkType<boolean> = {
	Name: "boolean",
	Validate(value): value is boolean {
		return typeIs(value, "boolean");
	},
	ValidateError: (value) => "Expected boolean, got " + typeOf(value),
	NetworkBuffer: NetworkBuffers.Boolean,
};

const Undefined: NetworkType<undefined> = {
	Name: "None",
	Validate(value): value is undefined {
		return false;
	},
	ValidateError: "Expected undefined",
	NetworkBuffer: {
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
	return {
		Name: valueType.Name + "[]",
		Validate(value: unknown): value is In<T>[] {
			return isArrayLike(value) && value.every((v) => valueType.Validate(v));
		},
		ValidateError: "Expected Array<" + valueType.Name + ">",
		NetworkBuffer: NetworkBuffers.Array(valueType.NetworkBuffer) as NetworkBuffer<Out<T>[]>, // 'cause of roblox-ts
		Serialize(value) {
			return value.map((item: In<T>) => NexusSerialization.Serialize(valueType, item));
		},
		Deserialize(value) {
			return (value as Out<T & unknown>[]).map((item) => NexusSerialization.Deserialize(valueType, item));
		},
	};
}

type MapCheckArrayIn<T> = NexusSerialization.InputInterface<T>;
type MapCheckArrayOut<T> = NexusSerialization.OutputInterface<T>;
export function NexusTuple<T extends ReadonlyArray<NetworkSerializableType<any, any> | NetworkType<any>>>(
	...items: T
): NetworkSerializableType<MapCheckArrayIn<T>, MapCheckArrayOut<T>> {
	const tupleSize = items.size();
	const buffer = NetworkBuffers.FixedArray(...items.map((v) => v.NetworkBuffer)) as NetworkBuffer<
		MapCheckArrayOut<T>
	>;

	return {
		Name: `[ ${items.map((v) => v.Name).join(", ")} ]`,
		Validate(value): value is MapCheckArrayIn<T> {
			return isArrayLike(value);
		},
		ValidateError: `Expected a tuple of [ ${items.map((v) => v.Name).join(", ")} ]`,
		NetworkBuffer: buffer,
		Serialize(value) {
			const newTuple = [] as Writable<MapCheckArrayOut<T>>;

			for (let i = 0; i < tupleSize; i++) {
				const valueAt = (value as unknown[])[i];

				const typeLike: NetworkSerializableType<unknown, unknown> | NetworkType<unknown> = items[i];
				newTuple[i] = NetIsSerializer(typeLike) //
					? typeLike.Serialize(valueAt) //
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
					? typeLike.Deserialize(valueAt) //
					: valueAt;
			}

			return newTuple;
		},
	};
}

/**
 * Creates an optional network type with the given inner type as the optional value
 * @param typeLike The optional value type
 * @returns An optional static network type
 */
export function NexusOptional<T extends NetworkSerializableType<any, any> | NetworkType<any, any>>(
	typeLike: T,
): NetworkSerializableType<In<T> | undefined, Out<T> | undefined> {
	return {
		Name: "" + typeLike.Name + "?",
		Validate(value): value is In<T> | undefined {
			return (value as unknown) === undefined || typeLike.Validate(value);
		},
		Serialize(value) {
			if ((value as unknown) === undefined) return undefined;
			return (NetIsSerializer(typeLike) ? typeLike.Serialize(value as In<T>) : value) as Out<T>;
		},
		Deserialize(value) {
			if ((value as unknown) === undefined) return undefined;
			return (NetIsSerializer(typeLike) ? typeLike.Deserialize(value as Out<T>) : value) as In<T>;
		},
		ValidateError: "Expected " + typeLike.Name + " | undefined",
		NetworkBuffer: NetworkBuffers.Nullable(typeLike.NetworkBuffer),
	};
}

export function NexusSet<T extends NetworkSerializableType<any, any> | NetworkType<any>>(
	valueType: T,
): NetworkSerializableType<ReadonlySet<In<T>>, readonly Out<T>[]> {
	return {
		Name: `Set<${valueType.Name}>`,
		ValidateError: (networkType, value) => {
			return "Expected " + networkType.Name + ", got " + typeOf(value);
		},
		Validate(value): value is Set<In<T>> {
			if (!typeIs(value, "table")) return false;
			for (const [k, v] of pairs(value)) {
				if (!valueType.Validate(k)) return false;
				if (!typeIs(v, "boolean")) return false;
			}

			return true;
		},
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
		NetworkBuffer: NetworkBuffers.Array(valueType.NetworkBuffer),
	};
}

export function NexusMap<K extends StaticNetworkType, V extends StaticNetworkType>(
	keyType: K,
	valueType: V,
): NetworkSerializableType<ReadonlyMap<In<K>, In<V>>, readonly [Out<K>, Out<V>][]> {
	return {
		Name: `Map<${keyType.Name}, ${valueType.Name}>`,
		ValidateError: (networkType, value) => {
			return "Expected " + networkType.Name + ", got " + typeOf(value);
		},
		Validate(value): value is ReadonlyMap<In<K>, In<V>> {
			if (!typeIs(value, "table")) return false;
			for (const [k, v] of pairs(value)) {
				if (!keyType.Validate(k)) return false;
				if (!valueType.Validate(v)) return false;
			}

			return true;
		},
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
		NetworkBuffer: {
			ReadData(reader) {
				const length = reader.ReadUInt32(); // read length
				const arr = new Array<[Out<K>, Out<V>]>();

				for (let i = 0; i < length; i++) {
					const k = keyType.NetworkBuffer.ReadData(reader) as Out<K>;
					const v = valueType.NetworkBuffer.ReadData(reader) as Out<V>;

					arr.push([k, v]);
				}

				return arr;
			},
			WriteData(data, writer) {
				writer.WriteUInt32(data.size()); // write length

				for (const pair of data) {
					const [k, v] = pair as [defined, defined];

					keyType.NetworkBuffer.WriteData(k, writer);
					valueType.NetworkBuffer.WriteData(v, writer);
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
		arr.push([key, value.NetworkBuffer]);
	}

	return arr.sort((a, b) => hashstring(tostring(a[0])) < hashstring(tostring(b[0])));
}

export type Serialized<T> = T extends string | boolean | number ? T : { [P in keyof T]: unknown };

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
		NetworkBuffer: NetworkBuffers.StringHashMap(ordinalMap),
		ValidateError: (networkType, value) => {
			if (!typeIs(value, "table")) {
				return `Expected object got ${typeOf(value)}`;
			}

			for (const [key, value] of pairs(objectInterface) as IterableFunction<
				LuaTuple<[string, NetworkType<any>]>
			>) {
				const matchingValue = value[key as keyof typeof value] as unknown;
				const result = value.Validate(matchingValue);
				if (!result) return `Expected ${value.Name} for key '${key}' for ${networkType.Name}`;
			}

			return "Expected interface";
		},
		Serialize(value) {
			const newObj = {} as Serialized<T>;

			// We have to actually serialize the inner values...
			for (const [key] of pairs(objectInterface) as IterableFunction<LuaTuple<[keyof T, unknown]>>) {
				const kvPair = objectInterface[key];

				assert(kvPair.Validate(value[key]));
				if (NetIsSerializer(kvPair)) {
					newObj[key] = kvPair.Serialize(value[key]) as never;
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
					newObj[key] = kvPair.Deserialize(value[key] as defined);
				} else {
					newObj[key] = value[key] as T[keyof T];
				}
			}

			return newObj as InTypes<typeof objectInterface>;
		},
		Validate(value): value is InTypes<typeof objectInterface> {
			if (!typeIs(value, "table")) {
				return false;
			}

			for (const [key, value] of pairs(objectInterface) as IterableFunction<
				LuaTuple<[string, NetworkType<any>]>
			>) {
				const matchingValue = value[key as keyof typeof value] as unknown;
				const result = value.Validate(matchingValue);
				if (!result) return false;
			}

			return true;
		},
	};
}

interface NexusCorePrimitives {
	readonly String: NetworkType<string>;

	readonly Int8: NetworkType<int8>;
	readonly Int16: NetworkType<int16>;
	readonly Int32: NetworkType<int32>;

	readonly UInt8: NetworkType<uint8>;
	readonly UInt16: NetworkType<uint16>;
	readonly UInt32: NetworkType<uint32>;

	readonly Float32: NetworkType<float32>;
	readonly Float64: NetworkType<float64>;

	readonly Boolean: NetworkType<boolean>;

	readonly Undefined: typeof Undefined;
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
	ArrayOf<T extends StaticNetworkType>(
		this: void,
		valueType: T,
	): NetworkSerializableType<readonly In<T>[], readonly Out<T>[]>;
	/**
	 * A fixed array of a type `[T, ...]`
	 * @param valueTypes The value types of the tuple
	 */
	TupleOf<T extends ReadonlyArray<StaticNetworkType>>(
		this: void,
		...valueTypes: T
	): NetworkSerializableType<MapCheckArrayIn<T>, MapCheckArrayOut<T>>;
	/**
	 * An optional type (`T | undefined`)
	 */
	Optional<T extends StaticNetworkType>(
		this: void,
		valueType: T,
	): NetworkSerializableType<In<T> | undefined, Out<T> | undefined>;
	/**
	 * A key-based interface
	 */
	Interface<T>(
		this: void,
		objectInterface: Interface<T>,
		customLabel?: string,
	): NetworkSerializableType<InTypes<typeof objectInterface>, OutTypes<typeof objectInterface>>;

	/**
	 * A set of the given value type
	 * @param valueType The value type
	 */
	SetOf<T extends StaticNetworkType>(
		this: void,
		valueType: T,
	): NetworkSerializableType<ReadonlySet<In<T>>, readonly Out<T>[]>;

	/**
	 * A map of the given key type to value type
	 * @param keyType The key type
	 * @param valueType The value type
	 */
	MapOf<K extends StaticNetworkType, V extends StaticNetworkType>(
		this: void,
		keyType: K,
		valueType: V,
	): NetworkSerializableType<ReadonlyMap<In<K>, In<V>>, readonly [Out<K>, Out<V>][]>;
}

interface NexusCoreTypes extends NexusCoreTypeOps, NexusCorePrimitives {}

export const NexusCoreTypes: NexusCoreTypes = {
	String: NexusString,

	Int8: NexusInt(8) as NetworkType<int8>,
	Int16: NexusInt(16) as NetworkType<int16>,
	Int32: NexusInt(32) as NetworkType<int32>,

	UInt8: NexusUInt(8) as NetworkType<uint8>,
	UInt16: NexusUInt(8) as NetworkType<uint16>,
	UInt32: NexusUInt(8) as NetworkType<uint32>,

	Float32: NexusFloat(32) as NetworkType<float32>,
	Float64: NexusFloat(64) as NetworkType<float64>,

	Boolean: NexusBoolean,
	Undefined,

	SetOf: NexusSet,
	MapOf: NexusMap,
	Literal: NexusLiteral,
	ArrayOf: NexusArray,
	TupleOf: NexusTuple,
	Optional: NexusOptional,
	Interface: NexusObject,
};
