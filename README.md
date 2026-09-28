<div align="center">
  <img src="./icon.png">
  <h1>NEXUS</h1>
  <p>Networking for Roblox, powered by the <a href="https://vorlias.nz/spec/nom">Network Object Model</a></p>
</div>

<!-- Aka "_RbxNet v4.0_" - this is a continuation of https://github.com/roblox-aurora/rbx-net/issues/91, which ended up as https://github.com/Vorlias/NexusNetLegacy and now is a pure Roblox library as Airship was discontinued. 

It's still yet to be determined if I will add some sort of backwards compat. for this library. for RbxNet v3.0. -->

## Features
- The **Network Object Model** - simple define a network object model, and Nexus will generate the appropriate network objects and allow you to use them with a simple to use API. The API is built in a way that only will show types specific to the appropriate contexts.
- **Serialization** - Serialization and deserialization of custom user types.
- **Buffer Encoding** - Buffer encoding is a default feature of Nexus, similar to other libraries such as Bytenet and Zap. Compression is an optional feature for any larger network messages.
- **Forced static typing** - see https://blog.vorlias.nz/2023/11/moving-to-a-simpler-type-strict-rbxnet as to why.

You can also define _singleton_ (standalone) network objects via `Nexus.Server` and `Nexus.Client`.

<!-- ## Differences from RbxNet
- Uses _buffer_ serialization similar to networking systems like bytenet and zap
- Includes _serialization_ support.
- Forced static types - see https://blog.vorlias.nz/2023/11/moving-to-a-simpler-type-strict-rbxnet as to why. -->

## Why not use _X_ library instead?
It's all down to personal preference, at this point. _Serialization_ and soon other features like cross-server signaling might be a big factor as to the difference with Nexus.

Nexus is built to be extendable and to not require any third party tooling or transformers, while still having a strong featureset.

## Why no Luau?
I actually _really want_ to support Luau. The type system just isn't there yet; however. Any tiny amount of recursion breaks it... and that's useful to the strong type system that Nexus and its predecessors have.

In future if that's properly supported, perhaps. Especially with classes coming soon.

## Migration from RbxNet v3
TODO