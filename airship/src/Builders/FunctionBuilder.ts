import { NexusConfiguration } from "../Core/Configuration";
import { createCachingMiddleware, CachingOptions, CacheType } from "../Core/Middleware/FunctionCaching";
import { RateLimitOptions } from "../Core/Middleware/RateLimit";
import { ClientFunctionInvokeMiddleware, ServerFunctionCallbackMiddleware } from "../Core/Middleware/Types";
import {
	ClientFunctionDeclaration,
	NetworkFunctionBuilder,
	NetworkModelConfiguration,
	RemoteRunContext,
	ServerFunctionDeclaration,
} from "../Core/Types/NetworkObjectModel";
import { NetworkType, ToNetworkArguments } from "../Core/Types/NetworkTypes";
import { NexusTimeSpan } from "../Core/Types/Time";

export class AirshipFunctionBuilder<TArgs extends ReadonlyArray<unknown>, TRet>
	implements NetworkFunctionBuilder<TArgs, TRet>
{
	useBuffer = false;
	arguments: NetworkType.Any[] = [];
	serverMiddleware: ServerFunctionCallbackMiddleware[] = [];
	clientMiddleware: ClientFunctionInvokeMiddleware[] = [];
	timeout = NexusTimeSpan.seconds(10);

	constructor(public returns: NetworkType.Any) {}

	SetUseBuffer(useBuffer: boolean): this {
		this.useBuffer = useBuffer;
		return this;
	}

	public WithArguments<T extends ReadonlyArray<unknown> = TArgs>(
		...values: ToNetworkArguments<T>
	): AirshipFunctionBuilder<T, TRet> {
		this.arguments = values as NetworkType.OfType<TArgs>[];
		return this;
	}

	/**
	 * Sets the timeout for this function for if no result is given from the server
	 * @param [timeout=10] The seconds to timeout with
	 * @deprecated Not yet implemented
	 * @returns
	 */
	public WithCallTimeout(timeout: NexusTimeSpan) {
		assert(timeout.seconds > 0, "Timeout must be positive number greater than zero");
		this.timeout = timeout;
		return this;
	}

	/**
	 * Will cache the result of this function for the given amount of time, globally.
	 *
	 * Use the custom options overload to do it per player
	 * @param cacheTime The amount of seconds to cache the result for
	 */
	public WithCachedCallback(cacheTime: NexusTimeSpan): this;
	/**
	 * Wil cache the result of this function for the given amount of time
	 *
	 * @param options The options for the caching
	 */
	public WithCachedCallback(options: CachingOptions): this;
	public WithCachedCallback(memoizationOptions: NexusTimeSpan | CachingOptions) {
		let middleware = NexusTimeSpan.is(memoizationOptions)
			? createCachingMiddleware({
					time: memoizationOptions,
					type: CacheType.Global,
			  })
			: createCachingMiddleware(memoizationOptions);

		this.serverMiddleware.push(middleware.serverCallback);
		return this;
	}

	public WithServerCallbackMiddleware<UArgs extends TArgs, URet extends TRet>(
		middleware: ServerFunctionCallbackMiddleware<UArgs, URet>,
	) {
		this.serverMiddleware.push(middleware as ServerFunctionCallbackMiddleware<any>);
		return this;
	}

	WhichReturns<R>(returnValue: NetworkType.OfType<R>): AirshipFunctionBuilder<TArgs, R> {
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
			ServerCallbackMiddleware: this.serverMiddleware,
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
			TimeoutSeconds: this.timeout.seconds,
			Arguments: this.arguments,
			ClientInvokeMiddleware: this.clientMiddleware,
			Returns: this.returns,
		};
	}
}
