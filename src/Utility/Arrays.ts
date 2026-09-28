/**
 * Creates a slice of an array, similar to JavaScript's `Array.slice`
 * @param array The array
 * @param start The start index
 * @param endPos The end index
 * @internal
 */
export function ArraySlice<TValue extends defined>(array: ReadonlyArray<TValue>, start = 0, endPos = array.size()) {
	if (start < 0) {
		start = math.max(0, array.size() + start);
	}

	if (endPos < 0) {
		endPos = math.max(0, array.size() + endPos);
	}

	const newArray = array.move(start, endPos - 1, 0, []);

	return newArray;
}
