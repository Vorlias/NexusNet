import { EventBuilder } from "../../Builders/EventBuilder";
import { FunctionBuilder } from "../../Builders/FunctionBuilder";
import { RobloxContextNetworkModel, RobloxNetworkObjectModelBuilder } from "../../Builders/ObjectModelBuilder";
import { NEXUS_VERSION } from "../../Core/CoreInfo";
import { RemoteContext } from "../../Core/Generators/RemoteContext";
import { ServerCallbackMiddleware } from "../../Core/Middleware/Types";
import {
	AnyNetworkDeclaration,
	DeclarationRemoteKeys,
	FilterClientDeclarations,
	FilterServerDeclarations,
} from "../../Core/Types/Declarations";
import {
	ClientBuilder,
	ContextNetworkModel,
	NetworkModelConfiguration,
	NetworkObjectDeclaration,
	NetworkObjectModelBuilder,
	RemoteDeclarations,
	RemoteRunContext,
	ServerBuilder,
} from "../../Core/Types/NetworkObjectModel";
import { StaticNetworkType, ToNetworkArguments } from "../../Core/Types/NetworkTypes";
import { Identity, MergeIdentity, Named } from "../../Core/Types/Utility";
import { NexusTypes } from "../../RobloxTypes";
import { RobloxNetworkModelConfiguration } from "../../NOM/NetworkObjectModel";

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

	export const array = NexusTypes.Array;
	export const map = NexusTypes.Map;
	export const set = NexusTypes.Set;
	export const tuple = NexusTypes.Tuple;
	export const literal = NexusTypes.Literal;
	export const enumerable = NexusTypes.StringEnum;

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
	export function Create(): NetDefinitionBuilder<defined>;
	export function Create(
		declarations?: RemoteDeclarations,
		configuration?: Net4DefinitionsCompat.DefinitionConfiguration,
	): ContextNetworkModel<RemoteDeclarations> | NetDefinitionBuilder<defined> {
		if (declarations) {
			let model = new NetDefinitionBuilder().SetConfiguration({
				ServerCallbackMiddleware: configuration?.ServerGlobalMiddleware,
				// ClientGetShouldYield: configuration?.ClientGetShouldYield ?? true,
				// MicroprofileCallbacks: configuration?.MicroprofileCallbacks,
				UseBuffers: false,
				EnforceArgumentCount: false,
			});

			for (const [key, value] of pairs(declarations) as IterableFunction<
				LuaTuple<[string, RemoteDeclarations[keyof RemoteDeclarations]]>
			>) {
				if (value.Type === "Event") {
					const eventBuilder = new EventBuilder();

					if (value.RunContext === RemoteRunContext.Server) {
						model = model.AddServerOwned(key, eventBuilder) as NetDefinitionBuilder<defined>;
					} else {
						model = model.AddClientOwned(key, eventBuilder) as NetDefinitionBuilder<defined>;
					}
				} else {
					// TODO:
				}
			}

			return model.Build();
		} else {
			return new NetDefinitionBuilder();
		}
	}
}

class Net4FunctionBuilder<T extends ReadonlyArray<unknown>, TRet> extends FunctionBuilder<T, TRet> {}

class NetEventBuilder<T extends ReadonlyArray<unknown>> extends EventBuilder<T> {
	WhichReturnsAsync<TRet>(value: StaticNetworkType<TRet>): Net4FunctionBuilder<T, TRet> {
		const fb = new Net4FunctionBuilder(value);
		fb.arguments = this.arguments;
		return fb;
	}
}

type InferDeclarations<T> = T extends NetDefinitionBuilder<infer D, infer N> ? D : never;
type InferNamespace<T> = T extends NetDefinitionBuilder<infer D, infer N> ? N : never;

interface NetContextModel<T extends RemoteDeclarations, M> extends RobloxContextNetworkModel<T> {
	GetNamespace<K extends keyof M>(this: void, ns: K): NetContextModel<InferDeclarations<M[K]>, InferNamespace<M[K]>>;
}

export type InferModel<T> = T extends NetDefinitionBuilder<infer T> ? T : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type None = {};

