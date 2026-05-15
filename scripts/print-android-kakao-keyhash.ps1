param(
  [string]$KeystorePath = "android/app/debug.keystore",
  [string]$Alias = "androiddebugkey",
  [string]$StorePass = "android",
  [string]$KeyPass = "android"
)

$ErrorActionPreference = "Stop"

$resolvedKeystore = Resolve-Path -LiteralPath $KeystorePath
$keytoolOutput = & keytool -list -v `
  -alias $Alias `
  -keystore $resolvedKeystore `
  -storepass $StorePass `
  -keypass $KeyPass

if ($LASTEXITCODE -ne 0) {
  throw "keytool failed with exit code $LASTEXITCODE"
}

$sha1Line = $keytoolOutput | Where-Object { $_ -match "^\s*SHA1:\s*" } | Select-Object -First 1
if (-not $sha1Line) {
  throw "Could not find SHA1 fingerprint in keytool output."
}

$sha1 = ($sha1Line -replace "^\s*SHA1:\s*", "").Trim()
$bytes = $sha1 -split ":" | ForEach-Object { [Convert]::ToByte($_, 16) }
$keyHash = [Convert]::ToBase64String([byte[]]$bytes)

Write-Host "Keystore: $resolvedKeystore"
Write-Host "Alias: $Alias"
Write-Host "SHA1: $sha1"
Write-Host "Kakao Android key hash: $keyHash"
