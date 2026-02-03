// export interface SyncArray<T> extends Array<T> {}
// interface SyncArrayConstructor {
// 	new <T>(networkType: NetworkType.OfType<T>): Array<T>;
// }

// const SyncArrayConstructor = {
// 	new: <T>(nt: StaticNetworkType<T>): Array<T> & SyncArray<T> => {
// 		const obj = new Array<T>();
// 		return setmetatable(obj, {});
// 	},
// } as unknown as SyncArrayConstructor;

// export const SyncArray = SyncArrayConstructor;

// const test = new SyncArray(NexusTypes.String);
// test.push("Hello, World!");
