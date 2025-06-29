import assert from "assert";
import { TransformState } from "../../class/TransformState";
import { CallMacro, MacroInfo } from "../macro";
import ts, { factory } from "typescript";

export const ServerEvent: CallMacro = {
    getSymbol(state: TransformState) {
        const symbol = state.nexusNet.nexusXBuilder.get("ServerEvent");
        assert(symbol, "Could not find debug macro symbol");
        return symbol;
    },
    transform(state: TransformState, node: ts.CallExpression, { symbol }: MacroInfo) {
        console.log("hi");
        return node;
    },
};
