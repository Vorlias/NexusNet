import { NetworkSerialization } from "../Serialization";
import { NetworkEncoder, NetworkEncoding } from "./NetworkEncoding";
import { NetworkType } from "./NetworkType";
import { NexusString } from "./PrimitiveTypes";
import { NexusPlayer } from "./RobloxTypes";

type ArrayIn<T extends defined> = Array<NetworkType.In<T> & defined>;
type ArrayOut<T extends defined> = Array<NetworkType.Out<T> & defined>;

export type NexusArray<T extends NetworkType.Defined> = NetworkType.Serializable<ArrayIn<T>, ArrayOut<T>>;
export function NexusArray<TType extends NetworkType.Defined>(valueType: TType) {
    return {
        Encoding: NetworkEncoding.Array(valueType.Encoding) as NetworkEncoder<ArrayOut<TType>>,
        Serializer: {
            Serialize(value) {
                return value.map(v => NetworkSerialization.Serialize(valueType, v)) as ArrayOut<TType>;
            },
            Deserialize(value) {
                return value.map(v => NetworkSerialization.Deserialize(valueType, v)) as ArrayIn<TType>;
            },
        },
        Flags: 0,
    } satisfies NetworkType.Serializable<ArrayIn<TType>, ArrayOut<TType>>;
}

export type NexusMap<KType, VType> = NetworkType.Serializable<Map<NetworkType.In<KType>, NetworkType.In<VType>>, ReadonlyArray<[NetworkType.Out<KType>, NetworkType.Out<VType>]>>
export function NexusMap<K extends NetworkType.Defined, V extends NetworkType.Unknown>(keyType: K, valueType: V): NexusMap<K, V> {
    return {
        Encoding: NetworkEncoding.Array(NetworkEncoding.FixedArray(keyType.Encoding, valueType.Encoding)) as NetworkEncoder<[]>,
        Serializer: {
            Serialize(map) {
                const arr = new Array<[NetworkType.Out<K>, NetworkType.Out<V>]>();

                for (const [k, v] of map) {
                    arr.push([NetworkSerialization.Serialize(keyType, k), NetworkSerialization.Serialize(valueType, v)]);
                }

                return arr;
            },
            Deserialize(value) {
                const map = new Map<NetworkType.In<K>, NetworkType.In<V>>();

                for (const [k, v] of value) {
                    map.set(NetworkSerialization.Deserialize(keyType, k), NetworkSerialization.Deserialize(valueType, v));
                }

                return map;
            }
        },
        Flags: 0,
    };
}

export type NexusSet<VType> = NetworkType.Serializable<Set<NetworkType.In<VType>>, ReadonlyArray<NetworkType.Out<VType>>>;
export function NexusSet<V extends NetworkType.Defined>(valueType: V): NexusSet<V> {
    return {
        Encoding: NetworkEncoding.Array(valueType.Encoding) as NetworkEncoder<[]>,
        Serializer: {
            Serialize(set) {
                const arr = new Array<NetworkType.Out<V>>();
                for (const entry of set) {
                    arr.push(NetworkSerialization.Serialize(valueType, entry));
                }
                return arr;
            },
            Deserialize(arr) {
                const set = new Set<NetworkType.In<V>>();
                for (const value of arr) {
                    set.add(NetworkSerialization.Deserialize(valueType, value));
                }
                return set;
            }
        },
        Flags: 0,
    }
}


