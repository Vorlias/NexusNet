import {
	ClientEventDeclaration,
	ServerMiddleware,
	NetworkClientEventBuilder,
	NetworkEventBuilder,
	NetworkingFlags,
	NetworkModelConfiguration,
	NetworkServerEventBuilder,
	RemoteRunContext,
	ServerBuilder,
	ServerEventDeclaration,
	ServerMiddlewareBuilder,
	ClientMiddlewareBuilder,
} from "../Core/Types/NetworkObjectModel";
import { StaticNetworkType, ToNetworkArguments } from "../Core/Types/NetworkTypes";
import { NexusConfiguration } from "../Core/Configuration";
import {
	ClientCallbackMiddleware,
	ClientInvokeMiddleware,
	ServerCallbackMiddleware,
	ServerInvokeMiddleware,
} from "../Core/Middleware/Types";

export class AirshipEventBuilder<TArgs extends ReadonlyArray<unknown>> implements NetworkEventBuilder<TArgs> {
	unreliable = false;
	useBuffer = false;

	private arguments: StaticNetworkType[] | undefined;
	private callbackMiddleware: Callback[] = [];
	private invokeMiddleware: Callback[] = [];

	SetUseBuffer(useBuffer: boolean): this {
		this.useBuffer = useBuffer;
		return this;
	}

	AsUnreliable(): this {
		this.unreliable = true;
		return this;
	}

	public WithArguments<T extends ReadonlyArray<unknown> = TArgs>(
		...values: ToNetworkArguments<T>
	): AirshipEventBuilder<T> {
		this.arguments = values as StaticNetworkType<TArgs>[];
		return this as never as AirshipEventBuilder<T>;
	}

	WithServerMiddleware(
		build: (builder: ServerMiddlewareBuilder<TArgs>) => ServerMiddlewareBuilder<TArgs>,
	): NetworkServerEventBuilder<TArgs> {
		const builder: ServerMiddlewareBuilder<TArgs> = {
			OnClientCallback: (callback: ClientCallbackMiddleware<TArgs>) => {
				this.callbackMiddleware.push(callback);
				return builder as unknown as ServerMiddlewareBuilder<TArgs>;
			},
			OnServerInvoke: (callback: ServerInvokeMiddleware<TArgs>) => {
				this.invokeMiddleware.push(callback);
				return builder as unknown as ServerMiddlewareBuilder<TArgs>;
			},
		};

		build(builder);
		return this as never as NetworkServerEventBuilder<TArgs>;
	}

	WithClientMiddleware(
		build: (builder: ClientMiddlewareBuilder<TArgs>) => ClientMiddlewareBuilder<TArgs>,
	): NetworkClientEventBuilder<TArgs> {
		const builder: ClientMiddlewareBuilder<TArgs> = {
			OnServerCallback: <TOut extends ReadonlyArray<unknown> = TArgs>(
				callback: ServerCallbackMiddleware<TArgs, TOut>,
			) => {
				this.callbackMiddleware.push(callback);
				return builder as unknown as ClientMiddlewareBuilder<TOut>;
			},
			OnClientInvoke: (callback: ClientInvokeMiddleware<TArgs>) => {
				this.invokeMiddleware.push(callback);
				return builder as unknown as ClientMiddlewareBuilder<TArgs>;
			},
		};

		build(builder);
		return this as never as NetworkClientEventBuilder<TArgs>;
	}

	OnServer(configuration: NetworkModelConfiguration): ServerEventDeclaration<TArgs> {
		const flags = NexusConfiguration.EncodeConfigFlags({
			UseBufferSerialization: configuration.UseBuffers || this.useBuffer,
			EnforceArgumentCount: configuration.EnforceArgumentCount ?? true,
			Debugging: configuration.Debugging,
			Logging: configuration.Logging,
		});

		const declaration: ServerEventDeclaration<TArgs> = {
			Type: "Event",
			Flags: flags,
			RunContext: RemoteRunContext.Server,
			Arguments: this.arguments,
			CallbackMiddleware: this.callbackMiddleware,
			InvokeMiddleware: [],
			Unreliable: this.unreliable,
		};

		return table.freeze(declaration);
	}

	OnClient(configuration: NetworkModelConfiguration): ClientEventDeclaration<TArgs> {
		const flags = NexusConfiguration.EncodeConfigFlags({
			UseBufferSerialization: configuration.UseBuffers && this.useBuffer,
			EnforceArgumentCount: configuration.EnforceArgumentCount ?? true,
			Debugging: configuration.Debugging,
			Logging: configuration.Logging,
		});

		const declaration: ClientEventDeclaration<TArgs> = {
			Type: "Event",
			Flags: flags,
			RunContext: RemoteRunContext.Client,
			CallbackMiddleware: this.callbackMiddleware,
			InvokeMiddleware: [],
			Arguments: this.arguments,
			Unreliable: this.unreliable,
		};

		return table.freeze(declaration);
	}
}
