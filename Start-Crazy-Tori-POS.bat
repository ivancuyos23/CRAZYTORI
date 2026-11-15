@echo off
title Crazy Tori POS Launcher
echo Starting Crazy Tori Local SQLite Server...
start "Crazy Tori Backend" cmd /k "cd /d C:\Crazy tori\backend && node server.js"

echo Starting Crazy Tori POS App (Laptop + Mobile Wi-Fi)...
start "Crazy Tori Frontend" cmd /k "cd /d C:\Crazy tori\frontend && npm run dev -- --host"

timeout /t 3 /nobreak >nul
start http://localhost:5173