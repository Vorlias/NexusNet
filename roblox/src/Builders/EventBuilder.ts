import {
	ClientEventDeclaration,
	NetworkEventBuilder,
	NetworkModelConfiguration,
	RemoteRunContext,
	ServerEventDeclaration,
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
		return this;
	}

	OnServer(configuration: NetworkModelConfiguration): ServerEventDeclaration<TArgs> {
		return {
			Type: "Event",
			RunContext: RemoteRunContext.Server,
			UseBufferSerialization: configuration.UseBuffers,
			Debugging: configuration.Logging,
			Arguments: this.arguments,
			CallbackMiddleware: [],
			InvokeMiddleware: [],
			Unreliable: this.unreliable,
		};
	}

	OnClient(configuration: NetworkModelConfiguration): ClientEventDeclaration<TArgs> {
		return {
			Type: "Event",
			RunContext: RemoteRunContext.Client,
			UseBufferSerialization: configuration.UseBuffers,
			Debugging: configuration.Logging,
			CallbackMiddleware: [],
			InvokeMiddleware: [],
			Unreliable: this.unreliable,
		};
	}
}
