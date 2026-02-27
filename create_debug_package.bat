@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   CREATE DEBUG PACKAGE
echo ========================================
echo.

REM Создаём папку DEBUG
set DEBUG_DIR=%~dp0DEBUG
if exist "%DEBUG_DIR%" (
    echo [INFO] Removing old DEBUG folder...
    rmdir /s /q "%DEBUG_DIR%"
)

echo [1/5] Creating DEBUG folder...
mkdir "%DEBUG_DIR%"
mkdir "%DEBUG_DIR%\client"
mkdir "%DEBUG_DIR%\client\src"
mkdir "%DEBUG_DIR%\client\src\core"
mkdir "%DEBUG_DIR%\client\src\ui"
mkdir "%DEBUG_DIR%\client\src\chat"
mkdir "%DEBUG_DIR%\client\src\features"
mkdir "%DEBUG_DIR%\client\src\features\mouse-follower"
mkdir "%DEBUG_DIR%\client\src\features\draggable"
mkdir "%DEBUG_DIR%\client\src\features\battle"
mkdir "%DEBUG_DIR%\client\src\types"
mkdir "%DEBUG_DIR%\server"
mkdir "%DEBUG_DIR%\server\src"
mkdir "%DEBUG_DIR%\server\src\rooms"
mkdir "%DEBUG_DIR%\fnt"
mkdir "%DEBUG_DIR%\.qwen"

echo [2/5] Copying root files...
call :copy_file "%~dp0package.json" "%DEBUG_DIR%\package.json.txt"
call :copy_file "%~dp0README.md" "%DEBUG_DIR%\README.md.txt"
call :copy_file "%~dp0ARCHITECTURE.md" "%DEBUG_DIR%\ARCHITECTURE.md.txt"
call :copy_file "%~dp0.gitignore" "%DEBUG_DIR%\.gitignore.txt"

echo [3/5] Copying client files...
call :copy_file "%~dp0client\package.json" "%DEBUG_DIR%\client\package.json.txt"
call :copy_file "%~dp0client\tsconfig.json" "%DEBUG_DIR%\client\tsconfig.json.txt"
call :copy_file "%~dp0client\vite.config.ts" "%DEBUG_DIR%\client\vite.config.ts.txt"
call :copy_file "%~dp0client\index.html" "%DEBUG_DIR%\client\index.html.txt"
call :copy_file "%~dp0client\src\main.ts" "%DEBUG_DIR%\client\src\main.ts.txt"
call :copy_file "%~dp0client\src\core\GameEngine.ts" "%DEBUG_DIR%\client\src\core\GameEngine.ts.txt"
call :copy_file "%~dp0client\src\core\InputManager.ts" "%DEBUG_DIR%\client\src\core\InputManager.ts.txt"
call :copy_file "%~dp0client\src\core\NetworkManager.ts" "%DEBUG_DIR%\client\src\core\NetworkManager.ts.txt"
call :copy_file "%~dp0client\src\ui\UIController.ts" "%DEBUG_DIR%\client\src\ui\UIController.ts.txt"
call :copy_file "%~dp0client\src\chat\ChatManager.ts" "%DEBUG_DIR%\client\src\chat\ChatManager.ts.txt"
call :copy_file "%~dp0client\src\features\mouse-follower\MouseFollowerManager.ts" "%DEBUG_DIR%\client\src\features\mouse-follower\MouseFollowerManager.ts.txt"
call :copy_file "%~dp0client\src\features\draggable\DraggableObject.ts" "%DEBUG_DIR%\client\src\features\draggable\DraggableObject.ts.txt"
call :copy_file "%~dp0client\src\features\battle\BattleManager.ts" "%DEBUG_DIR%\client\src\features\battle\BattleManager.ts.txt"
call :copy_file "%~dp0client\src\features\battle\BattleRenderer.ts" "%DEBUG_DIR%\client\src\features\battle\BattleRenderer.ts.txt"
call :copy_file "%~dp0client\src\features\battle\VirusTubeManager.ts" "%DEBUG_DIR%\client\src\features\battle\VirusTubeManager.ts.txt"
call :copy_file "%~dp0client\src\types\schema.ts" "%DEBUG_DIR%\client\src\types\schema.ts.txt"

echo [4/5] Copying server files...
call :copy_file "%~dp0server\package.json" "%DEBUG_DIR%\server\package.json.txt"
call :copy_file "%~dp0server\tsconfig.json" "%DEBUG_DIR%\server\tsconfig.json.txt"
call :copy_file "%~dp0server\src\index.ts" "%DEBUG_DIR%\server\src\index.ts.txt"
call :copy_file "%~dp0server\src\rooms\HoldingRoom.ts" "%DEBUG_DIR%\server\src\rooms\HoldingRoom.ts.txt"
call :copy_file "%~dp0server\src\rooms\schema.ts" "%DEBUG_DIR%\server\src\rooms\schema.ts.txt"

