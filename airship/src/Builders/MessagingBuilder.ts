import {
	CrossServerEventDeclaration,
	NetworkModelConfiguration,
	ServerBuilder,
} from "../Core/Types/NetworkObjectModel";
import { NetworkType } from "../Core/Types/NetworkTypes";

export class CrossServerEventBuilder<TArgs extends ReadonlyArray<unknown>>
	implements ServerBuilder<CrossServerEventDeclaration<TArgs>>
{
	arguments: NetworkType.Any[] = [];

	OnServer(configuration: NetworkModelConfiguration): CrossServerEventDeclaration<TArgs> {
		const declaration: CrossServerEventDeclaration<TArgs> = {
			Type: "Messaging",
			Arguments: [],
			UseBuffer: true,
		};
		return table.freeze(declaration);
	}
}
