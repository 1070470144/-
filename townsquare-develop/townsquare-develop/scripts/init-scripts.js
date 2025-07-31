#!/usr/bin/env node

/**
 * 初始化剧本存储目录结构
 * 运行: node scripts/init-scripts.js
 */

const fs = require('fs');
const path = require('path');

const baseDir = 'src/data/scripts';
const dirs = [
  baseDir,
  path.join(baseDir, 'custom'),
  path.join(baseDir, 'official'),
  path.join(baseDir, 'templates')
];

console.log('🚀 开始初始化剧本存储目录...');

// 创建目录
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ 创建目录: ${dir}`);
  } else {
    console.log(`📁 目录已存在: ${dir}`);
  }
});

// 创建README文件
const readmePath = path.join(baseDir, 'README.md');
const readmeContent = `# 剧本存储目录

此目录用于存储TownSquare应用的剧本数据。

## 目录结构

- \`custom/\` - 自定义剧本
- \`official/\` - 官方剧本  
- \`templates/\` - 模板剧本

## 文件格式

每个剧本存储为独立的JSON文件，文件名格式为: \`{剧本ID}.json\`

## 剧本数据结构

\`\`\`json
{
  "id": "剧本ID",
  "name": "剧本名称",
  "author": "作者",
  "description": "剧本描述",
  "level": "难度等级",
  "roles": ["角色ID列表"],
  "category": "分类",
  "createdAt": "创建时间",
  "updatedAt": "更新时间",
  "version": "版本号"
}
\`\`\`

## 注意事项

- 请勿手动修改此目录中的文件
- 所有操作应通过应用界面进行
- 定期备份重要剧本数据
`;

if (!fs.existsSync(readmePath)) {
  fs.writeFileSync(readmePath, readmeContent, 'utf8');
  console.log(`✅ 创建README文件: ${readmePath}`);
} else {
  console.log(`📄 README文件已存在: ${readmePath}`);
}

// 创建示例剧本文件
const exampleScript = {
  id: "example_script",
  name: "示例剧本",
  author: "系统",
  description: "这是一个示例剧本，用于演示剧本存储功能。",
  level: "Beginner",
  roles: ["washerwoman", "librarian", "investigator"],
  category: "custom",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: "1.0.0"
};

const examplePath = path.join(baseDir, 'custom', 'example_script.json');
if (!fs.existsSync(examplePath)) {
  fs.writeFileSync(examplePath, JSON.stringify(exampleScript, null, 2), 'utf8');
  console.log(`✅ 创建示例剧本: ${examplePath}`);
} else {
  console.log(`📄 示例剧本已存在: ${examplePath}`);
}

// 创建.gitignore文件
const gitignorePath = path.join(baseDir, '.gitignore');
const gitignoreContent = `# 忽略临时文件
*.tmp
*.temp

# 忽略备份文件
*.bak
*.backup

# 忽略日志文件
*.log

# 保留示例文件
!example_script.json
`;

if (!fs.existsSync(gitignorePath)) {
  fs.writeFileSync(gitignorePath, gitignoreContent, 'utf8');
  console.log(`✅ 创建.gitignore文件: ${gitignorePath}`);
} else {
  console.log(`📄 .gitignore文件已存在: ${gitignorePath}`);
}

console.log('\n🎉 剧本存储目录初始化完成！');
console.log('\n📋 目录结构:');
console.log('src/data/scripts/');
console.log('├── custom/          # 自定义剧本');
console.log('├── official/         # 官方剧本');
console.log('├── templates/        # 模板剧本');
console.log('├── README.md         # 说明文档');
console.log('└── .gitignore        # Git忽略文件');

console.log('\n💡 提示:');
console.log('- 现在可以通过应用界面导入和管理剧本');
console.log('- 所有剧本将自动保存为JSON文件');
console.log('- 建议定期备份重要剧本数据'); 