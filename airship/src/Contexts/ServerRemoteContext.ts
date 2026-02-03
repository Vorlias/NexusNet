import { Game } from "@Easy/Core/Shared/Game";
import { ClientRemoteContext, RemoteContext, ServerRemoteContext } from "../Core/Generators/RemoteContext";
import { FilterServerDeclarations } from "../Core/Types/Declarations";
import { InferServerRemote } from "../Core/Types/Inference";
import { RemoteDeclarations, ServerEventDeclaration } from "../Core/Types/NetworkObjectModel";
import { ServerEventLike } from "../Core/Types/Server/NetworkObjects";

export class AirshipServerRemoteContext<TDeclarations extends RemoteDeclarations>
	implements ServerRemoteContext<TDeclarations>
{
	private eventCache = new Map<string, ServerEventLike>();

	public constructor(declarations: TDeclarations) {
		if (Game.IsServer()) {
			this.Init();
		}
	}

	private Init() {}

	public Get<K extends keyof FilterServerDeclarations<TDeclarations> & string>(
		id: K,
	): InferServerRemote<TDeclarations[K]> {
		const cachedObject = this.eventCache.get(id);
		assert(cachedObject);
		return cachedObject as InferServerRemote<TDeclarations[K]>;
	}
}
