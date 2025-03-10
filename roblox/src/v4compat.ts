import { EventBuilder } from "./Builders/EventBuilder";
import { FunctionBuilder } from "./Builders/FunctionBuilder";
import { RobloxNetworkObjectModelBuilder } from "./Builders/ObjectModelBuilder";
import { NEXUS_VERSION } from "./Core/CoreInfo";
import { ServerCallbackMiddleware } from "./Core/Middleware/Types";
import { AnyNetworkDeclaration, FilterClientDeclarations, FilterServerDeclarations } from "./Core/Types/Declarations";
import {
	ClientBuilder,
	ContextNetworkModel,
	RemoteDeclarations,
	RemoteRunContext,
	ServerBuilder,
} from "./Core/Types/NetworkObjectModel";
import { StaticNetworkType, ToNetworkArguments } from "./Core/Types/NetworkTypes";
import { Identity, MergeIdentity, Named } from "./Core/Types/Utility";
import { NexusTypes } from "./RobloxTypes";

namespace Net4TypeCompat {
	export const number = NexusTypes.Float32;
	export const str = NexusTypes.String;
	export const boolean = NexusTypes.Boolean;
	export const optional = NexusTypes.Optional;

	export const Vector3 = NexusTypes.Vector3;
	export const Vector2 = NexusTypes.Vector2;
	export const Color3 = NexusTypes.Color3;
	// export const Font = undefined;
	export const Vector3int16 = NexusTypes.Vector3int16;
	export const Vector2int16 = NexusTypes.Vector2int16;
	export const NumberSequence = NexusTypes.NumberSequence;
	export const ColorSequence = NexusTypes.ColorSequence;
	export const DateTime = NexusTypes.DateTime;
	// export const Ray = undefined;
	export const NumberRange = NexusTypes.NumberRange;
	export const CFrame = NexusTypes.CFrame;

	export const integer = NexusTypes.Int32;
	export const u8 = NexusTypes.UInt8;
	export const u16 = NexusTypes.UInt16;
	export const u32 = NexusTypes.UInt32;
	export const i8 = NexusTypes.Int8;
	export const i16 = NexusTypes.Int16;
	export const i32 = NexusTypes.Int32;

	export const struct = NexusTypes.Interface;
	export const InstanceIsA = NexusTypes.InstanceOf;
	export const Player = NexusTypes.Player;

	export const array = NexusTypes.ArrayOf;

	export const Instance = NexusTypes.Instance;
}

namespace Net4DefinitionsCompat {
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

	/**
	 * Creates definitions for Remote instances that can be used on both the client and server.
	 * @description https://docs.vorlias.com/rbx-net/docs/3.0/definitions#definitions-oh-my
	 * @param declarations
	 * @deprecated Use `Create().Add(declarations)`
	 */
	export function Create<T extends RemoteDeclarations>(
		declarations: T,
		configuration?: Net4DefinitionsCompat.DefinitionConfiguration,
	): ContextNetworkModel<T>;
	/**
	 * Creates definitions using the new net definitions builder
	 *
	 * @version 4.0
	 */
	export function Create(): Net4DefinitionBuilder<defined>;
	export function Create(
		declarations?: RemoteDeclarations,
		configuration?: Net4DefinitionsCompat.DefinitionConfiguration,
	): ContextNetworkModel<RemoteDeclarations> | Net4DefinitionBuilder<defined> {
		if (declarations) {
			let model = new Net4DefinitionBuilder().SetConfiguration({
				ServerCallbackMiddleware: configuration?.ServerGlobalMiddleware,
				ClientGetShouldYield: configuration?.ClientGetShouldYield ?? true,
				MicroprofileCallbacks: configuration?.MicroprofileCallbacks,
				UseBuffers: false,
			});

			for (const [key, value] of pairs(declarations) as IterableFunction<
				LuaTuple<[string, RemoteDeclarations[keyof RemoteDeclarations]]>
			>) {
				if (value.Type === "Event") {
					const eventBuilder = new EventBuilder();

					if (value.RunContext === RemoteRunContext.Server) {
						model = model.AddServer(key, eventBuilder) as Net4DefinitionBuilder<defined>;
					} else {
						model = model.AddClient(key, eventBuilder) as Net4DefinitionBuilder<defined>;
					}
				} else {
					// TODO:
				}
			}

			return model.Build();
		} else {
			return new Net4DefinitionBuilder();
		}
	}
}

class Net4FunctionBuilder<T extends ReadonlyArray<unknown>, TRet> extends FunctionBuilder<T, TRet> {}

