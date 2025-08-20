/* eslint-disable roblox-ts/no-array-pairs */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NexusTypes } from "../Framework";
import { float32, float64, int16, int32, int8, NetworkBuffers, uint16, uint32, uint8 } from "./Buffers";
import { NexusHashTable } from "./NetworkTypes/HashTable";
import NexusSerialization from "./Serialization";
import { MapCheckArrayIn, MapCheckArrayOut, NexusArray, NexusSet, NexusMap, NexusTuple } from "./Types/CollectionTypes";
export { NexusArray, NexusSet, NexusMap, NexusTuple } from "./Types/CollectionTypes";
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
				if ((value as In<T>) === undefined) return undefined;
				return NexusSerialization.Serialize(typeLike, value as In<T>);
			},
			Deserialize(value) {
				if ((value as Out<T>) === undefined) return undefined;
				return NexusSerialization.Deserialize(typeLike, value as Out<T>);
			},
		},

		Encoding: NetworkBuffers.Nullable(typeLike.Encoding),
	};
}

export type Serialized<T> = T extends string | boolean | number ? T : { [P in keyof T]: unknown };

type StringEnumLike<T> = { [P in keyof T]: T[P] & string };
type IntEnumLike<T> = { [P in keyof T]: T[P] & number };

const strEnumCache = new Map<object, NetworkSerializableType<any, int32>>();
export function NexusStringEnum<T extends object>(
	enumObject: StringEnumLike<T>,
): NetworkSerializableType<T[keyof T], int32> {
	const cached = strEnumCache.get(enumObject);
	if (cached) return cached;

	const hashToKey = new Map<number, string>();

	const valueToKey = new Map<string, string>();
	const keyToHash = new Map<string, number>();
	const values = new Array<string>();

	for (const [key, value] of pairs<{ [P in string]: string }>(enumObject)) {
		const keyHash = hashstring(value); // will give us the key
		hashToKey.set(keyHash, key);
		keyToHash.set(key, keyHash);
		valueToKey.set(value, key);
		values.push(value);
	}

	const networkType = {
		Name: values.map((v) => `"${v}"`).join(" | "),
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
	} satisfies NetworkSerializableType<T[keyof T], int32>;

	table.freeze(networkType);
	strEnumCache.set(enumObject, networkType);
	return networkType;
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
	 * An array of a type `readonly T[]`
	 * @param valueType The value type of the array
	 */
	Array<T extends StaticNetworkType>(this: void, valueType: T): NetworkSerializableType<In<T>[], Out<T>[]>;

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
	Set<T extends StaticNetworkType>(this: void, valueType: T): NetworkSerializableType<Set<In<T>>, readonly Out<T>[]>;

	/**
	 * A map of the given key type to value type
	 * @param keyType The key type
	 * @param valueType The value type
	 */
	Map<K extends StaticNetworkType, V extends StaticNetworkType>(
		this: void,
		keyType: K,
		valueType: V,
	): NetworkSerializableType<Map<In<K>, In<V>>, readonly [Out<K>, Out<V>][]>;

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
	Interface: typeof NexusHashTable;

	IntRange: (min: int32, max: int32) => NetworkType<int32>;
	Range: (min: float32, max: float32) => NetworkType<int32>;
}

export interface NexusCoreTypes extends NexusCoreTypeOps, NexusCorePrimitives {}

export const NexusCoreTypes: NexusCoreTypes = {
	String: NexusString,
	Buffer: NexusRawBuffer,

	Range: NexusRange(NexusFloat32),
	IntRange: NexusRange(NexusInt32),
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

	Array: NexusArray,
	Set: NexusSet,
	Map: NexusMap,

	Literal: NexusLiteral,

	Tuple: NexusTuple,
	Optional: NexusOptional,
	Interface: NexusHashTable,
};
