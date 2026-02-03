import {
	RemoteDeclarations,
	ServerEventDeclaration,
	ClientEventDeclaration,
	ServerFunctionDeclaration,
	ContextNetworkModel,
} from "./Types/NetworkObjectModel";
import { NetworkType, ToNetworkArguments } from "./Types/NetworkTypes";
import { MergeIdentity, Identity, Named } from "./Types/Utility";

export interface XNetworkObjectModelBuilder<TDecl extends RemoteDeclarations> {
	AddStaticType<TType>(handler: NetworkType.OfType<TType>): this;
	AddStaticTypes<TTypes extends unknown[]>(...handlers: ToNetworkArguments<TTypes>): this;

	ServerEvent<N extends string, T extends ReadonlyArray<unknown>>(): XNetworkObjectModelBuilder<
		MergeIdentity<Identity<Named<N, ServerEventDeclaration<T>>>, TDecl>
	>;
	ClientEvent<N extends string, T extends ReadonlyArray<unknown>>(): XNetworkObjectModelBuilder<
		MergeIdentity<Identity<Named<N, ClientEventDeclaration<T>>>, TDecl>
	>;
	ServerFunction<N extends string, T extends (...args: unknown[]) => unknown>(): XNetworkObjectModelBuilder<
		MergeIdentity<Identity<Named<N, ServerFunctionDeclaration<Parameters<T>, ReturnType<T>>>>, TDecl>
	>;
	Build(): ContextNetworkModel<TDecl>;
}

export namespace NexusX {
	/**
	 * Create an object model using the Nexus Extension runtime
	 *
	 * **NOTE:** this requires `nexusnet-transformer` to be set up
	 */
	export function BuildObjectModel(): XNetworkObjectModelBuilder<{}> {
		throw `The NexusNet transformer is required for NexusX usage`;
	}
}
