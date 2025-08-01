const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// 系统设置文件路径
const SYSTEM_DIR = path.join(__dirname, '../../src/data/system');
const SETTINGS_FILE = path.join(SYSTEM_DIR, 'settings.json');
const CATEGORIES_FILE = path.join(SYSTEM_DIR, 'categories.json');

// 确保系统目录存在
async function ensureSystemDirectory() {
  try {
    await fs.access(SYSTEM_DIR);
  } catch (error) {
    await fs.mkdir(SYSTEM_DIR, { recursive: true });
    console.log(`创建系统目录: ${SYSTEM_DIR}`);
  }
}

// 读取分类数据
async function readCategories() {
  try {
    await ensureSystemDirectory();
    const content = await fs.readFile(CATEGORIES_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    // 如果文件不存在，返回默认分类
    return {
      categories: [
        {
          id: "custom",
          name: "自制剧本",
          description: "用户自制的剧本",
          color: "#4CAF50",
          createdAt: new Date().toISOString(),
          createdBy: "admin@mm.com",
          isActive: true
        },
        {
          id: "official",
          name: "官方剧本",
          description: "官方发布的剧本",
          color: "#2196F3",
          createdAt: new Date().toISOString(),
          createdBy: "admin@mm.com",
          isActive: true
        },
        {
          id: "mixed",
          name: "混合剧本",
          description: "官方与自制混合的剧本",
          color: "#FF9800",
          createdAt: new Date().toISOString(),
          createdBy: "admin@mm.com",
          isActive: true
        }
      ]
    };
  }
}

// 保存分类数据
async function saveCategories(categoriesData) {
  await ensureSystemDirectory();
  await fs.writeFile(CATEGORIES_FILE, JSON.stringify(categoriesData, null, 2), 'utf8');
}

// 检查分类是否被使用
async function checkCategoryUsage(categoryId) {
  try {
    const scriptsDir = path.join(__dirname, '../../src/data/scripts');
    const customDir = path.join(scriptsDir, 'custom');
    const officialDir = path.join(scriptsDir, 'official');
    
    const dirs = [customDir, officialDir];
    
    for (const dir of dirs) {
      try {
        const files = await fs.readdir(dir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        for (const file of jsonFiles) {
          const filePath = path.join(dir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const scriptData = JSON.parse(content);
          
          if (scriptData.category === categoryId) {
            return true; // 分类被使用
          }
        }
      } catch (error) {
        // 目录不存在，继续检查下一个
      }
    }
    
    return false; // 分类未被使用
  } catch (error) {
    console.error('检查分类使用情况失败:', error);
    return true; // 出错时保守处理，不允许删除
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
    
    // 将用户信息添加到请求对象中
    req.user = currentUser;
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

// 获取所有分类
router.get('/categories', async (req, res) => {
  try {
    const categoriesData = await readCategories();
    res.json({
      success: true,
      data: categoriesData.categories
    });
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json({
      success: false,
      error: '获取分类失败'
    });
  }
});

// 添加新分类
router.post('/categories', requireAdmin, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: '分类名称和描述不能为空'
      });
    }
    
    const categoriesData = await readCategories();
    
    // 生成唯一ID
    const id = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    
    const newCategory = {
      id,
      name,
      description,
      color: color || '#4CAF50',
      createdAt: new Date().toISOString(),
      createdBy: req.user?.username || 'admin@mm.com',
      isActive: true
    };
    
    categoriesData.categories.push(newCategory);
    await saveCategories(categoriesData);
    
    res.json({
      success: true,
      data: newCategory,
      message: '分类添加成功'
    });
  } catch (error) {
    console.error('添加分类失败:', error);
    res.status(500).json({
      success: false,
      error: '添加分类失败'
    });
  }
});

// 更新分类
router.put('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, isActive } = req.body;
    
    const categoriesData = await readCategories();
    const categoryIndex = categoriesData.categories.findIndex(cat => cat.id === id);
    
    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '分类不存在'
      });
    }
    
    const category = categoriesData.categories[categoryIndex];
    
    // 更新分类信息
    if (name) categoriesData.categories[categoryIndex].name = name;
    if (description) categoriesData.categories[categoryIndex].description = description;
    if (color) categoriesData.categories[categoryIndex].color = color;
    if (typeof isActive === 'boolean') categoriesData.categories[categoryIndex].isActive = isActive;
    
    await saveCategories(categoriesData);
    
    res.json({
      success: true,
      data: categoriesData.categories[categoryIndex],
      message: '分类更新成功'
    });
  } catch (error) {
    console.error('更新分类失败:', error);
    res.status(500).json({
      success: false,
      error: '更新分类失败'
    });
  }
});

// 删除分类
router.delete('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const categoriesData = await readCategories();
    const category = categoriesData.categories.find(cat => cat.id === id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: '分类不存在'
      });
    }
    
    // 检查分类是否被使用
    const isUsed = await checkCategoryUsage(id);
    if (isUsed) {
      return res.status(400).json({
        success: false,
        error: '该分类下还有剧本，无法删除'
      });
    }
    
    // 检查分类是否被使用
    const isCategoryUsed = await checkCategoryUsage(id);
    if (isCategoryUsed) {
      return res.status(400).json({
        success: false,
        error: '该分类下还有剧本，无法删除'
      });
    }
    
    // 删除分类
    categoriesData.categories = categoriesData.categories.filter(cat => cat.id !== id);
    await saveCategories(categoriesData);
    
    res.json({
      success: true,
      message: '分类删除成功'
    });
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json({
      success: false,
      error: '删除分类失败'
    });
  }
});

module.exports = router; 