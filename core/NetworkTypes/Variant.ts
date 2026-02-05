import NexusSerialization from "@Vorlias/NexusNet/Core/Serialization";
import { NetworkSerializableType, NetworkType } from "@Vorlias/NexusNet/Core/Types/NetworkTypes";
import { Identity } from "@Vorlias/NexusNet/Core/Types/Utility";
import { int32 } from "@Vorlias/NexusNet/Framework";

type VariantOf<T> = Identity<{ [P in keyof T]: { Type: P; Value: NexusSerialization.Input<T[P]> } }[keyof T]>;
type SerializedVariantOf<T> = { [P in keyof T]: [typeHash: int32, NexusSerialization.Output<T[P]>] }[keyof T];

export interface NetworkVariantType<T> extends NetworkSerializableType<VariantOf<T>, SerializedVariantOf<T>> {
	$Type: "Variant";
	Variants: T;
}

export function NexusVariant<T extends { [P in string]: NetworkType.Any }>(variants: T): NetworkVariantType<T> {
	const hashToKey = new Map<number, string>();
	for (const [key] of pairs(variants) as IterableFunction<LuaTuple<[name: string, value: defined]>>) {
		hashToKey.set(string.hash(key), key);
	}

	return {
		$Type: "Variant",
		Name: "Variant",
		Variants: variants,
		Validation: {
			Validate(value): value is VariantOf<T> {
				return false;
			},
		},
		Serialization: {
			Serialize: (value: VariantOf<T>): SerializedVariantOf<T> => {
				const hashId = string.hash(value.Type as string);
				return [hashId, NexusSerialization.Serialize(variants[value.Type], value.Value)];
			},
			Deserialize: (value: SerializedVariantOf<T>): VariantOf<T> => {
				const [id, data] = value;

				const key = hashToKey.get(id);
				assert(key !== undefined);

				return {
					Type: key,
					Value: data,
				} as VariantOf<T>;
			},
		},
		Encoding: {
			WriteData(data, writer) {
				const [key, value] = data;
				writer.WriteInt32(key);

				const serializer = variants[key];
				serializer.Encoding.WriteData(value, writer);
			},
			ReadData(reader) {
				const hashKey = reader.ReadInt32();
				const key = hashToKey.get(hashKey);
				assert(key !== undefined);

				const serializer = variants[key];
				const value = serializer.Encoding.ReadData(reader);

				return [hashKey, value];
			},
		},
	};
}
