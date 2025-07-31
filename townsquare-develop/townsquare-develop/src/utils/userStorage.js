/**
 * 用户隔离的本地存储工具
 * 为每个用户创建独立的localStorage命名空间
 */

import { SYSTEM_KEYS, getRoleFlagKey } from "./storageKeys.js";

// 生成用户ID
function generateUserId() {
  // 检查是否有现有的浏览器窗口ID
  let browserWindowId = sessionStorage.getItem(SYSTEM_KEYS.BROWSER_WINDOW_ID);
  if (!browserWindowId) {
    // 生成新的浏览器窗口ID
    browserWindowId =
      "window_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem(SYSTEM_KEYS.BROWSER_WINDOW_ID, browserWindowId);
  }

  // 优先检查是否有现有的说书人用户ID
  let storytellerUserId = sessionStorage.getItem(
    SYSTEM_KEYS.STORYTELLER_USER_ID,
  );
  if (storytellerUserId) {
    return storytellerUserId;
  }

  // 根据浏览器窗口生成玩家用户ID
  const playerUserId = "role_" + browserWindowId;

  return playerUserId;
}

// 生成玩家会话ID
function generatePlayerSessionId() {
  // 使用浏览器窗口ID作为玩家会话ID
  const browserWindowId = sessionStorage.getItem(SYSTEM_KEYS.BROWSER_WINDOW_ID);
  if (browserWindowId) {
    console.log("使用浏览器窗口ID作为玩家会话ID:", browserWindowId);
    return browserWindowId;
  }

  // 如果没有浏览器窗口ID，返回null
  console.log("没有浏览器窗口ID，不是玩家模式");
  return null;
}

// 获取当前用户ID
function getCurrentUserId() {
  return generateUserId();
}

// 获取当前玩家会话ID
function getCurrentPlayerSessionId() {
  return generatePlayerSessionId();
}

// 生成带用户ID前缀的存储键（保留用于未来扩展）
// function getStorageKey(key) {
//   const userId = getCurrentUserId();
//   return `${userId}_${key}`;
// }

// 设置hash角色标志位
function setHashRoleFlag(hash, role) {
  if (!hash) return;
  const flagKey = getRoleFlagKey(hash);
  sessionStorage.setItem(flagKey, role);
  console.log(`设置hash角色标志位: ${hash} -> ${role}`);
}

// 获取hash角色标志位
function getHashRoleFlag(hash) {
  if (!hash) return null;
  const flagKey = getRoleFlagKey(hash);
  const role = sessionStorage.getItem(flagKey);
  console.log(`获取hash角色标志位: ${hash} -> ${role}`);
  return role;
}

// 清除hash角色标志位
function clearHashRoleFlag(hash) {
  if (!hash) return;
  const flagKey = getRoleFlagKey(hash);
  sessionStorage.removeItem(flagKey);
  console.log(`清除hash角色标志位: ${hash}`);
}

// 设置说书人用户ID
function setStorytellerUserId() {
  const storytellerUserId =
    "storyteller_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  sessionStorage.setItem(SYSTEM_KEYS.STORYTELLER_USER_ID, storytellerUserId);
  console.log("设置说书人用户ID:", storytellerUserId);
  return storytellerUserId;
}

// 设置用户角色类型
function setUserRole(roleType) {
  const userId = getCurrentUserId();
  const roleKey = `${userId}_role_type`; // Directly construct storage key
  sessionStorage.setItem(roleKey, roleType);
  console.log(`设置用户角色: ${userId} -> ${roleType}`);

  // 清除角色缓存，确保下次获取时重新检测
  clearRoleCache();
}

// 获取用户角色类型
function getUserRoleType() {
  const userId = getCurrentUserId();
  const roleKey = `${userId}_role_type`; // Directly construct storage key
  const roleType = sessionStorage.getItem(roleKey);

  if (roleType) {
    return roleType;
  }

  // If no explicit role type, infer from user ID prefix
  if (userId.startsWith("storyteller_")) {
    return "storyteller";
  } else if (userId.startsWith("role_")) {
    return "player";
  } else {
    return null;
  }
}

