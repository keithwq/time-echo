$ConfigDirTxt = "~/.ssh/sealos/"
$ConfigDir = "$HOME\.ssh\sealos\"
$SSHConfigFile = "$HOME\.ssh\config"

$ConfigFileTxt = "~/.ssh/sealos/devbox_config"
$ConfigFile = "$ConfigDir\devbox_config"

$PrivateKey = @"
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtz
c2gtZWQyNTUxOQAAACCak+7tibEbTX+yvdXXwb7f+bkYbNjo5wVp6H+pr36TYAAA
AIggZbGoIGWxqAAAAAtzc2gtZWQyNTUxOQAAACCak+7tibEbTX+yvdXXwb7f+bkY
bNjo5wVp6H+pr36TYAAAAEDs/dY2eIRdSo1qK81Wmkia7GVDdALZTTIKFTTD63lg
eZqT7u2JsRtNf7K91dfBvt/5uRhs2OjnBWnof6mvfpNgAAAAAAECAwQF
-----END OPENSSH PRIVATE KEY-----

"@

$Name = "bja.sealos.run_ns-z2ypacm8_time-echo"
$HostName = "bja.sealos.run"
$Port = "2233"
$User = "devbox"

$IdentityFileTxt = "${ConfigDirTxt}$Name"
$IdentityFile = "$ConfigDir$Name"
$HostEntry = "Host $Name`n  HostName $HostName`n  Port $Port`n  User $User`n  IdentityFile $IdentityFileTxt`n  IdentitiesOnly yes`n  StrictHostKeyChecking no"

# Check if the configuration directory exists
if (-Not (Test-Path $ConfigDir)) {
    New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
}

# Check if the configuration file exists
if (-Not (Test-Path $ConfigFile)) {
    New-Item -ItemType File -Path $ConfigFile -Force | Out-Null
}

# Check if the default config exists
if (-Not (Test-Path $SSHConfigFile)) {
    New-Item -ItemType File -Path $SSHConfigFile -Force | Out-Null
}

# Check if the .ssh/config file contains the Include statement
if (-Not (Get-Content $SSHConfigFile)) {
    Add-Content -Path $SSHConfigFile -Value "Include $ConfigFileTxt`n"
} else {
    if (-Not (Select-String -Path $SSHConfigFile -Pattern "Include $ConfigFileTxt")) {
        (Get-Content $SSHConfigFile) | ForEach-Object {
            if ($_ -eq (Get-Content $SSHConfigFile)[0]) {
                "Include $ConfigFileTxt`n$_"
            } else {
                $_
            }
        } | Set-Content $SSHConfigFile
    }
}

# Write the private key to the file
$PrivateKey | Set-Content -Path $IdentityFile -Force

# Check if a host with the same name exists
if (Select-String -Path $ConfigFile -Pattern "^Host $Name") {
    $newContent = @()
    $skip = $false

    (Get-Content $ConfigFile) | ForEach-Object {
        if ($_ -match "^Host $Name$") {
            $skip = $true
            $newContent += $HostEntry
        }
        elseif ($_ -match "^Host ") {
            $skip = $false
            $newContent += $_
        }
        elseif (-not $skip) {
            $newContent += $_
        }
    }

    $newContent | Set-Content $ConfigFile
} else {
    # Append to the end of the file
    Add-Content -Path $ConfigFile -Value $HostEntry
}
