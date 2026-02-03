import ts from "typescript";
import { transformNode } from "./transformNode";
import { TransformState } from "../class/TransformState";


export function transformStatement(state: TransformState, statement: ts.Statement): ts.Statement {
	return ts.visitEachChild(statement, (newNode) => transformNode(state, newNode), state.context);
}
