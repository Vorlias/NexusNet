import {
	CrossServerEventDeclaration,
	NetworkModelConfiguration,
	ServerBuilder,
} from "../Core/Types/NetworkObjectModel";
import { StaticNetworkType } from "../Core/Types/NetworkTypes";

export class CrossServerEventBuilder<TArgs extends ReadonlyArray<unknown>>
	implements ServerBuilder<CrossServerEventDeclaration<TArgs>>
{
	arguments: StaticNetworkType[] = [];

	OnServer(configuration: NetworkModelConfiguration): CrossServerEventDeclaration<TArgs> {
		const declaration: CrossServerEventDeclaration<TArgs> = {
			Type: "Messaging",
			Arguments: [],
		};
		return table.freeze(declaration);
	}
}
