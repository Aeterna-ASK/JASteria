$content = Get-Content '.\src\store\restaurantStore.js' -Raw
$bytes = [System.Text.Encoding]::GetEncoding('Shift_JIS').GetBytes($content)
$restored = [System.Text.Encoding]::UTF8.GetString($bytes)
Set-Content -Path '.\src\store\restaurantStore.js' -Value $restored -Encoding UTF8
