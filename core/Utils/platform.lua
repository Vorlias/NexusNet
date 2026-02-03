local isAirshipCache = GameObject ~= nil; -- GameObject is an Airship global
local isRobloxCache = game ~= nil -- game is a Roblox env variable

local function isAirship()
    return isAirshipCache ~= nil
end

local function isRoblox()
    return isRobloxCache ~= nil
end

local function getPlatform(): "airship" | "roblox"
    if isAirship() then
        return "airship"
    elseif isRoblox() then
        return "roblox"
    end

    error("Invalid platform")
end

return {
    isAirship = isAirship,
    isRoblox = isRoblox,
    getPlatform = getPlatform,
}