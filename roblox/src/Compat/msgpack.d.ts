export type binary<T extends object = object> = string & { readonly __nominal_BinaryString: unique symbol };

export function encode<T extends object>(value: T): binary<T>;
export function decode<T extends object>(value: binary<T>): T;
export function utf8Encode<T extends object>(value: binary<T>): string;
export function utf8Decode<T extends object>(value: string): binary<T>;
export as namespace msgpack;
