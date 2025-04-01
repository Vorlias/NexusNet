import { NexusNetworkBehaviour } from "@Vorlias/NexusNet/Components/NexusNetworkBehaviour";
import Nexus from "@Vorlias/NexusNet/Framework";

export default class TestNetworkable extends NexusNetworkBehaviour {
	private inlineTest = Nexus.Client("inlineTest", Nexus.Event());
	private inlineTest2 = Nexus.Server("inlineTest2", Nexus.Event());
}
