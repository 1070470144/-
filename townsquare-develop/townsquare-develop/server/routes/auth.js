const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// 用户数据存储路径
const USERS_DIR = path.join(__dirname, '../../src/data/users');
const USERS_FILE = path.join(USERS_DIR, 'users.json');

// 确保用户目录存在
async function ensureUsersDirectory() {
  try {
    await fs.access(USERS_DIR);
  } catch (error) {
    await fs.mkdir(USERS_DIR, { recursive: true });
    console.log(`创建用户目录: ${USERS_DIR}`);
  }
}

// 读取用户数据
async function readUsers() {
  try {
    await ensureUsersDirectory();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // 如果文件不存在，返回空数组
    return [];
  }
}

// 保存用户数据
async function saveUsers(users) {
  await ensureUsersDirectory();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// 生成密码哈希
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 生成JWT Token（简化版）
function generateToken(userId) {
  const payload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// 验证Token
function verifyToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token已过期
    }
    return payload.userId;
  } catch (error) {
    return null;
  }
}

// 初始化默认管理员账号
async function initializeDefaultAdmin() {
  try {
    const users = await readUsers();
    
    // 检查是否已有管理员
    const hasAdmin = users.some(user => user.role === 'admin');
    
    if (!hasAdmin) {
      // 创建默认管理员
      const adminUser = {
        id: Date.now().toString(),
        username: 'admin@mm.com',
        password: hashPassword('123456'),
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      
      users.push(adminUser);
      await saveUsers(users);
      console.log('✅ 默认管理员账号已创建: admin@mm.com / 123456');
    }
  } catch (error) {
    console.error('初始化默认管理员失败:', error);
  }
}

// 在模块加载时初始化默认管理员
initializeDefaultAdmin();

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      });
    }
    
    const users = await readUsers();
    const user = users.find(u => u.username === username);
    
    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    const token = generateToken(user.id);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      });
    }
    
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        error: '用户名长度必须在3-20个字符之间'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: '密码长度不能少于6个字符'
      });
    }
    
    const users = await readUsers();
    
    // 检查用户名是否已存在
    if (users.find(u => u.username === username)) {
      return res.status(400).json({
        success: false,
        error: '用户名已存在'
      });
    }
    
    // 创建新用户
    const newUser = {
      id: Date.now().toString(),
      username,
      password: hashPassword(password),
      role: 'user', // 默认角色
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await saveUsers(users);
    
    const token = generateToken(newUser.id);
    
    res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// 用户登出
router.post('/logout', async (req, res) => {
  // 由于使用简单的Token，这里只是返回成功
  // 实际应用中可能需要将Token加入黑名单
  res.json({
    success: true,
    message: '登出成功'
  });
});

// 获取用户信息
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '未提供认证Token'
      });
    }
    
    const token = authHeader.substring(7);
    const userId = verifyToken(token);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Token无效或已过期'
      });
    }
    
    const users = await readUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// 刷新Token
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '未提供认证Token'
      });
    }
    
    const token = authHeader.substring(7);
    const userId = verifyToken(token);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Token无效或已过期'
      });
    }
    
    const newToken = generateToken(userId);
    
    res.json({
      success: true,
      token: newToken
    });
  } catch (error) {
    console.error('刷新Token失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// 获取所有用户（管理员功能）
router.get('/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '未提供认证Token'
      });
    }
    
    const token = authHeader.substring(7);
    const userId = verifyToken(token);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Token无效或已过期'
      });
    }
    
    // 检查是否为管理员
    const users = await readUsers();
    const currentUser = users.find(u => u.id === userId);
    
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }
    
    // 返回用户列表（不包含密码）
    const userList = users.map(user => ({
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions || [],
      createdAt: user.createdAt
    }));
    
    res.json({
      success: true,
      data: userList
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// 更新用户权限（管理员功能）
router.put('/users/:userId/permissions', async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '未提供认证Token'
      });
    }
    
    const token = authHeader.substring(7);
    const adminId = verifyToken(token);
    
    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Token无效或已过期'
      });
    }
    
    // 检查是否为管理员
    const users = await readUsers();
    const adminUser = users.find(u => u.id === adminId);
    
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }
    
    // 验证权限格式
    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        error: '权限必须是数组格式'
      });
    }
    
    // 查找要修改的用户
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    // 更新用户权限
    targetUser.permissions = permissions;
    await saveUsers(users);
    
    res.json({
      success: true,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        role: targetUser.role,
        permissions: targetUser.permissions,
        createdAt: targetUser.createdAt
      }
    });
  } catch (error) {
    console.error('更新用户权限失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// 更改用户角色（管理员功能）
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '未提供认证Token'
      });
    }
    
    const token = authHeader.substring(7);
    const adminId = verifyToken(token);
    
    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Token无效或已过期'
      });
    }
    
    // 检查是否为管理员
    const users = await readUsers();
    const adminUser = users.find(u => u.id === adminId);
    
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }
    
    // 查找要修改的用户
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    // 更新用户角色
    targetUser.role = role;
    await saveUsers(users);
    
    res.json({
      success: true,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        role: targetUser.role,
        createdAt: targetUser.createdAt
      }
    });
  } catch (error) {
    console.error('更改用户角色失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// 删除用户（管理员功能）
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '未提供认证Token'
      });
    }
    
    const token = authHeader.substring(7);
    const adminId = verifyToken(token);
    
    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Token无效或已过期'
      });
    }
    
    // 检查是否为管理员
    const users = await readUsers();
    const adminUser = users.find(u => u.id === adminId);
    
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }
    
    // 查找要删除的用户
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    // 不能删除自己
    if (targetUser.id === adminId) {
      return res.status(400).json({
        success: false,
        error: '不能删除自己'
      });
    }
    
    // 删除用户
    const updatedUsers = users.filter(u => u.id !== id);
    await saveUsers(updatedUsers);
    
    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// 导出必要的函数供其他模块使用
module.exports = {
  router,
  readUsers,
  verifyToken,
  generateToken,
  hashPassword
}; 