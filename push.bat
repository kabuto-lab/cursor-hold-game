@echo off
chcp 65001 >nul
echo ========================================
echo   GIT PUSH TO GITHUB
echo ========================================
echo.

REM Check if we are on main branch
git branch --show-current > temp_branch.txt
set /p BRANCH=<temp_branch.txt
del temp_branch.txt

echo Current branch: %BRANCH%
echo.

REM Pull latest changes from remote first
echo Pulling latest changes from remote...
git pull origin %BRANCH%
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Warning: Pull had conflicts, but continuing...
)

echo.

REM Add all changes
echo Staging all changes...
git add .
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error: Failed to stage changes!
    pause
    goto :eof
)

REM Check if there are changes to commit
git diff --cached --quiet
if %ERRORLEVEL% EQU 0 (
    echo No changes to commit.
) else (
    echo Committing changes...
    git commit -m "Auto-commit before push"
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo Warning: Commit may have issues, continuing to push...
    )
)

echo.

REM Push to GitHub
echo Pushing to GitHub...
git push origin %BRANCH%
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error: Push failed!
    pause
    goto :eof
)

echo.
echo ========================================
echo   PUSH SUCCESSFUL!
echo ========================================
echo.
pause
