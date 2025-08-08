/* eslint-disable @typescript-eslint/no-explicit-any */
import { int32, NetworkBuffers } from "../Buffers";
import { BufferReader } from "../Buffers/BufferReader";
import { BufferWriter } from "../Buffers/BufferWriter";
import NexusSerialization, { Input, Output } from "../Serialization";
import { DeserializationException } from "../Serialization/Serializer";

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

export interface NetworkValidator<TValue, TEncode = TValue> {
	/**
	 * A callback to get the message for an invalid type on {@link Check} being false
	 */
	ValidateError?: NetworkTypeErrorFn<NetworkType<TValue, TEncode>> | string;
	/**
	 * A callback which is used to check the given value matches this network type
	 */
	Validate(this: void, value: unknown): value is TValue;
}

type NetworkTypeErrorFn<T extends StaticNetworkType = StaticNetworkType> = (networkType: T, value: unknown) => string;
export interface NetworkType<TValue, TEncode = TValue> {
	/**
	 * The name of the type
	 */
	Name: string;
	/**
	 * A network buffer for this network type - used for buffer serialization
	 */
	Encoding: NetworkBuffer<TEncode>;
	Validation: NetworkValidator<TValue, TEncode>;
}

export interface SerializationContext {}
export interface DeserializationContext {
	Invalidate(this: void): void;
}

export interface NetworkSerializer<TInput, TOutput> {
	/**
	 * Serializes the given value to the serialized value for this network type
	 */
	Serialize(this: void, value: TInput, serializer?: SerializationContext): TOutput;
}

export interface NetworkDeserializer<TInput, TOutput> {
	/**
	 * Deserializes a serialized value for this network type to the original type
	 */
	Deserialize(this: void, value: TOutput, deserializer?: DeserializationContext): TInput;

	/**
	 * Handle errors that might happen with the deserialization process
	 */
	OnDeserializeException?(this: void, exception: DeserializationException): boolean | void;
}

export interface NetworkTypeSerialization<TInput, TOutput>
	extends NetworkSerializer<TInput, TOutput>,
		NetworkDeserializer<TInput, TOutput> {}

export interface NetworkSerializableType<TInput, TOutput> extends NetworkType<TInput, TOutput> {
	Serialization: NetworkTypeSerialization<TInput, TOutput>;
}

export namespace NetworkType {
	export function Check<T, TEncode>(
		networkType: NetworkType<T, TEncode>,
		value: unknown,
	): LuaTuple<[true, undefined] | [false, string]> {
		if (networkType.Validation) {
			const validator = networkType.Validation;

			if (validator.Validate(value)) {
				return $tuple<[true, undefined]>(true, undefined);
			} else {
				const errMsg = typeIs(validator.ValidateError, "function")
					? validator.ValidateError(networkType, value)
					: validator.ValidateError ?? `Expected ${networkType.Name}`;

				return $tuple<[false, string]>(false, errMsg);
			}
		} else {
			return $tuple<[true, undefined]>(true, undefined);
		}
	}

	type InferSerializer<T> = T extends NetworkSerializableType<infer _TInput, infer _TOutput>
		? T["Serialization"]
		: undefined;
	type InferSerializers<T extends ReadonlyArray<StaticNetworkType>> = {
		[P in keyof T]: InferSerializer<T[P]>;
	};

	type InferBuffers<T extends ReadonlyArray<StaticNetworkType>> = {
		[P in keyof T]: T[P]["Encoding"];
	};

	type InferValidators<T extends ReadonlyArray<StaticNetworkType>> = {
		[P in keyof T]: NetworkValidator<Input<T[P]>, Output<T[P]>>;
	};

	export function TypesToSerializers<T extends ReadonlyArray<StaticNetworkType>>(...values: T): InferSerializers<T> {
		const serializers = new Array<NetworkSerializer<any, any>>(values.size());

		for (let i = 0; i < values.size(); i++) {
			const positionalNetworkType = values[i];
			if (NexusSerialization.IsSerializableType(positionalNetworkType)) {
				serializers[i] = positionalNetworkType.Serialization;
			}
		}

		return serializers as InferSerializers<T>;
	}

	export function TypesToBuffers<T extends ReadonlyArray<StaticNetworkType>>(...values: T): InferBuffers<T> {
		const buffers = new Array<NetworkBuffer<any>>(values.size());

		for (let i = 0; i < values.size(); i++) {
			const positionalNetworkType = values[i];
			buffers[i] = positionalNetworkType.Encoding;
		}

		return buffers as InferBuffers<T>;
	}

	export function GetValidators<T extends ReadonlyArray<StaticNetworkType>>(...values: T): InferValidators<T> {
		const validators = new Array<NetworkValidator<any, any>>(values.size());

		for (let i = 0; i < values.size(); i++) {
			const positionalNetworkType = values[i];
			validators[i] = positionalNetworkType.Validation;
		}

		return validators as InferValidators<T>;
	}
}

export type StaticNetworkType<T = any, U = any> = NetworkType<T, U> | NetworkSerializableType<T, U>;
export type ToNetworkArguments<T> = { [K in keyof T]: StaticNetworkType<T[K]> };
