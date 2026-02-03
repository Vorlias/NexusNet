import { NexusConfiguration } from "../Core/Configuration";
import {
	ClientEventDeclaration,
	ClientMiddlewareBuilder,
	NetworkClientEventBuilder,
	NetworkEventBuilder,
	NetworkModelConfiguration,
	NetworkServerEventBuilder,
	RemoteRunContext,
	ServerEventDeclaration,
	ServerMiddlewareBuilder,
} from "../Core/Types/NetworkObjectModel";
import { StaticNetworkType, ToNetworkArguments } from "../Core/Types/NetworkTypes";

export class EventBuilder<TArgs extends ReadonlyArray<unknown>> implements NetworkEventBuilder<TArgs> {
	unreliable = false;
	useBuffer = false;
	arguments: StaticNetworkType[] | undefined;

	SetUseBuffer(useBuffer: boolean): this {
		this.useBuffer = useBuffer;
		return this;
	}

	AsUnreliable(): this {
		this.unreliable = true;
		return this;
	}

	public WithArguments<T extends ReadonlyArray<unknown> = TArgs>(...values: ToNetworkArguments<T>): EventBuilder<T> {
		this.arguments = values as StaticNetworkType<TArgs>[];
		return this as never as EventBuilder<T>;
	}

	WithClientMiddleware(
		mwb: (builder: ClientMiddlewareBuilder<TArgs>) => ClientMiddlewareBuilder<TArgs>,
	): NetworkClientEventBuilder<TArgs> {
		throw `TODO IMPLEMENT`;
	}

	WithServerMiddleware(
		mwb: (builder: ServerMiddlewareBuilder<TArgs>) => ServerMiddlewareBuilder<TArgs>,
	): NetworkServerEventBuilder<TArgs> {
		throw `TODO IMPLEMENT`;
	}

	OnServer(configuration: NetworkModelConfiguration): ServerEventDeclaration<TArgs> {
		const flags = NexusConfiguration.EncodeConfigFlags({
			UseBufferSerialization: configuration.UseBuffers && this.useBuffer,
			EnforceArgumentCount: configuration.EnforceArgumentCount ?? true,
			Debugging: configuration.Debugging,
			Logging: configuration.Logging,
		});

		const declaration: ServerEventDeclaration<TArgs> = {
			Type: "Event",
			Flags: flags,
			RunContext: RemoteRunContext.Server,
			Arguments: this.arguments,
			CallbackMiddleware: [],
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
			Arguments: this.arguments,
			RunContext: RemoteRunContext.Client,
			CallbackMiddleware: [],
			InvokeMiddleware: [],
			Unreliable: this.unreliable,
		};

		return table.freeze(declaration);
	}
}
