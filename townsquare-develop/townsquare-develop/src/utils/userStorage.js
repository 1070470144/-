/**
 * 用户隔离的本地存储工具
 * 为每个用户创建独立的localStorage命名空间
 */

import { SYSTEM_KEYS, USER_DATA_KEYS, getRoleFlagKey } from './storageKeys.js';

// 生成用户ID
function generateUserId() {
  // 优先检查是否有现有的说书人用户ID
  let storytellerUserId = localStorage.getItem(SYSTEM_KEYS.STORYTELLER_USER_ID);
  if (storytellerUserId) {
    console.log("检测到现有说书人用户ID:", storytellerUserId);
    return storytellerUserId;
  }

  // 检查是否有现有的浏览器窗口ID
  let browserWindowId = localStorage.getItem(SYSTEM_KEYS.BROWSER_WINDOW_ID);
  if (!browserWindowId) {
    // 生成新的浏览器窗口ID
    browserWindowId = "window_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(SYSTEM_KEYS.BROWSER_WINDOW_ID, browserWindowId);
  } else {
    console.log("使用现有浏览器窗口ID:", browserWindowId);
  }

  // 根据浏览器窗口生成玩家用户ID
  const playerUserId = "player_" + browserWindowId;
  console.log("生成玩家用户ID:", playerUserId);

  return playerUserId;
}

// 生成玩家会话ID
function generatePlayerSessionId() {
  // 使用浏览器窗口ID作为玩家会话ID
  const browserWindowId = localStorage.getItem(SYSTEM_KEYS.BROWSER_WINDOW_ID);
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
  localStorage.setItem(flagKey, role);
  console.log(`设置hash角色标志位: ${hash} -> ${role}`);
}

// 获取hash角色标志位
function getHashRoleFlag(hash) {
  if (!hash) return null;
  const flagKey = getRoleFlagKey(hash);
  const role = localStorage.getItem(flagKey);
  console.log(`获取hash角色标志位: ${hash} -> ${role}`);
  return role;
}

// 清除hash角色标志位
function clearHashRoleFlag(hash) {
  if (!hash) return;
  const flagKey = getRoleFlagKey(hash);
  localStorage.removeItem(flagKey);
  console.log(`清除hash角色标志位: ${hash}`);
}

// 设置说书人用户ID
function setStorytellerUserId() {
  const storytellerUserId =
    "storyteller_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  localStorage.setItem(SYSTEM_KEYS.STORYTELLER_USER_ID, storytellerUserId);
  console.log("设置说书人用户ID:", storytellerUserId);
  return storytellerUserId;
}

