import { ClientListenerEvent, ClientSenderEvent } from "../../Core/Types/Client/NetworkObjects";
import { Connection } from "../../Core/Types/Dist";
import { ClientEventDeclaration } from "../../Core/Types/NetworkObjectModel";

export class ClientEvent<T extends ReadonlyArray<unknown>> implements ClientSenderEvent<T>, ClientListenerEvent<T> {
	constructor(
		private readonly name: string,
		declaration: ClientEventDeclaration<T>,
	) {}

	Connect(callback: (...args: T) => void): Connection {
		throw `TODO`;
	}
	SendToServer(...args: T): void {}
}
