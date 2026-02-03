import NexusSerialization from "../Serialization";
import {
	NetworkBuffer,
	NetworkSerializableType,
	NetworkSerializer,
	NetworkType,
	NetworkTypeSerialization,
} from "../Types/NetworkTypes";
import { hashstring } from "../Utils/hash";

function getHashSortedKeys<T extends { [P in string]: NetworkType<any> }>(obj: T): Array<[string, NetworkType<any>]> {
	const arr = new Array<[string, NetworkType<any>]>();

	for (const [key, value] of pairs(obj) as IterableFunction<LuaTuple<[string, NetworkType<any>]>>) {
		arr.push([key, value]);
	}

	return arr.sort((a, b) => hashstring(tostring(a[0])) < hashstring(tostring(b[0])));
}

interface HashTable<T extends object> extends Array<T[keyof T]> {
	readonly __nominal_hashSymbol?: unique symbol;
}
type TableNetworkType<T> = { [P in keyof T]: NetworkSerializableType<T[P], any> | NetworkType<T[P]> };
function CreateHashTableSerializer<T extends object>(
	struct: TableNetworkType<T>,
): NetworkTypeSerialization<NexusSerialization.InputInterface<TableNetworkType<T>>, HashTable<T>> {
	const ordinal = getHashSortedKeys(struct);

	return {
		Serialize(value) {
			const data = new Array<unknown>(ordinal.size());

			for (let i = 0; i < ordinal.size(); i++) {
				const [key, encoder] = ordinal[i];

				const [success, err] = pcall(() => {
					data[i] = NexusSerialization.Serialize(encoder, value[key as keyof typeof value]);
				});

				if (!success) {
					error("Failed to serialize key '" + key + "': " + tostring(err));
				}
			}

			return data as HashTable<T>;
		},
		Deserialize(data: Array<T[keyof T]>): NexusSerialization.InputInterface<TableNetworkType<T>> {
			const object = {} as NexusSerialization.InputInterface<TableNetworkType<T>>;

			// Assign properties back from the serializer
			for (let i = 0; i < ordinal.size(); i++) {
				const [key, encoder] = ordinal[i];
				const serializedValue = data[i];

				const value = NexusSerialization.Deserialize(encoder, serializedValue);
				object[key as keyof T] = value;
			}

			return object;
		},
	};
}

function CreateHashTableBuffer<T extends object>(struct: TableNetworkType<T>): NetworkBuffer<HashTable<T>> {
	const ordinal = getHashSortedKeys(struct);

	return {
		WriteData(data, writer) {
			for (let i = 0; i < ordinal.size(); i++) {
				const [key, encoder] = ordinal[i];

				const value = data[i + 1];
				encoder.Encoding.WriteData(value, writer); // lol this is where it decides to ignore the `+ 1`
			}
		},
		ReadData(reader) {
			const data = [] as HashTable<T>;

			for (let i = 0; i < ordinal.size(); i++) {
				const [, encoder] = ordinal[i];
				data[i + 1] = encoder.Encoding.ReadData(reader);
			}

			return data;
		},
	};
}

export function NexusHashTable<T extends object>(
	tbl: TableNetworkType<T>,
	debugName?: string,
): NetworkSerializableType<NexusSerialization.InputInterface<typeof tbl>, HashTable<T>> {
	const buffer = CreateHashTableBuffer<T>(tbl);
	const serializer = CreateHashTableSerializer<T>(tbl);

	return {
		Name: debugName ?? "HashTable",
		Validation: {
			Validate(obj): obj is NexusSerialization.InputInterface<typeof tbl> {
				if (!typeIs(obj, "table")) return false;
				for (const [key, value] of pairs(obj)) {
					const validator = tbl[key as keyof typeof tbl].Validation;
					if (!validator.Validate(value)) return false;
				}

				return true;
			},
			ValidateError(this: void, networkType, obj) {
				if (!typeIs(obj, "table")) return "Expected table got " + typeOf(obj);
				for (const [key, value] of pairs(obj)) {
					const validator = tbl[key as keyof typeof tbl].Validation;
					if (!validator.Validate(value)) return "Invalid key '" + key + "'";
				}

				return "";
			},
		},
		Serialization: serializer,
		Encoding: buffer,
	};
}
