const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

// 配置文件上传
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      // 临时目录，实际文件会重新保存到正确位置
      cb(null, require('os').tmpdir());
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 剧本存储目录
const SCRIPTS_DIR = path.join(__dirname, '../../src/data/scripts');
const CUSTOM_DIR = path.join(SCRIPTS_DIR, 'custom');
const OFFICIAL_DIR = path.join(SCRIPTS_DIR, 'official');
const TEMPLATES_DIR = path.join(SCRIPTS_DIR, 'templates');
const STATUS_FILE = path.join(SCRIPTS_DIR, 'status', 'script_status.json');
const USAGE_FILE = path.join(SCRIPTS_DIR, 'usage.json');
const LIKES_FILE = path.join(SCRIPTS_DIR, 'likes.json');
const IMAGES_METADATA_FILE = path.join(SCRIPTS_DIR, 'script_images.json');
const USER_INFO_FILE = path.join(SCRIPTS_DIR, 'user_info.json');
const IMAGES_DIR = path.join(SCRIPTS_DIR, 'images');

// 确保目录存在
async function ensureDirectories() {
  const seriesDir = path.join(SCRIPTS_DIR, 'series');
  const dirs = [SCRIPTS_DIR, CUSTOM_DIR, OFFICIAL_DIR, TEMPLATES_DIR, path.dirname(STATUS_FILE), IMAGES_DIR, seriesDir];
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch (error) {
      await fs.mkdir(dir, { recursive: true });
      console.log(`创建目录: ${dir}`);
    }
  }
}

// 获取目录路径
function getDirectoryByType(type) {
  switch (type) {
    case 'custom':
      return CUSTOM_DIR;
    case 'official':
      return OFFICIAL_DIR;
    case 'templates':
      return TEMPLATES_DIR;
    default:
      return CUSTOM_DIR;
  }
}

