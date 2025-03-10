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
const String: NetworkType<string> = {
	Name: "string",
	Validate(value): value is string {
		return typeIs(value, "string");
	},
	Message: (value) => "Expected string, got " + typeOf(value),
	NetworkBuffer: NetworkBuffers.String,
};

type Literal = string | number | boolean;
function Literal<T extends Array<Literal>>(...items: T): NetworkSerializableType<T[number], number> {
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
const Int: (bits?: IntegerBits) => NetworkType<number> = (bits = 32) => {
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
		Message: (value) => {
			return `Expected ${name}, got ${typeOf(value)}`;
		},
		NetworkBuffer: encoder,
	};
};

const unsignedEncoders = {
	[8]: NetworkBuffers.UInt8,
	[16]: NetworkBuffers.UInt16,
	[32]: NetworkBuffers.UInt32,
};
const UInt: (bits?: IntegerBits) => NetworkType<number> = (bits = 32) => {
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
		Message: (value) => "Expected UInt" + bits + ", got " + typeOf(value) + " " + value,
		NetworkBuffer: encoder,
	};
};

const floatEncoders = {
	[32]: NetworkBuffers.Float32,
	[64]: NetworkBuffers.Float64,
};
const Float: (bits?: FloatBits) => NetworkType<number> = (bits = 32) => {
	const encoder = floatEncoders[bits];

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
	NetworkBuffer: NetworkBuffers.Boolean,
};

const Undefined: NetworkType<undefined> = {
	Name: "None",
	Validate(value): value is undefined {
		return false;
	},
	Message: "",
	NetworkBuffer: {
		WriteData(data, writer) {},
		ReadData(reader) {
			return undefined;
		},
	},
};

// type ToUnion<T> = T extends ReadonlyArray<infer A> ? NetworkSerializableType<In<A>, Out<A>> : never;
// export function Union<T extends ReadonlyArray<NetworkSerializableType<any, any> | NetworkType<any>>>(...types: T) {
// 	return {
// 		Name: types.map((v) => v.Name).join(" | "),
// 		Message: "",
// 		Validate(value): value is ToUnion<T> {
// 			return false;
// 		},
// 		Serialize(value: In<ToUnion<T>>): Out<ToUnion<T>> {
// 			const index = types.findIndex((f) => f.Validate(value));
// 			const networkType = types[index];

// 			return NexusSerialization.Serialize(networkType, value);
// 		},
// 		Deserialize(value: Out<ToUnion<T>>): In<ToUnion<T>> {
// 			throw `TODO`;
// 		},
// 		NetworkBuffer: {
// 			ReadData(reader) {
// 				const index = reader.ReadInt32();
// 				const networkType = types[index];
// 				return networkType.NetworkBuffer.ReadData(reader);
// 			},
// 			WriteData(data, writer) {
// 				const index = types.findIndex((f) => f.Validate(data));
// 				const networkType = types[index];

// 				writer.WriteInt32(index);
// 				networkType?.NetworkBuffer.WriteData(data, writer);
// 			},
// 		},
// 	} as ToUnion<T>;
// }

function isArrayLike(value: unknown): value is defined[] {
	return typeIs(value, "table") && (next(value)[0] === undefined || typeIs(next(value)[0], "number"));
}

/**
 * Creates an array network type with the given inner network type as the array type
 * @param typeLike The inner network type
 * @returns An array network type of the given inner type
 */
function ArrayOf<T extends StaticNetworkType<defined, defined>>(
	typeLike: T,
): NetworkSerializableType<In<T>[], Out<T>[]> {
	return {
		Name: typeLike.Name + "[]",
		Validate(value: unknown): value is In<T>[] {
			return isArrayLike(value) && value.every((v) => typeLike.Validate(v));
		},
		Message: "Expected " + typeLike.Name + "[]",
		NetworkBuffer: NetworkBuffers.Array(typeLike.NetworkBuffer) as NetworkBuffer<Out<T>[]>, // 'cause of roblox-ts
		Serialize(value) {
			return value.map((item: In<T>) => NexusSerialization.Serialize(typeLike, item));
		},
		Deserialize(value) {
			return (value as Out<T & unknown>[]).map((item) => NexusSerialization.Deserialize(typeLike, item));
		},
	};
}

type MapCheckArrayIn<T> = NexusSerialization.InputInterface<T>;
type MapCheckArrayOut<T> = NexusSerialization.OutputInterface<T>;
function TupleOf<T extends ReadonlyArray<NetworkSerializableType<any, any> | NetworkType<any>>>(
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
		NetworkBuffer: NetworkBuffers.Nullable(typeLike.NetworkBuffer),
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
function Interface<T>(
	objectInterface: Interface<T>,
	customLabel?: string,
): NetworkSerializableType<InTypes<typeof objectInterface>, OutTypes<typeof objectInterface>> {
	// We need to create a guaranteed ordered map
	const ordinalMap = getHashSortedKeys(objectInterface);

	return {
		Name: customLabel ?? `interface { ${ordinalMap.map((value) => value[0]).join("; ")} }`,
		NetworkBuffer: NetworkBuffers.StringHashMap(ordinalMap),
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

	readonly Undefined: typeof Undefined;
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
		objectInterface: Interface<T>,
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
	Undefined,

	/**
	 * A collection of literals - over the network this is represented by an integer of what value it is
	 */
	Literal,
	/**
	 * An array of a type `T[]`
	 */
	ArrayOf,
	/**
	 * A fixed array of a type `[T, ...]`
	 */
	TupleOf,
	/**
	 * An optional type (`T | undefined`)
	 */
	Optional,
	/**
	 * A key-based interface
	 */
	Interface,
};
