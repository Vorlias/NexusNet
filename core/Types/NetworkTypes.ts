/* eslint-disable @typescript-eslint/no-explicit-any */
import { int32, NetworkBuffers } from "../Buffers";
import { BufferReader } from "../Buffers/BufferReader";
import { BufferWriter } from "../Buffers/BufferWriter";
import NexusSerialization, { Input, Output } from "../Serialization";

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

type NetworkTypeErrorFn<T extends StaticNetworkType = StaticNetworkType> = (networkType: T, value: unknown) => string;
export interface NetworkType<TValue, TEncode = TValue> {
	/**
	 * The name of the type
	 */
	Name: string;
	/**
	 * A callback to get the message for an invalid type on {@link Check} being false
	 */
	ValidateError?: NetworkTypeErrorFn<NetworkType<TValue, TEncode>> | string;
	/**
	 * A callback which is used to check the given value matches this network type
	 */
	Validate(this: void, value: unknown): value is TValue;
	/**
	 * A network buffer for this network type - used for buffer serialization
	 */
	NetworkBuffer: NetworkBuffer<TEncode>;
}

export interface NetworkSerializableType<TInput, TOutput> extends NetworkType<TInput, TOutput> {
	/**
	 * Serializes the given value to the serialized value for this network type
	 */
	Serialize(this: void, value: TInput): TOutput;
	/**
	 * Deserializes a serialized value for this network type to the original type
	 */
	Deserialize(this: void, value: TOutput): TInput;
}

export namespace NetworkType {
	export function Check<T, TEncode>(
		networkType: NetworkType<T, TEncode>,
		value: unknown,
	): LuaTuple<[true, undefined] | [false, string]> {
		if (networkType.Validate(value)) {
			return $tuple<[true, undefined]>(true, undefined);
		} else {
			const errMsg = typeIs(networkType.ValidateError, "function")
				? networkType.ValidateError(networkType, value)
				: (networkType.ValidateError ?? `Expected ${networkType.Name}`);

			return $tuple<[false, string]>(false, errMsg);
		}
	}
}

export function __NexusCreateSerializableType<TInput, TOutput>(
	name: string,
	ser: Pick<NetworkSerializableType<TInput, TOutput>, "Validate" | "Serialize" | "Deserialize">,
	networkBuffer: NetworkBuffer<TOutput>,
): NetworkSerializableType<TInput, TOutput> {
	return {
		...ser,
		Name: name,
		ValidateError: `Expected ${name}`,
		NetworkBuffer: networkBuffer,
	};
}

export type StaticNetworkType<T = any, U = any> = NetworkType<T> | NetworkSerializableType<T, U>;
export type ToNetworkArguments<T> = { [K in keyof T]: StaticNetworkType<T[K]> };
