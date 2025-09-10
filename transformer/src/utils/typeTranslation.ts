import { factory } from "typescript";

type IntegerBits = 8 | 16 | 32;
type FloatBits = 32 | 64;

export function createLiteralNexusTypeExpression(
	networkTypeId:
		| "String"
		| "Number"
		| "Boolean"
		| `Int${IntegerBits}`
		| `UInt${IntegerBits}`
		| `Float${FloatBits}`
		| `Identity`,
) {
	return factory.createPropertyAccessExpression(
		factory.createPropertyAccessExpression(factory.createIdentifier("NexusX"), factory.createIdentifier("Types")),
		factory.createIdentifier(networkTypeId),
	);
}
