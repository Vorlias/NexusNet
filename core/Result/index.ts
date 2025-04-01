import NexusSerialization from "../Serialization";
import { NetworkSerializableType, NetworkSerializer, NetworkType, StaticNetworkType } from "../Types/NetworkTypes";

interface Ok<T> {
	readonly ok: true;
	readonly value: T;
}

interface Err<E> {
	readonly ok: false;
	readonly err: E;
}

export type NexusResult<T extends defined, E extends defined> = Ok<T> | Err<E>;

export function Ok<T extends defined, E extends defined>(value: T): NexusResult<T, E> {
	return {
		ok: true,
		value,
	};
}

export function Err<T extends defined, E extends defined>(err: E): NexusResult<T, E> {
	return {
		ok: false,
		err,
	};
}

function IsResult(value: unknown): value is NexusResult<defined, defined> {
	return typeIs(value, "table") && "ok" in value && ("err" in value || "value" in value);
}

function NetType<T extends defined, E extends defined>(
	valueType: StaticNetworkType<T>,
	errorType: StaticNetworkType<E>,
): NetworkSerializableType<NexusResult<T, E>, [true, T] | [false, E]> {
	return {
		Name: `Result<${valueType.Name}, ${errorType.Name}>`,
		Validator: {
			ValidateError: (typeId) => {
				return "Expected " + typeId.Name;
			},
			Validate(value): value is NexusResult<T, E> {
				return IsResult(value);
			},
		},
		Serializer: {
			Serialize(result) {
				if (result.ok) {
					return [true, NexusSerialization.Serialize(valueType, result.value)];
				} else {
					return [false, NexusSerialization.Serialize(errorType, result.err)];
				}
			},
			Deserialize(serialized) {
				const [ok, value] = serialized;
				if (ok) {
					return Ok(NexusSerialization.Deserialize(valueType, value));
				} else {
					return Err(NexusSerialization.Deserialize(errorType, value));
				}
			},
		},
		BufferEncoder: {
			WriteData(data, writer) {
				const [isOk, value] = data;
				if (isOk) {
					writer.WriteBoolean(true);
					valueType.BufferEncoder.WriteData(value, writer);
				} else {
					writer.WriteBoolean(false);
					errorType.BufferEncoder.WriteData(value, writer);
				}
			},
			ReadData(reader) {
				const isOk = reader.ReadBoolean();
				if (isOk) {
					return [true, valueType.BufferEncoder.ReadData(reader)];
				} else {
					return [false, errorType.BufferEncoder.ReadData(reader)];
				}
			},
		},
	};
}

export const NexusResult = {
	Type: NetType,
	IsResult,
	Ok,
	Err,
};
