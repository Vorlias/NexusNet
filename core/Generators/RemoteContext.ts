import { ClientEventLike, ClientFunctionLike } from "../Types/Client/NetworkObjects";
import {
	AnyNetworkDeclaration,
	DeclarationRemoteKeys,
	FilterClientDeclarations,
	FilterServerDeclarations,
} from "../Types/Declarations";
import { InferClientRemote, InferServerRemote } from "../Types/Inference";
import {
	ClientEventDeclaration,
	ClientFunctionDeclaration,
	CrossServerEventDeclaration,
	NetworkModelConfiguration,
	RemoteDeclarations,
	ServerEventDeclaration,
	ServerFunctionDeclaration,
} from "../Types/NetworkObjectModel";
import { ServerBroadcaster, ServerEventLike, ServerFunctionLike } from "../Types/Server/NetworkObjects";
import {
	ClientEventFactory,
	ClientFunctionFactory,
	ServerEventFactory,
	ServerFunctionFactory,
	ServerMessagingFactory,
} from "./Factories";

export interface ServerRemoteContext<TDefinitions extends RemoteDeclarations> {
	Get<K extends keyof FilterServerDeclarations<TDefinitions> & string>(id: K): InferServerRemote<TDefinitions[K]>;
}

export interface ClientRemoteContext<TDefinitions extends RemoteDeclarations> {
	Get<K extends keyof FilterClientDeclarations<TDefinitions> & string>(id: K): InferClientRemote<TDefinitions[K]>;
}

export interface RemoteContext<
	TDeclarations extends RemoteDeclarations,
	K extends DeclarationRemoteKeys<TDeclarations>,
> {
	Client: InferClientRemote<TDeclarations[K]>;
	Server: InferServerRemote<TDeclarations[K]>;
}

interface NexusServerObjectFactories {
	event: ServerEventFactory;
	function: ServerFunctionFactory;
	messaging?: ServerMessagingFactory;
}

interface NexusClientObjectFactories {
	event: ClientEventFactory;
	function: ClientFunctionFactory;
}

export class NexusServerContext<TDefinitions extends RemoteDeclarations> implements ServerRemoteContext<TDefinitions> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private eventCache = new Map<string, ServerEventLike | ServerBroadcaster<any>>();
	private functionCache = new Map<string, ServerFunctionLike>();

	private Event: ServerEventFactory;
	private Function: ServerFunctionFactory;
	private Messaging?: ServerMessagingFactory;

	public constructor(
		private readonly scope: string,
		isServer: boolean,
		factories: NexusServerObjectFactories,
		private declarations: TDefinitions,
		private configuration: NetworkModelConfiguration,
	) {
		this.Event = factories.event;
		this.Function = factories.function;
		this.Messaging = factories.messaging;

		if (isServer) this.Init();
		table.freeze(this);
	}

	public Init() {
		const ServerEvent = this.Event;
		const ServerFunction = this.Function;
		const CrossMessagingEvent = this.Messaging;

		for (const [name, declaration] of pairs(this.declarations) as IterableFunction<
			LuaTuple<[name: string, value: AnyNetworkDeclaration]>
		>) {
			let id = `${this.scope}:${name}`;

			if (declaration.Type === "Event") {
				const obj = new ServerEvent(id, declaration as ServerEventDeclaration<never>);
				this.eventCache.set(id, obj);
			} else if (declaration.Type === "Function") {
				const obj = new ServerFunction(id, declaration as ServerFunctionDeclaration<never, never>);
				this.functionCache.set(id, obj);
			} else if (declaration.Type === "Messaging" && CrossMessagingEvent) {
				const obj = new CrossMessagingEvent(id, declaration);
				this.eventCache.set(id, obj);
			}
		}

		table.freeze(this.eventCache);
		table.freeze(this.functionCache);
	}

	public Get<K extends keyof FilterServerDeclarations<TDefinitions> & string>(
		key: K,
	): InferServerRemote<TDefinitions[K]> {
		let id = `${this.scope}:${key}`;

		const obj = this.eventCache.get(id) ?? this.functionCache.get(id);
		assert(obj, `Failed to get server network object with id '${id}'`);
		return obj as InferServerRemote<TDefinitions[K]>;
	}
}

export class NexusClientContext<TDefinitions extends RemoteDeclarations> implements ClientRemoteContext<TDefinitions> {
	private eventCache = new Map<string, ClientEventLike>();
	private functionCache = new Map<string, ClientFunctionLike>();

	private Event: ClientEventFactory;
	private Function: ClientFunctionFactory;

	public constructor(
		private readonly scope: string,
		isClient: boolean,
		factories: NexusClientObjectFactories,
		private declarations: TDefinitions,
		private configuration: NetworkModelConfiguration,
	) {
		this.Event = factories.event;
		this.Function = factories.function;

		if (isClient) this.Init();
		table.freeze(this);
	}

	public Init() {
		const ClientEvent = this.Event;
		const ClientFunction = this.Function;
		// const ServerFunction = this.funcFactory.Server;

		for (const [name, declaration] of pairs(this.declarations) as IterableFunction<
			LuaTuple<[name: string, value: AnyNetworkDeclaration]>
		>) {
			let id = `${this.scope}:${name}`;

			if (declaration.Type === "Event") {
				const obj = new ClientEvent(id, declaration as ClientEventDeclaration<never>);
				this.eventCache.set(id, obj);
			} else if (declaration.Type === "Function") {
				const obj = new ClientFunction(id, declaration as ClientFunctionDeclaration<never, never>);
				this.functionCache.set(id, obj);
			}
		}

		table.freeze(this.eventCache);
		table.freeze(this.functionCache);
	}

	public Get<K extends keyof FilterClientDeclarations<TDefinitions> & string>(
		key: K,
	): InferClientRemote<TDefinitions[K]> {
		let id = `${this.scope}:${key}`;

		const obj = this.eventCache.get(id) ?? this.functionCache.get(id);
		assert(obj, `Failed to get client network object with id '${id}'`);
		return obj as InferClientRemote<TDefinitions[K]>;
	}
}
