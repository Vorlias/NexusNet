import { NetworkSerialization, NetworkTypeSerialization } from "../Serialization";
import { NexusArray, NexusMap, NexusSet } from "./CollectionTypes";
import { NexusNullable } from "./ModifierTypes";
import { float64, NetworkEncoder, NetworkEncoding } from "./NetworkEncoding";
import {
	NexusString,
	NexusInt8,
	NexusInt16,
	NexusInt32,
	NexusUInt8,
	NexusUInt16,
	NexusSingle,
	NexusDouble,
	NexusUInt32,
	NexusBool,
} from "./PrimitiveTypes";
import { NexusColor3, NexusInstanceHandleOf, NexusPlayer, NexusUserType, NexusVector } from "./RobloxTypes";
import { Identity } from "./Utility";

export interface NetworkType<T, E = T> {
	readonly Encoding: NetworkEncoder<E>;
	readonly Flags: NetworkTypeFlags;
}

export const enum NetworkTypeFlags {
	None = 0,
	/** @internal */
	NoBufferEncoding = 1 << 0,
}

export namespace NetworkType {
	export type Any = NetworkType<any>;
	export type Unknown = NetworkType<unknown>;
	export type Defined = NetworkType<defined>;
	export type OfType<T, U = any> = NetworkType<T, U> | Serializable<T, U>;

	export type ToTypeArray<T> = { -readonly [P in keyof T]: OfType<T[P]> };

	export interface Serializable<TIn, TOut, TEnc = TOut> extends NetworkType<TIn, TEnc> {
		readonly Serializer: NetworkTypeSerialization<TIn, TOut>;
	}

	export interface ArrayOf<T> extends Serializable<In<T>[], Out<T>[]> {}
	export interface MapOf<K, V> extends Serializable<Map<In<K>, In<V>>, readonly [Out<K>, Out<V>][]> {}
	export interface SetOf<V> extends Serializable<Set<In<V>>, readonly Out<V>[]> {}

	export type In<T> =
		T extends NetworkType.Serializable<infer A, infer _> ? A : T extends NetworkType<infer A> ? A : never;

	export type Out<T> =
		T extends NetworkType.Serializable<infer _, infer A> ? A : T extends NetworkType<infer _, infer A> ? A : never;

	export type InPropTypes<T> = Identity<{ [P in keyof T]: In<T[P]> }>;
	export type OutPropTypes<T> = Identity<{ [P in keyof T]: Out<T[P]> }>;

	// Primitive Declarations
	export const String = NexusString;
	export const Number = NexusSingle;
	export const Integer = NexusInt32;

	export const Int8 = NexusInt8;
	export const Int16 = NexusInt16;
	export const Int32 = NexusInt32;

	export const UInt32 = NexusUInt32;
	export const UInt16 = NexusUInt16;
	export const UInt8 = NexusUInt8;

	// Type Declarations
	export const Player = NexusPlayer;
	export const User = NexusUserType;
	export const Color3 = NexusColor3;
	export const Vector3 = NexusVector;
	export const InstanceOf = NexusInstanceHandleOf;

	// Modifier type declarations
	export const Nullable = NexusNullable;
	export const Array = NexusArray;
	export const Set = NexusSet;
	export const Map = NexusMap;
}
