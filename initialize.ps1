# Nexus Networking
#
# Due to the differences between platforms, we need to generate a few different things

function Create-Link($target, $link) {
    if (-not (Test-Path $link)) {
        echo $target
        New-Item -Path $link -ItemType SymbolicLink -Value $target
    }
}

Create-Link "$PSScriptRoot\core" "airship\src\Core"
Create-Link "$PSScriptRoot\core" "roblox\src\Core"
Create-Link "$PSScriptRoot\airship\src" "airship\AirshipNexusNet\Assets\AirshipPackages\@Vorlias\Net"