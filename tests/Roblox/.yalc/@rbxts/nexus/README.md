<div align="center">
  <img src="https://i.imgur.com/eqw3xYR.png"/>
  <h1>Nexus Networking</h1>
  <p>Cross-platform Networking for Roblox, powered by the Network Object Model</p>
</div>

Nexus is a Network Object Model based _networking framework_ for Roblox. It is the successor to [RbxNet](https://rbxnet.australis.dev).

## Features

- The **Network Object Model** - simply define a network object model, and build it and NexusNet will generate the appropriate network objects and allow you to use them with the same general API.
- **Validation** - First-class type validation and enforcement, no weird issues with invalid types
- **Serialization** - Serialize structures into more network-friendly variants
- **Buffer Encoding** - Turn your network messages into binary messages


## Usage
If your events need to be accessed globally:

```ts
export const Networking = Nexus.BuildObjectModel()
  .Build();
```