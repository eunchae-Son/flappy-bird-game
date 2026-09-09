@echo off
setlocal
set "GAME_FILE=%~dp0index.html"
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "%GAME_FILE%"
  exit /b
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "%GAME_FILE%"
  exit /b
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
  start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" "%GAME_FILE%"
  exit /b
)
echo Google Chrome was not found. Open index.html in Chrome manually.
pause
