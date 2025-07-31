@echo off
chcp 65001 >nul
echo ========================================
echo    TownSquare 集成版启动脚本
echo ========================================
echo.

echo 使用集成服务器（WebSocket + API）...
echo.

echo 正在启动集成服务器（WebSocket + API）...
start "TownSquare Server (Integrated)" cmd /k "cd /d %~dp0server && echo 启动集成服务器（WebSocket + API）... && node index.js"

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
echo 🔌 WebSocket服务器: ws://localhost:8081
echo 🌐 API服务器: http://localhost:8081/api
echo 🛠️  集成服务器（WebSocket + API）
echo.
echo 📋 可用API端点:
echo    - GET  /api/scripts          # 获取所有剧本
echo    - POST /api/scripts          # 保存剧本
echo    - PUT  /api/scripts/:id      # 更新剧本
echo    - DELETE /api/scripts/:id    # 删除剧本
echo    - POST /api/scripts/import   # 批量导入剧本
echo    - GET  /api/scripts/export/all # 导出所有剧本
echo    - GET  /api/scripts/stats/info # 获取存储统计
echo.
echo 按任意键关闭此窗口...
pause >nul 