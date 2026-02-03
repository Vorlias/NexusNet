using System;
using UnityEngine;

public enum NexusType {
    [InspectorName("string")]
    String,
    [InspectorName("number")]
    Number,
    [InspectorName("boolean")]
    Boolean,
    [InspectorName("int8")]
    Int8,
    [InspectorName("int16")]
    Int16,
    [InspectorName("int32")]
    Int32,
    [InspectorName("uint8")]
    UInt8,
    [InspectorName("uint16")]
    UInt16,
    [InspectorName("uint32")]
    UInt32,
    NetworkIdentity,
    Player,
    Character,
}

public enum NexusModifier {
    None,
    Set,
    Array,
    Map,
}

public interface INexusNetworkDefinition {}

[Serializable]
public class NexusTypeArgument {
    public NexusModifier modifier;
    public NexusType type1;
    public NexusType type2;
    public bool nullable;
}

[Serializable]
public class NexusNetworkEvent : INexusNetworkDefinition {
    public string name = "Event";
    public NexusTypeArgument[] arguments;

    public bool rateLimited;
    public float rateLimitCount = 1;
    public float rateLimitTime = 60;
}

[Serializable]
public class NexusNetworkFunction : INexusNetworkDefinition {
    public string name = "Function";
    public NexusTypeArgument[] arguments;
    public NexusTypeArgument returns;

    public bool cached;
    public float cacheSeconds;
}

[Serializable]
public class NexusNetworkScope : INexusNetworkDefinition {
    public string name;
    
    [SerializeReference]
    public INexusNetworkDefinition[] definitions = new INexusNetworkDefinition[] {
        new NexusNetworkEvent(),
        new NexusNetworkFunction()
    };
}