@echo off
echo ====================================
echo Building Rift Revealer
echo ====================================
echo.
echo Step 1: Building React frontend...
call npm run build
if errorlevel 1 (
    echo Error building frontend!
    exit /b 1
)
echo.
echo Step 2: Rebuilding native modules...
call npm run rebuild
if errorlevel 1 (
    echo Error rebuilding native modules!
    exit /b 1
)
echo.
echo Step 3: Packaging Electron app...
call npx electron-builder build --win --publish never
if errorlevel 1 (
    echo Error packaging app!
    exit /b 1
)
echo.
echo ====================================
echo Build complete!
echo Executable location: dist\Rift Revealer Setup *.exe
echo Portable version: dist\Rift Revealer *.exe
echo ====================================
pause
