import { MapUtil } from "@Easy/Core/Shared/Util/MapUtil";
import { ClientEventDeclaration, ServerEventDeclaration } from "../Core/Types/NetworkObjectModel";
import { ServerEvent } from "../Objects/Server/ServerEvent";
import { Game } from "@Easy/Core/Shared/Game";
import { Bin } from "@Easy/Core/Shared/Util/Bin";
import { ClientEvent } from "../Objects/Client/ClientEvent";
import { NetDeserializeArguments } from "../Core/Serialization/Serializer";
import inspect from "@Easy/Core/Shared/Util/Inspect";

type LuauBehaviourClass<T> = (new () => T) & {
	constructor: (self: T) => void;
	OnDestroy?: (self: T) => void;
	Awake?: (self: T) => void;
};

interface EventDeclaration {
	readonly property: string;
	readonly server: ServerEventDeclaration<unknown[]>;
	readonly client: ClientEventDeclaration<unknown[]>;
}

export const NetworkBehaviourTypes = new Set<typeof AirshipBehaviour>();

export const ServerEvents = new Map<typeof AirshipBehaviour, Map<string, EventDeclaration>>();

function findMethodOnInstance<T extends object>(
	value: T,
	name: string,
): ((object: T, ...args: unknown[]) => void) | undefined {
	const instance = getmetatable(value);
	if (instance === undefined) return undefined;

	const possibleMethodOrProperty = value[name as keyof T];
	if (typeIs(possibleMethodOrProperty, "function")) {
		return possibleMethodOrProperty;
	}
}

type ClientListenerEvent = ClientEvent<[NetworkIdentity, ...unknown[]]>;
type ServerListenerEvent = ServerEvent<[NetworkIdentity, ...unknown[]]>;

export function NetworkBehaviour() {
	return (Constructor: typeof AirshipBehaviour) => {
		const bins = new Map<AirshipBehaviour, Bin>();
		const identities = new Map<AirshipBehaviour, NetworkIdentity>();
		const ComponentClass = Constructor as LuauBehaviourClass<AirshipBehaviour>;
		const remoteMap = MapUtil.GetOrCreate(ServerEvents, Constructor, new Map());

		const clientEvents = new Map<string, ClientListenerEvent>();
		const serverEvents = new Map<string, ServerListenerEvent>();

		const constructor = ComponentClass.constructor;
		ComponentClass.constructor = (object) => {
			constructor(object);

			const bin = new Bin();
			bins.set(object, bin);
		};

		const networkAwake = (object: AirshipBehaviour) => {
			print("object is", object.gameObject.name);

			const networkId = object.gameObject.GetComponent<NetworkIdentity>();
			print("networkIdentity is", networkId);
			assert(networkId, "Missing NetworkIdentity");
			identities.set(object, networkId);

			const instanceBin = bins.get(object)!.Extend();

			function connectClientDelegate(name: string, declaration: EventDeclaration) {
				const callback = findMethodOnInstance(object, declaration.property);
				const identity = identities.get(object);

				if (!callback || !identity) return;

				const delegate = MapUtil.GetOrCreate(
					clientEvents,
					name,
					() => new ClientEvent(name, declaration.client),
				);

				instanceBin.Add(
					delegate.Connect((networkIdentity, ...args) => {
						if (networkIdentity !== identity) return;
						callback(object, ...args);
					}),
				);
			}

			if (Game.IsClient()) {
				for (const [name, declaration] of remoteMap) {
					connectClientDelegate(name, declaration);
				}
			}
		};
		if (typeIs(ComponentClass.Awake, "function")) {
			const userAwake = ComponentClass.Awake;
			ComponentClass.Awake = (object) => {
				userAwake(object);
				networkAwake(object);
			};
		} else {
			ComponentClass.Awake = networkAwake;
		}

		const networkDestroy = (object: AirshipBehaviour) => {
			identities.delete(object);

			bins.get(object)?.Clean();
			bins.delete(object);
		};

		if (typeIs(ComponentClass.OnDestroy, "function")) {
			const userDestroy = ComponentClass.OnDestroy;
			ComponentClass.OnDestroy = (object) => {
				userDestroy(object);
				networkDestroy(object);
			};
		} else {
			ComponentClass.OnDestroy = networkDestroy;
		}
	};
}
