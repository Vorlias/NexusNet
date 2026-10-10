import { TransformFromNetworkArguments, TransformToNetworkReturnBuffer } from "../Buffers/Transform";
import { RemotesFolder } from "../Internal";
import { GetRbxNetFunctionId } from "../Internal/InternalId";
import { NOM, ConfigFlags } from "../NetworkObjectModel";
import { NetworkType } from "../Types/NetworkType";
import { TypeChecker } from "../Validation";
import { ServerListenerFunction } from "./ServerNetworkTypes";

export function CreateServerFunctionCallback<T extends ReadonlyArray<unknown>, R extends unknown>(
	argumentTypes: NetworkType.ToTypeArray<T>,
	returnType: NetworkType.OfType<R>,
	callback: (player: Player, ...args: T) => R,
	compression: CastsToEnum<Enum.CompressionAlgorithm> | undefined,
) {
	return (player: Player, buf: unknown, xData: unknown) => {
		assert(typeIs(buf, "buffer"));
		assert(xData === undefined || TypeChecker.isArrayLike(xData));

		const valueArguments = TransformFromNetworkArguments(buf, xData, argumentTypes, compression);
		const valueResult = callback(player, ...(valueArguments as T));

		return TransformToNetworkReturnBuffer(returnType, valueResult);
	};
}

const RunService = game.GetService("RunService");
export class ServerSyncFunction<TArgs extends unknown[], TRet extends unknown[]> implements ServerListenerFunction<
	TArgs,
	TRet
> {
	private readonly instance!: RemoteFunction;
	private readonly declaration: NOM.ServerFunctionDeclaration<TArgs, TRet>;

	private readonly arguments: NetworkType.ToTypeArray<TArgs>;
	private readonly returns: NetworkType.OfType<TRet>;

	public constructor(name: string, declaration: NOM.ServerFunctionDeclaration<TArgs, TRet>) {
		this.declaration = declaration;

		name = NOM.hasConfigFlag(declaration.Config.Flags, ConfigFlags.RuntimeHashNames)
			? string.format("%.X", GetRbxNetFunctionId(name))
			: name;

		this.instance = RunService.IsServer()
			? new Instance("RemoteFunction")
			: (RemotesFolder.WaitForChild(name) as RemoteFunction);
		assert(this.instance.IsA("RemoteFunction"));
		this.instance.Name = name;
		this.instance.Parent = RemotesFolder;

		this.arguments = declaration.Arguments as NetworkType.ToTypeArray<TArgs>;
		this.returns = declaration.Returns;

		table.freeze(this);
	}

	SetCallback(callback: (target: Player, ...args: TArgs) => TRet) {
		this.instance.OnServerInvoke = CreateServerFunctionCallback(this.arguments, this.returns, callback, undefined);
	}
}
