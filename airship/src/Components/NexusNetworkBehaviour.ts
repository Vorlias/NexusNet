import { NexusNetwork } from "Code/Network";
import { AnyClientNetworkObject, AnyNetworkDeclaration, AnyServerNetworkObject } from "../Core/Types/Declarations";
import Nexus from "../Framework";
import { ClientEventDeclaration, ServerEventDeclaration } from "../Core/Types/NetworkObjectModel";
import { Game } from "@Easy/Core/Shared/Game";
import { Bin } from "@Easy/Core/Shared/Util/Bin";

export const NexusServerRpc = new Map<AirshipBehaviour, Map<string, AnyServerNetworkObject>>();
export const NexusClientRpc = new Map<AirshipBehaviour, Map<string, AnyClientNetworkObject>>();

interface NexusCommandRpc {
	readonly rpcType: "Command";
	readonly property: string;
	readonly requiresAuthority: boolean;
	readonly context: Nexus.InlineContext<
		ClientEventDeclaration<[networkIdentity: NetworkIdentity, ...args: unknown[]]>
	>;
}

interface NexusClientRpc {
	readonly rpcType: "ClientRpc";
	readonly property: string;
	readonly context: Nexus.InlineContext<
		ServerEventDeclaration<[networkIdentity: NetworkIdentity, ...args: unknown[]]>
	>;
}

type NexusRpc = NexusCommandRpc | NexusClientRpc;

function getPropertyCallback(obj: NexusNetworkBehaviour, property: string) {
	const prop = obj[property as never] as (obj: NexusNetworkBehaviour, ...args: unknown[]) => unknown;
	return prop;
}

/**
 * A network behaviour
 */
export abstract class NexusNetworkBehaviour extends AirshipBehaviour {
	private static $RPC = new Array<NexusRpc>();
	private bin = new Bin();

	@SerializeField()
	protected networkIdentity: NetworkIdentity | undefined;

	protected Awake(): void {
		const constructor = getmetatable(this) as typeof NexusNetworkBehaviour;
		const rpcs = constructor.$RPC;

		// Server-based listeners
		if (Game.IsServer()) {
			for (const { context, rpcType, property } of rpcs) {
				if (rpcType === "Command") {
					const callback = getPropertyCallback(this, property);

					this.bin.Add(
						context.server.Connect((player, nid, ...args) => {
							if (nid.netId !== this.networkIdentity?.netId) return;
							callback(this, ...args);
						}),
					);
				}
			}
		}

		// Client-based listeners
		if (Game.IsClient()) {
			for (const { context, rpcType, property } of rpcs) {
				if (rpcType === "ClientRpc") {
					const callback = getPropertyCallback(this, property);

					this.bin.Add(
						context.client.Connect((nid, ...args) => {
							if (nid.netId !== this.networkIdentity?.netId) return;
							callback(this, ...args);
						}),
					);
				}
			}
		}
	}

	protected OnDestroy(): void {
		this.bin.Clean();
	}
}
