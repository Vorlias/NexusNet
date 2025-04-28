import { NetworkType, StaticNetworkType } from "../Core/Types/NetworkTypes";
import { NexusTypes } from "../Framework";

export interface SyncArray<T> extends Array<T> {}
interface SyncArrayConstructor {
	new <T>(networkType: StaticNetworkType<T>): Array<T>;
}

const SyncArrayConstructor = {
	new: <T>(nt: StaticNetworkType<T>): Array<T> & SyncArray<T> => {
		const obj = new Array<T>();
		return setmetatable(obj, {});
	},
} as unknown as SyncArrayConstructor;

export const SyncArray = SyncArrayConstructor;

const test = new SyncArray(NexusTypes.String);
test.push("Hello, World!");
