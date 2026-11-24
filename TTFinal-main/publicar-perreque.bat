@echo off
setlocal
title PERREQUE - publicar en internet

REM ===========================================================================
REM  Publica PERREQUE en internet con un enlace https temporal (Cloudflare Tunnel).
REM  Deja esta computadora encendida (sin suspender) mientras otros prueban la pagina.
REM  Para detener todo, cierra las ventanas "PERREQUE ...".
REM ===========================================================================

set "ROOT=%~dp0"
set "ROOTF=%ROOT:\=/%"
set "JDK21=C:\Users\Saibo\.jdks\ms-21.0.10"
set "JAVA_HOME=%JDK21%"
set "LOG=%ROOT%deploy\tunel.log"

REM --- cloudflared (crea el enlace publico) ---
set "CF="
for /f "delims=" %%i in ('where cloudflared 2^>nul') do if not defined CF set "CF=%%i"
if not defined CF if exist "%ROOT%deploy\bin\cloudflared.exe" set "CF=%ROOT%deploy\bin\cloudflared.exe"
if not defined CF if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" set "CF=C:\Program Files (x86)\cloudflared\cloudflared.exe"
if not defined CF if exist "C:\Program Files\cloudflared\cloudflared.exe" set "CF=C:\Program Files\cloudflared\cloudflared.exe"
if not defined CF (
  echo [FALTA] No encuentro cloudflared. Instalalo una sola vez con este comando y vuelve a abrir este archivo:
  echo.
  echo     winget install --id Cloudflare.cloudflared
  echo.
  pause
  exit /b 1
)

REM --- clave JWT nueva y secreta para la version publica (la de desarrollo esta en el codigo) ---
for /f "delims=" %%i in ('powershell -NoProfile -Command "[guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')"') do set "JWT_SECRET=%%i"

echo ===========================================================
echo   Publicando PERREQUE
echo ===========================================================
net start postgresql-x64-18 >nul 2>&1

echo [1/5] ml-service (red neuronal)...
netstat -ano | findstr ":8000 " | findstr LISTENING >nul
if errorlevel 1 (
  start "PERREQUE ml-service" cmd /k "cd /d %ROOT%ml-service && .venv\Scripts\python.exe -m uvicorn app.main:app --port 8000"
) else (
  echo       ya estaba corriendo.
)

echo [2/5] backend con clave segura (se reinicia si ya corria)...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8080 " ^| findstr LISTENING') do taskkill /PID %%p /F >nul 2>&1
start "PERREQUE backend (publico)" cmd /k "cd /d %ROOT%back\petproject && mvnw.cmd spring-boot:run -Dspring-boot.run.arguments=--app.upload-dir=%ROOTF%back/uploads"

echo [3/5] compilando la pagina (1 a 2 minutos)...
pushd "%ROOT%front"
set "REACT_APP_API_URL=same-origin"
set "GENERATE_SOURCEMAP=false"
call npm run build >"%ROOT%deploy\build.log" 2>&1
if errorlevel 1 (
  echo [ERROR] No se pudo compilar la pagina. Revisa deploy\build.log
  popd
  pause
  exit /b 1
)
popd

echo       esperando al backend...
:esperar
curl -s -o nul "http://localhost:8080/pets?page=0&size=1" || (timeout /t 3 /nobreak >nul & goto esperar)

echo [4/5] gateway (pagina + API en un solo dominio, puerto 8090)...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8090 " ^| findstr LISTENING') do taskkill /PID %%p /F >nul 2>&1
start "PERREQUE gateway" cmd /k "cd /d %ROOT% && node deploy\gateway.js"

echo [5/5] enlace publico...
if exist "%LOG%" del "%LOG%"
start "PERREQUE enlace publico (no cerrar)" cmd /k ""%CF%" tunnel --no-autoupdate --url http://localhost:8090 --logfile "%LOG%""

powershell -NoProfile -Command "$f='%LOG%'; for($i=0;$i -lt 60;$i++){ if(Test-Path $f){ $m = Select-String -Path $f -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' | Select-Object -First 1; if($m){ $u=$m.Matches[0].Value; Set-Clipboard $u; Set-Content -Path '%ROOT%deploy\ENLACE.txt' -Value $u; Write-Host ''; Write-Host ('  ENLACE PUBLICO: ' + $u) -ForegroundColor Green; Write-Host '  (ya esta copiado; pegalo con Ctrl+V. Tambien queda en deploy\ENLACE.txt)'; exit } }; Start-Sleep 2 }; Write-Host 'No se obtuvo el enlace; revisa la ventana PERREQUE enlace publico.' -ForegroundColor Yellow"

echo.
echo  - Comparte el enlace. Funciona mientras esta computadora y las ventanas sigan abiertas.
echo  - Si reinicias este archivo, el enlace CAMBIA y hay que compartir el nuevo.
echo  - Todos deben iniciar sesion de nuevo (la clave de sesion es nueva).
echo.
pause
endlocal
