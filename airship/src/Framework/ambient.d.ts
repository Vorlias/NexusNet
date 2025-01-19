interface buffer {
	/**
	 * **DO NOT USE!**
	 *
	 * This field exists to force TypeScript to recognize this as a nominal type
	 * @hidden
	 * @deprecated
	 */
	readonly _nominal_buffer: unique symbol;
}

declare namespace buffer {
	/** Creates a buffer. */
	function create(size: number): buffer;

	/** Creates a buffer from a string. */
	function fromstring(str: string): buffer;

	/** Converts a buffer to a string. */
	function tostring(b: buffer): string;

	/** Returns the size of the buffer in bytes. */
	function len(b: buffer): number;

	/** Reads an 8-bit signed integer from the buffer. */
	function readi8(b: buffer, offset: number): number;

	/** Reads an 8-bit unsigned integer from the buffer. */
	function readu8(b: buffer, offset: number): number;

	/** Reads a 16-bit signed integer from the buffer. */
	function readi16(b: buffer, offset: number): number;

	/** Reads a 16-bit unsigned integer from the buffer. */
	function readu16(b: buffer, offset: number): number;

	/** Reads a 32-bit signed integer from the buffer. */
	function readi32(b: buffer, offset: number): number;

	/** Reads a 32-bit unsigned integer from the buffer. */
	function readu32(b: buffer, offset: number): number;

	/** Reads a 32-bit floating-point value from the buffer. */
	function readf32(b: buffer, offset: number): number;

	/** Reads a 64-bit floating-point value from the buffer. */
	function readf64(b: buffer, offset: number): number;

	/** Writes an 8-bit signed integer to the buffer. */
	function writei8(b: buffer, offset: number, value: number): void;

	/** Writes an 8-bit unsigned integer to the buffer. */
	function writeu8(b: buffer, offset: number, value: number): void;

	/** Writes a 16-bit signed integer to the buffer. */
	function writei16(b: buffer, offset: number, value: number): void;

	/** Writes a 16-bit unsigned integer to the buffer. */
	function writeu16(b: buffer, offset: number, value: number): void;

	/** Writes a 32-bit signed integer to the buffer. */
	function writei32(b: buffer, offset: number, value: number): void;

	/** Writes a 32-bit unsigned integer to the buffer. */
	function writeu32(b: buffer, offset: number, value: number): void;

	/** Writes a 32-bit floating-point value to the buffer. */
	function writef32(b: buffer, offset: number, value: number): void;

	/** Writes a 64-bit floating-point value to the buffer. */
	function writef64(b: buffer, offset: number, value: number): void;

	/** Reads a string from the buffer. */
	function readstring(b: buffer, offset: number, count: number): string;

	/** Writes a string to the buffer. */
	function writestring(b: buffer, offset: number, value: string, count?: number): void;

	/** Copies bytes between buffers. */
	function copy(target: buffer, targetOffset: number, source: buffer, sourceOffset?: number, count?: number): void;

	/** Sets a region of the buffer memory to some 8-bit unsigned integer value. */
	function fill(b: buffer, offset: number, value: number, count?: number): void;
}
