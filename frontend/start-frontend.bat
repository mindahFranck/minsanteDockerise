@echo off
:: ========================================
:: Health Management System - Frontend
:: ========================================

title Health Management - Frontend

echo.
echo ========================================
echo  Health Management System
echo  Demarrage du Frontend
echo ========================================
echo.

:: Vérifier que les dépendances sont installées
if not exist "node_modules" (
    echo Installation des dependances frontend...
    call npm install
    if errorlevel 1 (
        echo ERREUR: Installation echouee
        pause
        exit /b 1
    )
)

echo.
echo Frontend demarre sur: http://localhost:5173
echo.
echo Appuyez sur Ctrl+C pour arreter
echo.

:: Démarrer le frontend
call npm run dev
