import type { Player } from "@Easy/Core/Shared/Player/Player";
import type { AirshipScriptConnection } from "../Objects/NetConnection";
import { ServerEvent } from "../Objects/Server/ServerEvent";
import { ClientEvent } from "../Objects/Client/ClientEvent";
import type { StaticNetworkType, ToNetworkArguments } from "../Core/Types/NetworkTypes";
import { AirshipNetworkObjectModelBuilder } from "../Builders/ObjectModelBuilder";
import { AirshipEventBuilder } from "../Builders/EventBuilder";
import { InferClientRemote, InferNOMDeclarations, InferServerRemote } from "../Core/Types/Inference";
import type {
	ClientBuilder,
	ClientEventDeclaration,
	ContextNetworkModel,
	NetworkModelConfiguration,
	NetworkObjectModelBuilder,
	ServerBuilder,
} from "../Core/Types/NetworkObjectModel";
import { AnyNetworkDeclaration } from "../Core/Types/Declarations";
import { AirshipFunctionBuilder } from "../Builders/FunctionBuilder";
import { NEXUS_VERSION } from "../Core/CoreInfo";
import { NexusTypes } from "./AirshipTypes";
import { NexusInlineClient, NexusInlineServer } from "./Inline";
import { NexusSyncState } from "../NetworkData/SyncState";
export { NexusTypes } from "./AirshipTypes";

declare module "../Core/Types/Dist" {
	export interface ModuleTypes {
		NetworkPlayer: Player;
		Connection: AirshipScriptConnection;
		NetworkServerEvent: ServerEvent<unknown[]>;
		NetworkClientEvent: ClientEvent<unknown[]>;
	}
}

/**
 * NexusNet runtime for Airship
 * @version Airship-1.0
 */
namespace Nexus {
	/**
	 * Infers the Network Model declarations from {@link T | `T`}, where `T` is a {@link ContextNetworkModel | `ContextNetworkModel`} or {@link NetworkObjectModelBuilder | `NetworkObjectModelBuilder`}
	 *
	 * This can be useful if you want a type for the network declaration, e.g.
	 * ```ts
	 * export type Network = ContextNetworkModel<Nexus.InferModel<typeof Network>>;
	 * ```
	 * where `Network` is your {@link ContextNetworkModel | `ContextNetworkModel`}
	 */
	export type InferModel<T extends object> = InferNOMDeclarations<T>;
	/**
	 * Infers the server object type from the given declaration
	 */
	export type ToServerObject<T extends AnyNetworkDeclaration> = InferServerRemote<T>;
	/**
	 * Infers the client object type from the given declaration
	 */
	export type ToClientObject<T extends AnyNetworkDeclaration> = InferClientRemote<T>;

	/**
	 * The version of Nexus
	 */
	export const VERSION = `Nexus ${NEXUS_VERSION}`;

	/**
	 * Build an object model
	 */
	export function BuildObjectModel(): AirshipNetworkObjectModelBuilder {
		return new AirshipNetworkObjectModelBuilder();
	}

	/**
	 * Define a remote event
	 * @returns The builder for a remote
	 */
	export function Event(): AirshipEventBuilder<[]>;
	export function Event<T extends ReadonlyArray<unknown>>(...values: ToNetworkArguments<T>): AirshipEventBuilder<T>;
	export function Event<T extends ReadonlyArray<unknown>>(...values: ToNetworkArguments<T>): AirshipEventBuilder<[]> {
		if (values.size() > 0) {
			return new AirshipEventBuilder().WithArguments(...values) as AirshipEventBuilder<[]>;
		}

		return new AirshipEventBuilder();
	}

	/**
	 * Define a remote function
	 */
	export function Function<T extends ReadonlyArray<unknown>, TRet>(
		args: ToNetworkArguments<T>,
		returns: StaticNetworkType<TRet>,
	): AirshipFunctionBuilder<T, TRet> {
		return new AirshipFunctionBuilder(returns).WithArguments(...args);
	}

	export interface InlineContext<T> {
		readonly server: InferServerRemote<T>;
		readonly client: InferClientRemote<T>;
	}

	export type InlineClientEvent<T extends readonly unknown[]> = InlineContext<ClientEventDeclaration<T>>;

	/**
	 * Creates an inline server object - for usage with components
	 *
	 * ```ts
	 * export class MyComponent extends AirshipBehaviour {
	 * 	private sendHelloEvent = Nexus.Server("MyComponent/SendHello", Nexus.Event(NexusTypes.String));
	 *
	 * 	protected Start() {
	 * 		if (Game.IsServer()) {
	 * 			Airship.Players.Observe((player) => {
	 * 				this.sendHelloEvent.Server.SendToPlayer(player, `Hello, ${player.username}!`);
	 * 			});
	 * 		}
	 *
	 * 		if (Game.IsClient()) {
	 * 			this.sendHelloEvent.Client.Connect((message) => {
	 * 				print("The server says", message);
	 * 			});
	 * 		}
	 * 	}
	 * }
	 * ```
	 */
	export function Server<const T extends AnyNetworkDeclaration>(
		name: string,
		network: ServerBuilder<T>,
		configuration?: Partial<NetworkModelConfiguration>,
	): InlineContext<T> {
		return NexusInlineServer(name, network, configuration);
	}

	/**
	 * Creates an inline client network object
	 */
	export function Client<const T extends AnyNetworkDeclaration>(
		name: string,
		network: ClientBuilder<T>,
		configuration?: Partial<NetworkModelConfiguration>,
	): InlineContext<T> {
		return NexusInlineClient(name, network, configuration);
	}

	// export const State = NexusSyncState;
	// export type State<T extends object> = NexusSyncState<T>;
}

export default Nexus;
