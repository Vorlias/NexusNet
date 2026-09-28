import { NOM } from "../NetworkObjectModel";
import { NetworkType } from "../Types/NetworkType";

export class NexusCrossServerEventBuilder<T extends unknown[]> implements NOM.ServerBuilder<
	NOM.CrossServerEventDeclaration<T>
> {
	public arguments: NetworkType.Any[] = [];

	OnServer(configuration: NOM.Config): NOM.CrossServerEventDeclaration<T> {
		return table.freeze({
			Type: "Messaging",
			Arguments: [],
		});
	}
}
