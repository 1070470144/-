@echo off
chcp 65001 >nul
echo ========================================
echo    TownSquare 修复版启动脚本
echo ========================================
echo.

echo 使用修复版服务器文件（强制开发模式）...
echo.

echo 正在启动WebSocket服务器...
start "TownSquare Server (Fixed)" cmd /k "cd /d %~dp0 && echo 启动WebSocket服务器（修复版）... && node server_dev.js"

echo 等待服务器启动...
timeout /t 5 /nobreak >nul

echo 正在启动Vue客户端...
start "TownSquare Client" cmd /k "cd /d %~dp0 && echo 启动Vue客户端... && npm run serve"

echo.
echo ========================================
echo    ✅ 启动完成！
echo ========================================
echo.
echo 📱 客户端地址: http://localhost:8080
echo 🔌 服务器地址: ws://localhost:8081
echo 🛠️  使用修复版服务器文件
echo.
echo 按任意键关闭此窗口...
pause >nul 