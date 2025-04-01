import { NetworkBuffer } from "../Types/NetworkTypes";

export class NetworkTypeBuilder<TValue = never, TEncode = TValue> {
	public constructor() {}

	public Build(): TValue extends never ? never : TValue {
		throw `TODO`;
	}
}
