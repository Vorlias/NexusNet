import { TransformFromNetworkReturnBuffer, TransformToNetworkArguments } from "../Buffers/Transform";
import { RemotesFolder } from "../Internal";
import { GetRbxNetFunctionId } from "../Internal/InternalId";
import { ConfigFlags, NOM } from "../NetworkObjectModel";
import { NetworkType } from "../Types/NetworkType";
import { ClientInvokeFunction } from "./ClientNetworkTypes";

export class NexusClientSyncFunction<TArgs extends unknown[], TRet extends unknown> implements ClientInvokeFunction<
	TArgs,
	TRet
> {
	private instance: RemoteFunction;
	private readonly arguments: NetworkType.ToTypeArray<TArgs>;
	private readonly returns: NetworkType.OfType<TRet>;

	public constructor(name: string, declaration: NOM.ServerFunctionDeclaration<TArgs, TRet>) {
		name = NOM.hasConfigFlag(declaration.Config.Flags, ConfigFlags.RuntimeHashNames)
			? string.format("%.X", GetRbxNetFunctionId(name))
			: name;

		const object = RemotesFolder.WaitForChild(name);
		assert(object.IsA("RemoteFunction"));
		this.instance = object;

		this.arguments = declaration.Arguments as NetworkType.ToTypeArray<TArgs>;
		this.returns = declaration.Returns;

		table.freeze(this);
	}

	SendToServerAsync(...args: TArgs): Promise<TRet> {
		return new Promise((resolve) => {
			const result = this.SendToServer(...args);
			resolve(result);
		});
	}

	SendToServer(...args: TArgs): TRet {
		const [networkArguments, xData] = TransformToNetworkArguments(args, this.arguments, undefined);
		const invokeResult = this.instance.InvokeServer(networkArguments, xData);
		if (typeIs(invokeResult, "buffer")) {
			return TransformFromNetworkReturnBuffer(this.returns, invokeResult) as TRet;
		} else {
			throw `Unhandled`;
		}
	}
}
