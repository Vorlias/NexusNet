import { CallMacro } from "../macro";
import { BuildObjectModel } from "./BuildObjectModel";
import { ServerEvent } from "./ServerEvent";

export const CALL_MACROS = new Array<CallMacro>(
    BuildObjectModel,
    ServerEvent,
);
