import { int32 } from "./Buffers";
import NexusSerialization from "./Serialization";
import { NetworkType, NetworkSerializableType, StaticNetworkType } from "./Types/NetworkTypes";

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

/**
 * @deprecated Experimental - not recommended to use
 */
export function NexusExUnion<T extends ReadonlyArray<StaticNetworkType>>(
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
