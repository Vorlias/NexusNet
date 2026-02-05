import { NetworkSerializableType, NetworkType } from "../Types/NetworkTypes";
import NexusSerialization from "../Serialization";
import { int32 } from "../Buffers";

type UnionFromIn<T extends NetworkType.Any[]> = { [P in keyof T]: NexusSerialization.Input<T[P]> }[number];

type ParseInt<T> = T extends `${infer N extends number}` ? N : never;
type UnionFromOut<T extends NetworkType.Any[]> = {
	[P in keyof T]: [type: ParseInt<P>, value: NexusSerialization.Output<T[P]>];
}[number];

export interface NetworkUnionType<T extends NetworkType.Any[]> extends NetworkSerializableType<
	UnionFromIn<T>,
	UnionFromOut<T>
> {
	$Type: "Union";
	Variants: T;
}

export function NexusUnion<const T extends NetworkType.Any[]>(...variants: T): NetworkUnionType<T> {
	const validators = variants.map((v) => v.Validation);

	return {
		$Type: "Union",
		Variants: variants,
		Name: variants.map((v) => v.Name).join(" | "),
		Serialization: {
			Serialize(value) {
				let typeIndex = validators.findIndex((v) => v.Validate(value));
				assert(typeIndex !== -1);
				return NexusSerialization.Serialize(variants[typeIndex], value);
			},
			Deserialize(value) {
				const [unionIndex, unionValue] = value as [int32, NexusSerialization.Output<T[number]>];
				const typeAtIndex = variants[unionIndex];
				assert(typeAtIndex);

				return NexusSerialization.Deserialize(typeAtIndex, unionValue);
			},
		},
		Validation: {
			Validate(value): value is UnionFromIn<T> {
				return validators.some((validator) => validator.Validate(value));
			},
		},
		Encoding: {
			ReadData(reader) {
				const index = reader.ReadInt32() as int32;
				const data = variants[index].Encoding.ReadData(reader);
				return [index, data] as UnionFromOut<T>;
			},

			WriteData(data, writer) {
				const [typeIndex, typeValue] = data;

				writer.WriteInt32(typeIndex);
				variants[typeIndex].Encoding.WriteData(typeValue, writer);
			},
		},
	};
}
