import { NOM, RemoteRunContext } from "../NetworkObjectModel";
import { NetworkType } from "../Types/NetworkType";

export interface ClientEventBuilder<T extends readonly unknown[]> extends NOM.ClientBuilder<
	NOM.ClientEventDeclaration<T>
> {}
export interface ServerEventBuilder<T extends readonly unknown[]> extends NOM.ServerBuilder<
	NOM.ServerEventDeclaration<T>
> {}

export class NexusEventBuilder<TArgs extends ReadonlyArray<unknown>>
	implements ClientEventBuilder<TArgs>, ServerEventBuilder<TArgs>
{
	public arguments: NetworkType.Any[] = [];
	public unreliable = false;

	AsUnreliable(): this {
		this.unreliable = true;
		return this;
	}

	OnClient(configuration: NOM.Config): NOM.ClientEventDeclaration<TArgs> {
		return table.freeze({
			Type: "Event",
			RunContext: RemoteRunContext.Client,
			Arguments: this.arguments as NetworkType.ToTypeArray<TArgs>,
			Flags: 0,
			Unreliable: this.unreliable,
		});
	}

	OnServer(configuration: NOM.Config): NOM.ServerEventDeclaration<TArgs> {
		return table.freeze({
			Type: "Event",
			RunContext: RemoteRunContext.Server,
			Arguments: this.arguments as NetworkType.ToTypeArray<TArgs>,
			Flags: 0,
			Unreliable: this.unreliable,
		});
	}
}