/**
 * A wrapper around Nexus matching the Net4 API
 */
class NetDefinitionBuilder<
	T extends RemoteDeclarations,
	N extends { [name: string]: NetDefinitionBuilder<Any, Any> } = None,
> {
	private prefix = "";
	private nexus = new RobloxNetworkObjectModelBuilder<T>();
	private namespaces = new Map<string, NetContextModel<RemoteDeclarations, Any>>();

	private WithPrefix(prefix: string) {
		this.prefix = prefix;
		return this;
	}

	SetConfiguration(
		configuration: Partial<RobloxNetworkModelConfiguration & Net4DefinitionsCompat.DefinitionConfiguration>,
	): this {
		this.nexus.SetConfiguration({
			...configuration,
		});
		return this;
	}

	AddClientOwned<TName extends string, TNomRemote extends NetworkObjectDeclaration>(
		id: TName,
		declaration: ClientBuilder<TNomRemote>,
	): NetDefinitionBuilder<Identity<Named<TName, TNomRemote> & T>, N> {
		this.nexus.AddClient([this.prefix, id].join("/"), declaration);
		return this as never;
	}

	AddServerOwned<TName extends string, TNomRemote extends NetworkObjectDeclaration>(
		id: TName,
		declaration: ServerBuilder<TNomRemote>,
	): NetDefinitionBuilder<Identity<Named<TName, TNomRemote> & T>, N> {
		this.nexus.AddServer([this.prefix, id].join("/"), declaration);
		return this as never;
	}

	AddNamespace<K extends string, M extends NetDefinitionBuilder<Any, Any>>(
		name: K,
		model: M,
	): NetDefinitionBuilder<T, Identity<{ [P in K]: M } & N>> {
		const defs = model.WithPrefix(name).Build();
		this.namespaces.set([this.prefix, name].join("/"), defs);

		return this as never;
	}

	Build(): NetContextModel<T, N> {
		const model = this.nexus.Build();
		const prefix = this.prefix;
		const namespaces = this.namespaces;

		return {
			Server: model.Server,
			Client: model.Client,
			Get<K extends DeclarationRemoteKeys<T>>(key: K) {
				const id = [prefix, key].join("/");
				return model.Get(id as typeof key);
			},
			GetNamespace(k) {
				const id = [prefix, k].join("/");
				const ns = namespaces.get(id);
				assert(ns);
				return ns;
			},
		};
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

	export function Remote(): NetEventBuilder<[]>;
	export function Remote<T extends ReadonlyArray<unknown>>(): NetEventBuilder<T>;
	export function Remote<T extends ReadonlyArray<unknown>>(...typeChecks: ToNetworkArguments<T>): NetEventBuilder<T>;
	export function Remote<T extends ReadonlyArray<unknown>>(
		...typeChecks: ToNetworkArguments<T>
	): NetEventBuilder<T> {
		if (typeChecks.size() === 0) {
			return new NetEventBuilder();
		}

		return new NetEventBuilder().WithArguments(...(typeChecks as never)) as NetEventBuilder<T>;
	}

	export function UnreliableRemote(): NetEventBuilder<[]>;
	export function UnreliableRemote<T extends ReadonlyArray<unknown>>(): NetEventBuilder<T>;
	export function UnreliableRemote<T extends ReadonlyArray<unknown>>(
		...typeChecks: ToNetworkArguments<T>
	): NetEventBuilder<T>;
	export function UnreliableRemote<T extends ReadonlyArray<unknown>>(
		...typeChecks: ToNetworkArguments<T>
	): NetEventBuilder<T> {
		if (typeChecks.size() === 0) {
			return new NetEventBuilder().AsUnreliable() as unknown as NetEventBuilder<T>;
		}

		return new NetEventBuilder().AsUnreliable().WithArguments(...(typeChecks as never)) as NetEventBuilder<T>;
	}

	export const BuildDefinition = Net4DefinitionsCompat.Create;
	/**
	 * @deprecated
	 */
	export const CreateDefinitions = Net4DefinitionsCompat.Create;
}

export default NetV4Compat;
