/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientCallbackMiddleware } from "../../Core/Middleware/Types";
import { CreateClientEventCallback, ParseServerCallbackArgs } from "../../Core/Serialization/CallbackHandlers";
import { ParseClientInvokeArgs } from "../../Core/Serialization/InvokeHandlers";
import { ClientListenerEvent, ClientSenderEvent } from "../../Core/Types/Client/NetworkObjects";
import { Connection } from "../../Core/Types/Dist";
import { ClientEventDeclaration, NetworkingFlags } from "../../Core/Types/NetworkObjectModel";
import { StaticNetworkType } from "../../Core/Types/NetworkTypes";
import { RemotesFolder } from "../../Internal";
import { GetRbxNetEventId } from "../Internal/InternalId";

export class ClientEvent<T extends Array<unknown>> implements ClientSenderEvent<T>, ClientListenerEvent<T> {
	private instance: RemoteEvent<Callback>;

	private argumentHandlers?: StaticNetworkType<any>[];
	private useBuffers = false;
	private callbackMiddleware: ClientCallbackMiddleware[];
	private argCountCheck: boolean;

	constructor(
		private readonly name: string,
		declaration: ClientEventDeclaration<T>,
	) {
		const id = game.GetService("RunService").IsStudio() ? name : string.format("%.X", GetRbxNetEventId(name));
		const object = RemotesFolder.WaitForChild(id);
		assert(object.IsA("RemoteEvent"));
		this.instance = object;

		this.argumentHandlers = declaration.Arguments;
		this.useBuffers = (declaration.Flags & NetworkingFlags.UseBufferSerialization) !== 0;
		this.argCountCheck = (declaration.Flags & NetworkingFlags.EnforceArgumentCount) !== 0;
		this.callbackMiddleware = declaration.CallbackMiddleware as ClientCallbackMiddleware[];
		table.freeze(this);
	}

	public Wait(): T {
		const result = this.instance.OnClientEvent.Wait();

		const transformedArgs = ParseServerCallbackArgs(
			this.name,
			this.useBuffers,
			this.argumentHandlers ?? [],
			result,
			this.argCountCheck,
		) as T;

		return transformedArgs;
	}

	Connect(callback: (...args: T) => void): Connection {
		return this.instance.OnClientEvent.Connect(
			CreateClientEventCallback(this.name, {
				Callback: callback,
				UseBuffers: this.useBuffers,
				EnforceArguments: this.argCountCheck,
				NetworkTypes: this.argumentHandlers ?? [],
				CallbackMiddleware: this.callbackMiddleware,
			}),
		);
	}

	SendToServer(...args: T): void {
		const serializedArgs = ParseClientInvokeArgs(
			this.name,
			this.useBuffers,
			this.argumentHandlers ?? [],
			[],
			args,
			this.argCountCheck,
		);
		if (!serializedArgs) return;

		this.instance.FireServer(...serializedArgs);
	}
}
