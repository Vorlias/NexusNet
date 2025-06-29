import assert from "assert";
import { TransformState } from "../../class/TransformState";
import { PropertyMacro } from "../macro";
import ts from "typescript";

export const ServerEvent: PropertyMacro = {
    getSymbol(state: TransformState) {
        const symbol = state.nexusNet.nexusXBuilder.get("ServerEvent");
        assert(symbol, "Could not find debug macro symbol");
        return symbol;
    },
    transform(state: TransformState, node: ts.PropertyAccessExpression | ts.ElementAccessExpression) {
        console.log("hi");
        return node;
    },
};
