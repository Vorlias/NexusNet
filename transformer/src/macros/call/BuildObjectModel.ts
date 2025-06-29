import assert from "assert";
import { TransformState } from "../../class/TransformState";
import { CallMacro, MacroInfo } from "../macro";
import ts, { factory } from "typescript";

export const BuildObjectModel: CallMacro = {
	getSymbol(state: TransformState) {
		const symbol = state.nexusNet.nexusXNamespace.get("BuildObjectModel");
		assert(symbol, "Could not find debug macro symbol");
		return symbol;
	},
	transform(state: TransformState, node: ts.CallExpression, { symbol }: MacroInfo) {
		// return factory.createCallExpression(
        //     factory.createPropertyAccessExpression(factory.createIdentifier("Nexus"), "BuildObjectModel"),
        //     undefined,
        //     []
        // );
		return node;
	},
};
