import { BufferReader } from "../Buffers/BufferReader";
import { BufferWriter } from "../Buffers/BufferWriter";
import { TypeChecker } from "../Validation";
import { NetworkType } from "./NetworkType";

export type int8 = number & { readonly __nominal_i8?: never };
export type uint8 = number & { readonly __nominal_u8?: never };

export type int16 = number & { readonly __nominal_i16?: never };
export type uint16 = number & { readonly __nominal_u16?: never };

export type int32 = number & { readonly __nominal_i32?: never };
export type uint32 = number & { readonly __nominal_u32?: never };

export type float32 = number & { readonly __nominal_f32?: never };
export type float64 = number & { readonly __nominal_f64?: never };

export interface NetworkEncoder<T> {
	WriteData(data: T, writer: BufferWriter): void;
	ReadData(reader: BufferReader): T;
}

const StringEncode: NetworkEncoder<string> = {
	WriteData(data, writer) {
		assert(TypeChecker.isString(data), "Expected UTF-8 string");
		writer.WriteString(data);
	},
	ReadData(reader) {
		const data = reader.ReadString();
		assert(TypeChecker.isString(data), "Expected UTF-8 string");
		return data;
	},
};

const Int8Encode: NetworkEncoder<int8> = {
	WriteData(data, writer) {
		writer.WriteInt8(data);
	},
	ReadData(reader) {
		return reader.ReadInt8();
	},
};

const Int16Encode: NetworkEncoder<int16> = {
	WriteData(data, writer) {
		writer.WriteInt16(data);
	},
	ReadData(reader) {
		return reader.ReadInt16();
	},
};

const Int32Encode: NetworkEncoder<int32> = {
	WriteData(data, writer) {
		writer.WriteInt32(data);
	},
	ReadData(reader) {
		return reader.ReadInt32();
	},
};

const UInt8Encode: NetworkEncoder<uint8> = {
	WriteData(data, writer) {
		writer.WriteUInt8(data);
	},
	ReadData(reader) {
		return reader.ReadUInt8();
	},
};

const UInt16Encode: NetworkEncoder<uint16> = {
	WriteData(data, writer) {
		writer.WriteUInt16(data);
	},
	ReadData(reader) {
		return reader.ReadUInt16();
	},
};

const UInt32Encode: NetworkEncoder<uint32> = {
	WriteData(data, writer) {
		writer.WriteUInt32(data);
	},
	ReadData(reader) {
		return reader.ReadUInt32();
	},
};

const SingleEncode: NetworkEncoder<float32> = {
	WriteData(data, writer) {
		writer.WriteFloat32(data);
	},
	ReadData(reader) {
		return reader.ReadFloat32();
	},
};

const DoubleEncode: NetworkEncoder<float64> = {
	WriteData(data, writer) {
		writer.WriteFloat64(data);
	},
	ReadData(reader) {
		return reader.ReadFloat64();
	},
};

const BooleanEncode: NetworkEncoder<boolean> = {
	WriteData(data, writer) {
		writer.WriteBoolean(data);
	},
	ReadData(reader) {
		return reader.ReadBoolean();
	},
};

const VectorEncode: NetworkEncoder<Vector3> = {
	WriteData(data, writer) {
		writer.WriteFloat32(data.X);
		writer.WriteFloat32(data.Y);
		writer.WriteFloat32(data.Z);
	},
	ReadData(reader) {
		const r = reader.ReadFloat32();
		const g = reader.ReadFloat32();
		const b = reader.ReadFloat32();
		return new Vector3(r, g, b);
	},
};

// TODO: Compress this down to UInt24 at some point :-)
const ColorEncode: NetworkEncoder<Color3> = {
	WriteData(data, writer) {
		writer.WriteFloat32(data.R);
		writer.WriteFloat32(data.G);
		writer.WriteFloat32(data.B);
	},
	ReadData(reader) {
		const r = reader.ReadFloat32();
		const g = reader.ReadFloat32();
		const b = reader.ReadFloat32();
		return new Color3(r, g, b);
	},
};

/** @internal Used for special cases like instances */
export const NexusNeverEncoder: NetworkEncoder<never> = {
	ReadData(reader) {
		throw `The reader should not be invoked on this type, was it marked with the NoBufferEncoding flag?`;
	},
	WriteData(data, writer) {},
};

export const NetworkEncoding = {
	Boolean: BooleanEncode,

	String: StringEncode,

	Int8: Int8Encode,
	Int16: Int16Encode,
	Int32: Int32Encode,

	UInt8: UInt8Encode,
	UInt16: UInt16Encode,
	UInt32: UInt32Encode,

	Float: SingleEncode,
	Double: DoubleEncode,

	Color3: ColorEncode,
	Vector3: VectorEncode,

	Array: <T extends defined>(encoder: NetworkEncoder<T>): NetworkEncoder<T[]> => {
		return {
			WriteData(data, writer) {
				const size = data.size();
				writer.WriteInt32(size);
				for (const value of data) {
					encoder.WriteData(value, writer);
				}
			},
			ReadData(reader) {
				const size = reader.ReadInt32(); // size
				const arr = new Array<T>(size);
				for (let i = 0; i < size; i++) {
					arr[i] = encoder.ReadData(reader);
				}
				return arr;
			},
		};
	},

	FixedArray: <T extends ReadonlyArray<unknown>>(
		...items: { [P in keyof T]: NetworkEncoder<T[P]> }
	): NetworkEncoder<T> => {
		const size = items.size();
		return {
			WriteData(data: T, writer) {
				for (let i = 0; i < size; i++) {
					const encoder = items[i];
					encoder.WriteData(data[i], writer);
				}
			},
			ReadData(reader): T {
				const tuple: unknown[] = [];

				for (let i = 0; i < size; i++) {
					const encoder = items[i];
					tuple[i] = encoder.ReadData(reader);
				}

				return tuple as defined as T;
			},
		};
	},

	Nullable: <T extends defined>(encoder: NetworkEncoder<T>): NetworkEncoder<T | undefined> => {
		return {
			ReadData(reader) {
				const hasValue = reader.ReadBoolean();
				if (hasValue) {
					return encoder.ReadData(reader);
				}

				return undefined;
			},
			WriteData(data, writer) {
				if (data !== undefined) {
					writer.WriteBoolean(true);
					encoder.WriteData(data, writer);
				} else {
					writer.WriteBoolean(false);
				}
			},
		};
	},
};
