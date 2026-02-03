export type Named<K extends string, T> = { [P in K]: T };
export type Identity<T> = T extends object
	? {} & {
			[P in keyof T]: T[P];
	  }
	: T;
export type MergeIdentity<T, U> = Identity<T & U>;

export function isArrayLike<T extends object>(value: ReadonlyArray<T> | ReadonlySet<T>): value is readonly T[] {
	const [k, v] = next(value);
	if (typeIs(k, "number")) {
		return true;
	}

	return false;
}

export function isSetLike<T>(value: ReadonlyArray<T> | ReadonlySet<T>): value is ReadonlySet<T> {
	const [_, v] = next(value);
	return typeIs(v, "boolean");
}
