export type Callback = () -> ()
export type ClientListenerEvent = {
    Connect: (self: ClientListenerEvent, cb: Callback) -> RBXScriptConnection
}
export type ClientSenderEvent = {
    SendToServer: (self: ClientListenerEvent, ...any) -> ()
}

export type ServerListenerEvent = {
    Connect: (self: ServerListenerEvent, cb: (player: Player, ...any) -> ()) -> RBXScriptConnection
}

export type ServerSenderEvent = {
    SendToPlayer: (self: ServerSenderEvent, player: Player, ...any) -> ()
}

export type ServerEventDeclaration<T...> = {
    read Type: "Event",
    read RunContext: "S"
}

export type ClientEventDeclaration<T...> = {
    read Type: "Event",
    read RunContext: "C"
}

export type function ToFunctionArguments(t0: type, ...: type)
    local type = types.newfunction({}, {})
    return type
end

type function GetProperty(T: type, v: type)
    for key, value in T:properties() do
        if key == v then
            return value.read
        end
    end

    return types.never
end

export type function GetDeclarationType(T: type)
    return GetProperty(T, types.singleton("Type"))
end



export type function InferNetworkObject(T: type)
    local typeProp = GetProperty(T, types.singleton("Type"))
    
    if (typeProp == types.singleton("Event")) then
        local runContext = GetProperty(T, types.singleton("RunContext"))

        if runContext == types.singleton("S") then
            return types.intersectionof(ServerSenderEvent, ClientListenerEvent)
        elseif runContext == types.singleton("C") then
            return types.intersectionof(ClientSenderEvent, ServerListenerEvent)
        end
    else
        return types.never
    end
end

return nil