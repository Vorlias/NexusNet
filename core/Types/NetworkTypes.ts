/* eslint-disable @typescript-eslint/no-explicit-any */
import { BufferReader } from "../Buffers/BufferReader";
import { BufferWriter } from "../Buffers/BufferWriter";

export type i8 = number;
export type u8 = number;
export type i16 = number;
export type u16 = number;
export type i32 = number;
export type u32 = number;
export type f32 = number;
export type f64 = number;

export interface NetworkBuffer<T> {
	WriteData(data: T, writer: BufferWriter): void;
	ReadData(reader: BufferReader): T;
}

export interface NetworkType<TValue, TEncode = TValue> {
	Name: string;
	Message: ((value: TValue, typeName: string) => string) | string;
	Validate(value: unknown): value is TValue;
	NetworkBuffer: NetworkBuffer<TEncode>;
}

export interface NetworkSerializableType<TInput, TOutput> extends NetworkType<TInput, TOutput> {
	Serialize(value: TInput): TOutput;
	Deserialize(value: TOutput): TInput;
}

export type StaticNetworkType<T = any> = NetworkType<T> | NetworkSerializableType<T, any>;
export type ToNetworkArguments<T> = { [K in keyof T]: StaticNetworkType<T[K]> };
