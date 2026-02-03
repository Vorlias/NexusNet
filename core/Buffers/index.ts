import { NetworkBuffer } from "../Types/NetworkTypes";

export type int8 = number & { readonly __nominal_i8?: never };
export type uint8 = number & { readonly __nominal_u8?: never };

export type int16 = number & { readonly __nominal_i16?: never };
export type uint16 = number & { readonly __nominal_u16?: never };

export type int32 = number & { readonly __nominal_i32?: never };
export type uint32 = number & { readonly __nominal_u32?: never };

export type float32 = number & { readonly __nominal_f32?: never };
export type float64 = number & { readonly __nominal_f64?: never };

export type utf8_string = string & { readonly __nominal_utf8?: never };

function isInt(value: unknown): value is int8 | int16 | int32 | uint8 | uint16 | uint32 {
	return typeIs(value, "number") && value % 1 === 0;
}

export namespace utf8_string {
	export function is(value: unknown): value is utf8_string {
		if (!typeIs(value, "string")) return false;
		const [len] = utf8.len(value);
		return len !== undefined && len !== false;
	}

	export function to_string(value: string | number | boolean): utf8_string {
		if (utf8_string.is(value)) {
			return value;
		} else if (typeIs(value, "number")) {
			return string.format("%f", value);
		} else if (typeIs(value, "boolean")) {
			return value ? "true" : "false";
		} else {
			throw `Invalid UTF-8 string provided`;
		}
	}
}

export namespace int8 {
	export const MIN = -127;
	export const MAX = 127;

	export function is(value: unknown): value is int8 {
		return isInt(value) && value >= MIN && value <= MAX;
	}
}

export namespace uint8 {
	export const MIN = 0;
	export const MAX = 255;

	export function is(value: unknown): value is uint8 {
		return isInt(value) && value >= MIN && value <= MAX;
	}
}

export namespace int16 {
	export const MIN = -32_767;
	export const MAX = 32_767;

	export function is(value: unknown): value is int16 {
		return isInt(value) && value >= MIN && value <= MAX;
	}
}

export namespace uint16 {
	export const MIN = -0;
	export const MAX = 65_535;

	export function is(value: unknown): value is uint16 {
		return isInt(value) && value >= MIN && value <= MAX;
	}
}

export namespace int32 {
	export const MIN = -2147483647;
	export const MAX = 2147483647;

	export function is(value: unknown): value is int32 {
		return isInt(value) && value >= MIN && value <= MAX;
	}
}

export namespace uint32 {
	export const MIN = -0;
	export const MAX = 4294967295;

	export function is(value: unknown): value is uint32 {
		return isInt(value) && value >= MIN && value <= MAX;
	}
}

export const INT_UNSIGNED = {
	8: uint8,
	16: uint16,
	32: uint32,
};

export const INT_SIGNED = {
	8: int8,
	16: int16,
	32: int32,
};

export const NeverBuffer = {
	$never: true,
	WriteData() {
		error("Cannot write to NetworkBuffer");
	},
	ReadData() {
		error("Cannot read from NetworkBuffer");
	},
} as NetworkBuffer<never>;

/**
 * The buffer encoders available to Nexus Networking
 */
export const NetworkBuffers = {
	Never: NeverBuffer,
	String: {
		WriteData(data, writer) {
			writer.WriteString(data);
		},
		ReadData(reader) {
			return reader.ReadString();
		},
	} as NetworkBuffer<string>,
	UTF8String: {
		WriteData(data, writer) {
			assert(utf8_string.is(data), "Expected UTF-8 string");
			writer.WriteString(data);
		},
		ReadData(reader) {
			const value = reader.ReadString();
			assert(utf8_string.is(value), "Expected UTF-8 string");
			return value;
		},
	} as NetworkBuffer<utf8_string>,
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
	Array: <T extends defined>(encoder: NetworkBuffer<T>) => {
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

/** @deprecated */
export const NCoreNetworkEncoders = NetworkBuffers;
