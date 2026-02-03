/* eslint-disable @typescript-eslint/no-explicit-any */
import { CreateServerFunctionCallback } from "../../Core/Serialization/CallbackHandlers";
import { NetworkPlayer } from "../../Core/Types/Dist";
import { NetworkingFlags, ServerFunctionDeclaration } from "../../Core/Types/NetworkObjectModel";
import { StaticNetworkType } from "../../Core/Types/NetworkTypes";
import { ServerListenerFunction } from "../../Core/Types/Server/NetworkObjects";
import { RemotesFolder } from "../../Internal";
import { GetRbxNetFunctionId } from "../Internal/InternalId";

export class ServerFunction<T extends Array<unknown>, R> implements ServerListenerFunction<T, R> {
	private instance: RemoteFunction;

	private arguments: StaticNetworkType[];
	private returnType: StaticNetworkType;
	private useBuffer: boolean;

	constructor(
		private readonly name: string,
		declaration: ServerFunctionDeclaration<T, R>,
	) {
		const instance = new Instance("RemoteFunction");
		instance.Name = game.GetService("RunService").IsStudio()
			? name
			: string.format("%.X", GetRbxNetFunctionId(name));
		instance.Parent = RemotesFolder;
		this.instance = instance;

		this.arguments = declaration.Arguments;
		this.returnType = declaration.Returns;
		this.useBuffer = (declaration.Flags & NetworkingFlags.UseBufferSerialization) !== 0;

		table.freeze(this);
	}

	SetCallback(callback: (target: NetworkPlayer, ...args: T) => R): () => void {
		const overloadCallback = CreateServerFunctionCallback(this.name, {
			Callback: callback,
			UseBuffers: this.useBuffer,
			NetworkReturnType: this.returnType,
			NetworkTypes: this.arguments,
		});

		this.instance.OnServerInvoke = (player, ...args) => {
			return overloadCallback(player, ...args);
		};

		return () => {
			this.instance.OnServerInvoke = undefined;
		};
	}
}
