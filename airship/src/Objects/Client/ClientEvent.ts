import { ClientListenerEvent, ClientSenderEvent } from "@Vorlias/NexusNet/Core/Types/Client/NetworkObjects";
import { Connection, NetworkPlayer } from "@Vorlias/NexusNet/Core/Types/Dist";
import { NetworkedEvent } from "../Internal/NetworkEvent";
import { ClientEventDeclaration, NetworkingFlags } from "@Vorlias/NexusNet/Core/Types/NetworkObjectModel";
import { AirshipScriptConnection } from "../NetConnection";
import { StaticNetworkType } from "@Vorlias/NexusNet/Core/Types/NetworkTypes";
import { ClientCallbackMiddleware, ClientInvokeMiddleware } from "@Vorlias/NexusNet/Core/Middleware/Types";
import { ParseClientInvokeArgs, ParseServerInvokeArgs } from "@Vorlias/NexusNet/Core/Serialization/InvokeHandlers";
import { CreateClientEventCallback } from "@Vorlias/NexusNet/Core/Serialization/CallbackHandlers";

export class ClientEvent<T extends Array<unknown> = unknown[]> implements ClientSenderEvent<T>, ClientListenerEvent<T> {
	private instance: NetworkedEvent;
	private argumentHandlers?: StaticNetworkType<any>[];
	private useBuffers = false;
	private argCountCheck: boolean;

	private callbackMiddleware: ClientCallbackMiddleware[];
	private invokeMiddleware: ClientInvokeMiddleware[];

	constructor(private readonly name: string, declaration: ClientEventDeclaration<T>) {
		this.instance = new NetworkedEvent(name);
		this.argumentHandlers = declaration.Arguments;
		this.useBuffers = (declaration.Flags & NetworkingFlags.UseBufferSerialization) !== 0;
		this.callbackMiddleware = declaration.CallbackMiddleware as ClientCallbackMiddleware[];
		this.argCountCheck = (declaration.Flags & NetworkingFlags.EnforceArgumentCount) !== 0;
		this.invokeMiddleware = declaration.InvokeMiddleware;
		table.freeze(this);
	}

	public Predict(...args: T) {
		const transformedArgs = ParseClientInvokeArgs(
			this.name,
			this.useBuffers,
			this.argumentHandlers ?? [],
			this.invokeMiddleware,
			args,
			this.argCountCheck,
		);

		this.instance.onServerEvent.Fire(...transformedArgs);
	}

	public Connect(callback: (...args: T) => void): Connection {
		return new AirshipScriptConnection(
			this.instance.onServerEvent.Connect(
				CreateClientEventCallback(this.name, {
					UseBuffers: this.useBuffers,
					EnforceArguments: this.argCountCheck,
					NetworkTypes: this.argumentHandlers ?? [],
					Callback: callback,
					CallbackMiddleware: this.callbackMiddleware,
				}),
			),
		);
	}

	public SendToServer(...args: T): void {
		const serializedArgs = ParseClientInvokeArgs(
			this.name,
			this.useBuffers,
			this.argumentHandlers ?? [],
			[],
			args,
			this.argCountCheck,
		);
		if (!serializedArgs) return;

		return this.instance.FireServer(...serializedArgs);
	}
}
