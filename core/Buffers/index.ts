import { NetworkBuffer } from "../Types/NetworkTypes";

type int8 = number & { readonly __nominal_i8?: never };
type uint8 = number & { readonly __nominal_u8?: never };

type int16 = number & { readonly __nominal_i16?: never };
type uint16 = number & { readonly __nominal_u16?: never };

type int32 = number & { readonly __nominal_i32?: never };
type uint32 = number & { readonly __nominal_u32?: never };

type float32 = number & { readonly __nominal_f32?: never };
type float64 = number & { readonly __nominal_f64?: never };

/**
 * The buffer encoders available to Nexus Networking
 */
export const NCoreNetworkEncoders = {
	String: {
		WriteData(data, writer) {
			writer.WriteString(data);
		},
		ReadData(reader) {
			return reader.ReadString();
		},
	} as NetworkBuffer<string>,
	Int8: {
		WriteData(data, writer) {
			writer.WriteInt8(data);
		},
		ReadData(reader) {
			return reader.ReadInt8();
		},
	} as NetworkBuffer<int8>,
	UInt8: {
		WriteData(data, writer) {
			writer.WriteUInt8(data);
		},
		ReadData(reader) {
			return reader.ReadUInt8();
		},
	} as NetworkBuffer<uint8>,
	Int16: {
		WriteData(data, writer) {
			writer.WriteUInt16(data);
		},
		ReadData(reader) {
			return reader.ReadUInt16();
		},
	} as NetworkBuffer<int16>,
	UInt16: {
		WriteData(data, writer) {
			writer.WriteUInt16(data);
		},
		ReadData(reader) {
			return reader.ReadUInt16();
		},
	} as NetworkBuffer<uint16>,
	Int32: {
		WriteData(data, writer) {
			writer.WriteInt32(data);
		},
		ReadData(reader) {
			return reader.ReadInt32();
		},
	} as NetworkBuffer<int32>,
	UInt32: {
		WriteData(data, writer) {
			writer.WriteUInt32(data);
		},
		ReadData(reader) {
			return reader.ReadUInt32();
		},
	} as NetworkBuffer<uint32>,
	Float32: {
		WriteData(data, writer) {
			writer.WriteFloat32(data);
		},
		ReadData(reader) {
			return reader.ReadFloat32();
		},
	} as NetworkBuffer<float32>,
	Float64: {
		WriteData(data, writer) {
			writer.WriteFloat64(data);
		},
		ReadData(reader) {
			return reader.ReadFloat64();
		},
	} as NetworkBuffer<float64>,
	Boolean: {
		WriteData(data, writer) {
			writer.WriteBoolean(data);
		},
		ReadData(reader) {
			return reader.ReadBoolean();
		},
	} as NetworkBuffer<boolean>,
	Array: <T>(encoder: NetworkBuffer<T>) => {
		return {
			WriteData(data, writer) {
				writer.WriteUInt32(data.size()); // write length

				// Write values
				for (let i = 0; i < data.size(); i++) {
					encoder.WriteData(data[i], writer);
				}
			},
			ReadData(reader) {
				const length = reader.ReadUInt32(); // read length

				// read values
				const values = new Array<T>();
				for (let i = 0; i < length; i++) {
					const value = encoder.ReadData(reader);
					values[i] = value;
				}

				return values;
			},
		} as NetworkBuffer<T[]>;
	},
	FixedArray: <T extends ReadonlyArray<unknown>>(...items: { [P in keyof T]: NetworkBuffer<T[P]> }) => {
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
		} as NetworkBuffer<T>;
	},
	Nullable: <T>(encoder: NetworkBuffer<T>) => {
		return {
			WriteData(data, writer) {
				if (data !== undefined) {
					writer.WriteBoolean(true);
					encoder.WriteData(data, writer);
				} else {
					writer.WriteBoolean(false);
				}
			},
			ReadData(reader) {
				const hasValue = reader.ReadBoolean();
				if (hasValue) {
					return encoder.ReadData(reader);
				}

				return undefined;
			},
		} satisfies NetworkBuffer<T | undefined>;
	},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	StringHashMap: <T>(ordinal: ReadonlyArray<readonly [string, NetworkBuffer<any>]>) => {
		return {
			WriteData(data, writer) {
				// Write the struct properties sequentially
				for (let i = 0; i < ordinal.size(); i++) {
					const [key, encoder] = ordinal[i];

					const [success, err] = pcall(() => {
						encoder.WriteData(data[key as keyof typeof data], writer);
					});

					if (!success) {
						error("Failed to serialize key '" + key + "': " + tostring(err));
					}
				}
			},
			ReadData(reader) {
				const object = {} as T;

				// Assign properties back from the serializer
				for (let i = 0; i < ordinal.size(); i++) {
					const [key, encoder] = ordinal[i];

					const value = encoder.ReadData(reader) as T[keyof T];
					object[key as keyof T] = value;
				}

				return object;
			},
		} satisfies NetworkBuffer<T>;
	},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
} satisfies { [Key in string]: NetworkBuffer<any> | ((...args: any[]) => NetworkBuffer<any>) };
