import { BufferReader } from "../Buffers/BufferReader";
import { BufferWriter } from "../Buffers/BufferWriter";
import { TransformFromBuffer, TransformToBuffer } from "../Buffers/Transform";
import { RemotesFolder } from "../Internal";
import { GetRbxNetEventId } from "../Internal/InternalId";
import { NetworkType } from "../Types/NetworkType";
import { ServerListenerEvent, ServerSenderEvent } from "./ServerNetworkTypes";

export interface ServerEventDeclaration<T> {
    readonly Type: "Event";
    readonly Context: "Server";
    readonly Arguments: NetworkType.ToTypeArray<T> | undefined,
}


function CreateServerEventCallback<T extends ReadonlyArray<unknown>>(
    argl: NetworkType.ToTypeArray<T>,
    callback: (player: Player, ...args: T) => void,
) {
    return (player: Player, buffer: buffer) => {
        const args = TransformFromBuffer(buffer, argl);
        callback(player, ...(args as T))
    }
}

const RunService = game.GetService("RunService");
export class NexusServerEvent<T extends Array<unknown>> implements ServerSenderEvent<T>, ServerListenerEvent<T> {
    private readonly instance!: RemoteEvent;
    private readonly declaration: ServerEventDeclaration<T>;

    private readonly arguments: NetworkType.ToTypeArray<T>;

    public constructor(name: string, declaration: ServerEventDeclaration<T>) {
        assert(RunService.IsServer())
        this.declaration = declaration;

        this.instance = new Instance("RemoteEvent");
        this.instance.Name = string.format("%.X", GetRbxNetEventId(name));
        this.instance.Parent = RemotesFolder;
        this.arguments = declaration.Arguments as NetworkType.ToTypeArray<T>;

        table.freeze(this);
    }

    public Connect(callback: (player: Player, ...args: T) => void): RBXScriptConnection {
        const cb = CreateServerEventCallback<T>(this.arguments, callback);
        return this.instance.OnServerEvent.Connect(cb as Callback);
    }

    public SendToAllPlayers(...args: T): void {
        const buf = TransformToBuffer(args, this.arguments);
        this.instance.FireAllClients(buf);
    }

    public SendToAllPlayersExcept(targetOrTargets: Player | Array<Player>, ...args: T): void {
        throw `TODO`;
    }

    public SendToPlayer(target: Player, ...args: T): void {
        const buf = TransformToBuffer(args, this.arguments);
        this.instance.FireClient(target, buf);
    }

    public SendToPlayers(targets: Array<Player>, ...args: T): void {
        throw `TODO`;
    }
}
