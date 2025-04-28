import { float32, float64, int16, int32, int8, uint16, uint32, uint8 } from "../../Buffers";

interface CoreTypeInference {
	string: string;
	number: number;
	boolean: boolean;

	int8: int8;
	int16: int16;
	int32: int32;

	uint8: uint8;
	uint16: uint16;
	uint32: uint32;

	float32: float32;
	float64: float64;
}

type StringTypes = keyof CoreTypeInference;

type ArrayProperty<K extends string = string> = `${K}[]`;
type SetProperty<K extends string = string> = `Set<${K}>`;
type MapProperty<K extends string = string, K2 extends string = string> = `Map<${K}, ${K2}>`;
type OptionalProperty<K extends string = string> = `${K}?`;

namespace TypeParser {
	export type parse<def extends string> = def extends `(${infer child})`
		? parse<child>
		: def extends `${infer child}?`
			? {
					kind: "optional";
					children: parse<child>;
				}
			: def extends `${infer child}[]` | `Array<${infer child}>`
				? { kind: "array"; children: parse<child> }
				: def extends `Set<${infer child}>`
					? { kind: "set"; children: parse<child> }
					: def extends `Map<${infer keys}, ${infer values}>`
						? {
								kind: "map";
								keys: parse<keys>;
								values: parse<values>;
							}
						: { kind: "type"; value: def };

	type test = parse<"string?[]">;

	type ValidateInner<TDef> = TDef extends ""
		? StringTypes
		: TDef extends `(${infer _})`
			? ValidateInner<_>
			: TDef extends OptionalProperty<infer _>
				? `${ValidateInner<_>}?`
				: TDef extends "Array" | ArrayProperty<infer A> | `${infer A}[`
					? ArrayProperty<ValidateInner<A>>
					: TDef extends SetProperty<infer V>
						? SetProperty<ValidateInner<V>>
						: TDef extends MapProperty<infer K, infer V>
							? MapProperty<ValidateInner<K>, ValidateInner<V>>
							:
									| Extract<StringTypes, TDef>
									| OptionalProperty<StringTypes>
									| ArrayProperty<StringTypes>
									// | ArrayProperty<OptionalProperty<StringTypes>>
									| SetProperty<StringTypes>
									| MapProperty<StringTypes, StringTypes>;

	export type Validate<TDef> = TDef extends string ? ValidateInner<TDef> : never;
	export type Instantiate<D> = never;
}
