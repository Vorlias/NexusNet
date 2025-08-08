<div align="center">
  <img src="./icon.png">
  <h1>NEXUS</h1>
  <p>Cross-platform Networking for Multiplayer Platforms, powered by the <a href="https://vorlias.nz/spec/nom">Network Object Model</a></p>
  <h4>Available on:</h4>
  <img src="./RobloxNPM.png?v=2"/>&nbsp;
  <a href="https://airship.gg"><img src="./Airship.png?v=2"/></a>
</div>

## Features

- The **Network Object Model** - simply define a network object model, and build it and NexusNet will generate the appropriate network objects and allow you to use them with the same general API.
- **Validation** - First-class type validation and enforcement, no weird issues with invalid types
- [**Serialization**](./WritingCustomTypes.md) - Serialize structures into more network-friendly variants
- **Buffer Encoding** - Turn your network messages into binary messages

### Defining a model

```ts
export const Network = Nexus.BuildObjectModel()
  .AddServer("PrintHello", Nexus.Event(NetType.String))
  .Build();
```

Using the object on the server:

```ts
import { Network } from "./Model";

// Roblox:
game.GetService("Players").PlayerAdded.Connect((player) => {
    Network.Get("SendMessage").Server.SendToPlayer(player, "Hello, World!");
});

// Airship:
Airship.Players.ObservePlayers((player) => {
    Network.Get("SendMessage").Server.SendToPlayer(player, "Hello, World!");
})
```

Listening on the client:

```ts
import { Network } from "./Model";
Network.Get("SendMessage").Client.Connect((message) => {
  print("Server said", message);
});
```

## Platforms

This supports two variants - [_Airship_](https://airship.gg) and [_Roblox_](https://roblox.com).

### Roblox

The Roblox version of NexusNet uses [_Roblox Typescript_](https://roblox-ts.com). Source code is available [here](./roblox)

### Airship

The airship version of NexusNet is a package in [Airship](https://airship.gg), it can be opened in unity via [the AirshipNexusNet project](./airship/AirshipNexusNet/).
