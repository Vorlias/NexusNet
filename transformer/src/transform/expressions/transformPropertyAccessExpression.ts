import ts from "typescript";
import { transformNode } from "../transformNode";
import { TransformState } from "../../class/TransformState";

export function transformPropertyAccessExpression(
	state: TransformState,
	node: ts.PropertyAccessExpression,
): ts.Expression {
	const symbol = state.getSymbol(node.expression);
	if (symbol !== undefined) {
		const macro = state.getPropertyMacro(symbol);
		if (macro) {
			return macro.transform(state, node, { symbol, symbols: [symbol] });
		}
	}

	return ts.visitEachChild(node, (node) => transformNode(state, node), state.context);
}
