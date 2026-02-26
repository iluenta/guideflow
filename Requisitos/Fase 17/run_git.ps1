$ErrorActionPreference = "Continue"
Write-Output "--- GIT STATUS ---" | Out-File -FilePath git_debug.log
git status | Out-File -FilePath git_debug.log -Append
Write-Output "`n--- GIT CONFIG ---" | Out-File -FilePath git_debug.log -Append
git config user.email "antigravity@google.com" | Out-File -FilePath git_debug.log -Append
git config user.name "Antigravity AI" | Out-File -FilePath git_debug.log -Append
Write-Output "`n--- GIT ADD ---" | Out-File -FilePath git_debug.log -Append
git add app/auth/callback/page.tsx scripts/dev-admin-login.js 2>&1 | Out-File -FilePath git_debug.log -Append
Write-Output "`n--- GIT COMMIT ---" | Out-File -FilePath git_debug.log -Append
git commit -m 'fix: magic link double slash and robust callback parsing' 2>&1 | Out-File -FilePath git_debug.log -Append
Write-Output "`n--- GIT PUSH ---" | Out-File -FilePath git_debug.log -Append
git push origin main 2>&1 | Out-File -FilePath git_debug.log -Append
Write-Output "`n--- FINAL HASH ---" | Out-File -FilePath git_debug.log -Append
git rev-parse HEAD | Out-File -FilePath git_debug.log -Append
