@echo off
TITLE DevLog - Desenvolvimento
echo ==================================================
echo   Iniciando Ambiente de Desenvolvimento: DevLog
echo ==================================================
echo.
echo [!] Verificando dependencias...
if not exist node_modules (
    echo [!] node_modules nao encontrado. Instalando...
    npm install
)

echo [!] Gerando Prisma Client...
call npx prisma generate

echo.
echo [!] Iniciando Next.js...
npm run dev
pause
