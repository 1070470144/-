/**
 * 单个剧本导入功能测试
 */

import scriptImporter from "./scriptImporter";

// 测试用的JSON数据（模拟您提供的格式）
const testScriptJSON = `[{
  "id": "_meta",
  "name": "暗流涌动",
  "author": "官方",
  "description": "乌云在鸦木布拉夫的天空中翻滚着，让这个沉睡中的小镇和迷信的居民们笼罩在不祥的阴影之中。",
  "logo": "https://oss.gstonegames.com/static/image/team/202206/c_5935045915561_5940ef2d.jpg",
  "townsfolkName": "镇民",
  "additional": [{
    "剧本介绍": "在《暗流涌动》中，每种要素都会略有涉及。难度：初学者。"
  }]
}, {
  "id": "1_82",
  "name": "乞丐",
  "ability": "你只能使用投票标记投票。死亡的玩家可以将他的投票标记给你，如果他这么做，你会得知他的阵营。",
  "team": "traveler",
  "firstNight": 0,
  "otherNight": 0,
  "firstNightReminder": "",
  "otherNightReminder": "",
  "reminders": [],
  "remindersGlobal": [],
  "setup": false,
  "image": "https://oss.gstonegames.com/data_file/clocktower/role_icon/beggar.png",
  "edition": "custom",
  "flavor": ""
}, {
  "id": "1_93",
  "name": "替罪羊",
  "ability": "如果你的阵营的一名玩家被处决，你可能会代替他被处决。",
  "team": "traveler",
  "firstNight": 0,
  "otherNight": 0,
  "firstNightReminder": "",
  "otherNightReminder": "",
  "reminders": [],
  "remindersGlobal": [],
  "setup": false,
  "image": "https://oss.gstonegames.com/data_file/clocktower/role_icon/scapegoat.png",
  "edition": "custom",
  "flavor": ""
}]`;

/**
 * 测试单个剧本导入
 */
export async function testSingleImport() {
  console.log("=== 开始测试单个剧本导入 ===");

  try {
    // 创建测试文件
    const testFile = new File([testScriptJSON], "暗流涌动.json", {
      type: "application/json",
    });

    console.log("测试文件:", testFile.name);
    console.log("文件大小:", testFile.size, "bytes");

    // 测试导入
    const result = await scriptImporter.importScriptFile(testFile, "official");

    console.log("导入结果:", result);

    if (result.success) {
      console.log("✅ 单个剧本导入成功");
      console.log("剧本名称:", result.script.name);
      console.log("作者:", result.script.author);
      console.log("角色数量:", result.script.roles.length);
      console.log("分类:", result.script.category);
      console.log("难度:", result.script.level);
      console.log("描述长度:", result.script.description.length);

      // 显示角色详情
      if (result.script.roleDetails) {
        console.log("角色详情:");
        result.script.roleDetails.forEach((role, index) => {
          console.log(`  ${index + 1}. ${role.name} (${role.team})`);
        });
      }
    } else {
      console.log("❌ 单个剧本导入失败:", result.error);
    }

    return result;
  } catch (error) {
    console.error("测试过程中发生错误:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 测试错误处理
 */
export async function testErrorHandling() {
  console.log("=== 开始测试错误处理 ===");

  const testCases = [
    {
      name: "空文件测试",
      content: "",
      expectedError: "JSON解析失败",
    },
    {
      name: "无效JSON测试",
      content: "{ invalid json }",
      expectedError: "JSON解析失败",
    },
    {
      name: "缺少meta信息测试",
      content: '[{"id": "test", "name": "test"}]',
      expectedError: "未找到剧本meta信息",
    },
    {
      name: "缺少角色测试",
      content: '[{"id": "_meta", "name": "test"}]',
      expectedError: "剧本必须包含至少一个角色",
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n测试: ${testCase.name}`);

    try {
      const testFile = new File([testCase.content], `${testCase.name}.json`, {
        type: "application/json",
      });

      const result = await scriptImporter.importScriptFile(testFile, "test");

      if (!result.success) {
        console.log(`✅ 正确捕获错误: ${result.error}`);
      } else {
        console.log(`❌ 应该失败但成功了: ${testCase.name}`);
      }
    } catch (error) {
      console.log(`✅ 正确捕获错误: ${error.message}`);
    }
  }
}

/**
 * 测试不同分类的导入
 */
export async function testCategoryImport() {
  console.log("=== 开始测试分类导入 ===");

  const categories = ["official", "mixed", "custom", "event", "overseas"];

  for (const category of categories) {
    console.log(`\n测试分类: ${category}`);

    try {
      const testFile = new File([testScriptJSON], `test_${category}.json`, {
        type: "application/json",
      });

      const result = await scriptImporter.importScriptFile(testFile, category);

      if (result.success) {
        console.log(`✅ ${category} 分类导入成功`);
        console.log(`   实际分类: ${result.script.category}`);
      } else {
        console.log(`❌ ${category} 分类导入失败: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ ${category} 分类导入异常: ${error.message}`);
    }
  }
}

/**
 * 运行所有单个导入测试
 */
export async function runSingleImportTests() {
  console.log("🚀 开始运行单个剧本导入测试套件");

  // 测试正常导入
  await testSingleImport();

  // 测试错误处理
  await testErrorHandling();

  // 测试分类导入
  await testCategoryImport();

  console.log("\n🎉 单个剧本导入测试完成");
}

export default {
  testSingleImport,
  testErrorHandling,
  testCategoryImport,
  runSingleImportTests,
};
