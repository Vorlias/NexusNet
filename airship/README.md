<div align="center">
  <img src="https://i.imgur.com/eqw3xYR.png"/>
  <h1>Nexus Networking (Experimental)</h1>
  <p>Cross-platform Networking for Airship, powered by the Network Object Model</p>
</div>

Nexus is a Network Object Model based _networking framework_ for Airship.

## Features

- The **Network Object Model** - simply define a network object model, and build it and NexusNet will generate the appropriate network objects and allow you to use them with the same general API.
- **Validation** - First-class type validation and enforcement, no weird issues with invalid types
- **Serialization** - Serialize structures into more network-friendly variants
- **Buffer Encoding** - Turn your network messages into binary messages


## Usage
If your networking objects are relating to just a single component, it's recommended to declare it on a per-component basis:

```ts

export class MyComponent extends AirshipComponent {
    private readonly networking = Nexus.BuildObjectModel()
      .AddServer("MyServerEvent", Nexus.Event(NexusTypes.String))
      .Build()
    private readonly myServerEventNE = this.networking.Get("MyServerEvent");

    protected StartServer() {
      Airship.Players.ObservePlayers((player) => {
        this.myServerEventNE.Server.SendToPlayer(player, `Welcome to the server, ${player.username}!`);
      });
    }

    protected StartClient() {
      this.myServerEventNE.Client.Connect((message) => {
        print("server said", message);
      });
    }

    protected Start() {
      if (Game.IsServer()) this.StartServer();
      if (Game.IsClient()) this.StartClient();
    }
}
```

If you need game-wide networking, you can use the a _global networking_ file:
```ts
export const Network = Nexus.BuildObjectModel()
  // ...
  .Build();
```