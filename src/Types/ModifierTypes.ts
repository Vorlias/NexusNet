import { NetworkType } from "./NetworkType";
import { NetworkEncoding } from "./NetworkEncoding";

export function NexusNullable<T extends defined>(nt: NetworkType<T>): NetworkType<T | undefined> {
    return {
        Encoding: NetworkEncoding.Nullable(nt.Encoding),
        Flags: nt.Flags,
    };
}
