@echo off
chcp 65001 >nul
title ИТ-Учёт — локальный сервер

echo.
echo  Проверяю Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ОШИБКА] Python не найден!
    echo  Скачайте Python с https://python.org и установите.
    echo  При установке поставьте галочку "Add Python to PATH"
    pause
    exit /b 1
)

echo  Python найден. Запускаю сервер...
echo.
python "%~dp0server.py"

if errorlevel 1 (
    echo.
    echo  [ОШИБКА] Сервер завершился с ошибкой.
    pause
)
