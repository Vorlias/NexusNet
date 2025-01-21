/* eslint-disable @typescript-eslint/no-explicit-any */
import { float32, float64, int16, int32, int8, NCoreNetworkEncoders, uint16, uint32, uint8 } from "./Buffers";
import { NetIsSerializer } from "./Serialization/Serializer";
import { NetworkBuffer, NetworkSerializableType, NetworkType } from "./Types/NetworkTypes";
import { hashstring } from "./Utils/hash";

// Gets an output type
export type Out<TType> =
	TType extends NetworkSerializableType<infer _, infer OType>
		? OType
		: TType extends NetworkType<infer OType>
			? OType
			: never;

// Gets an input type
export type In<TType> =
	TType extends NetworkSerializableType<infer IType, infer _>
		? IType
		: TType extends NetworkType<infer IType>
			? IType
			: never;

/**
 * A network string type
 */
const String: NetworkType<string> = {
	Name: "string",
	Validate(value): value is string {
		return typeIs(value, "string");
	},
	Message: (value) => "Expected string, got " + typeOf(value),
	NetworkBuffer: NCoreNetworkEncoders.String,
};

type Literal = string | number | boolean | {};
function Literal<T extends Array<Literal>>(...items: T): NetworkSerializableType<T[number], number> {
	return {
		Name: "Literal",
		Message: () => "",
		Validate(value): value is T[number] {
			return items.includes(value as Literal);
		},
		Serialize(value) {
			return items.indexOf(value);
		},
		Deserialize(value) {
			return items[value];
		},
		NetworkBuffer: NCoreNetworkEncoders.Int32,
	};
}

type IntegerBits = 8 | 16 | 32;
type FloatBits = 32 | 64;

const intEncoders = {
	[8]: NCoreNetworkEncoders.Int8,
	[16]: NCoreNetworkEncoders.Int16,
	[32]: NCoreNetworkEncoders.Int32,
};
const Int: (bits?: IntegerBits) => NetworkType<number> = (bits = 32) => {
	let encoder = intEncoders[bits];

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
		Message: (value) => {
			return `Expected ${name}, got ${typeOf(value)}`;
		},
		NetworkBuffer: encoder,
	};
};

const unsignedEncoders = {
	[8]: NCoreNetworkEncoders.UInt8,
	[16]: NCoreNetworkEncoders.UInt16,
	[32]: NCoreNetworkEncoders.UInt32,
};
const UInt: (bits?: IntegerBits) => NetworkType<number> = (bits = 32) => {
	let encoder = unsignedEncoders[bits];
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
		Message: (value) => "Expected UInt" + bits + ", got " + typeOf(value) + " " + value,
		NetworkBuffer: encoder,
	};
};

const floatEncoders = {
	[32]: NCoreNetworkEncoders.Float32,
	[64]: NCoreNetworkEncoders.Float64,
};
const Float: (bits?: FloatBits) => NetworkType<number> = (bits = 32) => {
	let encoder = floatEncoders[bits];

	return {
		Name: `Float${bits}`,
		Validate(value): value is number {
			return typeIs(value, "number");
		},
		Message: (value) => "Expected Float" + bits + ", got " + typeOf(value) + " " + value,
		NetworkBuffer: encoder,
	};
};

const Boolean: NetworkType<boolean> = {
	Name: "boolean",
	Validate(value): value is boolean {
		return typeIs(value, "boolean");
	},
	Message: (value) => "Expected boolean, got " + typeOf(value),
	NetworkBuffer: NCoreNetworkEncoders.Boolean,
};

function isArrayLike(value: unknown): value is defined[] {
	return typeIs(value, "table") && (next(value)[0] === undefined || typeIs(next(value)[0], "number"));
}

/**
 * Creates an array network type with the given inner network type as the array type
 * @param typeLike The inner network type
 * @returns An array network type of the given inner type
 */
function ArrayOf<T extends NetworkSerializableType<any, any> | NetworkType<any, any>>(
	typeLike: T,
): NetworkSerializableType<In<T>[], Out<T>[]> {
	return {
		Name: typeLike.Name + "[]",
		Validate(value): value is In<T>[] {
			return isArrayLike(value);
		},
		Message: "Expected " + typeLike.Name + "[]",
		NetworkBuffer: NCoreNetworkEncoders.Array(typeLike.NetworkBuffer),
		Serialize(value) {
			if (NetIsSerializer<T>(typeLike)) {
				return value.map((item) => typeLike.Serialize(item) as Out<T>) as Out<T>[];
			} else {
				return value as Out<T>;
			}
		},
		Deserialize(value) {
			if (NetIsSerializer<T>(typeLike)) {
				return (value as defined[]).map((item) => typeLike.Deserialize(item)) as In<T>[];
			} else {
				return value as In<T>[];
			}
		},
	};
}

