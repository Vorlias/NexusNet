import { ClientEventLike } from "../Types/Client/NetworkObjects";
import {
	AnyNetworkDeclaration,
	DeclarationRemoteKeys,
	FilterClientDeclarations,
	FilterServerDeclarations,
	OrderedRemoteDeclarations,
} from "../Types/Declarations";
import { InferClientRemote, InferServerRemote } from "../Types/Inference";
import {
	ClientEventDeclaration,
	NetworkModelConfiguration,
	RemoteDeclarations,
	RemoteRunContext,
	ServerEventDeclaration,
	ServerFunctionDeclaration,
} from "../Types/NetworkObjectModel";
import { ServerEventLike } from "../Types/Server/NetworkObjects";
import {
	ClientEventFactory,
	ClientFunctionFactory,
	NexusEventFactories,
	NexusFunctionFactories,
	ServerEventFactory,
	ServerFunctionFactory,
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
	Client: InferClientRemote<FilterClientDeclarations<TDeclarations>[K]>;
	Server: InferServerRemote<FilterServerDeclarations<TDeclarations>[K]>;
}

export class NexusServerContext<TDefinitions extends RemoteDeclarations> implements ServerRemoteContext<TDefinitions> {
	private eventCache = new Map<string, ServerEventLike>();

	private Event: ServerEventFactory;
	private Function: ServerFunctionFactory;

	public constructor(
		private isServer: boolean,
		factories: { event: ServerEventFactory; function: ServerFunctionFactory },
		private declarations: TDefinitions,
		private configuration: NetworkModelConfiguration,
	) {
		this.Event = factories.event;
		this.Function = factories.function;

		if (isServer) {
			this.Init();
		}
	}

	public Init() {
		const ServerEvent = this.Event;
		// const ServerFunction = this.funcFactory.Server;

		for (const [name, declaration] of pairs(this.declarations) as IterableFunction<
			LuaTuple<[name: string, value: AnyNetworkDeclaration]>
		>) {
			if (declaration.Type === "Event") {
				const obj = new ServerEvent(name, declaration as ServerEventDeclaration<never>);
				this.eventCache.set(name, obj);
			}
		}
	}

	public Get<K extends keyof FilterServerDeclarations<TDefinitions> & string>(
		id: K,
	): InferServerRemote<TDefinitions[K]> {
		const obj = this.eventCache.get(id);
		assert(obj);
		return obj as InferServerRemote<TDefinitions[K]>;
	}
}

export class NexusClientContext<TDefinitions extends RemoteDeclarations> implements ClientRemoteContext<TDefinitions> {
	private eventCache = new Map<string, ClientEventLike>();

	private Event: ClientEventFactory;
	private Function: ClientFunctionFactory;

	public constructor(
		private isServer: boolean,
		factories: { event: ClientEventFactory; function: ClientFunctionFactory },
		private declarations: TDefinitions,
		private configuration: NetworkModelConfiguration,
	) {
		this.Event = factories.event;
		this.Function = factories.function;

		if (isServer) {
			this.Init();
		}
	}

	public Init() {
		const ClientEvent = this.Event;
		// const ServerFunction = this.funcFactory.Server;

		for (const [name, declaration] of pairs(this.declarations) as IterableFunction<
			LuaTuple<[name: string, value: AnyNetworkDeclaration]>
		>) {
			if (declaration.Type === "Event") {
				const obj = new ClientEvent(name, declaration as ClientEventDeclaration<never>);
				this.eventCache.set(name, obj);
			}
		}
	}

	public Get<K extends keyof FilterClientDeclarations<TDefinitions> & string>(
		id: K,
	): InferClientRemote<TDefinitions[K]> {
		const obj = this.eventCache.get(id);
		assert(obj);
		return obj as InferClientRemote<TDefinitions[K]>;
	}
}
