# 存储键管理系统

## 概述

本项目使用统一的存储键管理系统来管理所有localStorage相关的键值。所有存储键都定义在 `storageKeys.js` 文件中，确保键名的一致性和可维护性。

## 文件结构

```
src/utils/
├── storageKeys.js      # 存储键定义和管理
├── userStorage.js      # 用户存储工具（已更新使用统一键名）
└── README_storage.md   # 本文档
```

## 存储键分类

### 1. 系统级存储键 (SYSTEM_KEYS)

这些键不依赖用户隔离，用于全局系统功能：

- `BROWSER_WINDOW_ID`: 浏览器窗口唯一标识
- `BROWSER_INSTANCE_ID`: 浏览器实例标识（兼容旧版本）
- `STORYTELLER_USER_ID`: 说书人用户ID
- `GLOBAL_SESSION`: 全局会话数据（兼容旧版本）
- `MIGRATION_COMPLETED`: 迁移完成标志
- `IMAGE_OPT_IN`: 图片选择同意

### 2. 用户数据存储键 (USER_DATA_KEYS)

这些键通过userStorage管理，支持用户隔离：

- `BACKGROUND`: 背景设置
- `MUTED`: 静音设置
- `STATIC`: 静态模式
- `ZOOM`: 缩放设置
- `IS_GRIMOIRE`: 是否为说书人模式
- `ROLES`: 自定义角色
- `EDITION`: 版本设置
- `BLUFFS`: 恶魔伪装
- `FABLED`: 寓言角色
- `PLAYERS`: 玩家数据
- `PLAYER_ID`: 玩家ID
- `SESSION`: 会话数据
- `GAME_HISTORY`: 游戏历史

### 3. 说书人特定存储键 (STORYTELLER_KEYS)

专门用于说书人模式的数据：

- `SESSION`: 说书人会话
- `EDITION`: 说书人版本
- `FABLED`: 说书人寓言
- `BLUFFS`: 说书人恶魔伪装
- `PLAYERS`: 说书人玩家数据

### 4. 玩家特定存储键 (PLAYER_KEYS)

专门用于玩家模式的数据：

- `SESSION`: 玩家会话

## 使用方法

### 导入存储键

```javascript
import { 
  SYSTEM_KEYS, 
  USER_DATA_KEYS, 
  STORYTELLER_KEYS, 
  PLAYER_KEYS,
  getRoleFlagKey,
  clearAllStorage,
  getStorageStats 
} from './storageKeys.js';
```

### 使用存储键

```javascript
// 系统级存储
localStorage.setItem(SYSTEM_KEYS.BROWSER_WINDOW_ID, windowId);

// 用户数据存储（通过userStorage）
userStorage.setItem(USER_DATA_KEYS.BACKGROUND, backgroundValue);

// 角色标志位
const flagKey = getRoleFlagKey(hash);
localStorage.setItem(flagKey, role);
```

### 工具函数

```javascript
// 获取所有系统级存储键
const systemKeys = getSystemKeys();

// 获取所有用户数据存储键
const userDataKeys = getUserDataKeys();

// 清理所有存储数据
clearAllStorage(true); // 包含系统级数据

// 获取存储使用统计
const stats = getStorageStats();
console.log(stats);
// 输出: { system: 3, userData: 5, storyteller: 2, player: 1, roleFlags: 1, total: 12 }
```

## 迁移说明

### 从旧版本迁移

项目已经包含了自动迁移功能，会将旧的存储键迁移到新的统一键名系统。

### 兼容性

- 新的存储键系统完全向后兼容
- 旧版本的存储键仍然可以正常工作
- 迁移过程是自动的，无需手动干预

## 最佳实践

1. **始终使用常量**：不要硬编码存储键名，始终使用 `storageKeys.js` 中定义的常量

2. **分类使用**：根据数据性质选择合适的存储键分类

3. **用户隔离**：用户数据始终通过 `userStorage` 管理，确保数据隔离

4. **清理数据**：使用提供的工具函数进行数据清理，避免手动操作

5. **监控使用**：定期使用 `getStorageStats()` 监控存储使用情况

## 更新日志

- **v1.0.0**: 初始版本，统一所有存储键管理
- 支持用户隔离存储
- 提供完整的工具函数
- 自动迁移旧数据

## 注意事项

1. 修改存储键名时，需要同时更新所有相关文件
2. 新增存储键时，需要在 `storageKeys.js` 中定义
3. 删除存储键时，需要确保没有其他地方在使用
4. 存储键名应该具有描述性，便于理解和维护 