import { TransformFromBuffer, TransformToBuffer } from "../Buffers/Transform";
import { RemotesFolder } from "../Internal";
import { GetRbxNetEventId } from "../Internal/InternalId";
import { NOM } from "../NetworkObjectModel";
import { NetworkType } from "../Types/NetworkType";
import { ClientListenerEvent, ClientSenderEvent } from "./ClientNetworkTypes";

function CreateClientEventCallback<T extends ReadonlyArray<unknown>>(
    argl: NetworkType.ToTypeArray<T>,
    callback: (...args: T) => void,
) {
    return (buffer: buffer) => {
        const args = TransformFromBuffer(buffer, argl);
        callback(...(args as T))
    }
}

const RunService = game.GetService("RunService");

export class NexusClientEvent<T extends ReadonlyArray<unknown>> implements ClientSenderEvent<T>, ClientListenerEvent<T> {
    private instance: RemoteEvent<Callback>;
    private readonly arguments: NetworkType.ToTypeArray<T>;

    public constructor(name: string, declaration: NOM.ClientEventDeclaration<T>) {
        assert(RunService.IsClient());
        const id = string.format("%.X", GetRbxNetEventId(name));
        const object = RemotesFolder.WaitForChild(id);
        assert(object.IsA("RemoteEvent"));
        this.instance = object;
        this.arguments = declaration.Arguments as NetworkType.ToTypeArray<T>;

        table.freeze(this);
    }

    public Connect(callback: (...args: T) => void): RBXScriptConnection {
        const cb = CreateClientEventCallback(this.arguments, callback);
        return this.instance.OnClientEvent.Connect(cb as Callback);
    }

    public SendToServer(...args: T): void {
        const data = TransformToBuffer(args as never, this.arguments);
        this.instance.FireServer(data);
    }
}
