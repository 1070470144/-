const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// 系统设置文件路径
const SYSTEM_DIR = path.join(__dirname, '../../src/data/system');
const SETTINGS_FILE = path.join(SYSTEM_DIR, 'settings.json');

// 确保系统目录存在
async function ensureSystemDirectory() {
  try {
    await fs.access(SYSTEM_DIR);
  } catch (error) {
    await fs.mkdir(SYSTEM_DIR, { recursive: true });
    console.log(`创建系统目录: ${SYSTEM_DIR}`);
  }
}

// 读取系统设置
async function readSettings() {
  try {
    await ensureSystemDirectory();
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // 如果文件不存在，返回默认设置
    return {
      registration: {
        enabled: true
      },
      scripts: {
        autoApprove: false,
        requireReview: true
      },
      system: {
        maintenance: false,
        version: '1.0.0'
      }
    };
  }
}

// 保存系统设置
async function saveSettings(settings) {
  await ensureSystemDirectory();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
}

// 验证管理员权限的中间件
async function requireAdmin(req, res, next) {
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
    
    next();
  } catch (error) {
    console.error('权限验证失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
}

// 从auth.js导入必要的函数
const authModule = require('./auth');
const { readUsers, verifyToken } = authModule;

// 获取注册开关状态
router.get('/registration', async (req, res) => {
  try {
    const settings = await readSettings();
    res.json({
      success: true,
      enabled: settings.registration.enabled
    });
  } catch (error) {
    console.error('获取注册状态失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// 切换注册开关（需要管理员权限）
router.put('/registration', requireAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;
    const settings = await readSettings();
    
    settings.registration.enabled = enabled;
    await saveSettings(settings);
    
    res.json({
      success: true,
      enabled: settings.registration.enabled
    });
  } catch (error) {
    console.error('切换注册状态失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// 获取系统设置
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    const settings = await readSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('获取系统设置失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// 更新系统设置
router.put('/settings', requireAdmin, async (req, res) => {
  try {
    const newSettings = req.body;
    await saveSettings(newSettings);
    
    res.json({
      success: true,
      data: newSettings
    });
  } catch (error) {
    console.error('更新系统设置失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// 获取系统统计信息
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const users = await readUsers();
    const settings = await readSettings();
    
    // 读取剧本统计
    const scriptsDir = path.join(__dirname, '../../src/data/scripts/custom');
    let scriptCount = 0;
    let pendingCount = 0;
    
    try {
      const scriptFiles = await fs.readdir(scriptsDir);
      scriptCount = scriptFiles.filter(file => file.endsWith('.json')).length;
      
      // 统计待审核剧本
      for (const file of scriptFiles) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(scriptsDir, file), 'utf8');
          const script = JSON.parse(content);
          if (script.status === 'pending') {
            pendingCount++;
          }
        }
      }
    } catch (error) {
      // 目录不存在或读取失败
    }
    
    const stats = {
      users: {
        total: users.length,
        admin: users.filter(u => u.role === 'admin').length,
        user: users.filter(u => u.role === 'user').length
      },
      scripts: {
        total: scriptCount,
        pending: pendingCount,
        approved: scriptCount - pendingCount
      },
      system: {
        registration: settings.registration.enabled,
        maintenance: settings.system?.maintenance || false,
        version: settings.system?.version || '1.0.0'
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取系统统计失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

module.exports = router; 