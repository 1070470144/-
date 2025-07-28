# TownSquare 手动启动指南

如果批处理脚本有问题，可以按照以下步骤手动启动：

## 方法1：使用快速启动脚本

```bash
双击运行 quick_start.bat
```

这个脚本跳过了环境检查，直接启动服务。

## 方法2：手动启动

### 步骤1：打开两个命令提示符窗口

### 步骤2：启动WebSocket服务器
在第一个命令提示符窗口中：

```bash
# 进入项目目录
cd /d D:\xue\xuerangongju\townsquare-develop\townsquare-develop

# 设置环境变量
set NODE_ENV=development

# 启动服务器
node server/index.js
```

应该看到输出：
```
开发模式：WebSocket服务器运行在端口8081
```

### 步骤3：启动Vue客户端
在第二个命令提示符窗口中：

```bash
# 进入项目目录
cd /d D:\xue\xuerangongju\townsquare-develop\townsquare-develop

# 启动客户端
npm run serve
```

应该看到输出：
```
Local: http://localhost:8080/
```

### 步骤4：访问应用
打开浏览器访问：http://localhost:8080

## 方法3：使用PowerShell

如果命令提示符有问题，可以尝试PowerShell：

```powershell
# 启动服务器
$env:NODE_ENV="development"
node server/index.js
```

在另一个PowerShell窗口：
```powershell
npm run serve
```

## 故障排除

### 问题1：npm命令无响应
- 尝试重新安装Node.js
- 检查网络连接
- 清除npm缓存：`npm cache clean --force`

### 问题2：端口被占用
```bash
# 查看端口占用
netstat -ano | findstr :8080
netstat -ano | findstr :8081

# 关闭占用进程
taskkill /pid <进程ID> /f
```

### 问题3：依赖包问题
```bash
# 删除node_modules重新安装
rmdir /s node_modules
npm install
```

## 成功标志

启动成功后，您应该看到：

1. **服务器窗口**：
   ```
   开发模式：WebSocket服务器运行在端口8081
   ```

2. **客户端窗口**：
   ```
   Local: http://localhost:8080/
   ```

3. **浏览器**：
   - 自动打开 http://localhost:8080
   - 显示TownSquare界面

## 关闭服务

1. 在服务器窗口按 `Ctrl+C`
2. 在客户端窗口按 `Ctrl+C`
3. 或者使用 `stop.bat` 脚本 