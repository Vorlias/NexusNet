import { TransformBufferToArgs } from "../../Core/Serialization/BufferEncoding";
import { ParseClientInvokeArgs } from "../../Core/Serialization/InvokeHandlers";
import { NetDeserializeArguments } from "../../Core/Serialization/Serializer";
import { ClientInvokeFunction } from "../../Core/Types/Client/NetworkObjects";
import { ClientFunctionDeclaration, NetworkingFlags } from "../../Core/Types/NetworkObjectModel";
import { StaticNetworkType } from "../../Core/Types/NetworkTypes";
import { RemotesFolder } from "../../Internal";
import { GetRbxNetFunctionId } from "../Internal/InternalId";

export class ClientFunction<T extends unknown[], R> implements ClientInvokeFunction<T, R> {
	instance: RemoteFunction<Callback>;
	private arguments: StaticNetworkType[];
	private returnType: StaticNetworkType;
	private useBuffer: boolean;

	constructor(
		private readonly name: string,
		declaration: ClientFunctionDeclaration<T, R>,
	) {
		const id = game.GetService("RunService").IsStudio() ? name : string.format("%.X", GetRbxNetFunctionId(name));
		const object = RemotesFolder.WaitForChild(id);
		assert(object.IsA("RemoteFunction"));
		this.instance = object;

		this.arguments = declaration.Arguments;
		this.returnType = declaration.Returns;
		this.useBuffer = (declaration.Flags & NetworkingFlags.UseBufferSerialization) !== 0;

		table.freeze(this);
	}

	SendToServer(...args: T): R {
		const transformedArgs = ParseClientInvokeArgs(this.name, this.useBuffer, this.arguments, [], args, true);
		const serializedResult = this.instance.InvokeServer(...transformedArgs);

		if (this.useBuffer) {
			const decoded = TransformBufferToArgs(this.name, this.arguments, serializedResult as buffer);
			const [deserializedResult] = NetDeserializeArguments([this.returnType], decoded);
			return deserializedResult as R;
		} else {
			const [deserializedResult] = NetDeserializeArguments([this.returnType], [serializedResult]);
			return deserializedResult as R;
		}
	}

	async SendToServerAsync(...args: T): Promise<R> {
		return this.SendToServer(...args);
	}
}
