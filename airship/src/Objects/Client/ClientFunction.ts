import { NetworkFunction } from "@Easy/Core/Shared/Network/NetworkFunction";
import { ClientInvokeFunction } from "@Vorlias/NexusNet/Core/Types/Client/NetworkObjects";
import { ClientFunctionDeclaration, NetworkingFlags } from "@Vorlias/NexusNet/Core/Types/NetworkObjectModel";
import { NetworkedFunction } from "../Internal/NetworkFunction";
import { ParseClientInvokeArgs } from "@Vorlias/NexusNet/Core/Serialization/InvokeHandlers";
import { StaticNetworkType } from "@Vorlias/NexusNet/Core/Types/NetworkTypes";
import { TransformBufferToArgs } from "@Vorlias/NexusNet/Core/Serialization/BufferEncoding";
import { NetDeserializeArguments } from "@Vorlias/NexusNet/Core/Serialization/Serializer";
import { ClientFunctionInvokeMiddleware } from "@Vorlias/NexusNet/Core/Middleware/Types";

export class ClientFunction<T extends Array<unknown>, R> implements ClientInvokeFunction<T, R> {
	private instance: NetworkedFunction;
	private arguments: StaticNetworkType[];
	private returnType: StaticNetworkType;
	private useBuffer: boolean;
	private middleware: ClientFunctionInvokeMiddleware[];

	public constructor(private name: string, declaration: ClientFunctionDeclaration<T, R>) {
		this.instance = new NetworkedFunction(name, declaration.TimeoutSeconds);
		this.arguments = declaration.Arguments;
		this.returnType = declaration.Returns;
		this.useBuffer = (declaration.Flags & NetworkingFlags.UseBufferSerialization) !== 0;
		this.middleware = declaration.ClientInvokeMiddleware;
	}

	SendToServer(...args: T): R {
		const transformedArgs = ParseClientInvokeArgs(this.name, this.useBuffer, this.arguments, [], args, true);
		const serializedResult = this.instance.FireServer(...transformedArgs);

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
