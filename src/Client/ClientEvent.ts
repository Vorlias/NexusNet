import {
	TransformFromBuffer,
	TransformFromNetworkArguments,
	TransformToBuffer,
	TransformToNetworkArguments,
} from "../Buffers/Transform";
import { RemotesFolder } from "../Internal";
import { GetRbxNetEventId } from "../Internal/InternalId";
import { NOM } from "../NetworkObjectModel";
import { NetworkType } from "../Types/NetworkType";
import { ClientListenerEvent, ClientSenderEvent } from "./ClientNetworkTypes";

function CreateClientEventCallback<T extends ReadonlyArray<unknown>>(
	argl: NetworkType.ToTypeArray<T>,
	callback: (...args: T) => void,
	compression: CastsToEnum<Enum.CompressionAlgorithm> | undefined,
) {
	return (buffer: buffer, data: defined[] | undefined) => {
		assert(typeIs(buffer, "buffer"));
		assert(data === undefined || typeIs(data, "table"));

		const args = TransformFromNetworkArguments(buffer, data, argl, compression);
		callback(...(args as T));
	};
}

const RunService = game.GetService("RunService");

export class NexusClientEvent<T extends ReadonlyArray<unknown>>
	implements ClientSenderEvent<T>, ClientListenerEvent<T>
{
	public instance: RemoteEvent<Callback>;
	private readonly arguments: NetworkType.ToTypeArray<T>;
	private compression?: CastsToEnum<Enum.CompressionAlgorithm>;

	public constructor(name: string, declaration: NOM.ClientEventDeclaration<T>) {
		assert(RunService.IsClient());
		const id = string.format("%.X", GetRbxNetEventId(name));
		const object = RemotesFolder.WaitForChild(id);
		assert(object.IsA("RemoteEvent"));
		this.instance = object;
		this.arguments = declaration.Arguments as NetworkType.ToTypeArray<T>;
		this.compression = declaration.Config.Compression;

		table.freeze(this);
	}

	public Connect(callback: (...args: T) => void): RBXScriptConnection {
		const cb = CreateClientEventCallback(this.arguments, callback, this.compression);
		return this.instance.OnClientEvent.Connect(cb as Callback);
	}

	public SendToServer(...args: T): void {
		const [buffer, xData] = TransformToNetworkArguments(args as never, this.arguments, this.compression);
		this.instance.FireServer(buffer, xData);
	}
}
