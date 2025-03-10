--!strict
-- This is experimental Luau types, not yet implemented as Luau is still missing a few things

type function Partial(tbl)
    if not tbl:is("table") then
        error("Expected table at T")
    end

    local props = tbl:properties()
    for k, v in props do
        tbl:setproperty(k, types.unionof(v, typeof(nil)))
    end

    return T
end
type function Merge(T, U)
    if not T:is("table") then
        error("Expected table at T")
    end

    if not U:is("table") then
        error("Expected table at U")
    end

    return types.intersectionof(T, U)
end

-- Equiv to { [K]: T }
type function Named(K, T)
    if K:is("string") then
        error("Expected string for K")
    end

    local tbl = types.newtable()
    tbl:setproperty(K, T)
    return tbl
end

type function is(T, U)
    return types.boolean -- can't do literals yet :c
end

-- type partial = Partial<{a: number, b: number}>
type test = Merge<Named<"test", string>, {}>

type BufferReader = {}
type BufferWriter = {}

-- Network Types --
type NetworkBuffer<T> = {
    WriteData: (self: NetworkBuffer<T>, data: T, writer: BufferWriter) -> (),
    ReadData: (self: NetworkBuffer<T>, reader: BufferReader) -> T,
}

type NetworkType<T, U = T> = {
    Name: string,
    Message: string | ((value: T, typeName: string) -> string),
    Validate: <V>(self: NetworkType<T, U>, value: V) -> is<V, T>,
    NetworkBuffer: NetworkBuffer<U>,
}

type function Literal(T)
    if (T:is("string")) then
        return T
    end

   
    return T
end
-- End Network types

function Literal<T>(value: T): Literal<T>
    return value :: T
end

type test5 = Literal<string>
local test = Literal("hi there") :: Literal<"test">

type function AssertLiteral(T)
    if (T:is("string")) then
        error("Expected literal")
    else
        return T
    end

   
end

type ServerEventDeclaration<T> = {
    Type: "Event",
    RunContext: "Server",
}

type ClientEventDeclaration<T> = {
    Type: "Event",
    RunContext: "Client",
}

type ServerBuilder<T> = {
    OnServer: (self: ServerBuilder<T>) -> ServerEventDeclaration<T>,
}

type ClientBuilder<T> = {
    OnClient: (self: ClientBuilder<T>) -> ClientEventDeclaration<T>,
}

type MergeBuilder<T, U> = {}

type ObjectModelBuilder<T> = {
    AddServer: <K, U>(self: ObjectModelBuilder<T>, name: K, ServerBuilder<U>) -> ObjectModelBuilder<T>, -- recursive types are smelly
    AddClient: <K, U>(self: ObjectModelBuilder<T>, name: K, ClientBuilder<U>) -> ObjectModelBuilder<T>,

    Build: (self: ObjectModelBuilder<T>) -> T,
}

type EventBuilder<T> = {
    
} & ClientBuilder<T> & ServerBuilder<T>



type Nexus = {
    BuildObjectModel: () -> ObjectModelBuilder<{}>,
    Event: (() -> EventBuilder<() -> ()>) 
            & (<T0>(type: NetworkType<T0>) -> EventBuilder<(T0) -> ()>) 
            & (<T0, T1>(type: NetworkType<T0>, type2: NetworkType<T1>) -> EventBuilder<(T0, T1) -> ()>)
            & (<T0, T1, T2>(type: NetworkType<T0>, type2: NetworkType<T1>, type3: NetworkType<T2>) -> EventBuilder<(T0, T1, T2) -> ()>)
            & (<T0, T1, T2, T3>(type: NetworkType<T0>, type2: NetworkType<T1>, type3: NetworkType<T2>, type4: NetworkType<T3>) -> EventBuilder<(T0, T1, T2, T3) -> ()>)
}

local stringType = {} :: NetworkType<string>
local int32 = {} :: NetworkType<number>




local Nexus  = {} :: Nexus
local test = Nexus.Event(int32, stringType):OnServer()

local test2 = Nexus.BuildObjectModel():AddServer("Test", Nexus.Event())
