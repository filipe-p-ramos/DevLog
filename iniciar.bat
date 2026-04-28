@echo off
TITLE PROJECT_NOTES - Desenvolvimento
echo ==================================================
echo   Iniciando Ambiente de Desenvolvimento: PROJECT_NOTES
echo ==================================================
echo.
echo [!] Verificando dependencias...
if not exist node_modules (
    echo [!] node_modules nao encontrado. Instalando...
    npm install
)
echo.
echo [!] Iniciando Next.js...
npm run dev
pause
