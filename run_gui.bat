@echo off
title ResumeParser NLU — Local Demo
color 0A
echo.
echo  ============================================
echo   ResumeParser NLU — Starting Local Backend
echo  ============================================
echo.

:: Check if flask is installed
python -c "import flask, flask_cors" >nul 2>&1
if errorlevel 1 (
    echo  [1/2] Installing required packages...
    pip install flask flask-cors --quiet
) else (
    echo  [1/2] Packages already installed.
)

echo.
echo  [2/2] Starting server (model will load, this takes a minute)...
echo        The GUI will open automatically in your browser.
echo        Press Ctrl+C to stop.
echo.

cd /d "%~dp0"
python server.py
pause
