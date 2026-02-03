import { NetworkType } from "../Core/Types/NetworkTypes";
import msgpack from "./msgpack";

export enum Type {
	NoneOrUndefined,
	String,
	Number,
	Boolean,
	Object,
}

const typeMap: { [P in keyof CheckableTypes]?: Type } = {
	nil: Type.NoneOrUndefined,
	string: Type.String,
	number: Type.Number,
	boolean: Type.Boolean,
	table: Type.Object,
};

export type Variant = string | number | object | boolean | undefined;
export const Variant: NetworkType<Variant, Variant> = {
	Name: "Variant",
	Validator: {
		Validate(value): value is Variant {
			return true;
		},
	},
	BufferEncoder: {
		WriteData(data, writer) {
			const typeId = typeMap[typeOf(data)];
			assert(typeId !== undefined, `Cannot send variant of type ${typeOf(data)} over the network.`);
			writer.WriteInt32(typeId);

			switch (typeId) {
				case Type.String:
					writer.WriteString(data as string);
					break;
				case Type.Number:
					writer.WriteFloat32(data as number);
					break;
				case Type.Boolean:
					writer.WriteBoolean(data as boolean);
					break;
				case Type.Object:
					writer.WriteString(msgpack.encode(data as object));
					break;
				case Type.NoneOrUndefined:
					break;
				default:
					throw `Not implemented: ${typeId}`;
			}
		},
		ReadData(reader) {
			const typeId = reader.ReadInt32() as Type;
			switch (typeId) {
				case Type.NoneOrUndefined:
					return undefined;
				case Type.String:
					return reader.ReadString();
				case Type.Number:
					return reader.ReadFloat32();
				case Type.Boolean:
					return reader.ReadBoolean();
				case Type.Object:
					return msgpack.decode(reader.ReadString() as msgpack.binary);
				default:
					throw `Not implemented ${typeId}`;
			}
		},
	},
};
