@echo off
chcp 65001 >nul
echo ========================================
echo  ROLLBACK TO VERSION v12 (68ecd10)
echo  Apply PIXY retro font to all UI
echo ========================================
echo.

echo [1/4] Checking Git status...
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git not found or not a Git repository!
    pause
    exit /b 1
)

echo [2/4] Creating/switching to branch rollback-v12 from commit 68ecd10...
git checkout 68ecd10 >nul 2>&1
git checkout -B rollback-v12 68ecd10 >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Failed to create branch!
    pause
    exit /b 1
)

echo [3/4] Checking current commit...
for /f "tokens=*" %%i in ('git rev-parse --short HEAD') do set CURRENT_COMMIT=%%i
echo Current commit: %CURRENT_COMMIT%

if "%CURRENT_COMMIT%"=="68ecd10" (
    echo SUCCESS: Successfully rolled back to v12!
) else (
    echo ERROR: Failed to rollback to 68ecd10!
    pause
    exit /b 1
)

echo.
echo [4/4] Pushing branch rollback-v12 to GitHub (force)...
git push -f -u origin rollback-v12 >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Failed to push! Try: git push -f -u origin rollback-v12
) else (
    echo SUCCESS: Branch pushed to GitHub!
)

echo.
echo ========================================
echo  DONE! Rolled back to v12 (68ecd10)
echo ========================================
echo.
echo GitHub: https://github.com/kabuto-lab/cursor-hold-game/tree/rollback-v12
echo.

pause
