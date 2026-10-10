# Backwards compatible with RbxNet v3
## TypeScript

!! EXPERIMENTAL !!

Uninstall `@rbxts/net`.

Change your `tsconfig.json` to include 

```ts
{
    "compilerOptions": {
        // ...
        "paths": {
            // ...
            "@rbxts/net": ["node_modules/@rbxts/nexus-net/out/Compat/Net3"]
        }
    }
}
```

This will route all `@rbxts/net` usage through Nexus' compatability layers.


NOTE: This will mark any RbxNet declarations without types as _deprecated_. You can use the Nexus types to add static types to it otherwise it will fall back to insecure value mode. (RbxNet's behaviour)

Though it's recommended you probably manually migrate things to Nexus instead.