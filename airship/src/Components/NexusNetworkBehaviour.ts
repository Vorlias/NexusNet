import { AnyClientNetworkObject, AnyNetworkDeclaration, AnyServerNetworkObject } from "../Core/Types/Declarations";
import { ClientEventDeclaration, ServerEventDeclaration } from "../Core/Types/NetworkObjectModel";
import { Game } from "@Easy/Core/Shared/Game";
import { Bin } from "@Easy/Core/Shared/Util/Bin";
import Nexus from "../Framework";

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
		const id = (this.networkIdentity ??= this.gameObject.GetAirshipComponentInParent<NetworkIdentity>()!);

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

			if (typeIs(this.OnStartServer, "function")) {
				if (id.netId === 0) {
					this.bin.Add(id.onStartServer.Connect(() => this.OnStartServer!()));
				} else {
					this.OnStartServer();
				}
			}

			if (typeIs(this.OnStopServer, "function")) {
				this.bin.Add(id.onStopServer.Connect(() => this.OnStopServer!()));
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

			if (typeIs(this.OnStartClient, "function")) {
				if (id.netId === 0) {
					this.bin.Add(id.onStartClient.Connect(() => this.OnStartClient!()));
				} else {
					this.OnStartClient();
				}
			}

			if (typeIs(this.OnStopClient, "function")) {
				this.bin.Add(id.onStopServer.Connect(() => this.OnStopClient!()));
			}
		}

		if (typeIs(this.OnStartAuthority, "function")) {
			this.bin.Add(id.onStartAuthority.Connect(() => this.OnStartAuthority!()));
		}

		if (typeIs(this.OnStopAuthority, "function")) {
			this.bin.Add(id.onStopAuthority.Connect(() => this.OnStopAuthority!()));
		}
	}

	protected OnStartAuthority?(): void;
	protected OnStopAuthority?(): void;

	protected OnStartServer?(): void;
	protected OnStartClient?(): void;

	protected OnStopServer?(): void;
	protected OnStopClient?(): void;

	protected IsOwned(): boolean {
		return this.networkIdentity?.isOwned ?? false;
	}

	protected IsServer() {
		return this.networkIdentity?.isServer ?? Game.IsServer();
	}

	protected IsClient() {
		return this.networkIdentity?.isClient ?? Game.IsClient();
	}

	protected OnDestroy(): void {
		this.bin.Clean();
	}
}
