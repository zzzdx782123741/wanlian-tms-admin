@echo off
chcp 65001 >nul
echo ========================================
echo   获取本机局域网IP地址
echo ========================================
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set LOCAL_IP=%%a
    set LOCAL_IP=!LOCAL_IP: =!
    goto :found_ip
)

:found_ip
echo 本机局域网IP: %LOCAL_IP%
echo.
echo 同事可以通过以下地址访问你的Web管理后台:
echo.
echo ┌─────────────────────────────────────────┐
echo │  http://%LOCAL_IP%:5173/               │
echo └─────────────────────────────────────────┘
echo.
echo 提示:
echo 1. 确保你和同事在同一网络下
echo 2. 先运行"启动局域网模式.bat"启动服务
echo 3. 将上面的地址发送给同事
echo.
pause