// 获取用户角色类型（说书人/玩家）
function getUserRole() {
  console.log("=== 开始角色检测 ===");

  // 检查浏览器窗口ID
  const browserWindowId = localStorage.getItem(SYSTEM_KEYS.BROWSER_WINDOW_ID);
  console.log("浏览器窗口ID:", browserWindowId);

  // 检查用户存储中的会话信息
  const userId = getCurrentUserId();
  console.log("当前用户ID:", userId);

  // 优先检查说书人会话数据（使用用户特定的存储键）
  const storytellerSession = localStorage.getItem(
    `${userId}_storyteller_session`,
  );
  console.log("说书人会话数据:", storytellerSession);

  // 如果有说书人会话数据，返回说书人模式
  if (
    storytellerSession &&
    storytellerSession !== "null" &&
    storytellerSession !== "undefined"
  ) {
    try {
      const sessionData = JSON.parse(storytellerSession);
      if (
        sessionData &&
        Array.isArray(sessionData) &&
        sessionData.length >= 2
      ) {
        console.log("检测到有效的说书人会话，返回说书人模式");
        return "storyteller";
      }
    } catch (e) {
      if (storytellerSession.length > 0) {
        console.log("检测到说书人会话字符串，返回说书人模式");
        return "storyteller";
      }
    }
  }

  // 检查是否有说书人数据（任何说书人相关的数据）
  const storytellerEdition = localStorage.getItem(
    `${userId}_storyteller_edition`,
  );
  const storytellerFabled = localStorage.getItem(
    `${userId}_storyteller_fabled`,
  );
  const storytellerBluffs = localStorage.getItem(
    `${userId}_storyteller_bluffs`,
  );
  const storytellerPlayers = localStorage.getItem(
    `${userId}_storyteller_players`,
  );

  console.log("说书人数据检查:");
  console.log("- 版本数据:", storytellerEdition);
  console.log("- 寓言数据:", storytellerFabled);
  console.log("- 恶魔伪装数据:", storytellerBluffs);
  console.log("- 玩家数据:", storytellerPlayers);

  // 如果有说书人数据，返回说书人模式
  if (
    storytellerPlayers &&
    storytellerPlayers !== "null" &&
    storytellerPlayers !== "undefined"
  ) {
    console.log("检测到说书人玩家数据，返回说书人模式");
    return "storyteller";
  }

  if (
    (storytellerEdition &&
      storytellerEdition !== "null" &&
      storytellerEdition !== "undefined") ||
    (storytellerFabled &&
      storytellerFabled !== "null" &&
      storytellerFabled !== "undefined") ||
    (storytellerBluffs &&
      storytellerBluffs !== "null" &&
      storytellerBluffs !== "undefined")
  ) {
    console.log("检测到说书人相关数据，返回说书人模式");
    return "storyteller";
  }

  // 检查全局会话数据（兼容旧数据）
  const globalSessionData = localStorage.getItem(SYSTEM_KEYS.GLOBAL_SESSION);

  if (
    globalSessionData &&
    globalSessionData !== "null" &&
    globalSessionData !== "undefined"
  ) {
    try {
      const [isSpectator] = JSON.parse(globalSessionData);
      if (!isSpectator) {
        console.log("检测到全局说书人会话，返回说书人模式");
        return "storyteller";
      }
    } catch (e) {
      // 如果解析失败，检查是否为有效的会话字符串
      if (globalSessionData.length > 0) {
        console.log("检测到全局会话字符串，返回说书人模式");
        return "storyteller";
      }
    }
  }

  // 检查所有玩家会话
  const playerSessions = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      key.startsWith(`${userId}_player_`) &&
      key.endsWith("_session")
    ) {
      const playerSessionId = key
        .replace(`${userId}_player_`, "")
        .replace("_session", "");
      const sessionData = localStorage.getItem(key);
      if (sessionData) {
        playerSessions.push({ id: playerSessionId, data: sessionData });
      }
    }
  }

  console.log("用户ID:", userId);
  console.log("全局会话:", globalSessionData);
  console.log("玩家会话列表:", playerSessions);

  // 检查用户ID，如果是以"storyteller_"开头的，说明是说书人
  if (userId.startsWith("storyteller_")) {
    console.log("检测到说书人用户ID，返回说书人模式");
    return "storyteller";
  }

  // 检查用户ID，如果是以"player_"开头的，说明是玩家
  if (userId.startsWith("player_")) {
    console.log("检测到玩家用户ID，返回玩家模式");
    return "player";
  }

  // 检查用户ID，如果是以"spectator_"开头的，说明是游客
  if (userId.startsWith("spectator_")) {
    console.log("检测到游客用户ID，返回游客模式");
    return "player";
  }

  console.log("用户ID检查完成，未匹配到明确的前缀");

  // 只有在没有明确的说书人标识时，才检查玩家会话
  // 检查当前玩家是否有有效的会话
  const currentPlayerSessionId = getCurrentPlayerSessionId();
  const currentPlayerSession = localStorage.getItem(
    `${userId}_player_${currentPlayerSessionId}_session`,
  );

  if (
    currentPlayerSession &&
    currentPlayerSession !== "null" &&
    currentPlayerSession !== "undefined"
  ) {
    // 验证玩家会话的有效性
    try {
      const sessionData = JSON.parse(currentPlayerSession);
      if (
        sessionData &&
        Array.isArray(sessionData) &&
        sessionData.length >= 2
      ) {
        // 检查会话数据是否为说书人会话
        const [isSpectator] = sessionData;
        if (!isSpectator) {
          console.log("检测到说书人会话，返回说书人模式");
          return "storyteller";
        } else {
          console.log("检测到当前玩家的有效会话，返回玩家模式");
          return "player";
        }
      }
    } catch (e) {
      // 如果解析失败，检查是否为有效的会话字符串
      if (currentPlayerSession.length > 0) {
        console.log("检测到当前玩家的会话字符串，返回玩家模式");
        return "player";
      }
    }
  }

  // 如果有浏览器窗口ID且没有说书人数据，返回玩家模式
  if (browserWindowId) {
    console.log("检测到浏览器窗口ID且无说书人数据，返回玩家模式");
    return "player";
  }

  // 默认情况下，如果没有明确的会话数据，返回玩家模式
  // 这样可以防止未加入主机的用户看到说书人数据
  console.log("没有检测到有效会话，返回默认玩家模式");
  return "player";
}

// 获取用户特定的存储键
function getUserSpecificKey(key, role = null) {
  const currentRole = role || getUserRole();
  const userId = getCurrentUserId();

  // 如果是玩家模式，使用浏览器窗口ID作为稳定的标识符
  if (currentRole === "player") {
    const browserWindowId = localStorage.getItem(SYSTEM_KEYS.BROWSER_WINDOW_ID);
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
      const browserWindowId = localStorage.getItem(SYSTEM_KEYS.BROWSER_WINDOW_ID);
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
      const browserWindowId = localStorage.getItem(SYSTEM_KEYS.BROWSER_WINDOW_ID);
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
};
