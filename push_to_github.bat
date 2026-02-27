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

REM Show git status
echo [1/4] Checking git status...
git status --short
echo.

REM Check if there are changes to commit
git diff --quiet && git diff --cached --quiet
if %ERRORLEVEL% EQU 0 (
    echo No changes to commit.
    echo.
    set /p CONFIRM="Do you want to push anyway? (y/n): "
    if /i not "%CONFIRM%"=="y" goto :eof
) else (
    REM Get commit message from user
    echo [2/4] Enter commit message:
    set /p MESSAGE="Commit message: "
    
    if "%MESSAGE%"=="" (
        echo Error: Commit message cannot be empty!
        pause
        goto :eof
    )
    
    REM Add and commit
    echo [3/4] Adding and committing changes...
    git add .
    git commit -m "%MESSAGE%"
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Commit failed!
        pause
        goto :eof
    )
    echo Commit successful!
    echo.
)

REM Push to GitHub
echo [4/4] Pushing to GitHub...
git push origin %BRANCH%
if %ERRORLEVEL% NEQ 0 (
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