class Net4EventBuilder<T extends ReadonlyArray<unknown>> extends EventBuilder<T> {
	WhichReturnsAsync<TRet>(value: StaticNetworkType<TRet>): Net4FunctionBuilder<T, TRet> {
		const fb = new Net4FunctionBuilder(value);
		fb.arguments = this.arguments;
		return fb;
	}
}

class Net4DefinitionBuilder<T extends RemoteDeclarations> extends RobloxNetworkObjectModelBuilder<T> {
	/**
	 * @deprecated
	 */
	AddServerOwned<TName extends string, TNomRemote extends AnyNetworkDeclaration>(
		id: TName,
		declaration: ServerBuilder<TNomRemote>,
	): RobloxNetworkObjectModelBuilder<MergeIdentity<Identity<Named<TName, TNomRemote>>, T>> {
		return this.AddServer(id, declaration);
	}

	/**
	 * @deprecated
	 */
	AddClientOwned<TName extends string, TNomRemote extends AnyNetworkDeclaration>(
		id: TName,
		declaration: ClientBuilder<TNomRemote>,
	): RobloxNetworkObjectModelBuilder<MergeIdentity<Identity<Named<TName, TNomRemote>>, T>> {
		return this.AddClient(id, declaration);
	}

	/** @deprecated */
	AddLegacyDefinitions<TAddDeclarations extends RemoteDeclarations>(declarations: TAddDeclarations) {
		return this as unknown as Net4DefinitionBuilder<MergeIdentity<T, TAddDeclarations>>;
	}
}

/**
 * Net 4.x compat layer
 */
namespace NetV4Compat {
	export const VERSION = `Nexus ${NEXUS_VERSION} (Net-4.0-compat)`;

	export const Definitions = Net4DefinitionsCompat;
	export const Types = Net4TypeCompat;

	export namespace Util {
		/**
		 * Returns a `key -> value` type map of remotes in the specified declaration, mapped to server objects.
		 *
		 * ```ts
		 * type GlobalNamespace = Net.Util.GetDeclarationDefinitions<typeof Remotes>;
		 * type ServerGlobalRemotes = Net.Util.GetServerRemotes<GlobalNamespace>;
		 * ```
		 */
		export type GetServerRemotes<T extends RemoteDeclarations> = FilterServerDeclarations<T>;
		/**
		 * Returns a `key -> value` type map of remotes in the specified declaration, mapped to client objects.
		 *
		 * ```ts
		 * type GlobalNamespace = Net.Util.GetDeclarationDefinitions<typeof Remotes>;
		 * type ClientGlobalRemotes = Net.Util.GetClientRemotes<GlobalNamespace>;
		 * ```
		 */
		export type GetClientRemotes<T extends RemoteDeclarations> = FilterClientDeclarations<T>;

		// export type GetServerRemoteKeys<T extends RemoteDeclarations> = keyof GetServerRemotes<T>;
		// export type GetClientRemoteKeys<T extends RemoteDeclarations> = keyof GetServerRemotes<T>;
	}

	export function Remote(): Net4EventBuilder<[]>;
	export function Remote<T extends ReadonlyArray<unknown>>(): Net4EventBuilder<T>;
	export function Remote<T extends ReadonlyArray<unknown>>(...typeChecks: ToNetworkArguments<T>): Net4EventBuilder<T>;
	export function Remote<T extends ReadonlyArray<unknown>>(
		...typeChecks: ToNetworkArguments<T>
	): Net4EventBuilder<T> {
		if (typeChecks.size() === 0) {
			return new Net4EventBuilder();
		}

		return new Net4EventBuilder().WithArguments(...(typeChecks as never)) as Net4EventBuilder<T>;
	}

	export function UnreliableRemote(): Net4EventBuilder<[]>;
	export function UnreliableRemote<T extends ReadonlyArray<unknown>>(): Net4EventBuilder<T>;
	export function UnreliableRemote<T extends ReadonlyArray<unknown>>(
		...typeChecks: ToNetworkArguments<T>
	): Net4EventBuilder<T>;
	export function UnreliableRemote<T extends ReadonlyArray<unknown>>(
		...typeChecks: ToNetworkArguments<T>
	): Net4EventBuilder<T> {
		if (typeChecks.size() === 0) {
			return new Net4EventBuilder().AsUnreliable();
		}

		return new Net4EventBuilder().AsUnreliable().WithArguments(...(typeChecks as never)) as Net4EventBuilder<T>;
	}

	export const BuildDefinition = Net4DefinitionsCompat.Create;
	/**
	 * @deprecated
	 */
	export const CreateDefinitions = Net4DefinitionsCompat.Create;
}
export default NetV4Compat;
