import { NetworkedEvent } from "./Internal/NetworkEvent";

export interface NexusEventConnection {
	(): void;
}
export class NexusEventConnection {
	private connected = true;

	public constructor(private readonly disconnect: () => void) {}

	public Disconnect() {
		this.disconnect();
		this.connected = false;
	}

	public IsConnected() {
		return this.connected;
	}

	public Destroy() {
		this.disconnect();
		this.connected = false;
	}
}

const nexusEvent = getmetatable(NexusEventConnection) as LuaMetatable<NexusEventConnection>;
nexusEvent.__call = (thisObj) => {
	thisObj.Destroy();
};
