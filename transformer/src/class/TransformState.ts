import ts, { factory } from "typescript";
import { TransformConfiguration } from "../types";
import { LoggerProvider } from "./logProvider";
import { NexusNetXProvider } from "./NexusNetSymbols";
import { DistribInfo } from "../utils/typescript-version";
import { CALL_MACROS } from "../macros/call";
import { CallMacro, PropertyMacro } from "../macros/macro";
import { PROPERTY_MACROS } from "../macros/property";
import { createLiteralNexusTypeExpression } from "../utils/typeTranslation";

export class TransformState {
	private callMacros = new Map<ts.Symbol, CallMacro>();
	private propertyMacros = new Map<ts.Symbol, PropertyMacro>();

	public readonly typeChecker: ts.TypeChecker;

	public readonly options = this.program.getCompilerOptions();
	public readonly srcDir = this.options.rootDir ?? this.program.getCurrentDirectory();

	public constructor(
		public readonly program: ts.Program,
		public readonly context: ts.TransformationContext,
		public readonly config: TransformConfiguration,
		public readonly logger: LoggerProvider,
		public readonly distrib: DistribInfo,
		public readonly nexusNet: NexusNetXProvider,
	) {
		this.typeChecker = program.getTypeChecker();

		this.initMacros();
	}

	private initMacros() {
		for (const macro of CALL_MACROS) {
			const symbols = macro.getSymbol(this);
			if (Array.isArray(symbols)) {
				for (const symbol of symbols) {
					this.callMacros.set(symbol, macro);
				}
			} else {
				this.callMacros.set(symbols, macro);
			}
		}

		// for (const macro of PROPERTY_MACROS) {
		// 	const symbols = macro.getSymbol(this);
		// 	if (Array.isArray(symbols)) {
		// 		for (const symbol of symbols) {
		// 			this.propertyMacros.set(symbol, macro);
		// 		}
		// 	} else {
		// 		this.propertyMacros.set(symbols, macro);
		// 		console.log("register sym", symbols.id)
		// 	}
		// }
	}

	public pushImport() {}

	private inferTypeFromTypeNode(typeNode: ts.TypeNode): ts.Expression {
		const type = this.typeChecker.getTypeAtLocation(typeNode);

		if (typeNode.kind === ts.SyntaxKind.StringKeyword) {
			return createLiteralNexusTypeExpression("String");
		} else if (typeNode.kind === ts.SyntaxKind.NumberKeyword) {
			return createLiteralNexusTypeExpression("Number");
		} else if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) {
			return createLiteralNexusTypeExpression("Boolean");
		} else if (ts.isTypeReferenceNode(typeNode)) {
			if (ts.isIdentifier(typeNode.typeName)) {
				// TODO: Smarter symbol stuff here :-)
				switch (typeNode.typeName.text) {
					case "int8":
						return createLiteralNexusTypeExpression("Int8");
					case "int16":
						return createLiteralNexusTypeExpression("Int16");
					case "int32":
						return createLiteralNexusTypeExpression("Int32");
					case "uint8":
						return createLiteralNexusTypeExpression("UInt8");
					case "uint16":
						return createLiteralNexusTypeExpression("UInt16");
					case "uint32":
						return createLiteralNexusTypeExpression("UInt32");
					case "float32":
						return createLiteralNexusTypeExpression("Float32");
					case "float64":
						return createLiteralNexusTypeExpression("Float64");
					case "NetworkIdentity":
						return createLiteralNexusTypeExpression("Identity");
				}
			}
		}

		throw `Missing handler for ${ts.SyntaxKind[typeNode.kind]}`;
	}

	public tupleTypesToRuntimeTypeExpressions(
		elements: ts.NodeArray<ts.TypeNode | ts.NamedTupleMember>,
	): ts.Expression[] {
		const expressions = new Array<ts.Expression>();

		for (const element of elements) {
			if (ts.isNamedTupleMember(element)) {
				expressions.push(this.inferTypeFromTypeNode(element.type));
			} else if (ts.isTypeNode(element)) {
				expressions.push(this.inferTypeFromTypeNode(element));
			}
		}

		return expressions;
	}

	public getCallMacro(symbol: ts.Symbol): CallMacro | undefined {
		return this.callMacros.get(symbol);
	}

	public getPropertyMacro(symbol: ts.Symbol): PropertyMacro | undefined {
		return this.propertyMacros.get(symbol);
	}

	public getSymbol(node: ts.Node, followAlias = true): ts.Symbol | undefined {
		const symbol = this.typeChecker.getSymbolAtLocation(node);

		if (symbol && followAlias) {
			return ts.skipAlias(symbol, this.typeChecker);
		} else {
			return symbol;
		}
	}

	private prereqStack = new Array<Array<ts.Statement>>();
	public capture<T>(cb: () => T): [T, ts.Statement[]] {
		this.prereqStack.push([]);
		const result = cb();
		return [result, this.prereqStack.pop()!];
	}
}