echo [5/5] Creating HTML structure file...
call :create_html_structure

echo.
echo ========================================
echo   DEBUG PACKAGE CREATED!
echo ========================================
echo   Location: %DEBUG_DIR%
echo ========================================
echo.
pause
goto :eof

REM Функция копирования файла с заголовком
:copy_file
set "SOURCE=%~1"
set "DEST=%~2"

if not exist "%SOURCE%" (
    echo [SKIP] %SOURCE% (not found)
    goto :eof
)

REM Получаем абсолютный путь
for %%I in ("%SOURCE%") do set "ABS_PATH=%%~fI"

REM Создаём файл с заголовком и содержимым
(
    echo ========================================
    echo ORIGINAL FILE PATH: %ABS_PATH%
    echo ========================================
    echo.
    type "%SOURCE%"
) > "%DEST%"

echo [COPY] %DEST%
goto :eof

REM Создание HTML файла со структурой
:create_html_structure
(
    echo ^<!DOCTYPE html^>
    echo ^<html lang="en"^>
    echo ^<head^>
    echo   ^<meta charset="UTF-8" /^>
    echo   ^<meta name="viewport" content="width=device-width, initial-scale=1.0" /^>
    echo   ^<title^>TOVCH Project Structure^</title^>
    echo   ^<style^>
    echo     body {
    echo       font-family: 'Courier New', monospace;
    echo       background: #0f0f23;
    echo       color: #00ff00;
    echo       padding: 20px;
    echo     }
    echo     .tree {
    echo       white-space: pre;
    echo       line-height: 1.5;
    echo     }
    echo     .folder { color: #00ffff; }
    echo     .file { color: #ff00ff; }
    echo     .desc { color: #888; }
    echo     a {
    echo       color: #00ff00;
    echo       text-decoration: underline;
    echo     }
    echo     a:hover {
    echo       color: #ffff00;
    echo     }
    echo   ^</style^>
    echo ^</head^>
    echo ^<body^>
    echo   ^<h1^>TOVCH Project Structure^</h1^>
    echo   ^<p^>Debug Package Generated: ^<script^>document.write(new Date().toLocaleString())^</script^>^</p^>
    echo   ^<h2^>File Structure^</h2^>
    echo   ^<div class="tree"^>
    echo TOVCH/
    echo ├── 📄 ^<a href="package.json.txt"^>package.json^</a^>                 ^<span class="desc"^># Корневой workspace (npm workspaces)^</span^>
    echo ├── 📄 ^<a href="README.md.txt"^>README.md^</a^>                    ^<span class="desc"^># Пользовательская документация^</span^>
    echo ├── 📄 ^<a href="ARCHITECTURE.md.txt"^>ARCHITECTURE.md^</a^>              ^<span class="desc"^># Техническая архитектура^</span^>
    echo ├── 📄 ^<a href=".gitignore.txt"^>.gitignore^</a^>                   ^<span class="desc"^># Git ignore правила^</span^>
    echo │
    echo ├── 📂 ^<span class="folder"^>client/^</span^>                      ^<span class="desc"^># Фронтенд (PixiJS + TypeScript + Vite)^</span^>
    echo │   ├── 📄 ^<a href="client/package.json.txt"^>package.json^</a^>            ^<span class="desc"^># Зависимости клиента^</span^>
    echo │   ├── 📄 ^<a href="client/tsconfig.json.txt"^>tsconfig.json^</a^>            ^<span class="desc"^># TypeScript конфиг^</span^>
    echo │   ├── 📄 ^<a href="client/vite.config.ts.txt"^>vite.config.ts^</a^>            ^<span class="desc"^># Vite конфиг^</span^>
    echo │   ├── 📄 ^<a href="client/index.html.txt"^>index.html^</a^>                ^<span class="desc"^># HTML + CSS стили^</span^>
    echo │   ├── 📂 ^<span class="folder"^>src/^</span^>
    echo │   │   ├── 📄 ^<a href="client/src/main.ts.txt"^>main.ts^</a^>                  ^<span class="desc"^># Точка входа приложения^</span^>
    echo │   │   ├── 📂 ^<span class="folder"^>core/^</span^>
    echo │   │   │   ├── 📄 ^<a href="client/src/core/GameEngine.ts.txt"^>GameEngine.ts^</a^>   ^<span class="desc"^># PixiJS инициализация^</span^>
    echo │   │   │   ├── 📄 ^<a href="client/src/core/InputManager.ts.txt"^>InputManager.ts^</a^> ^<span class="desc"^># Мышь/клавиатура input^</span^>
    echo │   │   │   └── 📄 ^<a href="client/src/core/NetworkManager.ts.txt"^>NetworkManager.ts^</a^> ^<span class="desc"^># Colyseus клиент^</span^>
    echo │   │   ├── 📂 ^<span class="folder"^>ui/^</span^>
    echo │   │   │   └── 📄 ^<a href="client/src/ui/UIController.ts.txt"^>UIController.ts^</a^> ^<span class="desc"^># Lobby ↔ Room UI^</span^>
    echo │   │   ├── 📂 ^<span class="folder"^>chat/^</span^>
    echo │   │   │   └── 📄 ^<a href="client/src/chat/ChatManager.ts.txt"^>ChatManager.ts^</a^>   ^<span class="desc"^># Чат в комнате^</span^>
    echo │   │   └── 📂 ^<span class="folder"^>features/^</span^>
    echo │   │       ├── 📂 ^<span class="folder"^>mouse-follower/^</span^>
    echo │   │       │   └── 📄 ^<a href="client/src/features/mouse-follower/MouseFollowerManager.ts.txt"^>MouseFollowerManager.ts^</a^>
    echo │   │       ├── 📂 ^<span class="folder"^>draggable/^</span^>
    echo │   │       │   └── 📄 ^<a href="client/src/features/draggable/DraggableObject.ts.txt"^>DraggableObject.ts^</a^>
    echo │   │       └── 📂 ^<span class="folder"^>battle/^</span^>
    echo │   │           ├── 📄 ^<a href="client/src/features/battle/BattleManager.ts.txt"^>BattleManager.ts^</a^>
    echo │   │           ├── 📄 ^<a href="client/src/features/battle/BattleRenderer.ts.txt"^>BattleRenderer.ts^</a^>
    echo │   │           └── 📄 ^<a href="client/src/features/battle/VirusTubeManager.ts.txt"^>VirusTubeManager.ts^</a^>
    echo │   └── 📂 ^<span class="folder"^>types/^</span^>
    echo │       └── 📄 ^<a href="client/src/types/schema.ts.txt"^>schema.ts^</a^>                ^<span class="desc"^># Colyseus схемы^</span^>
    echo │
    echo ├── 📂 ^<span class="folder"^>server/^</span^>                      ^<span class="desc"^># Бэкенд (Node.js + Colyseus)^</span^>
    echo │   ├── 📄 ^<a href="server/package.json.txt"^>package.json^</a^>                ^<span class="desc"^># Зависимости сервера^</span^>
    echo │   ├── 📄 ^<a href="server/tsconfig.json.txt"^>tsconfig.json^</a^>                ^<span class="desc"^># TypeScript конфиг^</span^>
    echo │   └── 📂 ^<span class="folder"^>src/^</span^>
    echo │       ├── 📄 ^<a href="server/src/index.ts.txt"^>index.ts^</a^>                    ^<span class="desc"^># Точка входа сервера^</span^>
    echo │       └── 📂 ^<span class="folder"^>rooms/^</span^>
    echo │           ├── 📄 ^<a href="server/src/rooms/HoldingRoom.ts.txt"^>HoldingRoom.ts^</a^>  ^<span class="desc"^># Логика комнаты^</span^>
    echo │           └── 📄 ^<a href="server/src/rooms/schema.ts.txt"^>schema.ts^</a^>              ^<span class="desc"^># Colyseus схемы^</span^>
    echo │
    echo └── 📂 ^<span class="folder"^>fnt/^</span^>                         ^<span class="desc"^># Шрифты^</span^>
    echo     ├── 📄 PIXY.otf                    ^<span class="desc"^># Ретро шрифт (основной)^</span^>
    echo     └── 📄 PIXY.ttf                    ^<span class="desc"^># Ретро шрифт (fallback)^</span^>
    echo   ^</div^>
    echo   
    echo   ^<h2^>Quick Links^</h2^>
    echo   ^<ul^>
    echo     ^<li^>^<a href="client/src/main.ts.txt"^>Client Entry Point (main.ts)^</a^>^</li^>
    echo     ^<li^>^<a href="client/src/core/GameEngine.ts.txt"^>Game Engine (GameEngine.ts)^</a^>^</li^>
    echo     ^<li^>^<a href="client/src/core/NetworkManager.ts.txt"^>Network Manager (NetworkManager.ts)^</a^>^</li^>
    echo     ^<li^>^<a href="server/src/rooms/HoldingRoom.ts.txt"^>Server Room (HoldingRoom.ts)^</a^>^</li^>
    echo     ^<li^>^<a href="server/src/rooms/schema.ts.txt"^>Server Schema (schema.ts)^</a^>^</li^>
    echo   ^</ul^>
    echo ^</body^>
    echo ^</html^>
) > "%DEBUG_DIR%\project_structure.html"

echo [CREATE] project_structure.html
goto :eof
