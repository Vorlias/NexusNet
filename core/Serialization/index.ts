/* eslint-disable @typescript-eslint/no-explicit-any */
import { NetworkSerializableType, NetworkType } from "../Types/NetworkTypes";
import { Identity } from "../Types/Utility";

namespace NexusSerialization {
	export type Input<T> =
		T extends NetworkSerializableType<infer A, infer _> ? A : T extends NetworkType<infer A, infer _> ? A : never;

	export type InputDebug<T> =
		T extends NetworkSerializableType<infer A, infer _>
			? { value: A }
			: T extends NetworkType<infer A, infer B>
				? { value: A; value2: B }
				: never;

	export type Output<T> =
		T extends NetworkSerializableType<infer _, infer A> ? A : T extends NetworkType<infer A, infer _> ? A : never;

	export type InputInterface<T> = Identity<{ [P in keyof T]: Input<T[P]> }>;
	export type OutputInterface<T> = Identity<{ [P in keyof T]: Output<T[P]> }>;

	export function IsSerializableType<T>(value: NetworkType.OfType<T>): value is NetworkSerializableType<T, unknown> {
		return "Serialization" in value && typeIs(value.Serialization, "table");
	}

	export function Serialize<TNetworkType extends NetworkSerializableType<any, any> | NetworkType<any>>(
		networkType: TNetworkType,
		value: Input<TNetworkType>,
	): Output<TNetworkType> {
		if (IsSerializableType(networkType)) {
			return networkType.Serialization.Serialize(value) as Output<TNetworkType>;
		} else {
			return value as Output<TNetworkType>;
		}
	}

	export function Deserialize<TNetworkType extends NetworkSerializableType<any, any> | NetworkType<any>>(
		networkType: TNetworkType,
		value: Output<TNetworkType>,
	): Input<TNetworkType> {
		if (IsSerializableType(networkType)) {
			return networkType.Serialization.Deserialize(value) as Input<TNetworkType>;
		} else {
			return value as Input<TNetworkType>;
		}
	}
}
export = NexusSerialization;
