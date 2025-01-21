import { Network } from "shared/Network";

const players = game.GetService("Players");

players.PlayerAdded.Connect((player) => {
	Network.Get("HelloFromServer").Server.SendToPlayer(player, "Hello, World!");
});

Network.Get("HelloFromClient").Server.Connect((player, test) => {
	print("the player", player, " sent back the number", test);
});
