@echo off
chcp 65001 >nul
echo ========================================
echo   万联驿站 Web管理后台 - 局域网启动
echo ========================================
echo.

echo [步骤1] 获取本机局域网IP地址...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set LOCAL_IP=%%a
    set LOCAL_IP=!LOCAL_IP: =!
    goto :found_ip
)
:found_ip
echo 本机IP地址: %LOCAL_IP%
echo.

echo [步骤2] 检查后端API是否运行...
curl -s http://localhost:3000/api >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  警告: 后端API未运行！
    echo 请先在新终端窗口中运行:
    echo   cd wanlian-tms-api
    echo   npm run dev
    echo.
) else (
    echo ✅ 后端API运行正常
)
echo.

echo [步骤3] 启动前端开发服务器（局域网模式）...
echo.
echo ┌─────────────────────────────────────────┐
echo │  启动后，请将以下地址发送给同事:        │
echo │                                         │
echo │  http://%LOCAL_IP%:5173/               │
echo │                                         │
echo └─────────────────────────────────────────┘
echo.
echo 按任意键开始启动...
pause >nul

npm run dev:lan
