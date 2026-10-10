import { ServerFunctionCallbackMiddleware } from "../Middleware";
import { NOM, RemoteRunContext } from "../NetworkObjectModel";
import { NetworkType } from "../Types/NetworkType";

// export interface ClientFunctionBuilder<R extends unknown, T extends readonly unknown[]> extends NOM.ClientBuilder<
// 	NOM.ClientFunctionDeclaration<T, R>
// > {}
export interface ServerFunctionBuilder<R extends unknown, T extends readonly unknown[]> extends NOM.ServerBuilder<
	NOM.ServerFunctionDeclaration<T, R>
> {}

export class NexusFunctionBuilder<
	TRet extends defined,
	TArgs extends ReadonlyArray<unknown>,
> implements ServerFunctionBuilder<TRet, TArgs> {
	public arguments: NetworkType.Any[] = [];
	public returns: NetworkType.Defined;

	public configuration: Writable<NOM.FunctionConfig> = {};

	// public readonly serverCallbackMiddleware?: ServerFunctionCallbackMiddleware<TArgs, TRet> = undefined;

	public constructor(returns: NetworkType.OfType<TRet>) {
		this.returns = returns;
	}

	OnServer(configuration: NOM.Config): NOM.ServerFunctionDeclaration<TArgs, TRet> {
		return {
			Type: "Function",
			Arguments: this.arguments,
			Returns: this.returns,
			Flags: 0,
			RunContext: RemoteRunContext.Server,
			Config: table.freeze({ ...configuration, ...this.configuration }),
		};
	}
}
