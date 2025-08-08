# Custom Types in Nexus
There may be cases where you want to write a custom type in Nexus, such as for your own data objects.

There are two type objects to declare types with:
## `NetworkType<T>`
This is a simple network type that involves no serialization.

Some examples of simple types:
- Strings: `NexusTypes.String`
- Numbers: `NexusTypes.Number`, `NexusTypes.Int8`, `NexusTypes.Int16`, `NexusTypes.Int32`, `NexusTypes.UInt8`, `NexusTypes.UInt16`, `NexusTypes.UInt32`, `NexusTypes.Float32`, `NexusTypes.Float64`
- Booleans: `NexusTypes.Boolean`

On both Roblox/Airship, this may include types like `NexusTypes.Vector3` and `NexusTypes.Vector2`.

## `NetworkSerializableType<TIn, TOut>`
This is a more complex network type that will serialize a value before sending it over the network, before deserializing it back to the expected value type.

Some examples of built in serializable types:
- `NexusTypes.Literal` - serializes to the index of the literal value (it's a fixed list, so does not require the actual value to be sent)
- `NexusTypes.Set`* - serializes a set to an array
- `NexusTypes.Map`* - serializes a map to an array of key/pair values
- `NexusTypes.StringEnum`** - serializes the string value to a hash key representation
- `NexusTypes.Interface`** - serializes an object to a hash map (hash key ordered array)

\* These types use values as keys that don't serialize correctly when sent across the network, or wont arrive as expected.
\
\** Strings are expensive to send over the network as keys or when not necessary

On Airship, this includes `NexusTypes.Identity`, `NexusTypes.Character` and `NexusTypes.Player` of which require serialization/deserialization of identifiers to use over the network.