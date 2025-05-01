import { NexusConfiguration } from "../Core/Configuration";
import {
	ClientFunctionDeclaration,
	NetworkFunctionBuilder,
	NetworkModelConfiguration,
	RemoteRunContext,
	ServerFunctionDeclaration,
} from "../Core/Types/NetworkObjectModel";
import { StaticNetworkType, ToNetworkArguments } from "../Core/Types/NetworkTypes";

export class AirshipFunctionBuilder<TArgs extends ReadonlyArray<unknown>, TRet>
	implements NetworkFunctionBuilder<TArgs, TRet>
{
	unreliable = false;
	useBuffer = false;
	arguments: StaticNetworkType[] = [];

	constructor(public returns: StaticNetworkType) {}

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
	): AirshipFunctionBuilder<T, TRet> {
		this.arguments = values as StaticNetworkType<TArgs>[];
		return this;
	}

	WhichReturns<R>(returnValue: StaticNetworkType<R>): AirshipFunctionBuilder<TArgs, R> {
		this.returns = returnValue;
		return this;
	}

	OnServer(configuration: NetworkModelConfiguration): ServerFunctionDeclaration<TArgs, TRet> {
		const flags = NexusConfiguration.EncodeConfigFlags({
			UseBufferSerialization: configuration.UseBuffers || this.useBuffer,
			EnforceArgumentCount: configuration.EnforceArgumentCount ?? true,
			Debugging: configuration.Debugging,
			Logging: configuration.Logging,
		});

		return {
			Type: "Function",
			RunContext: RemoteRunContext.Server,
			Flags: flags,
			Arguments: this.arguments,
			Returns: this.returns,
		};
	}

	OnClient(configuration: NetworkModelConfiguration): ClientFunctionDeclaration<TArgs, TRet> {
		const flags = NexusConfiguration.EncodeConfigFlags({
			UseBufferSerialization: configuration.UseBuffers || this.useBuffer,
			EnforceArgumentCount: configuration.EnforceArgumentCount ?? true,
			Debugging: configuration.Debugging,
			Logging: configuration.Logging,
		});

		return {
			Type: "Function",
			RunContext: RemoteRunContext.Client,
			Flags: flags,
			Arguments: this.arguments,
			Returns: this.returns,
		};
	}
}
