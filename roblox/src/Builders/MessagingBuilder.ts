import {
	CrossServerEventDeclaration,
	NetworkModelConfiguration,
	ServerBuilder,
} from "../Core/Types/NetworkObjectModel";

export class ExperienceEventBuilder<TArgs extends ReadonlyArray<unknown>>
	implements ServerBuilder<CrossServerEventDeclaration<TArgs>>
{
	OnServer(configuration: NetworkModelConfiguration): CrossServerEventDeclaration<TArgs> {
		const declaration: CrossServerEventDeclaration<TArgs> = {
			Type: "Messaging",
		};
		return table.freeze(declaration);
	}
}
