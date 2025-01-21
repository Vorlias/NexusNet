/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientCallbackMiddleware } from "../../Core/Middleware/Types";
import { CreateClientEventCallback } from "../../Core/Serialization/CallbackHandlers";
import { ParseClientInvokeArgs } from "../../Core/Serialization/InvokeHandlers";
import { ClientListenerEvent, ClientSenderEvent } from "../../Core/Types/Client/NetworkObjects";
import { Connection } from "../../Core/Types/Dist";
import { ClientEventDeclaration } from "../../Core/Types/NetworkObjectModel";
import { StaticNetworkType } from "../../Core/Types/NetworkTypes";
import { RemotesFolder } from "../../Internal";
import { GetRbxNetEventId } from "../Internal/InternalId";

export class ClientEvent<T extends Array<unknown>> implements ClientSenderEvent<T>, ClientListenerEvent<T> {
	private instance: RemoteEvent<Callback>;

	private argumentHandlers?: StaticNetworkType<any>[];
	private useBuffers = false;
	private callbackMiddleware: ClientCallbackMiddleware[];

	constructor(
		private readonly name: string,
		declaration: ClientEventDeclaration<T>,
	) {
		const id = string.format("%.X", GetRbxNetEventId(name));
		const object = RemotesFolder.WaitForChild(id);
		assert(object.IsA("RemoteEvent"));
		this.instance = object;

		this.argumentHandlers = declaration.Arguments;
		this.useBuffers = declaration.UseBufferSerialization;
		this.callbackMiddleware = declaration.CallbackMiddleware as ClientCallbackMiddleware[];
	}

	Connect(callback: (...args: T) => void): Connection {
		return this.instance.OnClientEvent.Connect(
			CreateClientEventCallback({
				Callback: callback,
				UseBuffers: this.useBuffers,
				NetworkTypes: this.argumentHandlers ?? [],
				CallbackMiddleware: this.callbackMiddleware,
			}),
		);
	}

	SendToServer(...args: T): void {
		const serializedArgs = ParseClientInvokeArgs(this.useBuffers, this.argumentHandlers ?? [], [], args);
		if (!serializedArgs) return;

		this.instance.FireServer(...serializedArgs);
	}
}
