export type Collection<T> = ReadonlySet<T> | ReadonlyArray<T>;
export namespace NexusCollectionUtils {
	export function IsSetLike<T extends defined>(possibleSet: object): possibleSet is ReadonlySet<T> {
		const [key, value] = next(possibleSet);
		return typeIs(key, "table") && typeIs(value, "boolean");
	}

	export function IsArrayLike<T extends defined>(possibleArray: object): possibleArray is ReadonlyArray<T> {
		const [key] = next(possibleArray);
		const [key2] = next(possibleArray, key);

		// only numeric indices
		return typeIs(key, "number") && typeIs(key2, "nil");
	}
}
