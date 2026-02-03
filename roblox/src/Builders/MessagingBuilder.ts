import {
	CrossServerEventDeclaration,
	NetworkModelConfiguration,
	ServerBuilder,
} from "../Core/Types/NetworkObjectModel";
import { StaticNetworkType } from "../Core/Types/NetworkTypes";

export class ExperienceEventBuilder<TArgs extends ReadonlyArray<unknown>>
	implements ServerBuilder<CrossServerEventDeclaration<TArgs>>
{
	arguments: StaticNetworkType[] = [];

	OnServer(configuration: NetworkModelConfiguration): CrossServerEventDeclaration<TArgs> {
		const declaration: CrossServerEventDeclaration<TArgs> = {
			Type: "Messaging",
			Arguments: this.arguments,
		};
		return table.freeze(declaration);
	}
}
