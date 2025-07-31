# JSON剧本导入说明

## 📁 文件夹结构

```
src/data/scripts/custom/json/
├── 官方已发行剧本/          # 官方剧本
├── 经典混合剧本/            # 经典混合
├── 部分原创角色剧本/        # 自制剧本
├── 全原创角色剧本/          # 自制剧本
├── 节日&活动主题剧本/       # 节日活动
├── 脏镇7-9人中型剧本/      # 中型剧本
├── 特别的玩法/              # 特别玩法
├── 海外综艺《No Rolls Barred》剧本/  # 海外剧本
├── 海外官网推荐剧本/        # 海外剧本
├── 海外"自制角色"体验剧本/  # 海外剧本
├── 汀西维尔剧本/            # 汀西维尔
├── 快速上手与角色主题竞赛剧本/  # 快速上手
├── 山雨欲来体验剧本/        # 体验剧本
├── 城市赛专属剧本/          # 城市赛
├── 华灯初上角色设计大赛/    # 创作大赛
├── 华灯初上剧本创作大赛/    # 创作大赛
├── SUI染钟楼投稿&火乐杯剧本/  # 创作大赛
├── BWG·剧本大乱斗/         # 创作大赛
├── BOTC世界杯优选剧本/      # 世界杯
└── README.md
```

## 🎯 分类系统

### 自动分类映射
- **官方剧本** (`official`): 官方已发行剧本
- **经典混合** (`mixed`): 经典混合剧本
- **自制剧本** (`custom`): 部分原创角色剧本、全原创角色剧本
- **节日活动** (`event`): 节日&活动主题剧本
- **中型剧本** (`medium`): 脏镇7-9人中型剧本
- **特别玩法** (`special`): 特别的玩法
- **海外剧本** (`overseas`): 海外相关剧本
- **汀西维尔** (`tingxi`): 汀西维尔剧本
- **快速上手** (`beginner`): 快速上手与角色主题竞赛剧本
- **体验剧本** (`experience`): 山雨欲来体验剧本
- **城市赛** (`tournament`): 城市赛专属剧本
- **创作大赛** (`competition`): 各种创作大赛剧本
- **世界杯** (`worldcup`): BOTC世界杯优选剧本

## 📋 JSON文件格式

### 标准格式
```json
[{
  "id": "_meta",
  "name": "剧本名称",
  "author": "作者",
  "description": "剧本描述",
  "logo": "logo图片URL",
  "townsfolkName": "镇民",
  "additional": [{
    "剧本介绍": "详细介绍..."
  }]
}, {
  "id": "角色ID",
  "name": "角色名称",
  "ability": "角色能力描述",
  "team": "townsfolk|outsider|minion|demon|traveler",
  "firstNight": 夜晚顺序,
  "otherNight": 夜晚顺序,
  "firstNightReminder": "首夜提醒",
  "otherNightReminder": "其他夜晚提醒",
  "reminders": ["提醒标记"],
  "setup": false,
  "image": "角色图片URL",
  "edition": "custom"
}]
```

### 必需字段
- `_meta` 对象必须包含 `name` 字段
- 角色对象必须包含 `id`, `name`, `ability`, `team` 字段

## 🚀 导入方式

### 1. 界面导入
1. 打开剧本管理界面 (`Alt + M` → 剧本管理)
2. 点击"批量导入JSON"按钮
3. 选择分类
4. 选择JSON文件（支持多选）
5. 查看导入结果

### 2. 自动分类
- 系统会根据文件夹名称自动分类
- 可以根据剧本名称和描述智能分类
- 支持手动修改分类

### 3. 导入验证
- 自动验证JSON格式
- 检查必需字段
- 清理HTML标签
- 生成唯一ID

## 🔧 使用工具

### ScriptImporter
```javascript
import scriptImporter from '@/utils/scriptImporter';

// 导入单个文件
const result = await scriptImporter.importScriptFile(file, 'mixed');

// 获取分类
const categories = scriptImporter.getCategories();

// 按分类获取剧本
const scripts = await scriptImporter.getScriptsByCategory('mixed');
```

### BatchImportScripts
```javascript
import batchImportScripts from '@/utils/batchImportScripts';

// 导入所有剧本
const results = await batchImportScripts.importAllScripts();

// 获取统计信息
const stats = batchImportScripts.getImportStats();
```

## 📊 导入统计

系统会记录导入结果：
- 总文件数
- 成功导入数
- 失败导入数
- 按分类统计
- 详细错误信息

## ⚠️ 注意事项

1. **文件格式**: 只支持JSON格式文件
2. **编码**: 建议使用UTF-8编码
3. **大小**: 单个文件建议不超过1MB
4. **备份**: 导入前建议备份现有数据
5. **验证**: 导入后请检查剧本信息是否正确

## 🔄 更新和维护

### 添加新分类
1. 在 `scriptImporter.js` 中添加分类映射
2. 更新分类显示名称
3. 重新导入相关剧本

### 修改分类规则
1. 更新 `determineCategory` 方法
2. 重新导入剧本以应用新规则

### 数据迁移
1. 导出现有数据
2. 清理本地存储
3. 重新导入所有剧本

## 📝 更新日志

### v1.0.0
- 基础JSON导入功能
- 自动分类系统
- 批量导入支持
- 导入结果统计
- 界面集成 