export type Identity<T> = T extends object
	? {} & {
			[P in keyof T]: T[P];
		}
	: T;

export type Split<S extends string, D extends string> = string extends S
	? Array<string>
	: S extends ""
		? []
		: S extends `${infer T}${D}${infer U}`
			? [T, ...Split<U, D>]
			: [S];

type Join<T extends readonly string[], Delim = ""> = T extends readonly [infer F, ...infer R]
	? //@ts-expect-error
		`${F}${Delim}${Join<R>}`
	: "";

export type Drop<T extends readonly unknown[], N extends number, Count extends unknown[] = []> =
	//@ts-expect-error
	Count["length"] extends N
		? T
		: T extends readonly [unknown, ...infer Rest]
			? Drop<Rest, N, [...Count, unknown]>
			: [];

export type MergeIdentity<T, U> = Identity<T & U>;