type MapCheckArrayIn<T> = { [P in keyof T]: In<T[P]> };
type MapCheckArrayOut<T> = { [P in keyof T]: Out<T[P]> };
function TupleOf<T extends ReadonlyArray<NetworkSerializableType<any, any> | NetworkType<any>>>(
	...items: T
): NetworkSerializableType<MapCheckArrayIn<T>, MapCheckArrayOut<T>> {
	const tupleSize = items.size();
	const buffer = NCoreNetworkEncoders.FixedArray(...items.map((v) => v.NetworkBuffer)) as NetworkBuffer<
		MapCheckArrayOut<T>
	>;

	return {
		Name: `[ ${items.map((v) => v.Name).join(", ")} ]`,
		Validate(value): value is MapCheckArrayIn<T> {
			return isArrayLike(value);
		},
		Message: `Expected [ ${items.map((v) => v.Name).join(", ")} ]`,
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
function Optional<T extends NetworkSerializableType<any, any> | NetworkType<any, any>>(
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
		Message: "Expected " + typeLike.Name + " or undefined",
		NetworkBuffer: NCoreNetworkEncoders.Nullable(typeLike.NetworkBuffer),
	};
}

type InterfaceTypeDefiniton<T> = { [P in keyof T]: NetworkSerializableType<T[P], any> | NetworkType<T[P]> };
type InTypes<T> = { [P in keyof T]: In<T[P]> };
type OutTypes<T> = { [P in keyof T]: Out<T[P]> };

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
function Interface<T>(
	objectInterface: InterfaceTypeDefiniton<T>,
	customLabel?: string,
): NetworkSerializableType<InTypes<typeof objectInterface>, OutTypes<typeof objectInterface>> {
	// We need to create a guaranteed ordered map
	const ordinalMap = getHashSortedKeys(objectInterface);

	return {
		Name: customLabel ?? `interface { ${ordinalMap.map((value) => value[0]).join("; ")} }`,
		NetworkBuffer: NCoreNetworkEncoders.StringHashMap(ordinalMap),
		Message: "Expected a valid interface",
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
}

interface NexusCoreTypeOps {
	Literal<T extends Array<Literal>>(this: void, ...items: T): NetworkSerializableType<T[number], number>;
	ArrayOf<T extends NetworkSerializableType<any, any> | NetworkType<any, any>>(
		this: void,
		typeLike: T,
	): NetworkSerializableType<In<T>[], Out<T>[]>;
	TupleOf<T extends ReadonlyArray<NetworkSerializableType<any, any> | NetworkType<any>>>(
		this: void,
		...items: T
	): NetworkSerializableType<MapCheckArrayIn<T>, MapCheckArrayOut<T>>;
	Optional<T extends NetworkSerializableType<any, any> | NetworkType<any, any>>(
		this: void,
		typeLike: T,
	): NetworkSerializableType<In<T> | undefined, Out<T> | undefined>;
	Interface<T>(
		this: void,
		objectInterface: InterfaceTypeDefiniton<T>,
		customLabel?: string,
	): NetworkSerializableType<InTypes<typeof objectInterface>, OutTypes<typeof objectInterface>>;
}

interface NexusCoreTypes extends NexusCoreTypeOps, NexusCorePrimitives {}

export const NexusCoreTypes: NexusCoreTypes = {
	String,

	Int8: Int(8) as NetworkType<int8>,
	Int16: Int(16) as NetworkType<int16>,
	Int32: Int(32) as NetworkType<int32>,

	UInt8: UInt(8) as NetworkType<uint8>,
	UInt16: UInt(8) as NetworkType<uint16>,
	UInt32: UInt(8) as NetworkType<uint32>,

	Float32: Float(32) as NetworkType<float32>,
	Float64: Float(64) as NetworkType<float64>,

	Boolean,

	Literal,
	ArrayOf,
	TupleOf,
	Optional,
	Interface,
};
