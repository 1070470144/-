const express = require('express');
const cors = require('cors');
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API服务器运行正常' });
});

// 剧本API路由
app.use('/api/scripts', require('./routes/scripts'));

// 启动服务器
const PORT = 8081;
app.listen(PORT, () => {
  console.log(`测试服务器运行在端口 ${PORT}`);
  console.log(`API地址: http://localhost:${PORT}/api`);
});

// 错误处理
app.on('error', (error) => {
  console.error('服务器错误:', error);
}); 