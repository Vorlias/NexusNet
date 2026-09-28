import { float32, float64, int16, int32, int8, NetworkEncoding, uint16, uint32, uint8 } from "./NetworkEncoding";
import { NetworkType } from "./NetworkType";

export const NexusString: NetworkType<string> = {
    Encoding: NetworkEncoding.String,
    Flags: 0,
};

export const NexusInt8: NetworkType<int8> = {
    Encoding: NetworkEncoding.Int8,
    Flags: 0,
};

export const NexusInt16: NetworkType<int16> = {
    Encoding: NetworkEncoding.Int16,
    Flags: 0,
};

export const NexusInt32: NetworkType<int32> = {
    Encoding: NetworkEncoding.Int32,
    Flags: 0,
};

export const NexusUInt8: NetworkType<uint8> = {
    Encoding: NetworkEncoding.Int8,
    Flags: 0,
};

export const NexusUInt16: NetworkType<uint16> = {
    Encoding: NetworkEncoding.Int16,
    Flags: 0,
};

export const NexusUInt32: NetworkType<uint32> = {
    Encoding: NetworkEncoding.Int32,
    Flags: 0,
};

export const NexusSingle: NetworkType<float32> = {
    Encoding: NetworkEncoding.Float,
    Flags: 0,
};

export const NexusDouble: NetworkType<float64> = {
    Encoding: NetworkEncoding.Double,
    Flags: 0,
};

export const NexusBool: NetworkType<boolean> = {
    Encoding: NetworkEncoding.Boolean,
    Flags: 0,
};