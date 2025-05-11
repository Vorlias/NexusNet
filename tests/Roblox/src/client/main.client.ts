import Nexus, { NexusTypes } from "@rbxts/nexus";
import { Network } from "shared/Network";
import { NexusTesting } from "shared/Tests";
import { ClientEvent } from "@rbxts/nexus/out/Objects/Client/ClientEvent";
import { TestNetwork } from "shared/module";

NexusTesting.RunTests([
	NexusTesting.Test("Send signal to server", (test) => {
		const evt = TestNetwork.Get("TestClientSend").Client;
		evt.SendToServer("Hello, World!");
		const evt2 = TestNetwork.Get("TestServerSend").Client as ClientEvent<unknown[]>;
		const [message] = evt2.Wait();
		assert(message === `Server got 'Hello, World!'`);
	}),
]);

const result = TestNetwork.Client.Get("TestFunction").SendToServer();
print("got", `'${result}'`, "from server");
