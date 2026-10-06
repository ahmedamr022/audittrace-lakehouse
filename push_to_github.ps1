# AuditTrace: Push repository to GitHub
Write-Host "🚀 Pushing AuditTrace repository to GitHub..." -ForegroundColor Cyan

git add .
git commit -m "feat: initial commit - AuditTrace financial lakehouse & fraud surveillance engine" 2>$null
git branch -M main

$remoteUrl = "https://github.com/ahmedamr022/audittrace-lakehouse.git"
git remote remove origin 2>$null
git remote add origin $remoteUrl

Write-Host "Pushing to $remoteUrl..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 SUCCESS! Your repository is now live at: https://github.com/ahmedamr022/audittrace-lakehouse" -ForegroundColor Green
    Start-Process "https://github.com/ahmedamr022/audittrace-lakehouse"
} else {
    Write-Host ""
    Write-Host "⚠️ If the repository is not created yet on your GitHub account, please create it first at:" -ForegroundColor Yellow
    Write-Host "👉 https://github.com/new?name=audittrace-lakehouse" -ForegroundColor White
    Write-Host ""
    Write-Host "After creating it, simply run this script again: .\push_to_github.ps1" -ForegroundColor Cyan
}
