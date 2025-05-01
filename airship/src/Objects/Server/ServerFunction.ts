import { NetworkPlayer } from "@Vorlias/NexusNet/Core/Types/Dist";
import { NetworkingFlags, ServerFunctionDeclaration } from "@Vorlias/NexusNet/Core/Types/NetworkObjectModel";
import { ServerListenerFunction } from "@Vorlias/NexusNet/Core/Types/Server/NetworkObjects";
import { NetworkedFunction } from "../Internal/NetworkFunction";
import { CreateServerFunctionCallback } from "@Vorlias/NexusNet/Core/Serialization/CallbackHandlers";
import { StaticNetworkType } from "@Vorlias/NexusNet/Core/Types/NetworkTypes";
import { ParseServerInvokeArgs } from "@Vorlias/NexusNet/Core/Serialization/InvokeHandlers";

export class ServerFunction<T extends Array<unknown>, R> implements ServerListenerFunction<T, R> {
	private instance: NetworkedFunction;
	private arguments: StaticNetworkType[];
	private returnType: StaticNetworkType;
	private useBuffer: boolean;

	public constructor(private readonly name: string, declaration: ServerFunctionDeclaration<T, R>) {
		this.instance = new NetworkedFunction(name);
		this.arguments = declaration.Arguments;
		this.returnType = declaration.Returns;
		this.useBuffer = (declaration.Flags & NetworkingFlags.UseBufferSerialization) !== 0;
	}

	PredictCallback(callback: (player: NetworkPlayer, ...args: T) => R) {
		const serverFunctionCallback = CreateServerFunctionCallback(this.name, {
			Callback: callback,
			UseBuffers: this.useBuffer,
			NetworkReturnType: this.returnType,
			NetworkTypes: this.arguments,
		});

		return (...args: T) => {
			const transformedArgs = ParseServerInvokeArgs(this.name, this.useBuffer, this.arguments, [], args, true);
			return serverFunctionCallback(undefined!, ...transformedArgs) as R;
		};
	}

	SetCallback(callback: (target: NetworkPlayer, ...args: T) => R): () => void {
		const serverFunctionCallback = CreateServerFunctionCallback(this.name, {
			Callback: callback,
			UseBuffers: this.useBuffer,
			NetworkReturnType: this.returnType,
			NetworkTypes: this.arguments,
		});

		return this.instance.SetServerCallback(serverFunctionCallback);
	}
}
