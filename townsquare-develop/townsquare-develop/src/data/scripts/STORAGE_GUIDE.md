# 剧本存储功能优化指南

## 🎯 优化内容

### 1. JSON文件存储
- ✅ 剧本数据以JSON文件形式存储在项目目录中
- ✅ 支持自定义、官方、模板三种分类
- ✅ 每个剧本独立存储为一个JSON文件
- ✅ 文件名格式：`{剧本ID}.json`

### 2. 持久化存储
- ✅ 剧本数据持久化保存在 `src/data/scripts/` 目录
- ✅ 支持长期使用，不依赖浏览器localStorage
- ✅ 自动创建目录结构和示例文件
- ✅ 支持备份和恢复功能

### 3. 文件系统操作
- ✅ 完整的文件读写操作
- ✅ 自动目录创建和管理
- ✅ 文件删除和移动功能
- ✅ 文件信息统计

### 4. 用户界面优化
- ✅ 显示剧本文件路径信息
- ✅ 存储统计信息展示
- ✅ 实时剧本数量统计
- ✅ 分类筛选功能

## 📁 目录结构

```
src/data/scripts/
├── custom/          # 自定义剧本
│   ├── example_script.json
│   └── ...
├── official/        # 官方剧本
│   └── ...
├── templates/       # 模板剧本
│   └── ...
├── README.md        # 说明文档
└── .gitignore       # Git忽略文件
```

## 🚀 使用方法

### 1. 初始化存储
```bash
# 运行初始化脚本
node scripts/init-scripts.js
```

### 2. 导入剧本
1. 打开剧本管理界面 (`Alt + M` → 剧本管理)
2. 点击"导入剧本"或"批量导入JSON"
3. 选择JSON文件
4. 系统自动保存到对应目录

### 3. 查看存储信息
- 界面顶部显示剧本统计信息
- 剧本卡片显示文件路径
- 支持按分类筛选查看

## 📋 剧本文件格式

### 标准格式
```json
{
  "id": "剧本ID",
  "name": "剧本名称",
  "author": "作者",
  "description": "剧本描述",
  "level": "Beginner|Intermediate|Veteran",
  "roles": ["角色ID列表"],
  "category": "分类",
  "roleDetails": [
    {
      "id": "角色ID",
      "name": "角色名称",
      "ability": "角色能力",
      "team": "townsfolk|outsider|minion|demon|traveler",
      "firstNight": 夜晚顺序,
      "otherNight": 夜晚顺序,
      "firstNightReminder": "首夜提醒",
      "otherNightReminder": "其他夜晚提醒",
      "reminders": ["提醒标记"],
      "remindersGlobal": [],
      "setup": false,
      "image": "角色图片URL",
      "edition": "custom",
      "flavor": ""
    }
  ],
  "additional": [
    {
      "剧本介绍": "详细介绍...",
      "难度": "初学者"
    }
  ],
  "logo": "logo图片URL",
  "townsfolkName": "镇民",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "filePath": "src/data/scripts/custom/剧本ID.json"
}
```

## 🔧 技术特性

### 1. 文件系统操作
- 自动创建目录结构
- JSON文件读写操作
- 文件删除和移动
- 文件信息统计

### 2. 缓存机制
- localStorage作为临时缓存
- 文件系统作为持久存储
- 双重保障数据安全

### 3. 错误处理
- 文件操作错误处理
- 数据验证和修复
- 详细的错误日志

### 4. 备份功能
- 支持数据导出
- 支持数据导入
- 自动备份机制

## 📊 存储统计

### 界面显示
- 总剧本数量
- 各分类剧本数量
- 文件大小统计
- 最后更新时间

### 文件信息
- 文件名和路径
- 文件大小
- 创建和修改时间
- 文件状态

## ⚠️ 注意事项

1. **文件权限**: 确保应用有写入项目目录的权限
2. **文件格式**: 只支持UTF-8编码的JSON文件
3. **文件大小**: 建议单个文件不超过1MB
4. **备份**: 定期备份重要剧本数据
5. **版本控制**: 建议将剧本文件纳入版本控制

## 🧪 测试功能

### 文件系统测试
```javascript
import fileSystem from '@/utils/fileSystem';

// 测试文件写入
const result = await fileSystem.writeJsonFile('test.json', { test: 'data' });

// 测试文件读取
const data = await fileSystem.readJsonFile('test.json');

// 测试文件删除
await fileSystem.deleteFile('test.json');
```

### 存储系统测试
```javascript
import scriptStorage from '@/utils/scriptStorage';

// 测试剧本保存
const result = await scriptStorage.saveScript(scriptData, 'custom');

// 测试剧本读取
const scripts = scriptStorage.getAllScripts();

// 测试剧本删除
await scriptStorage.deleteScript(scriptId, 'custom');
```

## 🔄 更新日志

### v3.0.0 (当前版本)
- ✅ JSON文件持久化存储
- ✅ 完整的文件系统操作
- ✅ 用户界面优化
- ✅ 存储信息显示
- ✅ 备份和恢复功能
- ✅ 错误处理和日志
- ✅ 测试功能完善

### v2.0.0
- ✅ 单个剧本导入修复
- ✅ 智能分类系统
- ✅ 增强的数据验证
- ✅ 优化的用户界面

### v1.0.0
- ✅ 基础导入功能
- ✅ 简单分类支持
- ✅ 基本错误处理 