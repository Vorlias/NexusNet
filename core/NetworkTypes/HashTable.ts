import inspect from "@Easy/Core/Shared/Util/Inspect";
import { NexusTypes } from "../../Framework";
import NexusSerialization from "../Serialization";
import { NetworkBuffer, NetworkSerializableType, NetworkSerializer, NetworkType } from "../Types/NetworkTypes";
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
): NetworkSerializer<NexusSerialization.InputInterface<TableNetworkType<T>>, HashTable<T>> {
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
		Deserialize(data): NexusSerialization.InputInterface<TableNetworkType<T>> {
			const object = {} as NexusSerialization.InputInterface<TableNetworkType<T>>;

			// Assign properties back from the serializer
			for (let i = 0; i < ordinal.size(); i++) {
				const [key, encoder] = ordinal[i];

				const value = NexusSerialization.Deserialize(encoder, data[i]);
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
				try {
					let value = data[i + 1];
					encoder.BufferEncoder.WriteData(value, writer); // lol this is where it decides to ignore the `+ 1`
				} catch (err) {
					error(
						"Failed to encode " +
							key +
							" at " +
							(i + 1) +
							", got value " +
							tostring(data[i]) +
							" struct is " +
							inspect(data) +
							": " +
							err,
					);
				}
			}
		},
		ReadData(reader) {
			const data = [] as HashTable<T>;

			for (let i = 0; i < ordinal.size(); i++) {
				const [, encoder] = ordinal[i];
				data[i] = encoder.BufferEncoder.ReadData(reader);
			}

			return data;
		},
	};
}

export function NexusHashTable__EXPERIMENTAL<T extends object>(
	tbl: TableNetworkType<T>,
	debugName?: string,
): NetworkSerializableType<NexusSerialization.InputInterface<typeof tbl>, HashTable<T>> {
	const buffer = CreateHashTableBuffer<T>(tbl);
	const serializer = CreateHashTableSerializer<T>(tbl);

	return {
		Name: debugName ?? "HashTable",
		Validator: {
			Validate(obj): obj is NexusSerialization.InputInterface<typeof tbl> {
				if (!typeIs(obj, "table")) return false;
				for (const [key, value] of pairs(obj)) {
					const validator = tbl[key as keyof typeof tbl].Validator;
					if (!validator.Validate(value)) return false;
				}

				return true;
			},
		},
		Serializer: serializer,
		BufferEncoder: buffer,
	};
}
