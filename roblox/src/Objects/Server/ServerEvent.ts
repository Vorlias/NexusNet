import { Connection, NetworkPlayer } from "../../Core/Types/Dist";
import { ServerEventDeclaration } from "../../Core/Types/NetworkObjectModel";
import { ServerListenerEvent, ServerSenderEvent } from "../../Core/Types/Server/NetworkObjects";

export class ServerEvent<T extends ReadonlyArray<unknown>> implements ServerSenderEvent<T>, ServerListenerEvent<T> {
	constructor(
		private readonly name: string,
		declaration: ServerEventDeclaration<T>,
	) {}

	Connect(callback: (player: NetworkPlayer, ...args: T) => void): Connection {
		throw `TODO`;
	}

	SendToAllPlayers(...args: T): void {
		throw `TODO`;
	}

	SendToAllPlayersExcept(targetOrTargets: NetworkPlayer | Array<NetworkPlayer>, ...args: T): void {
		throw `TODO`;
	}

	SendToPlayer(target: NetworkPlayer, ...args: T): void {
		throw `TODO`;
	}

	SendToPlayers(targets: Array<NetworkPlayer>, ...args: T): void {
		throw `TODO`;
	}
}
