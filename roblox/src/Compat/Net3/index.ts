import { EventBuilder } from "../../Builders/EventBuilder";
import { FunctionBuilder } from "../../Builders/FunctionBuilder";
import { RobloxContextNetworkModel, RobloxNetworkObjectModelBuilder } from "../../Builders/ObjectModelBuilder";
import { NEXUS_VERSION } from "../../Core/CoreInfo";
import { ServerCallbackMiddleware } from "../../Core/Middleware/Types";
import {
	RemoteDeclarations,
	RemoteRunContext,
	NetworkingFlags,
	ServerEventDeclaration,
	ClientEventDeclaration,
} from "../../Core/Types/NetworkObjectModel";
import { NexusTypes } from "../../RobloxTypes";
import { Variant } from "../VariantType";

namespace Net3Compat {
	export interface DefinitionConfiguration {
		readonly ServerGlobalMiddleware?: ServerCallbackMiddleware[];
		/**
		 * @deprecated
		 */
		readonly ServerAutoGenerateRemotes?: boolean;
		/**
		 * Whether or not `Client.Get(...)` should yield for the remote to exist
		 *
		 * If `true` - Will yield until the remote exists, or error after 60 seconds.
		 *
		 * If `false` - Will error if the remote does not exist.
		 *
		 * @default true
		 */
		readonly ClientGetShouldYield?: boolean;

		/**
		 * Add a microprofiler debug label to each callback
		 */
		readonly MicroprofileCallbacks?: boolean;
	}

	export function Create<T extends RemoteDeclarations>(
		declarations: T,
		configuration: DefinitionConfiguration = {},
	): RobloxContextNetworkModel<T> {
		let model = new RobloxNetworkObjectModelBuilder<T>().SetConfiguration({
			ServerCallbackMiddleware: configuration.ServerGlobalMiddleware,
			ClientGetShouldYield: configuration.ClientGetShouldYield ?? true,
			MicroprofileCallbacks: configuration.MicroprofileCallbacks,
			UseBuffers: false,
			EnforceArgumentCount: false,
		});

		for (const [key, value] of pairs(declarations) as IterableFunction<
			LuaTuple<[string, RemoteDeclarations[keyof RemoteDeclarations]]>
		>) {
			if (value.Type === "Event") {
				const eventBuilder = new EventBuilder().WithArguments();

				if (value.RunContext === RemoteRunContext.Server) {
					model = model.AddServer(key, eventBuilder);
				} else {
					model = model.AddClient(key, eventBuilder);
				}
			} else if (value.Type === "Function") {
				const funBuilder = new FunctionBuilder(Variant).WithArguments();
				if (value.RunContext === RemoteRunContext.Server) {
					model = model.AddServer(key, funBuilder);
				} else {
					model = model.AddClient(key, funBuilder);
				}
			}
		}

		return model.Build();
	}

	/**
	 * Defines an event in which strictly the server fires an event that is recieved by clients
	 *
	 * `Server` [`Sends`] => `Client(s)` [`Recieves`]
	 *
	 * On the client, this will give an event that can use `Connect`.
	 *
	 * On the server, this will give an event that can use `SendToPlayer`, `SendToAllPlayers`, `SendToAllPlayersExcept`
	 *
	 */
	export function ServerToClientEvent<ServerArgs extends readonly unknown[] = unknown[]>(
		middleware?: ServerCallbackMiddleware[],
	) {
		return {
			Type: "Event",
			RunContext: RemoteRunContext.Server,
			CallbackMiddleware: middleware ?? [],
			InvokeMiddleware: [],
			Flags: NetworkingFlags.None,
			Arguments: [],
			Unreliable: false,
			Debugging: false,
		} as ServerEventDeclaration<ServerArgs>;
	}

	/**
	 * Defines an event in which strictly clients fire an event that's recieved by the server
	 *
	 * `Client(s)` [`Sends`] => `Server` [`Recieves`]
	 *
	 * On the client, this will give an event that can use `SendToServer`.
	 *
	 * On the server, this will give an event that can use `Connect`.
	 *
	 * @param mw The middleware of this event.
	 */
	export function ClientToServerEvent<ClientArgs extends readonly unknown[] = unknown[]>() {
		return {
			Type: "Event",
			RunContext: RemoteRunContext.Client,
			CallbackMiddleware: [],
			Flags: NetworkingFlags.None,
			Arguments: [],
			InvokeMiddleware: [],
			UseBufferSerialization: false,
			Unreliable: false,
			Debugging: false,
		} as ClientEventDeclaration<ClientArgs>;
	}
}

/**
 * Net 3.x compat layer
 */
namespace NetV3Compat {
	export const VERSION = `Nexus ${NEXUS_VERSION} (Net-3.0-compat)`;

	export const Definitions = Net3Compat;

	export function CreateDefinitions<T extends RemoteDeclarations>(
		declarations: T,
		configuration?: Net3Compat.DefinitionConfiguration,
	) {
		return Net3Compat.Create(declarations, configuration);
	}
}

export default NetV3Compat;
