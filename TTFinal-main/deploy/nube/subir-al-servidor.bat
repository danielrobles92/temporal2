@echo off
setlocal
title PERREQUE - subir al servidor
REM Sube la version guardada en git (ultimo commit) al servidor y lo reinicia.
REM   subir-al-servidor.bat            -> solo el codigo (para actualizar)
REM   subir-al-servidor.bat con-datos  -> ademas la base de datos y las fotos de esta PC
REM                                       (solo sirve la primera vez, con la base del servidor vacia)
REM La IP y la llave SSH estan en servidor.local.bat (no se sube a GitHub):
REM   set "SERVIDOR=ubuntu@IP_DEL_SERVIDOR"
REM   set "LLAVE=C:\ruta\a\la\llave.key"

set "AQUI=%~dp0"
set "ROOT=%AQUI%..\..\"
if not exist "%AQUI%servidor.local.bat" (
  echo [ERROR] Falta %AQUI%servidor.local.bat con SERVIDOR y LLAVE.
  pause & exit /b 1
)
call "%AQUI%servidor.local.bat"
set "SSH=C:\Windows\System32\OpenSSH\ssh.exe"
set "SCP=C:\Windows\System32\OpenSSH\scp.exe"
set "OPC=-i "%LLAVE%" -o StrictHostKeyChecking=accept-new"

cd /d "%ROOT%"
git diff --quiet HEAD || echo [AVISO] Hay cambios sin commit: se sube solo lo que ya esta en el ultimo commit.

echo [1/3] Subiendo el codigo...
git -c core.autocrlf=false archive --format=tar HEAD | "%SSH%" %OPC% %SERVIDOR% "mkdir -p perreque && tar -x -C perreque"
if errorlevel 1 ( echo [ERROR] No se pudo subir el codigo. & pause & exit /b 1 )

if /i "%~1"=="con-datos" (
  echo [2/3] Subiendo la base de datos y las fotos...
  set "PGPASSWORD=admin"
  "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -h localhost -U postgres -d pet_adoption -Fc -f "%TEMP%\perreque.dump"
  "%SSH%" %OPC% %SERVIDOR% "mkdir -p perreque-datos/inicial perreque-datos/uploads"
  "%SCP%" %OPC% "%TEMP%\perreque.dump" %SERVIDOR%:perreque-datos/inicial/perreque.dump
  tar -c -C "%ROOT%back\uploads" . | "%SSH%" %OPC% %SERVIDOR% "tar -x -C perreque-datos/uploads"
  del "%TEMP%\perreque.dump"
) else (
  echo [2/3] Sin datos: se conserva lo que ya tiene el servidor.
)

echo [3/3] Construyendo y reiniciando en el servidor (la primera vez tarda de 10 a 20 min)...
"%SSH%" %OPC% %SERVIDOR% "bash perreque/deploy/nube/instalar.sh"

echo.
echo Terminado. Puedes cerrar esta ventana.
pause >nul
endlocal