// 获取所有剧本
async function getAllScripts() {
  try {
    await ensureDirectories();
    
    const scripts = {
      custom: [],
      official: [],
      templates: []
    };

    // 读取状态文件
    const statusData = await readStatusFile();

    // 读取各目录下的剧本文件
    const types = ['custom', 'official', 'templates'];
    
    for (const type of types) {
      const dir = getDirectoryByType(type);
      
      try {
        const files = await fs.readdir(dir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        for (const file of jsonFiles) {
          try {
            const filePath = path.join(dir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const scriptData = JSON.parse(content);
            
            // 保持原始剧本数据不变，创建新的响应对象
            const scriptId = scriptData.id || path.basename(file, '.json');
            
            // 从状态文件获取状态信息
            const scriptStatus = await getScriptStatus(scriptId);
            
            // 加载图片信息
            let images = [];
            try {
              const imagesData = await getScriptImages(scriptId);
              images = imagesData.images || [];
            } catch (error) {
              console.error(`加载剧本 ${scriptId} 的图片失败:`, error);
            }
            
            // 加载用户信息
            let userInfo = null;
            try {
              userInfo = await getScriptUserInfo(scriptId);
            } catch (error) {
              console.error(`加载剧本 ${scriptId} 的用户信息失败:`, error);
            }
            
            // 创建响应对象，包含原始数据和系统信息
            const responseData = {
              // 原始剧本数据（保持不变）
              ...scriptData,
              // 系统添加的信息
              filePath: `${type}/${file}`,
              fileSize: content.length,
              lastModified: (await fs.stat(filePath)).mtime,
              type: type,
              // 状态信息（来自独立的状态文件）
              status: scriptStatus.status,
              reviewedBy: scriptStatus.reviewedBy,
              reviewedAt: scriptStatus.reviewedAt,
              reviewNote: scriptStatus.reviewNote,
              // 图片信息（来自独立的图片元数据文件）
              images: images,
              // 用户信息（来自独立的用户信息文件）
              userId: userInfo ? userInfo.userId : null,
              userCreatedAt: userInfo ? userInfo.createdAt : null
            };
            
            // 只在调试时显示状态信息
            // console.log(`📄 剧本 ${scriptId} 状态: ${scriptStatus.status}`);
            
            scripts[type].push(responseData);
          } catch (error) {
            console.error(`❌ 读取剧本文件失败: ${file}`, error);
          }
        }
      } catch (error) {
        console.error(`❌ 读取目录失败: ${dir}`, error);
      }
    }

    return scripts;
  } catch (error) {
    console.error('❌ 获取所有剧本失败:', error);
    throw error;
  }
}

// 保存剧本
async function saveScript(scriptData, type = 'custom', userId = null) {
  try {
    await ensureDirectories();
    
    const dir = getDirectoryByType(type);
    const fileName = `${scriptData.id}.json`;
    const filePath = path.join(dir, fileName);
    
    // 处理系列信息
    let seriesInfo = null;
    if (scriptData.seriesInfo) {
      const { option, seriesId, newSeriesName, newSeriesDescription, newSeriesVersion, existingSeriesVersion } = scriptData.seriesInfo;
      
      if (option === 'existing' && seriesId) {
        // 添加到现有系列
        seriesInfo = await addScriptToExistingSeries(scriptData.id, seriesId, scriptData, existingSeriesVersion);
      } else if (option === 'new' && newSeriesName) {
        // 创建新系列
        seriesInfo = await createNewSeriesWithScript(newSeriesName, newSeriesDescription, scriptData, newSeriesVersion);
      }
    }
    
    // 保持原始剧本数据不变，只保存用户上传的原始内容
    await fs.writeFile(filePath, JSON.stringify(scriptData, null, 2), 'utf8');
    
    // 保存用户信息（如果提供了用户ID）
    if (userId) {
      try {
        await saveScriptUserInfo(scriptData.id, userId);
      } catch (userError) {
        console.error('保存用户信息失败:', userError);
      }
    }
    
    // 系统信息（状态、图片等）存储在独立的数据结构中
    // 状态信息存储在 script_status.json 中
    // 图片信息存储在 script_images.json 中
    // 系列信息存储在 series/ 目录中
    // 用户信息存储在 user_info.json 中
    
    return { success: true, filePath, seriesInfo };
  } catch (error) {
    console.error('保存剧本失败:', error);
    throw error;
  }
}

// 添加剧本到现有系列
async function addScriptToExistingSeries(scriptId, seriesId, scriptData, customVersion) {
  try {
    const seriesDir = path.join(SCRIPTS_DIR, 'series');
    const seriesFilePath = path.join(seriesDir, `${seriesId}.json`);
    
    // 读取现有系列数据
    let seriesData;
    try {
      const content = await fs.readFile(seriesFilePath, 'utf8');
      seriesData = JSON.parse(content);
    } catch (error) {
      throw new Error('系列不存在');
    }
    
    // 验证版本号是否已存在
    const existingVersions = seriesData.versions || [];
    const versionExists = existingVersions.some(v => v.version === customVersion);
    if (versionExists) {
      throw new Error(`版本号 ${customVersion} 已存在，请使用其他版本号`);
    }
    
    // 添加新版本
    const newVersion = {
      id: scriptId,
      name: scriptData.name,
      version: customVersion,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    seriesData.versions = seriesData.versions || [];
    seriesData.versions.push(newVersion);
    seriesData.updatedAt = new Date().toISOString();
    
    // 保存更新后的系列数据
    await fs.writeFile(seriesFilePath, JSON.stringify(seriesData, null, 2), 'utf8');
    
    return {
      seriesId: seriesId,
      seriesName: seriesData.name,
      version: customVersion,
      isNewSeries: false
    };
  } catch (error) {
    console.error('添加到现有系列失败:', error);
    throw error;
  }
}

// 更新系列中的版本状态
async function updateSeriesVersionStatus(scriptId, seriesId, status) {
  try {
    const seriesDir = path.join(SCRIPTS_DIR, 'series');
    const seriesFilePath = path.join(seriesDir, `${seriesId}.json`);
    
    // 读取系列数据
    const content = await fs.readFile(seriesFilePath, 'utf8');
    const seriesData = JSON.parse(content);
    
    // 更新对应版本的状态
    if (seriesData.versions) {
      const version = seriesData.versions.find(v => v.id === scriptId);
      if (version) {
        version.status = status;
        version.updatedAt = new Date().toISOString();
        
        // 保存更新后的系列数据
        await fs.writeFile(seriesFilePath, JSON.stringify(seriesData, null, 2), 'utf8');
        console.log(`系列 ${seriesId} 中的版本 ${scriptId} 状态更新为: ${status}`);
      }
    }
  } catch (error) {
    console.error('更新系列版本状态失败:', error);
    // 不抛出错误，因为这是辅助功能
  }
}

// 创建新系列并添加剧本
async function createNewSeriesWithScript(seriesName, seriesDescription, scriptData, customVersion) {
  try {
    const seriesDir = path.join(SCRIPTS_DIR, 'series');
    await ensureDirectories();
    
    const seriesId = generateId();
    const seriesData = {
      id: seriesId,
      name: seriesName,
      description: seriesDescription,
      category: scriptData.category,
      versions: [{
        id: scriptData.id,
        name: scriptData.name,
        version: customVersion,
        createdAt: new Date().toISOString(),
        status: 'pending'
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const seriesFilePath = path.join(seriesDir, `${seriesId}.json`);
    await fs.writeFile(seriesFilePath, JSON.stringify(seriesData, null, 2), 'utf8');
    
    return {
      seriesId: seriesId,
      seriesName: seriesName,
      version: customVersion,
      isNewSeries: true
    };
  } catch (error) {
    console.error('创建新系列失败:', error);
    throw error;
  }
}

// 删除剧本
async function deleteScript(scriptId, type = 'custom') {
  try {
    const dir = getDirectoryByType(type);
    const fileName = `${scriptId}.json`;
    const filePath = path.join(dir, fileName);
    
    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch (error) {
      // 文件不存在，返回成功（因为目标已经达成）
      console.log(`剧本文件不存在: ${filePath}`);
      return { success: true, message: '剧本不存在或已被删除' };
    }
    
    // 删除文件
    await fs.unlink(filePath);
    console.log(`成功删除剧本: ${filePath}`);
    
    // 从所有系列中删除该剧本
    try {
      await removeScriptFromAllSeries(scriptId);
    } catch (seriesError) {
      console.log('从系列中删除剧本失败:', seriesError);
    }
    
    // 删除相关的状态数据
    try {
      await updateScriptStatus(scriptId, 'deleted', 'system', '剧本已删除');
    } catch (statusError) {
      console.log('删除状态数据失败:', statusError);
    }
    
    // 删除使用记录
    try {
      await deleteScriptUsage(scriptId);
    } catch (usageError) {
      console.log('删除使用记录失败:', usageError);
    }
    
    // 删除点赞记录
    try {
      await deleteScriptLikes(scriptId);
    } catch (likesError) {
      console.log('删除点赞记录失败:', likesError);
    }
    
    // 删除图片记录
    try {
      await deleteScriptImages(scriptId);
    } catch (imagesError) {
      console.log('删除图片记录失败:', imagesError);
    }
    
    // 删除用户信息
    try {
      await deleteScriptUserInfo(scriptId);
    } catch (userError) {
      console.log('删除用户信息失败:', userError);
    }
    
    return { success: true, message: '剧本及相关数据删除成功' };
  } catch (error) {
    console.error('删除剧本失败:', error);
    throw error;
  }
}

// 获取单个剧本
async function getScript(scriptId, type = 'custom') {
  try {
    const dir = getDirectoryByType(type);
    const fileName = `${scriptId}.json`;
    const filePath = path.join(dir, fileName);
    
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('获取剧本失败:', error);
    throw error;
  }
}

// 读取状态文件
async function readStatusFile() {
  try {
    await ensureDirectories();
    const content = await fs.readFile(STATUS_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    // 如果文件不存在，返回默认结构
    return { series: {}, standalone: {} };
  }
}

// 保存状态文件
async function saveStatusFile(statusData) {
  try {
    console.log('=== 开始保存状态文件 ===');
    console.log('保存的状态数据:', statusData);
    console.log('状态文件路径:', STATUS_FILE);
    
    await ensureDirectories();
    await fs.writeFile(STATUS_FILE, JSON.stringify(statusData, null, 2), 'utf8');
    
    console.log('状态文件保存成功:', STATUS_FILE);
    
    // 验证文件是否真的被写入
    const savedContent = await fs.readFile(STATUS_FILE, 'utf8');
    console.log('保存后的文件内容:', savedContent);
    console.log('=== 状态文件保存完成 ===');
  } catch (error) {
    console.error('保存状态文件失败:', error);
    throw error;
  }
}

// 获取剧本状态
async function getScriptStatus(scriptId) {
  const statusData = await readStatusFile();
  
  // 先检查独立剧本
  if (statusData.standalone[scriptId]) {
    return statusData.standalone[scriptId];
  }
  
  // 检查系列剧本
  for (const seriesId in statusData.series) {
    const series = statusData.series[seriesId];
    if (series.versions && series.versions[scriptId]) {
      return series.versions[scriptId];
    }
  }
  
  // 默认状态
  return { status: 'pending' };
}

// 更新剧本状态
async function updateScriptStatus(scriptId, status, reviewedBy, reviewNote = '') {
  console.log('更新剧本状态:', { scriptId, status, reviewedBy, reviewNote });
  
  const statusData = await readStatusFile();
  console.log('当前状态数据:', statusData);
  
  // 检查是否是系列剧本
  for (const seriesId in statusData.series) {
    const series = statusData.series[seriesId];
    if (series.versions && series.versions[scriptId]) {
      series.versions[scriptId] = {
        status,
        reviewedBy,
        reviewedAt: new Date().toISOString(),
        reviewNote
      };
      await saveStatusFile(statusData);
      console.log('系列剧本状态更新成功:', series.versions[scriptId]);
      
      // 如果审核通过，更新系列中的版本状态
      if (status === 'approved') {
        await updateSeriesVersionStatus(scriptId, seriesId, status);
      }
      
      return series.versions[scriptId];
    }
  }
  
  // 独立剧本
  statusData.standalone[scriptId] = {
    scriptId,
    status,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    reviewNote
  };
  
  await saveStatusFile(statusData);
  console.log('独立剧本状态更新成功:', statusData.standalone[scriptId]);
  return statusData.standalone[scriptId];
}

// 读取图片元数据
async function readImagesMetadata() {
  try {
    await ensureDirectories();
    const data = await fs.readFile(IMAGES_METADATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // 如果文件不存在，返回默认结构
    return { images: {} };
  }
}

// 保存图片元数据
async function saveImagesMetadata(metadata) {
  await ensureDirectories();
  await fs.writeFile(IMAGES_METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf8');
}

// 获取剧本图片
async function getScriptImages(scriptId) {
  try {
    const metadata = await readImagesMetadata();
    return metadata.images[scriptId] || { images: [] };
  } catch (error) {
    console.error('获取剧本图片失败:', error);
    return { images: [] };
  }
}

// 保存剧本图片
async function saveScriptImages(scriptId, images) {
  try {
    const metadata = await readImagesMetadata();
    metadata.images[scriptId] = {
      images: images
    };
    await saveImagesMetadata(metadata);
    return { success: true };
  } catch (error) {
    console.error('保存剧本图片失败:', error);
    throw error;
  }
}

// 删除剧本使用记录
async function deleteScriptUsage(scriptId) {
  try {
    const usageFile = path.join(SCRIPTS_DIR, 'usage.json');
    let usageData = {};
    
    try {
      const usageContent = await fs.readFile(usageFile, 'utf8');
      usageData = JSON.parse(usageContent);
    } catch (error) {
      // 文件不存在，无需删除
      return;
    }
    
    // 删除使用记录
    if (usageData[scriptId]) {
      delete usageData[scriptId];
      await fs.writeFile(usageFile, JSON.stringify(usageData, null, 2), 'utf8');
      console.log(`删除使用记录: ${scriptId}`);
    }
  } catch (error) {
    console.error('删除使用记录失败:', error);
    throw error;
  }
}

// 删除剧本点赞记录
async function deleteScriptLikes(scriptId) {
  try {
    const likesFile = path.join(SCRIPTS_DIR, 'likes.json');
    let likesData = {};
    
    try {
      const likesContent = await fs.readFile(likesFile, 'utf8');
      likesData = JSON.parse(likesContent);
    } catch (error) {
      // 文件不存在，无需删除
      return;
    }
    
    // 删除点赞记录
    if (likesData[scriptId]) {
      delete likesData[scriptId];
      await fs.writeFile(likesFile, JSON.stringify(likesData, null, 2), 'utf8');
      console.log(`删除点赞记录: ${scriptId}`);
    }
  } catch (error) {
    console.error('删除点赞记录失败:', error);
    throw error;
  }
}

// 删除剧本图片
async function deleteScriptImages(scriptId) {
  try {
    const metadata = await readImagesMetadata();
    delete metadata.images[scriptId];
    await saveImagesMetadata(metadata);
    
    // 删除图片文件目录
    const scriptImagesDir = path.join(IMAGES_DIR, scriptId);
    try {
      await fs.rmdir(scriptImagesDir, { recursive: true });
    } catch (error) {
      // 目录可能不存在，忽略错误
    }
    
    return { success: true };
  } catch (error) {
    console.error('删除剧本图片失败:', error);
    throw error;
  }
}

// 从所有系列中删除剧本
async function removeScriptFromAllSeries(scriptId) {
  try {
    const seriesDir = path.join(SCRIPTS_DIR, 'series');
    const seriesFiles = await fs.readdir(seriesDir);

    for (const file of seriesFiles) {
      if (file.endsWith('.json')) {
        const seriesFilePath = path.join(seriesDir, file);
        let seriesData;
        try {
          const content = await fs.readFile(seriesFilePath, 'utf8');
          seriesData = JSON.parse(content);
        } catch (error) {
          console.error(`读取系列文件失败: ${file}`, error);
          continue;
        }

        if (seriesData.versions) {
          const versionIndex = seriesData.versions.findIndex(v => v.id === scriptId);
          if (versionIndex !== -1) {
            seriesData.versions.splice(versionIndex, 1);
            await fs.writeFile(seriesFilePath, JSON.stringify(seriesData, null, 2), 'utf8');
            console.log(`从系列 ${file} 中删除剧本 ${scriptId}`);
          }
        }
      }
    }
    
    // 从状态文件中删除系列版本信息
    try {
      const statusData = await readStatusFile();
      let hasChanges = false;
      
      for (const seriesId in statusData.series) {
        const series = statusData.series[seriesId];
        if (series.versions && series.versions[scriptId]) {
          delete series.versions[scriptId];
          hasChanges = true;
          console.log(`从状态文件系列 ${seriesId} 中删除剧本 ${scriptId}`);
        }
      }
      
      if (hasChanges) {
        await saveStatusFile(statusData);
        console.log('状态文件更新成功');
      }
    } catch (statusError) {
      console.error('从状态文件删除系列版本信息失败:', statusError);
    }
  } catch (error) {
    console.error('从所有系列中删除剧本失败:', error);
    throw error;
  }
}

// 读取用户信息文件
async function readUserInfoFile() {
  try {
    await ensureDirectories();
    const content = await fs.readFile(USER_INFO_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    // 如果文件不存在，返回默认结构
    return { scripts: {} };
  }
}

// 保存用户信息文件
async function saveUserInfoFile(userInfoData) {
  try {
    await ensureDirectories();
    await fs.writeFile(USER_INFO_FILE, JSON.stringify(userInfoData, null, 2), 'utf8');
  } catch (error) {
    console.error('保存用户信息文件失败:', error);
    throw error;
  }
}

// 保存剧本用户信息
async function saveScriptUserInfo(scriptId, userId) {
  try {
    const userInfoData = await readUserInfoFile();
    userInfoData.scripts[scriptId] = {
      userId,
      createdAt: new Date().toISOString()
    };
    await saveUserInfoFile(userInfoData);
    console.log(`保存剧本用户信息: ${scriptId} -> ${userId}`);
  } catch (error) {
    console.error('保存剧本用户信息失败:', error);
    throw error;
  }
}

// 获取剧本用户信息
async function getScriptUserInfo(scriptId) {
  try {
    const userInfoData = await readUserInfoFile();
    return userInfoData.scripts[scriptId] || null;
  } catch (error) {
    console.error('获取剧本用户信息失败:', error);
    return null;
  }
}

// 删除剧本用户信息
async function deleteScriptUserInfo(scriptId) {
  try {
    const userInfoData = await readUserInfoFile();
    if (userInfoData.scripts[scriptId]) {
      delete userInfoData.scripts[scriptId];
      await saveUserInfoFile(userInfoData);
      console.log(`删除剧本用户信息: ${scriptId}`);
    }
  } catch (error) {
    console.error('删除剧本用户信息失败:', error);
  }
}

// API路由

// 获取所有剧本（支持分页和筛选）
router.get('/', async (req, res) => {
  try {
    console.log('📡 收到获取剧本请求');
    
    // 解析查询参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category || 'all';
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'name';
    const status = req.query.status || 'all'; // 默认显示所有状态
    const userId = req.query.userId || ''; // 用户ID，用于"我的上传"
    
    const scripts = await getAllScripts();
    
    // 根据分类筛选
    let filteredScripts = [];
    if (category === 'all') {
      filteredScripts = Object.values(scripts).flat();
    } else {
      filteredScripts = scripts[category] || [];
    }
    
    // 根据状态筛选
    if (status !== 'all') {
      filteredScripts = filteredScripts.filter(script => script.status === status);
    }
    
    // 根据用户ID筛选（我的上传）
    if (userId) {
      filteredScripts = filteredScripts.filter(script => script.userId === userId);
    }
    
    // 搜索筛选
    if (search) {
      const searchLower = search.toLowerCase();
      filteredScripts = filteredScripts.filter(script => 
        script.name.toLowerCase().includes(searchLower) ||
        (script.author && script.author.toLowerCase().includes(searchLower)) ||
        (script.description && script.description.toLowerCase().includes(searchLower))
      );
    }
    
    // 排序
    filteredScripts.sort((a, b) => {
      switch (sortBy) {
        case 'likes':
          return (b.likes || 0) - (a.likes || 0);
        case 'usage':
          return (b.usage || 0) - (a.usage || 0);
        case 'date':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    // 分页
    const total = filteredScripts.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedScripts = filteredScripts.slice(startIndex, endIndex);
    
    res.json({ 
      success: true, 
      data: {
        scripts: paginatedScripts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          category,
          search,
          sortBy,
          status,
          userId
        }
      }
    });
  } catch (error) {
    console.error('❌ 获取剧本失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取待审核剧本
router.get('/pending', async (req, res) => {
  try {
    const scripts = await getAllScripts();
    const pendingScripts = Object.values(scripts).flat().filter(script => 
      script.status === 'pending'
    );
    
    res.json({
      success: true,
      data: pendingScripts
    });
  } catch (error) {
    console.error('获取待审核剧本失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取所有状态
router.get('/status/all', async (req, res) => {
  try {
    const statusData = await readStatusFile();
    console.log('API返回状态数据:', statusData);
    
    res.json({
      success: true,
      data: statusData
    });
  } catch (error) {
    console.error('获取所有状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取剧本状态
router.get('/status/:scriptId', async (req, res) => {
  try {
    const { scriptId } = req.params;
    const status = await getScriptStatus(scriptId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('获取剧本状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新剧本状态（需要审核权限）
router.put('/status/:scriptId', async (req, res) => {
  try {
    const { scriptId } = req.params;
    const { status, reviewedBy, reviewNote } = req.body;
    
    console.log('=== 状态更新请求开始 ===');
    console.log('请求参数:', { scriptId, status, reviewedBy, reviewNote });
    console.log('请求体:', req.body);
    console.log('请求头:', req.headers);
    
    // 获取当前用户信息（需要从认证中间件获取）
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('认证失败: 未提供Token');
      return res.status(401).json({ success: false, error: '未提供认证Token' });
    }
    
    const token = authHeader.substring(7);
    // 这里需要验证token并获取用户信息
    // 暂时使用默认用户，实际应该从token解析
    const reviewer = reviewedBy || 'admin@mm.com';
    
    console.log('开始调用updateScriptStatus...');
    const updatedStatus = await updateScriptStatus(scriptId, status, reviewer, reviewNote);
    
    console.log('状态更新成功:', updatedStatus);
    console.log('=== 状态更新请求结束 ===');
    
    res.json({
      success: true,
      data: updatedStatus
    });
  } catch (error) {
    console.error('更新剧本状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 系列管理API

// 获取剧本系列
router.get('/series', async (req, res) => {
  try {
    const seriesDir = path.join(SCRIPTS_DIR, 'series');
    await ensureDirectories();
    
    // 确保系列目录存在
    try {
      await fs.access(seriesDir);
    } catch (error) {
      await fs.mkdir(seriesDir, { recursive: true });
    }
    
    const seriesFiles = await fs.readdir(seriesDir);
    const seriesList = [];
    
    for (const file of seriesFiles) {
      if (file.endsWith('.json')) {
        try {
          const content = await fs.readFile(path.join(seriesDir, file), 'utf8');
          const series = JSON.parse(content);
          seriesList.push(series);
        } catch (error) {
          console.error(`读取系列文件失败: ${file}`, error);
        }
      }
    }
    
    console.log('获取系列列表成功:', {
      totalFiles: seriesFiles.length,
      validSeries: seriesList.length,
      seriesList
    });
    
    res.json({
      success: true,
      data: seriesList
    });
  } catch (error) {
    console.error('获取剧本系列失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建剧本系列
router.post('/series', async (req, res) => {
  try {
    const { name, description, category } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: '系列名称不能为空'
      });
    }
    
    const seriesDir = path.join(SCRIPTS_DIR, 'series');
    await ensureDirectories();
    
    const seriesId = generateId();
    const series = {
      id: seriesId,
      name,
      description,
      category,
      versions: [],
      createdAt: new Date().toISOString()
    };
    
    const seriesFilePath = path.join(seriesDir, `${seriesId}.json`);
    await fs.writeFile(seriesFilePath, JSON.stringify(series, null, 2), 'utf8');
    
    console.log('创建系列成功:', {
      seriesId,
      filePath: seriesFilePath,
      series
    });
    
    res.json({
      success: true,
      data: series
    });
  } catch (error) {
    console.error('创建剧本系列失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新剧本系列
router.put('/series/:seriesId', async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { name, description, category } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: '系列名称不能为空'
      });
    }
    
    await ensureDirectories();
    const seriesDir = path.join(SCRIPTS_DIR, 'series');
    const seriesFile = path.join(seriesDir, `${seriesId}.json`);
    
    // 检查系列是否存在
    try {
      await fs.access(seriesFile);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '系列不存在'
      });
    }
    
    // 读取现有系列数据
    const seriesContent = await fs.readFile(seriesFile, 'utf8');
    const series = JSON.parse(seriesContent);
    
    // 更新系列信息
    series.name = name;
    series.description = description;
    series.category = category;
    series.updatedAt = new Date().toISOString();
    
    // 保存更新后的系列
    await fs.writeFile(seriesFile, JSON.stringify(series, null, 2), 'utf8');
    
    res.json({
      success: true,
      data: series
    });
  } catch (error) {
    console.error('更新剧本系列失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 添加剧本版本
router.post('/series/version', upload.single('file'), async (req, res) => {
  try {
    const { seriesId, version, description } = req.body;
    const file = req.file;
    
    if (!seriesId || !version || !file) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
    }
    
    await ensureDirectories();
    const seriesDir = path.join(SCRIPTS_DIR, 'series');
    const seriesFile = path.join(seriesDir, `${seriesId}.json`);
    
    // 读取系列信息
    const seriesContent = await fs.readFile(seriesFile, 'utf8');
    const series = JSON.parse(seriesContent);
    
    // 解析剧本文件
    const scriptContent = file.buffer.toString('utf8');
    const scriptData = JSON.parse(scriptContent);
    
    // 创建版本
    const versionId = generateId();
    const newVersion = {
      id: versionId,
      version,
      description,
      scriptData,
      isLatest: series.versions.length === 0, // 第一个版本为最新
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    // 添加到系列
    series.versions.push(newVersion);
    
    // 保存系列
    await fs.writeFile(seriesFile, JSON.stringify(series, null, 2), 'utf8');
    
    res.json({
      success: true,
      data: newVersion
    });
  } catch (error) {
    console.error('添加剧本版本失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 设置最新版本
router.put('/series/version/:versionId/latest', async (req, res) => {
  try {
    const { versionId } = req.params;
    
    await ensureDirectories();
    const seriesDir = path.join(SCRIPTS_DIR, 'series');
    const seriesFiles = await fs.readdir(seriesDir);
    
    for (const file of seriesFiles) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(seriesDir, file), 'utf8');
        const series = JSON.parse(content);
        
        // 找到包含该版本的系列
        const versionIndex = series.versions.findIndex(v => v.id === versionId);
        if (versionIndex !== -1) {
          // 重置所有版本为非最新
          series.versions.forEach(v => v.isLatest = false);
          // 设置指定版本为最新
          series.versions[versionIndex].isLatest = true;
          
          await fs.writeFile(
            path.join(seriesDir, file),
            JSON.stringify(series, null, 2),
            'utf8'
          );
          
          return res.json({
            success: true,
            data: series.versions[versionIndex]
          });
        }
      }
    }
    
    res.status(404).json({
      success: false,
      error: '版本不存在'
    });
  } catch (error) {
    console.error('设置最新版本失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除剧本版本
router.delete('/series/version/:versionId', async (req, res) => {
  try {
    const { versionId } = req.params;
    
    await ensureDirectories();
    const seriesDir = path.join(SCRIPTS_DIR, 'series');
    const seriesFiles = await fs.readdir(seriesDir);
    
    for (const file of seriesFiles) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(seriesDir, file), 'utf8');
        const series = JSON.parse(content);
        
        const versionIndex = series.versions.findIndex(v => v.id === versionId);
        if (versionIndex !== -1) {
          series.versions.splice(versionIndex, 1);
          
          await fs.writeFile(
            path.join(seriesDir, file),
            JSON.stringify(series, null, 2),
            'utf8'
          );
          
          return res.json({
            success: true,
            message: '版本删除成功'
          });
        }
      }
    }
    
    res.status(404).json({
      success: false,
      error: '版本不存在'
    });
  } catch (error) {
    console.error('删除剧本版本失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除剧本系列
router.delete('/series/:seriesId', async (req, res) => {
  try {
    const { seriesId } = req.params;
    
    const seriesFile = path.join(SCRIPTS_DIR, 'series', `${seriesId}.json`);
    
    try {
      await fs.unlink(seriesFile);
      res.json({
        success: true,
        message: '系列删除成功'
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: '系列不存在'
      });
    }
  } catch (error) {
    console.error('删除剧本系列失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单个剧本
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'custom' } = req.query;
    
    const script = await getScript(id, type);
    res.json({ success: true, data: script });
  } catch (error) {
    res.status(404).json({ success: false, error: '剧本不存在' });
  }
});

// 保存剧本
router.post('/', async (req, res) => {
  try {
    console.log('📡 收到保存剧本请求');
    const scriptData = req.body;
    const { type = 'custom' } = req.query;
    
    if (!scriptData.id || !scriptData.name) {
      return res.status(400).json({ 
        success: false, 
        error: '剧本ID和名称是必需的' 
      });
    }
    
    // 从请求头或请求体中获取用户信息
    const userId = req.headers['user-id'] || req.body.userId || null;
    console.log('用户ID:', userId);
    
    const result = await saveScript(scriptData, type, userId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ 保存剧本失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新剧本
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const scriptData = req.body;
    const { type = 'custom' } = req.query;
    
    scriptData.id = id; // 确保ID一致
    const result = await saveScript(scriptData, type);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除剧本
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'custom' } = req.query;
    
    console.log(`删除剧本请求: id=${id}, type=${type}`);
    
    const result = await deleteScript(id, type);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('删除剧本API失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: '删除剧本时发生服务器错误'
    });
  }
});

// 批量导入剧本
router.post('/import', async (req, res) => {
  try {
    const { scripts, type = 'custom' } = req.body;
    
    if (!Array.isArray(scripts)) {
      return res.status(400).json({ 
        success: false, 
        error: 'scripts必须是数组' 
      });
    }
    
    const results = [];
    for (const script of scripts) {
      try {
        const result = await saveScript(script, type);
        results.push({ success: true, script: script.name, ...result });
      } catch (error) {
        results.push({ success: false, script: script.name, error: error.message });
      }
    }
    
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 导出所有剧本
router.get('/export/all', async (req, res) => {
  try {
    const scripts = await getAllScripts();
    const exportData = {
      timestamp: new Date().toISOString(),
      totalScripts: Object.values(scripts).flat().length,
      scripts: scripts
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="scripts_export_${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 点赞剧本
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 读取点赞数据
    const likesFile = path.join(SCRIPTS_DIR, 'likes.json');
    let likesData = {};
    
    try {
      const likesContent = await fs.readFile(likesFile, 'utf8');
      likesData = JSON.parse(likesContent);
    } catch (error) {
      // 文件不存在，创建新的点赞数据
    }
    
    // 更新点赞数
    if (!likesData[id]) {
      likesData[id] = 0;
    }
    likesData[id]++;
    
    // 保存点赞数据
    await fs.writeFile(likesFile, JSON.stringify(likesData, null, 2), 'utf8');
    
    res.json({
      success: true,
      likes: likesData[id]
    });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 使用剧本
router.post('/:id/use', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 读取使用统计数据
    const usageFile = path.join(SCRIPTS_DIR, 'usage.json');
    let usageData = {};
    
    try {
      const usageContent = await fs.readFile(usageFile, 'utf8');
      usageData = JSON.parse(usageContent);
    } catch (error) {
      // 文件不存在，创建新的使用数据
    }
    
    // 更新使用次数
    if (!usageData[id]) {
      usageData[id] = 0;
    }
    usageData[id]++;
    
    // 保存使用数据
    await fs.writeFile(usageFile, JSON.stringify(usageData, null, 2), 'utf8');
    
    res.json({
      success: true,
      usage: usageData[id]
    });
  } catch (error) {
    console.error('使用剧本失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 注意：状态更新应该使用 /status/:scriptId 路由，而不是修改原始剧本文件

// 获取剧本使用统计
router.get('/:id/usage', async (req, res) => {
  try {
    const { id } = req.params;
    const usageFile = path.join(SCRIPTS_DIR, 'usage.json');
    
    let usageData = {};
    try {
      const content = await fs.readFile(usageFile, 'utf8');
      usageData = JSON.parse(content);
    } catch (error) {
      // 文件不存在，返回0
    }
    
    res.json({
      success: true,
      usage: usageData[id] || 0
    });
  } catch (error) {
    console.error('获取使用统计失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取剧本点赞统计
router.get('/:id/likes', async (req, res) => {
  try {
    const { id } = req.params;
    const likesFile = path.join(SCRIPTS_DIR, 'likes.json');
    
    let likesData = {};
    try {
      const content = await fs.readFile(likesFile, 'utf8');
      likesData = JSON.parse(content);
    } catch (error) {
      // 文件不存在，返回0
    }
    
    res.json({
      success: true,
      likes: likesData[id] || 0
    });
  } catch (error) {
    console.error('获取点赞统计失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取存储统计信息
router.get('/stats/info', async (req, res) => {
  try {
    const scripts = await getAllScripts();
    const allScripts = Object.values(scripts).flat();
    
    const stats = {
      total: allScripts.length,
      custom: scripts.custom.length,
      official: scripts.official.length,
      templates: scripts.templates.length,
      totalSize: allScripts.reduce((sum, script) => sum + (script.fileSize || 0), 0),
      categories: {},
      levels: {}
    };
    
    // 统计分类和难度
    allScripts.forEach(script => {
      if (script.category) {
        stats.categories[script.category] = (stats.categories[script.category] || 0) + 1;
      }
      if (script.level) {
        stats.levels[script.level] = (stats.levels[script.level] || 0) + 1;
      }
    });
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 图片管理API

// 获取剧本图片
router.get('/:scriptId/images', async (req, res) => {
  try {
    const { scriptId } = req.params;
    const images = await getScriptImages(scriptId);
    
    res.json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error('获取剧本图片失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 上传剧本图片
router.post('/:scriptId/images', upload.array('images', 3), async (req, res) => {
  try {
    const { scriptId } = req.params;
    const files = req.files;
    
    console.log('图片上传请求:', { scriptId, filesCount: files?.length });
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请选择图片文件'
      });
    }
    
    // 验证文件
    for (const file of files) {
      console.log('验证文件:', { 
        originalname: file.originalname, 
        size: file.size, 
        mimetype: file.mimetype,
        path: file.path 
      });
      
      const ext = path.extname(file.originalname).toLowerCase();
      if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
        return res.status(400).json({
          success: false,
          error: '只支持 JPG 和 PNG 格式的图片'
        });
      }
      
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: '图片大小不能超过 10MB'
        });
      }
    }
    
    // 创建剧本图片目录
    const scriptImagesDir = path.join(IMAGES_DIR, scriptId);
    await fs.mkdir(scriptImagesDir, { recursive: true });
    
    // 保存图片文件
    const images = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `image${i + 1}${ext}`;
      const filePath = path.join(scriptImagesDir, filename);
      
      // 读取临时文件并复制到目标位置
      const tempFilePath = file.path;
      console.log('处理文件:', { tempFilePath, targetPath: filePath });
      
      const fileContent = await fs.readFile(tempFilePath);
      console.log('文件内容大小:', fileContent.length, 'bytes');
      
      await fs.writeFile(filePath, fileContent);
      console.log('文件保存成功:', filePath);
      
      // 删除临时文件
      try {
        await fs.unlink(tempFilePath);
        console.log('临时文件删除成功:', tempFilePath);
      } catch (error) {
        console.log('删除临时文件失败:', error);
      }
      
      images.push({
        filename: filename,
        title: req.body.scriptName || '剧本图片',
        order: i + 1,
        uploadedAt: new Date().toISOString()
      });
    }
    
    // 保存图片元数据
    await saveScriptImages(scriptId, images);
    
    res.json({
      success: true,
      data: { images },
      message: '图片上传成功'
    });
  } catch (error) {
    console.error('上传剧本图片失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除剧本图片
router.delete('/:scriptId/images/:imageId', async (req, res) => {
  try {
    const { scriptId, imageId } = req.params;
    
    // 获取当前图片列表
    const currentImages = await getScriptImages(scriptId);
    
    // 找到要删除的图片
    const imageIndex = currentImages.images.findIndex(img => img.filename === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '图片不存在'
      });
    }
    
    // 删除文件
    const imagePath = path.join(IMAGES_DIR, scriptId, imageId);
    try {
      await fs.unlink(imagePath);
    } catch (error) {
      console.error('删除图片文件失败:', error);
    }
    
    // 更新元数据
    currentImages.images.splice(imageIndex, 1);
    await saveScriptImages(scriptId, currentImages.images);
    
    res.json({
      success: true,
      message: '图片删除成功'
    });
  } catch (error) {
    console.error('删除剧本图片失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 替换剧本图片
router.put('/:scriptId/images/:imageId', upload.single('image'), async (req, res) => {
  try {
    const { scriptId, imageId } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: '请选择图片文件'
      });
    }
    
    // 验证文件
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      return res.status(400).json({
        success: false,
        error: '只支持 JPG 和 PNG 格式的图片'
      });
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: '图片大小不能超过 10MB'
      });
    }
    
    // 获取当前图片列表
    const currentImages = await getScriptImages(scriptId);
    const imageIndex = currentImages.images.findIndex(img => img.filename === imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '图片不存在'
      });
    }
    
    // 替换文件
    const imagePath = path.join(IMAGES_DIR, scriptId, imageId);
    await fs.writeFile(imagePath, file.buffer);
    
    // 更新元数据
    currentImages.images[imageIndex].uploadedAt = new Date().toISOString();
    await saveScriptImages(scriptId, currentImages.images);
    
    res.json({
      success: true,
      message: '图片替换成功'
    });
  } catch (error) {
    console.error('替换剧本图片失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 