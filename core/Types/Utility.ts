export type Named<K extends string, T> = { [P in K]: T };
export type Identity<T> = T extends object
	? {} & {
			[P in keyof T]: T[P];
		}
	: T;
export type MergeIdentity<T, U> = Identity<T & U>;
