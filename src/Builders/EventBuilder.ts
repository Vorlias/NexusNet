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
	public configuration: Writable<NOM.EventConfig> = {};

	// AsUnreliable(): this {
	// 	this.unreliable = true;
	// 	return this;
	// }

	/**
	 * Set the compression algorithm for this event - only use this if it actually is necessary - misuse might use more bandwidth!
	 */
	UseBufferCompression(compression: CastsToEnum<Enum.CompressionAlgorithm>) {
		this.configuration.Compression = compression;
		return this;
	}

	OnClient(configuration: NOM.EventConfig): NOM.ClientEventDeclaration<TArgs> {
		return table.freeze({
			Type: "Event",
			RunContext: RemoteRunContext.Client,
			Arguments: this.arguments as NetworkType.ToTypeArray<TArgs>,
			Flags: 0,
			Unreliable: this.unreliable,
			Config: table.freeze({ ...configuration, ...this.configuration }),
		});
	}

	OnServer(configuration: NOM.EventConfig): NOM.ServerEventDeclaration<TArgs> {
		return table.freeze({
			Type: "Event",
			RunContext: RemoteRunContext.Server,
			Arguments: this.arguments as NetworkType.ToTypeArray<TArgs>,
			Flags: 0,
			Unreliable: this.unreliable,
			Config: table.freeze({ ...configuration, ...this.configuration }),
		});
	}
}
