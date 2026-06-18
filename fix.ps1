$content = Get-Content 'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\IngredientsView.vue' -Raw
$bytes = [System.Text.Encoding]::GetEncoding('Shift_JIS').GetBytes($content)
$restored = [System.Text.Encoding]::UTF8.GetString($bytes)
Set-Content -Path 'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\IngredientsView_restored.vue' -Value $restored -Encoding UTF8
