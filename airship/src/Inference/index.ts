import { Player } from "@Easy/Core/Shared/Player/Player";
import { float32, float64, int16, int32, int8, uint16, uint32, uint8 } from "../Core/Buffers";
import { NetworkType, StaticNetworkType } from "../Core/Types/NetworkTypes";
import { NexusTypes } from "../Framework";
import Character from "@Easy/Core/Shared/Character/Character";
import Inventory from "@Easy/Core/Shared/Inventory/Inventory";
import inspect from "@Easy/Core/Shared/Util/Inspect";

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

	Player: Player;
	Character: Character;
	Inventory: Inventory;
	Identity: NetworkIdentity;

	// Team: Team;

	Color: Color;

	Vector2: Vector2;
	Vector3: Vector3;
	Vector4: Vector4;

	Quaternion: Quaternion;
}

const STRING_INFERENCE = {
	string: NexusTypes.String,
	number: NexusTypes.Number,
	boolean: NexusTypes.Boolean,

	int8: NexusTypes.Int8,
	int16: NexusTypes.Int16,
	int32: NexusTypes.Int32,

	uint8: NexusTypes.UInt8,
	uint16: NexusTypes.UInt16,
	uint32: NexusTypes.UInt32,

	float32: NexusTypes.Float32,
	float64: NexusTypes.Float64,

	Player: NexusTypes.Player,
	Identity: NexusTypes.Identity,
	Inventory: NexusTypes.Inventory,
	Character: NexusTypes.Character,

	Color: NexusTypes.Color,

	Vector2: NexusTypes.Vector2,
	Vector3: NexusTypes.Vector3,
	Vector4: NexusTypes.Vector4,

	Quaternion: NexusTypes.Quaternion,
} satisfies { [P in keyof CoreTypeInference]: StaticNetworkType<CoreTypeInference[P]> };

type StringTypes = keyof CoreTypeInference;

type ArrayProperty<K extends string = string> = `${K}[]`;
type SetProperty<K extends string = string> = `Set<${K}>`;
type MapProperty<K extends string = string, K2 extends string = string> = `Map<${K}, ${K2}>`;
type OptionalProperty<K extends string = string> = `${K}?`;

interface ArrayTypeNode<TNode extends TypeNode = TypeNode> {
	kind: "array";
	children: TNode;
}

interface UnionTypeNode<TLeftNode extends TypeNode = TypeNode, TRightNode extends TypeNode = TypeNode> {
	kind: "union";
	left: TLeftNode;
	right: TRightNode;
}

interface SetTypeNode<TNode extends TypeNode = TypeNode> {
	kind: "set";
	children: TNode;
}

interface MapTypeNode<TKeysNode extends TypeNode = TypeNode, TValuesNode extends TypeNode = TypeNode> {
	kind: "map";
	keys: TKeysNode;
	values: TValuesNode;
}

interface OptionalTypeNode<TNode extends TypeNode = TypeNode> {
	kind: "optional";
	children: TNode;
}

interface LiteralTypeNode<TValue extends string = string> {
	kind: "type";
	value: TValue;
}

type TypeNode = OptionalTypeNode | LiteralTypeNode | MapTypeNode | ArrayTypeNode | SetTypeNode | UnionTypeNode;

namespace TypeParser {
	export type Ast<def extends string> = def extends `(${infer child})`
		? Ast<child>
		: def extends `${infer child}?`
		? OptionalTypeNode<Ast<child>>
		: def extends `${infer child}[]` | `Array<${infer child}>`
		? ArrayTypeNode<Ast<child>>
		: def extends `Set<${infer child}>`
		? SetTypeNode<Ast<child>>
		: def extends `Map<${infer keys}, ${infer values}>`
		? MapTypeNode<Ast<keys>, Ast<values>>
		: // : def extends `${infer A} | ${infer B}`
		  // ? UnionTypeNode<Ast<A>, Ast<B>>
		  LiteralTypeNode<def>;

	type test = Ast<"string?[]">;

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
		: Extract<StringTypes, TDef>;

	export type Validate<TDef> = TDef extends string ? ValidateInner<TDef> : never;
	export type Instantiate<D> = never;
}

export function expressionToAst<const TDef extends string>(
	expression: TypeParser.Validate<TDef>,
): TypeParser.Ast<TDef> {
	let typeNode: TypeNode | undefined;
	let value = "";
	let i = 0;

	const createDefaultNode: (value: string) => TypeNode = () => {
		return {
			kind: "type",
			value,
		};
	};

	while (i < expression.size()) {
		const char = string.sub(expression, i + 1, i + 1);

		if (char === "?") {
			// wrap in optional node
			if (typeNode === undefined) typeNode = createDefaultNode(value);
			typeNode = {
				kind: "optional",
				children: typeNode,
			};
		} else if (char === "<") {
			if (value === "Map") {
				assert(false, "Map");
			} else if (value === "Set") {
				// TODO: Set
				assert(false, "Set");
			}
		} else if (char === "[") {
			const nextChar = string.sub(expression, i + 2, i + 2);
			assert(nextChar === "]");
			if (typeNode === undefined) typeNode = createDefaultNode(value);
			typeNode = {
				kind: "array",
				children: typeNode,
			};
			i += 2;
			continue;
		}

		value += char;
		i += 1;
	}

	if (typeNode === undefined) {
		typeNode = createDefaultNode(value);
	}

	assert(typeNode);
	return typeNode as TypeParser.Ast<TDef>;
}

type AstToNetworkType<T> = T extends LiteralTypeNode<infer Literal>
	? NetworkType<CoreTypeInference[Literal & keyof CoreTypeInference]>
	: never;
function test<const TDef extends string, TInst = TypeParser.Ast<TDef>>(
	value: TypeParser.Validate<TDef>,
): AstToNetworkType<TInst> {
	const ast = expressionToAst(value);
	if (ast.kind === "type") {
		// short-circuit
		return STRING_INFERENCE[ast.value as keyof typeof STRING_INFERENCE] as AstToNetworkType<TInst>;
	}

	throw `TODO`;
}

const t = test("string");
