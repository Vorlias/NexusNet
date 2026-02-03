import { NexusIsOptionalType } from "../CoreTypes";
import { NetworkType } from "../Types/NetworkTypes";

export const enum ValidateResult {
	Ok,
	ArgCountMismatch,
	ValidationError,
}

interface ArgumentLengthMismatchError {
	argCount: number;
	expectedCount: number;
}
interface ArgumentValidationError {
	index: number;
	message: string;
}

export function ValidateArguments(
	args: unknown[],
	networkTypes: NetworkType.Any[],
	skipValidation = false,
): LuaTuple<
	| [ValidateResult.Ok, undefined]
	| [ValidateResult.ArgCountMismatch, ArgumentLengthMismatchError]
	| [ValidateResult.ValidationError, ArgumentValidationError]
> {
	// check len
	let minArgCount = 0;
	for (const networkType of networkTypes) {
		if (NexusIsOptionalType(networkType)) continue;
		minArgCount += 1;
	}

	if (minArgCount > args.size()) {
		return $tuple(ValidateResult.ArgCountMismatch, {
			argCount: args.size(),
			expectedCount: minArgCount,
		} satisfies ArgumentLengthMismatchError);
	}

	if (!skipValidation) {
		for (let i = 0; i < args.size(); i++) {
			const arg = args[i];
			const argType = networkTypes[i];
			const validator = argType.Validation;

			if (!validator.Validate(arg)) {
				return $tuple(ValidateResult.ValidationError, {
					index: i,
					message: typeIs(validator.ValidateError, "function")
						? validator.ValidateError(argType, arg)
						: typeIs(validator.ValidateError, "string")
						? validator.ValidateError
						: `Invalid argument`,
				} satisfies ArgumentValidationError);
			}
		}
	}

	return $tuple(ValidateResult.Ok, void 0);
}
