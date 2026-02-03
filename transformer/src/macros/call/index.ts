import { CallMacro } from "../macro";
import { RegisterType } from "./CreateType";
import { EventMacro } from "./Events";

export const CALL_MACROS = new Array<CallMacro>(
    // BuildObjectModel,
    // ServerEvent,
    EventMacro,
    RegisterType,
);
