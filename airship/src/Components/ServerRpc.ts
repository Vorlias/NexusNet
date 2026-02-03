import { Game } from "@Easy/Core/Shared/Game";
import { NetworkSerializableType, NetworkType, ToNetworkArguments } from "../Core/Types/NetworkTypes";
import { AirshipEventBuilder } from "../Builders/EventBuilder";
import Nexus, { NexusTypes } from "../Framework";
import { NexusClientRpc, NexusNetworkBehaviour, NexusServerRpc } from "./NexusNetworkBehaviour";
import { MapUtil } from "@Easy/Core/Shared/Util/MapUtil";
import { AnyClientNetworkObject, AnyServerNetworkObject } from "../Core/Types/Declarations";
import { Player } from "@Easy/Core/Shared/Player/Player";
import { NetworkBuffers, NeverBuffer, uint32 } from "../Core/Buffers";

export const enum CommandFlags {
	RequiresAuthority,
	PassNetworkConnectionArg,
}

interface Broadcaster<T extends readonly unknown[]> {
	(
		target: NexusNetworkBehaviour,
		property: string,
		descriptor: TypedPropertyDescriptor<(this: NexusNetworkBehaviour, ...args: [...T, Player | undefined]) => void>,
	): void;
}

export interface CommandOptions {
	requiresAuthority?: boolean;
}

export function CommandWithOptions<T extends ReadonlyArray<unknown>>(
	options: CommandOptions,
	args: ToNetworkArguments<T>,
): Broadcaster<T> {
	return (target, property, descriptor) => {
		const name = `${target}::${property}`;

		const constructor = target as unknown as typeof NexusNetworkBehaviour;
		const rpcList = constructor["$RPC"];

		const event = new AirshipEventBuilder().WithArguments<[NetworkIdentity, ...T]>(NexusTypes.Identity, ...args);

		const inlined = Nexus.Client(name, event);
		rpcList.push({
			property,
			requiresAuthority: options.requiresAuthority ?? true,
			rpcType: "Command",
			context: inlined,
		});

		const serverRpcs = MapUtil.GetOrCreate(NexusServerRpc, target, () => new Map<string, AnyServerNetworkObject>());
		const clientRpcs = MapUtil.GetOrCreate(NexusClientRpc, target, () => new Map<string, AnyClientNetworkObject>());
		serverRpcs.set(property, inlined.server);
		clientRpcs.set(property, inlined.client);

		if (Game.IsClient()) {
			const serverEvent = inlined.client;
			descriptor.value = (object, ...args) => {
				const networkIdentity = object.gameObject.GetComponent<NetworkIdentity>();
				assert(networkIdentity, "No NetworkIdentity on object");
				return serverEvent.SendToServer(networkIdentity, ...(args as unknown as [...T]));
			};

			return descriptor;
		}
	};
}

// /**
//  * A function that's invoked by clients
//  */
// export function Command<T extends Array<unknown>>(...args: ToNetworkArguments<T>): Broadcaster<T> {
// 	return CommandWithOptions({}, args);
// }

interface ConnectionType extends NetworkSerializableType<Player | undefined, string | undefined> {
	readonly __nominal_NetworkConnectionToClientSymbol?: unique symbol;
}
const connectionToClient = {
	Name: "Connection",
	Validation: {
		Validate: NexusTypes.Player.Validation.Validate,
	},
	Encoding: NetworkBuffers.Nullable(NexusTypes.Player.Encoding),
	Serialization: NexusTypes.Optional(NexusTypes.Player).Serialization,
} as ConnectionType;

interface Command {
	<T extends ReadonlyArray<unknown>>(...args: ToNetworkArguments<T>): Broadcaster<T>;
	PlayerSenderArgument: ConnectionType;
}
const command = {
	PlayerSenderArgument: connectionToClient,
} as Command;
setmetatable(command, {
	__call: (obj, ...args) => {
		const res = CommandWithOptions({}, args as NetworkType.Any[]);
		return res;
	},
});

export const Command = command;
