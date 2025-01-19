import { NetworkedEvent } from "./Internal/NetworkEvent";

export class AirshipScriptConnection {
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
