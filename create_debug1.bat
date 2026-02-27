@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   CREATE debug1 FOLDER
echo   Flat structure with all project files
echo ========================================
echo.

REM Создаём папку debug1
set DEBUG1_DIR=%~dp0debug1
if exist "%DEBUG1_DIR%" (
    echo [INFO] Removing old debug1 folder...
    rmdir /s /q "%DEBUG1_DIR%"
)

echo [1/3] Creating debug1 folder...
mkdir "%DEBUG1_DIR%"

echo [2/3] Copying files with flat structure...

REM Функция для копирования файла с преобразованием имени
call :copy_file "%~dp0package.json" "package.json.txt"
call :copy_file "%~dp0client\package.json" "client__package.json.txt"
call :copy_file "%~dp0client\tsconfig.json" "client__tsconfig.json.txt"
call :copy_file "%~dp0client\vite.config.ts" "client__vite.config.ts.txt"
call :copy_file "%~dp0client\index.html" "client__index.html.txt"
call :copy_file "%~dp0client\src\main.ts" "client__src__main.ts.txt"
call :copy_file "%~dp0client\src\core\GameEngine.ts" "client__src__core__GameEngine.ts.txt"
call :copy_file "%~dp0client\src\core\NetworkManager.ts" "client__src__core__NetworkManager.ts.txt"
call :copy_file "%~dp0client\src\core\InputManager.ts" "client__src__core__InputManager.ts.txt"
call :copy_file "%~dp0client\src\ui\UIController.ts" "client__src__ui__UIController.ts.txt"
call :copy_file "%~dp0client\src\chat\ChatManager.ts" "client__src__chat__ChatManager.ts.txt"
call :copy_file "%~dp0client\src\features\battle\BattleManager.ts" "client__src__features__battle__BattleManager.ts.txt"
call :copy_file "%~dp0client\src\features\battle\BattleRenderer.ts" "client__src__features__battle__BattleRenderer.ts.txt"
call :copy_file "%~dp0client\src\features\battle\VirusTubeManager.ts" "client__src__features__battle__VirusTubeManager.ts.txt"
call :copy_file "%~dp0client\src\features\battle\VirusParamsUI.ts" "client__src__features__battle__VirusParamsUI.ts.txt"
call :copy_file "%~dp0client\src\types\schema.ts" "client__src__types__schema.ts.txt"
call :copy_file "%~dp0server\package.json" "server__package.json.txt"
call :copy_file "%~dp0server\tsconfig.json" "server__tsconfig.json.txt"
call :copy_file "%~dp0server\src\index.ts" "server__src__index.ts.txt"
call :copy_file "%~dp0server\src\rooms\HoldingRoom.ts" "server__src__rooms__HoldingRoom.ts.txt"
call :copy_file "%~dp0server\src\rooms\schema.ts" "server__src__rooms__schema.ts.txt"

echo [3/3] Done!
echo.
echo ========================================
echo   debug1 FOLDER CREATED!
echo   Location: %DEBUG1_DIR%
echo ========================================
echo.
pause
goto :eof

REM Функция копирования файла с заголовком
:copy_file
set "SOURCE=%~1"
set "DEST_NAME=%~2"

if not exist "%SOURCE%" (
    echo [SKIP] %SOURCE% (not found)
    goto :eof
)

REM Получаем относительный путь от корня проекта
set "REL_PATH=%~1"
set "REL_PATH=!REL_PATH:%~dp0=!"

REM Создаём файл с заголовком и содержимым
(
    echo // ========================================
    echo // ORIGINAL PATH: !REL_PATH!
    echo // ========================================
    echo.
    type "%SOURCE%"
) > "%DEBUG1_DIR%\%DEST_NAME%"

echo [COPY] %DEST_NAME%
goto :eof
