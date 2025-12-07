@echo off
setlocal ENABLEDELAYEDEXPANSION
REM Helper: create git tag and GitHub release (interactive).
REM Requirements: git, gh (authenticated), clean working tree.

set EXIT_CODE=0
set PAUSE_AT_END=1
if "%1"=="--no-pause" set PAUSE_AT_END=

REM Ensure git and gh exist
where git >nul 2>&1 || (echo Required command 'git' not found.& set EXIT_CODE=1 & goto :finish)
where gh >nul 2>&1 || (echo Required command 'gh' not found.& set EXIT_CODE=1 & goto :finish)

REM Move to repo root
for /f "delims=" %%i in ('git rev-parse --show-toplevel') do set REPO_ROOT=%%i
if not defined REPO_ROOT (
  echo Failed to locate git repository root.
  set EXIT_CODE=1
  goto :finish
)
cd /d "%REPO_ROOT%"

REM Read package.json version (best effort)
for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-Content package.json -Raw ^| ConvertFrom-Json).version"') do set PKG_VERSION=%%i

set VERSION=
set /p VERSION=New version (package.json: %PKG_VERSION%) ^>= 
if "%VERSION%"=="" set VERSION=%PKG_VERSION%
if "%VERSION%"=="" (
  echo Version is required.
  set EXIT_CODE=1
  goto :finish
)

set TARGET=HEAD
set /p TARGET=Tag target commit-ish [HEAD]^> 
if "%TARGET%"=="" set TARGET=HEAD

set TITLE=v%VERSION%
set /p TITLE=Release title [v%VERSION%]^> 
if "%TITLE%"=="" set TITLE=v%VERSION%

set NOTES=Release v%VERSION%
set /p NOTES=Release notes (single line) [Release v%VERSION%]^> 
if "%NOTES%"=="" set NOTES=Release v%VERSION%

REM Guard: clean working tree
set DIRTY=
for /f "delims=" %%i in ('git status --porcelain') do set DIRTY=1 & goto :dirtyCheckDone
:dirtyCheckDone
if defined DIRTY (
  echo Working tree is not clean. Commit or stash changes before releasing.
  set EXIT_CODE=1
  goto :finish
)

REM Guard: tag must not exist
set TAG=v%VERSION%
set TAG_EXISTS=
for /f "delims=" %%i in ('git tag -l %TAG%') do set TAG_EXISTS=1
if defined TAG_EXISTS (
  echo Tag %TAG% already exists.
  set EXIT_CODE=1
  goto :finish
)

echo.
echo About to create tag %TAG% on %TARGET% and publish release "%TITLE%".
echo Notes: %NOTES%
set /p CONFIRM=Proceed? (y/N)^> 
if /i not "%CONFIRM%"=="y" if /i not "%CONFIRM%"=="yes" (
  echo Aborted.
  goto :finish
)

REM Create and push tag
git tag -a %TAG% %TARGET% -m "Release %TAG%"
if errorlevel 1 (
  echo Failed to create tag.
  set EXIT_CODE=1
  goto :finish
)

git push origin %TAG%
if errorlevel 1 (
  echo Failed to push tag.
  set EXIT_CODE=1
  goto :finish
)

REM Create GitHub release
gh release create %TAG% --title "%TITLE%" --notes "%NOTES%" --verify-tag
if errorlevel 1 (
  echo Failed to create GitHub release.
  set EXIT_CODE=1
  goto :finish
)

echo Release %TAG% created.

:finish
if defined PAUSE_AT_END pause
exit /b %EXIT_CODE%
