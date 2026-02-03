import assert from "assert";
import ts, { factory } from "typescript";
import { TransformState } from "../../class/TransformState";
import { CallMacro, MacroInfo } from "../macro";

export const EventMacro: CallMacro = {
	id: "serverEvent",
	getSymbol(state: TransformState) {
		const symbol = state.nexusNet.nexusXNamespace.get("Event");
		assert(symbol, "Could not find ServerEvent macro symbol");
		return symbol;
	},
	transform(state: TransformState, node: ts.CallExpression, { symbol }: MacroInfo) {
		const args = node.typeArguments?.[0];

		if (args && ts.isTupleTypeNode(args)) {
			const elements = args.elements;

			return factory.createCallExpression(
				factory.createPropertyAccessExpression(
					factory.createPropertyAccessExpression(
						factory.createIdentifier("NexusX"),
						factory.createIdentifier("Framework"),
					),
					factory.createIdentifier("Event"),
				),
				undefined,
				state.tupleTypesToRuntimeTypeExpressions(elements),
			);
		} else {
			return node;
		}
	},
};
