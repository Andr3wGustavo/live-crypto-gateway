param(
    [string]$ReportPath
)

# Read-only Windows diagnostics. No BCD writes, registry changes, paging-file
# changes, process termination or reboot. An optional JSON report is the only
# file written; its parent directory must already exist.
$ErrorActionPreference = 'Stop'

function Read-BootEntry {
    param([ValidateSet('{current}', '{badmemory}')][string]$Identifier)
    $savedPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        # cmd preserves the literal braces when invoking bcdedit on PowerShell 5.1.
        $output = (& "$env:SystemRoot\System32\cmd.exe" /d /c "bcdedit /enum $Identifier" 2>&1 | Out-String)
        $code = $LASTEXITCODE
        $limits = @([regex]::Matches($output, '(?im)^\s*(truncatememory|removememory|badmemoryaccess|badmemorylist)\s+(.+)$') | ForEach-Object {
            [ordered]@{ Name = $_.Groups[1].Value; Value = $_.Groups[2].Value.Trim() }
        })
        return [ordered]@{ ExitCode = $code; Limits = $limits; Output = $output.Trim() }
    } finally { $ErrorActionPreference = $savedPreference }
}

$os = Get-CimInstance Win32_OperatingSystem -OperationTimeoutSec 20
$computer = Get-CimInstance Win32_ComputerSystem -OperationTimeoutSec 20
$modules = @(Get-CimInstance Win32_PhysicalMemory -OperationTimeoutSec 20)
$installed = ($modules | Measure-Object -Property Capacity -Sum).Sum
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$report = [ordered]@{
    CapturedAt = [DateTime]::UtcNow.ToString('o')
    Elevated = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    Windows = [ordered]@{ Edition = $os.Caption; Architecture = $os.OSArchitecture; LastBoot = $os.LastBootUpTime.ToString('o') }
    Memory = [ordered]@{
        InstalledGiB = [math]::Round($installed / 1GB, 3)
        VisibleGiB = [math]::Round(($os.TotalVisibleMemorySize * 1KB) / 1GB, 3)
        InstalledMinusVisibleGiB = [math]::Round(($installed - $os.TotalVisibleMemorySize * 1KB) / 1GB, 3)
        AvailableMiB = [math]::Round($os.FreePhysicalMemory / 1KB)
        AvailableVirtualMiB = [math]::Round($os.FreeVirtualMemory / 1KB)
        SystemManagedPagefile = $computer.AutomaticManagedPagefile
    }
    Modules = @($modules | ForEach-Object { [ordered]@{ Slot = $_.DeviceLocator; CapacityGiB = $_.Capacity / 1GB } })
    Pagefiles = @(Get-CimInstance Win32_PageFileUsage -OperationTimeoutSec 20 | ForEach-Object {
        [ordered]@{ Name = $_.Name; AllocatedMiB = $_.AllocatedBaseSize; UsedMiB = $_.CurrentUsage; PeakMiB = $_.PeakUsage }
    })
    Graphics = @(Get-CimInstance Win32_VideoController -OperationTimeoutSec 20 | ForEach-Object {
        [ordered]@{ Name = $_.Name; ReportedAdapterGiB = [math]::Round($_.AdapterRAM / 1GB, 2) }
    })
    CurrentBoot = Read-BootEntry '{current}'
    BadMemoryBootEntry = Read-BootEntry '{badmemory}'
    LargeProcesses = @(Get-Process | Where-Object { $_.PrivateMemorySize64 -gt 150MB } | Sort-Object PrivateMemorySize64 -Descending | ForEach-Object {
        [ordered]@{ Name = $_.ProcessName; Id = $_.Id; WorkingSetMiB = [math]::Round($_.WorkingSet64 / 1MB); PrivateMiB = [math]::Round($_.PrivateMemorySize64 / 1MB) }
    })
    Note = 'Installed-minus-visible memory is a discrepancy, not proof of a particular cause. Private process memory is not all resident RAM. This script makes no system configuration changes.'
}

$json = $report | ConvertTo-Json -Depth 7
if ($ReportPath) {
    $absolutePath = [IO.Path]::GetFullPath($ReportPath)
    $parent = [IO.Path]::GetDirectoryName($absolutePath)
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) { throw 'The report parent directory must already exist.' }
    [IO.File]::WriteAllText($absolutePath, $json, (New-Object Text.UTF8Encoding($false)))
}
$json
