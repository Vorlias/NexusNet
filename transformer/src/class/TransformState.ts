import ts from "typescript";
import { TransformConfiguration } from "../types";
import { LoggerProvider } from "./logProvider";
import { NexusNetXProvider } from "./NexusNetSymbols";
import { DistribInfo } from "../utils/typescript-version";
import { CALL_MACROS } from "../macros/call";
import { CallMacro, PropertyMacro } from "../macros/macro";
import { PROPERTY_MACROS } from "../macros/property";

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

		for (const macro of PROPERTY_MACROS) {
			const symbols = macro.getSymbol(this);
			if (Array.isArray(symbols)) {
				for (const symbol of symbols) {
					this.propertyMacros.set(symbol, macro);
				}
			} else {
				this.propertyMacros.set(symbols, macro);
				console.log("register sym", symbols.id)
			}
		}
	}

	public pushImport() {}

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
