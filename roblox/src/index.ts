import { StaticNetworkType, ToNetworkArguments } from "./Core/Types/NetworkTypes";
import { EventBuilder } from "./Builders/EventBuilder";
import { RobloxNetworkObjectModelBuilder } from "./Builders/ObjectModelBuilder";
import { default as NetV3Compat } from "./v3compat";
import { default as NetV4Compat } from "./v4compat";
import { FunctionBuilder } from "./Builders/FunctionBuilder";
import { AnyNetworkDeclaration } from "./Core/Types/Declarations";
import { InferNOMDeclarations, InferServerRemote, InferClientRemote } from "./Core/Types/Inference";
import { NEXUS_VERSION } from "./Core/CoreInfo";
import { NexusTypes } from "./RobloxTypes";
export { NexusTypes } from "./RobloxTypes";
// export { NexusX } from "./Core/NexusX";

declare module "./Core/Types/Dist" {
	export interface ModuleTypes {
		NetworkPlayer: Player;
		Connection: RBXScriptConnection;
	}
}

/**
 * NexusNet for Roblox
 * @version Roblox-1.0
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
	 * rbx-net 3.x backwards compatibility layer for Nexus
	 *
	 * **NOTE**: This uses the old insecure API, it's recommended you migrate to the new API
	 * @deprecated
	 */
	export const Net3 = NetV3Compat;

	/**
	 * rbx-net 4.x backwards compatibility layer for Nexus
	 *
	 * **NOTE**: This uses an older API, it's recommended you migrate to the new API
	 * @deprecated
	 */
	export const Net4 = NetV4Compat;

	/**
	 * Build an object model
	 */
	export function BuildObjectModel(): RobloxNetworkObjectModelBuilder {
		return new RobloxNetworkObjectModelBuilder();
	}

	/**
	 * Define a remote event
	 * @returns The builder for a remote
	 */
	export function Event(): EventBuilder<[]>;
	export function Event<T extends ReadonlyArray<unknown>>(...values: ToNetworkArguments<T>): EventBuilder<T>;
	export function Event<T extends ReadonlyArray<unknown>>(...values: ToNetworkArguments<T>): EventBuilder<[]> {
		if (values.size() > 0) {
			return new EventBuilder().WithArguments(...values);
		}

		return new EventBuilder();
	}

	/**
	 * Define a remote function
	 */
	export function Function<T extends ReadonlyArray<unknown>, TRet>(
		args: ToNetworkArguments<T>,
		returns: StaticNetworkType<TRet>,
	): FunctionBuilder<T, TRet> {
		return new FunctionBuilder(returns).WithArguments(...args);
	}
}

export default Nexus;

const test = Nexus.BuildObjectModel()
	.AddServer("Test", Nexus.Event(NexusTypes.ArrayOf(NexusTypes.String))) //
	.SetConfiguration({
		EnforceArgumentCount: false,
	})
	.Build();

const test2 = Nexus.Net3.CreateDefinitions({
	X: Nexus.Net3.Definitions.ServerToClientEvent<[]>(),
});

const test3 = Nexus.Net4.BuildDefinition()
	.AddClientOwned("Test", Nexus.Net4.Remote(Nexus.Net4.Types.str)) //
	.Build();