// 创建游戏
function createGame(sessionId) {
  const storytellerUserId = setStorytellerUserId();
  setUserRole("storyteller");
  const userId = getCurrentUserId();
  const sessionKey = `${userId}_session_id`; // Directly construct storage key
  sessionStorage.setItem(sessionKey, sessionId);
  console.log(
    `创建游戏: ${storytellerUserId} -> storyteller, session: ${sessionId}`,
  );
}

// 加入游戏
function joinGame(sessionId) {
  if (sessionId.match(/^https?:\/\//i)) {
    sessionId = sessionId.split("#").pop();
  }
  const userId = getCurrentUserId();
  setUserRole("player");
  const sessionKey = `${userId}_session_id`; // Directly construct storage key
  sessionStorage.setItem(sessionKey, sessionId);
  console.log(`加入游戏: ${userId} -> player, session: ${sessionId}`);
}

// 退出游戏
function leaveGame() {
  const userId = getCurrentUserId();
  setUserRole("spectator");
  const sessionKey = `${userId}_session_id`; // Directly construct storage key
  sessionStorage.removeItem(sessionKey);
  console.log(`退出游戏: ${userId} -> spectator`);
}

// 获取当前会话ID
function getCurrentSessionId() {
  const userId = getCurrentUserId();
  const sessionKey = `${userId}_session_id`; // Directly construct storage key
  return sessionStorage.getItem(sessionKey);
}

// 角色检测缓存
let cachedUserRole = null;
let cachedUserId = null;

// 获取用户角色（带缓存优化）
function getUserRole() {
  const currentUserId = getCurrentUserId();

  // 如果用户ID没有变化，直接返回缓存的角色
  if (cachedUserId === currentUserId && cachedUserRole !== null) {
    return cachedUserRole;
  }

  console.log("=== 开始角色检测 ===");
  console.log("当前用户ID:", currentUserId);

  const roleType = getUserRoleType();
  console.log("角色类型:", roleType);

  if (roleType) {
    cachedUserRole = roleType;
    cachedUserId = currentUserId;
    return roleType;
  }

  console.log("没有找到角色类型，默认返回游客模式");
  cachedUserRole = "spectator";
  cachedUserId = currentUserId;
  return "spectator";
}

// 清除角色缓存（当角色发生变化时调用）
function clearRoleCache() {
  cachedUserRole = null;
  cachedUserId = null;
}

// 获取用户特定的存储键
function getUserSpecificKey(key, role = null) {
  const userId = getCurrentUserId();

  // 如果传入了角色参数，直接使用；否则默认为spectator
  const currentRole = role || "spectator";

  // 如果是玩家模式，使用浏览器窗口ID作为稳定的标识符
  if (currentRole === "player") {
    const browserWindowId = sessionStorage.getItem(
      SYSTEM_KEYS.BROWSER_WINDOW_ID,
    );
    if (browserWindowId) {
      // 使用浏览器窗口ID作为玩家数据的标识符，这样刷新时键保持一致
      return `${userId}_${currentRole}_${browserWindowId}_${key}`;
    } else {
      // 如果没有浏览器窗口ID，使用默认的玩家存储键
      return `${userId}_${currentRole}_default_${key}`;
    }
  }

  return `${userId}_${currentRole}_${key}`;
}

// 存储工具类
class UserStorage {
  constructor() {
    this.userId = getCurrentUserId();
    this.role = getUserRole();
  }

  // 设置存储项
  setItem(key, value) {
    // 在保存数据时重新检测角色，确保使用正确的存储键
    const currentRole = getUserRole();
    if (currentRole !== this.role) {
      console.log(`角色发生变化，更新角色: ${this.role} -> ${currentRole}`);
      this.role = currentRole;
    }

    const storageKey = getUserSpecificKey(key, this.role);
    console.log(`保存数据 [${key}] -> [${storageKey}]:`, value);
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (e) {
      console.warn("存储失败:", e);
    }
  }

  // 获取存储项
  getItem(key, defaultValue = null) {
    // 在读取数据时重新检测角色，确保使用正确的存储键
    const currentRole = getUserRole();
    if (currentRole !== this.role) {
      console.log(`角色发生变化，更新角色: ${this.role} -> ${currentRole}`);
      this.role = currentRole;
    }

    const storageKey = getUserSpecificKey(key, this.role);
    console.log(`读取数据 [${key}] -> [${storageKey}]`);
    try {
      const value = localStorage.getItem(storageKey);
      const result = value ? JSON.parse(value) : defaultValue;
      console.log(`读取结果 [${key}]:`, result);
      return result;
    } catch (e) {
      console.warn("读取存储失败:", e);
      return defaultValue;
    }
  }

  // 移除存储项
  removeItem(key) {
    const storageKey = getUserSpecificKey(key, this.role);
    localStorage.removeItem(storageKey);
  }

  // 检查存储项是否存在
  hasItem(key) {
    const storageKey = getUserSpecificKey(key, this.role);
    return localStorage.getItem(storageKey) !== null;
  }

  // 获取所有当前用户的存储键
  getAllKeys() {
    const keys = [];
    let prefix;

    if (this.role === "player") {
      const browserWindowId = sessionStorage.getItem(
        SYSTEM_KEYS.BROWSER_WINDOW_ID,
      );
      if (browserWindowId) {
        prefix = `${this.userId}_${this.role}_${browserWindowId}_`;
      } else {
        prefix = `${this.userId}_${this.role}_default_`;
      }
    } else {
      prefix = `${this.userId}_${this.role}_`;
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key.substring(prefix.length));
      }
    }

    return keys;
  }

  // 更新角色（当角色发生变化时调用）
  updateRole() {
    const newRole = getUserRole();
    this.role = newRole;
  }

  // 强制设置角色（用于调试）
  setRole(role) {
    console.log(`强制设置角色: ${this.role} -> ${role}`);
    this.role = role;
  }

  // 清除当前用户的所有存储
  clear() {
    const keys = this.getAllKeys();
    keys.forEach((key) => this.removeItem(key));
  }

  // 获取用户信息
  getUserInfo() {
    let storagePrefix;
    if (this.role === "player") {
      const browserWindowId = sessionStorage.getItem(
        SYSTEM_KEYS.BROWSER_WINDOW_ID,
      );
      storagePrefix = `${this.userId}_${this.role}_${browserWindowId}_`;
    } else {
      storagePrefix = `${this.userId}_${this.role}_`;
    }

    return {
      userId: this.userId,
      role: this.role,
      playerSessionId:
        this.role === "player" ? getCurrentPlayerSessionId() : null,
      storagePrefix: storagePrefix,
      currentPlayerId:
        this.role === "player" ? getCurrentPlayerSessionId() : null,
    };
  }
}

// 创建全局实例
const userStorage = new UserStorage();

// 导出工具函数
export default userStorage;

// 导出便捷函数
export const setUserStorage = (key, value) => userStorage.setItem(key, value);
export const getUserStorage = (key, defaultValue = null) =>
  userStorage.getItem(key, defaultValue);
export const removeUserStorage = (key) => userStorage.removeItem(key);
export const hasUserStorage = (key) => userStorage.hasItem(key);
export const clearUserStorage = () => userStorage.clear();
export const getUserInfo = () => userStorage.getUserInfo();
export const migrateOldData = () => userStorage.migrateOldData();
export {
  setHashRoleFlag,
  getHashRoleFlag,
  clearHashRoleFlag,
  setStorytellerUserId,
  getUserSpecificKey,
  // 新增角色管理函数
  setUserRole,
  getUserRoleType,
  getUserRole,
  createGame,
  joinGame,
  leaveGame,
  getCurrentSessionId,
};
