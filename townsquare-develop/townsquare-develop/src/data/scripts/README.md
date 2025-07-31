# 剧本管理系统

## 📁 文件夹结构

```
src/data/scripts/
├── official/          # 官方剧本
│   ├── trouble-brewing.json
│   ├── bad-moon-rising.json
│   ├── sects-and-violets.json
│   └── laissez-un-faire.json
├── custom/            # 自定义剧本
│   └── example-custom-script.json
├── templates/         # 模板剧本
│   └── beginner-template.json
└── README.md
```

## 🎯 功能特性

### 1. 剧本分类
- **官方剧本** (`official/`): 血染钟楼官方发布的剧本
- **自定义剧本** (`custom/`): 用户创建的剧本
- **模板剧本** (`templates/`): 可复用的剧本模板

### 2. 剧本数据格式

每个剧本文件包含以下字段：

```json
{
  "id": "unique-script-id",
  "name": "剧本名称",
  "author": "作者",
  "description": "剧本描述",
  "level": "Beginner|Intermediate|Veteran",
  "roles": ["角色ID列表"],
  "isOfficial": true/false,
  "isCustom": true/false,
  "isTemplate": true/false,
  "createdAt": "创建时间",
  "updatedAt": "更新时间",
  "version": "版本号"
}
```

### 3. 管理功能

#### 创建剧本
- 通过界面创建新剧本
- 选择角色组合
- 设置难度等级
- 添加描述信息

#### 编辑剧本
- 修改剧本信息
- 调整角色列表
- 更新描述和难度

#### 导入/导出
- 支持JSON格式导入
- 导出剧本文件
- 分享剧本数据

#### 删除剧本
- 删除自定义剧本
- 保留官方剧本

## 🛠️ 技术实现

### 核心工具
- `scriptManager.js`: 剧本管理核心工具
- `scriptInitializer.js`: 剧本数据初始化
- `ScriptManager.vue`: 剧本管理界面组件

### 存储方式
- **本地存储**: 使用localStorage保存剧本数据
- **文件系统**: 剧本文件存储在对应文件夹
- **数据同步**: 自动同步本地存储和文件系统

### 数据验证
- 剧本格式验证
- 角色ID验证
- 必填字段检查

## 📋 使用说明

### 1. 初始化系统
```javascript
import { initializeScripts } from '@/utils/scriptInitializer';

// 初始化剧本数据
await initializeScripts();
```

### 2. 管理剧本
```javascript
import scriptManager from '@/utils/scriptManager';

// 获取所有剧本
const scripts = await scriptManager.getAllScripts();

// 创建新剧本
const newScript = await scriptManager.createScript({
  name: "我的剧本",
  author: "我的名字",
  roles: ["washerwoman", "imp"]
}, 'custom');

// 保存剧本
await scriptManager.saveScript(script, 'custom');

// 删除剧本
await scriptManager.deleteScript(scriptId, 'custom');
```

### 3. 导入/导出
```javascript
// 导出剧本
scriptManager.exportScript(scriptId, 'custom');

// 导入剧本
const file = event.target.files[0];
await scriptManager.importScript(file, 'custom');
```

## 🔧 扩展开发

### 添加新剧本类型
1. 在对应文件夹创建JSON文件
2. 更新scriptManager.js中的类型处理
3. 在界面中添加新类型支持

### 自定义验证规则
1. 修改validateScript方法
2. 添加自定义验证逻辑
3. 更新错误提示信息

### 数据迁移
1. 使用scriptInitializer.js
2. 批量导入现有数据
3. 验证数据完整性

## 📊 统计信息

系统提供剧本统计功能：
- 总剧本数量
- 各类型剧本数量
- 按难度分类统计
- 创建时间分布

## 🔒 安全考虑

- 官方剧本不可删除
- 数据验证防止恶意输入
- 文件大小限制
- 角色ID白名单验证

## 📝 更新日志

### v1.0.0
- 基础剧本管理功能
- 官方剧本数据
- 自定义剧本支持
- 导入/导出功能
- 模板剧本系统 