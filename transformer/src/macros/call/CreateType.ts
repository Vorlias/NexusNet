import assert from "assert";
import ts, { factory } from "typescript";
import { TransformState } from "../../class/TransformState";
import { CallMacro, MacroInfo } from "../macro";

export const RegisterType: CallMacro = {
	id: "serverEvent",
	getSymbol(state: TransformState) {
		const symbol = state.nexusNet.nexusXNamespace.get("RegisterType");
		assert(symbol, "Could not find RegisterType macro symbol");
		return symbol;
	},
	transform(state: TransformState, node: ts.CallExpression, { symbol }: MacroInfo) {
        // const signature = state.typeChecker.getResolvedSignature(node);
        // const retType = signature?.getTypeParameterAtPosition(0);
        // if (!retType) throw `invalid`;
        
        // const id = retType.id;

		// const userTypes = factory.createPropertyAccessExpression(
		// 		factory.createIdentifier("NexusX"),
		// 		factory.createIdentifier("UserTypes"),
		// 	);
        
        // return factory.createAssignment(
		// 	factory.createPropertyAccessExpression(userTypes, state.typeChecker.typeToString(retType)),
		// 	node.arguments[0],
		// );
        return factory.createVoidZero();
	},
};
