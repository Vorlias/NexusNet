/* eslint-disable @typescript-eslint/no-explicit-any */
import { NetworkSerializableType, NetworkType } from "../Types/NetworkTypes";
import { NetIsSerializer } from "./Serializer";

namespace NexusSerialization {
	export type Input<T> =
		T extends NetworkSerializableType<infer A, infer _> ? A : T extends NetworkType<infer A> ? A : never;
	export type Output<T> =
		T extends NetworkSerializableType<infer _, infer A> ? A : T extends NetworkType<infer A> ? A : never;

	export function Serialize<TNetworkType extends NetworkSerializableType<any, any> | NetworkType<any>>(
		networkType: TNetworkType,
		value: Input<TNetworkType>,
	): Output<TNetworkType> {
		if (NetIsSerializer(networkType)) {
			return networkType.Serialize(value) as Output<TNetworkType>;
		} else {
			return value as Output<TNetworkType>;
		}
	}

	export function Deserialize<TNetworkType extends NetworkSerializableType<any, any> | NetworkType<any>>(
		networkType: TNetworkType,
		value: Output<TNetworkType>,
	): Input<TNetworkType> {
		if (NetIsSerializer(networkType)) {
			return networkType.Deserialize(value) as Input<TNetworkType>;
		} else {
			return value as Input<TNetworkType>;
		}
	}
}
export = NexusSerialization;
