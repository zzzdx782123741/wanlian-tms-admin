@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
echo ========================================
echo   万联驿站 Web 管理后台 - 局域网启动
echo ========================================
echo.

echo [步骤1] 获取本机局域网 IP 地址...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "LOCAL_IP=%%a"
    set "LOCAL_IP=!LOCAL_IP: =!"
    goto :found_ip
)
:found_ip
echo 本机 IP 地址: %LOCAL_IP%
echo.

set "API_PROTOCOL=http"
set "API_HOST=localhost"
set "API_PORT=3000"
set "API_PROXY_TARGET="
if exist ".env.development" (
    for /f "usebackq tokens=1,* delims==" %%a in (".env.development") do (
        if /I "%%a"=="VITE_API_PROTOCOL" set "API_PROTOCOL=%%b"
        if /I "%%a"=="VITE_API_HOST" set "API_HOST=%%b"
        if /I "%%a"=="VITE_API_PORT" set "API_PORT=%%b"
        if /I "%%a"=="VITE_API_PROXY_TARGET" set "API_PROXY_TARGET=%%b"
    )
)

if defined API_PROXY_TARGET (
    set "BACKEND_API_URL=!API_PROXY_TARGET!/api"
) else (
    set "BACKEND_API_URL=!API_PROTOCOL!://!API_HOST!:!API_PORT!/api"
)

echo [步骤2] 检查后端 API 是否运行...
echo 使用地址: !BACKEND_API_URL!
curl -s "!BACKEND_API_URL!" >nul 2>&1
if %errorlevel% neq 0 (
    echo 注意: 后端 API 暂未运行
    echo 请先在新的终端窗口中执行:
    echo   cd ..\wanlian-tms-api
    echo   npm run dev
    echo.
) else (
    echo 后端 API 运行正常
)
echo.

echo [步骤3] 启动前端开发服务器（局域网模式）...
echo.
echo ========================================
echo   启动后，请将以下地址发给同事:
echo
echo   http://%LOCAL_IP%:5173/
echo ========================================
echo.
echo 按任意键开始启动...
pause >nul

npm run dev:lan
