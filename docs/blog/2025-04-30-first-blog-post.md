---
slug: welcome-to-nexus
title: Welcome to Nexus!
authors: [vorlias]
# tags: [vorlias]
---

In 2023 [I explained a need for to move to a stricter RbxNet](https://blog.vorlias.nz/2023/11/moving-to-a-simpler-type-strict-rbxnet/), citing reasons such as pitfalls.

## Why NexusNet

Nexus Networking, aka "NexusNet" is a continuation of v4 (and for all intents and purposes is Net v4). If you're wondering _why_ this isn't just in the RbxNet repository:
- The changes here **extremely** _breaking_, and I didn't want to just release another "version" as it were. This is its own thing. This included a redesign of the entire structure of the project, to incorporate multiple "variants"
- I wanted to also support an [Airship](https://airship.gg) variant, besides Roblox - an upcoming Unity-based multiplayer platform we've been developing at Easy Games. This platform ultimately is what has made me actually figure out how to best approach things such as serialization.


So, this is NexusNet. The future&trade; of gaming platforms networking.


<!-- ### Continuing with the NOM (Network Object Model)

Nexus has support for using the object model builder:
```ts
export const Networking = Nexus.BuildObjectModel()
    .Build();
```

This is similar to the `Definitions.Create()` process Net had, however now is a builder rather than passing an object.

Then, if we wanted to declare a couple of events:


```ts
export const Networking = Nexus.BuildObjectModel()
    .AddServer("Event1", Nexus.Event())
    .AddClient("Event2", Nexus.Event())
    .Build();
```

`AddServer` means the event will be "owned" by the server (events are called by the server, to clients)
`AddClient` means the event will be "owned" by the client (events are called by the client, to the server)

Then to _Get_ the objects, we do the following:

On the server:
```ts
const serverSender1 = Networking.Get("Event1").Server;
const serverListener2 = Networking.Get("Event2").Server;
```

On the client:
```ts
const clientListener1 = Networking.Get("Event1").Client;
const clientSender2 = Networking.Get("Event2").Client;
``` -->