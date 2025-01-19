import { ClientListenerEvent, ClientSenderEvent } from "@Vorlias/Net/Core/Types/Client/NetworkObjects";
import { Connection } from "@Vorlias/Net/Core/Types/Dist";
import { NetworkedEvent } from "../Internal/NetworkEvent";
import { ClientEventDeclaration } from "@Vorlias/Net/Core/Types/NetworkObjectModel";
import { AirshipScriptConnection } from "../NetConnection";
import { StaticNetworkType } from "@Vorlias/Net/Core/Types/NetworkTypes";
import { ClientCallbackMiddleware } from "@Vorlias/Net/Core/Middleware/Types";
import { ParseClientInvokeArgs } from "@Vorlias/Net/Core/Serialization/InvokeHandlers";
import { CreateClientEventCallback } from "@Vorlias/Net/Core/Serialization/CallbackHandlers";

export class ClientEvent<T extends Array<unknown>> implements ClientSenderEvent<T>, ClientListenerEvent<T> {
	private instance: NetworkedEvent;
	private argumentHandlers?: StaticNetworkType<any>[];
	private useBuffers = false;
	private callbackMiddleware: ClientCallbackMiddleware[];

	constructor(private readonly name: string, declaration: ClientEventDeclaration<T>) {
		this.instance = new NetworkedEvent(name);
		this.argumentHandlers = declaration.Arguments;
		this.useBuffers = declaration.UseBufferSerialization;
		this.callbackMiddleware = declaration.CallbackMiddleware as ClientCallbackMiddleware[];
	}

	public Connect(callback: (...args: T) => void): Connection {
		return new AirshipScriptConnection(
			this.instance.OnServerEvent(
				CreateClientEventCallback({
					UseBuffers: this.useBuffers,
					NetworkTypes: this.argumentHandlers ?? [],
					Callback: callback,
					CallbackMiddleware: this.callbackMiddleware,
				}),
			),
		);
	}

	public SendToServer(...args: T): void {
		const serializedArgs = ParseClientInvokeArgs(this.useBuffers, this.argumentHandlers ?? [], [], args);
		if (!serializedArgs) return;

		return this.instance.FireServer(...serializedArgs);
	}
}
