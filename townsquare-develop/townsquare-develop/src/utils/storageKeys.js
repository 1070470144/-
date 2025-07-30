/**
 * 存储键管理
 * 统一管理项目中所有的localStorage key
 */

// 系统级存储键（不依赖用户隔离）
export const SYSTEM_KEYS = {
  // 浏览器窗口标识
  BROWSER_WINDOW_ID: "_browser_window_id",
  
  // 浏览器实例标识（兼容旧版本）
  BROWSER_INSTANCE_ID: "browser_instance_id",
  
  // 说书人用户ID
  STORYTELLER_USER_ID: "_storyteller_userId",
  
  // 全局会话数据（兼容旧版本）
  GLOBAL_SESSION: "session",
  
  // 迁移完成标志
  MIGRATION_COMPLETED: "_migration_completed",
  
  // 图片选择同意
  IMAGE_OPT_IN: "imageOptIn",
};

// 用户数据存储键（通过userStorage管理）
export const USER_DATA_KEYS = {
  // 背景设置
  BACKGROUND: "background",
  
  // 静音设置
  MUTED: "muted",
  
  // 静态模式
  STATIC: "static",
  
  // 缩放设置
  ZOOM: "zoom",
  
  // 是否为说书人模式
  IS_GRIMOIRE: "isGrimoire",
  
  // 自定义角色
  ROLES: "roles",
  
  // 版本设置
  EDITION: "edition",
  
  // 恶魔伪装
  BLUFFS: "bluffs",
  
  // 寓言角色
  FABLED: "fabled",
  
  // 玩家数据
  PLAYERS: "players",
  
  // 玩家ID
  PLAYER_ID: "playerId",
  
  // 会话数据
  SESSION: "session",
  
  // 游戏历史
  GAME_HISTORY: "gameHistory",
};

// 说书人特定存储键
export const STORYTELLER_KEYS = {
  // 说书人会话
  SESSION: "storyteller_session",
  
  // 说书人版本
  EDITION: "storyteller_edition",
  
  // 说书人寓言
  FABLED: "storyteller_fabled",
  
  // 说书人恶魔伪装
  BLUFFS: "storyteller_bluffs",
  
  // 说书人玩家数据
  PLAYERS: "storyteller_players",
};

// 玩家特定存储键
export const PLAYER_KEYS = {
  // 玩家会话
  SESSION: "player_session",
};

// 角色标志位存储键前缀
export const ROLE_FLAG_PREFIX = "_hash_role_";

/**
 * 生成角色标志位存储键
 * @param {string} hash - URL hash值
 * @returns {string} 存储键
 */
export function getRoleFlagKey(hash) {
  return `${ROLE_FLAG_PREFIX}${hash}`;
}

/**
 * 获取所有系统级存储键
 * @returns {string[]} 系统级存储键列表
 */
export function getSystemKeys() {
  return Object.values(SYSTEM_KEYS);
}

/**
 * 获取所有用户数据存储键
 * @returns {string[]} 用户数据存储键列表
 */
export function getUserDataKeys() {
  return Object.values(USER_DATA_KEYS);
}

/**
 * 获取所有说书人特定存储键
 * @returns {string[]} 说书人特定存储键列表
 */
export function getStorytellerKeys() {
  return Object.values(STORYTELLER_KEYS);
}

/**
 * 获取所有玩家特定存储键
 * @returns {string[]} 玩家特定存储键列表
 */
export function getPlayerKeys() {
  return Object.values(PLAYER_KEYS);
}

/**
 * 获取所有存储键
 * @returns {string[]} 所有存储键列表
 */
export function getAllKeys() {
  return [
    ...getSystemKeys(),
    ...getUserDataKeys(),
    ...getStorytellerKeys(),
    ...getPlayerKeys(),
  ];
}

/**
 * 清理所有存储数据
 * @param {boolean} includeSystem - 是否包含系统级数据
 */
export function clearAllStorage(includeSystem = false) {
  const keysToClear = includeSystem ? getAllKeys() : getUserDataKeys();
  
  keysToClear.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // 清理角色标志位
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(ROLE_FLAG_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
  
  console.log(`清理了 ${keysToClear.length} 个存储键`);
}

/**
 * 获取存储使用情况统计
 * @returns {object} 存储使用统计
 */
export function getStorageStats() {
  const stats = {
    system: 0,
    userData: 0,
    storyteller: 0,
    player: 0,
    roleFlags: 0,
    total: 0,
  };
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    stats.total++;
    
    if (getSystemKeys().includes(key)) {
      stats.system++;
    } else if (getUserDataKeys().includes(key)) {
      stats.userData++;
    } else if (key.startsWith(ROLE_FLAG_PREFIX)) {
      stats.roleFlags++;
    } else if (key.includes('storyteller_')) {
      stats.storyteller++;
    } else if (key.includes('player_')) {
      stats.player++;
    }
  }
  
  return stats;
}

// 导出所有键的常量
export default {
  SYSTEM_KEYS,
  USER_DATA_KEYS,
  STORYTELLER_KEYS,
  PLAYER_KEYS,
  ROLE_FLAG_PREFIX,
  getRoleFlagKey,
  getSystemKeys,
  getUserDataKeys,
  getStorytellerKeys,
  getPlayerKeys,
  getAllKeys,
  clearAllStorage,
  getStorageStats,
}; 