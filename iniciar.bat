@echo off
cd /d "%~dp0"
node scripts/assemble.mjs
node server.mjs
pause
