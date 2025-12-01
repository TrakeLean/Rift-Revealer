@echo off
setlocal enabledelayedexpansion

rem Ensure Node.js is on PATH (fallback to default install path if missing)
where node >nul 2>&1
if errorlevel 1 (
    set "NODE_HOME=C:\Program Files\nodejs"
    if exist "%NODE_HOME%\node.exe" (
        set "PATH=%NODE_HOME%;%PATH%"
        echo Added Node.js from "%NODE_HOME%" to PATH.
    ) else (
        echo Node.js not found. Please install Node.js or update NODE_HOME in build.bat.
        pause
        exit /b 1
    )
)

echo ====================================
echo Building Rift Revealer
echo ====================================
echo.
echo Step 1: Building React frontend...
call npm run build
if errorlevel 1 (
    echo Error building frontend!
    pause
    exit /b 1
)
echo.
echo Step 2: Preparing native modules (electron-builder will rebuild)...
rem Clear any locked better-sqlite3 binary to avoid EPERM unlink errors
if exist "node_modules\better-sqlite3\build\Release\better_sqlite3.node" (
    del /f /q "node_modules\better-sqlite3\build\Release\better_sqlite3.node" >nul 2>&1
)

echo.
echo Step 3: Packaging Electron app...
rem This runs electron-builder which invokes electron-rebuild internally
call npx electron-builder build --win --publish never
if errorlevel 1 (
    echo Error packaging app!
    pause
    exit /b 1
)
echo.
echo ====================================
echo Build complete!
echo Executable location: dist\Rift Revealer Setup *.exe
echo Portable version: dist\Rift Revealer *.exe
echo ====================================
pause
endlocal
