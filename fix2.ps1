$content = Get-Content '.\src\components\IngredientsView.vue' -Raw
$bytes = [System.Text.Encoding]::GetEncoding('Shift_JIS').GetBytes($content)
$restored = [System.Text.Encoding]::UTF8.GetString($bytes)
Set-Content -Path '.\src\components\IngredientsView.vue' -Value $restored -Encoding UTF8
