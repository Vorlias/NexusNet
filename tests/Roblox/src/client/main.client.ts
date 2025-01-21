import { Network } from "shared/Network";

Network.Get("HelloFromServer").Client.Connect((message) => {
    print("The server says", message);
    Network.Get("HelloFromClient").Client.SendToServer(1337);
})