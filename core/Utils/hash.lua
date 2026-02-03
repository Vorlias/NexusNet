local hash: (value: string) -> number;

local function hashstringImpl(value)
    local hash: number = 0
    if #value == 0 then
        return hash
    end
    for i = 0, #value - 1 do
        local char = string.byte(string.sub(value, i + 1, i + 1))
        hash = (bit32.lshift(hash, 5)) - hash + char
        hash = bit32.band(hash, hash)
    end
    return math.abs(hash)
end

-- Airship hash 'string.hash'
if string["hash"] ~= nil then
    hash = string["hash"]
else
    hash = hashstringImpl
end

return {
    hashstring = hash,
    luahashstring = hashstringImpl,
}