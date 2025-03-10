import { Game } from "@Easy/Core/Shared/Game";
import { ToNetworkArguments } from "../Core/Types/NetworkTypes";
import { ServerEvent } from "../Objects/Server/ServerEvent";
import { AirshipEventBuilder } from "../Builders/EventBuilder";
import { ServerEvents } from "./NetworkableBehaviour";
import { MapUtil } from "@Easy/Core/Shared/Util/MapUtil";
import { NexusTypes } from "../Framework";

interface Broadcaster<T extends unknown[]> {
	(
		target: AirshipBehaviour,
		property: string,
		descriptor: TypedPropertyDescriptor<(this: AirshipBehaviour, ...args: T) => void>,
	): void;
}

export function Broadcast<T extends Array<unknown>>(...args: ToNetworkArguments<T>): Broadcaster<T> {
	return (target, property, descriptor) => {
		const name = `${target}::${property}`;

		const event = new AirshipEventBuilder().WithArguments<[NetworkIdentity, ...T]>(NexusTypes.Identity, ...args);

		const serverDeclaration = event.OnServer({ UseBuffers: false, Logging: false, Debugging: false });
		const clientDeclaration = event.OnClient({ UseBuffers: false, Logging: false, Debugging: false });

		const declarationMap = MapUtil.GetOrCreate(ServerEvents, target as never, new Map());
		assert(declarationMap, "No declaration map for " + target);

		declarationMap.set(name, { property, server: serverDeclaration, client: clientDeclaration });

		if (Game.IsServer()) {
			const serverEvent = new ServerEvent<[NetworkIdentity, ...T]>(name, serverDeclaration);
			print("create server event", serverEvent);

			descriptor.value = (object, ...args) => {
				const networkIdentity = object.gameObject.GetAirshipComponent<NetworkIdentity>();
				assert(networkIdentity, "No NetworkIdentity on object");
				return serverEvent.SendToAllPlayers(networkIdentity, ...args);
			};

			return descriptor;
		}
	};
}
