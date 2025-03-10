# Custom Types
Writing a custom type for Nexus is pretty straight-forward:

## Serialization
If you are sending a custom object over the network, you will need to declare a `NetworkSerializableType`.

A `NetworkSerializableType` has the following methods it requires:
- `Validate` - this is to validate that the input value is what you expected
- `Serialize` - this is how you serialize your custom type to a network-friendly type
- `Deserialize` - this is how you deserialize your custom type from a network-friendly type
- `NetworkBuffer` - this is how your serialized type is handled when using buffers
