import {
	ClientFunctionDeclaration,
	NetworkFunctionBuilder,
	NetworkModelConfiguration,
	ServerFunctionDeclaration,
} from "../Core/Types/NetworkObjectModel";
import { StaticNetworkType, ToNetworkArguments } from "../Core/Types/NetworkTypes";

export class AirshipFunctionBuilder<TArgs extends ReadonlyArray<unknown>, TRet>
	implements NetworkFunctionBuilder<TArgs, TRet>
{
	unreliable = false;
	useBuffer = false;

	private arguments: StaticNetworkType[] | undefined;

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
		return {
			Type: "Function",
			// RunContext: RemoteRunContext.Server,
			UseBufferSerialization: configuration.UseBuffers,
			Debugging: configuration.Logging,
			// Arguments: this.arguments,
			// CallbackMiddleware: [],
			// InvokeMiddleware: [],
			// Unreliable: this.unreliable,
		};
	}

	OnClient(configuration: NetworkModelConfiguration): ClientFunctionDeclaration<TArgs, TRet> {
		return {
			Type: "Function",
			// RunContext: RemoteRunContext.Client,
			UseBufferSerialization: configuration.UseBuffers,
			Debugging: configuration.Logging,
			// CallbackMiddleware: [],
			// InvokeMiddleware: [],
			// Unreliable: this.unreliable,
		};
	}
}
