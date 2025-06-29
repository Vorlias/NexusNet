import ts from "typescript";
import { transformStatement } from "./transformStatement";
import { TransformState } from "../class/TransformState";
import { transformExpression } from "./transformExpression";

export function transformNode(state: TransformState, node: ts.Node): ts.Node | ts.Statement[] {
	if (ts.isExpression(node)) {
		return transformExpression(state, node);
	} else if (ts.isStatement(node)) {
		return transformStatement(state, node);
	}

	return ts.visitEachChild(node, (newNode) => transformNode(state, newNode), state.context);
}
