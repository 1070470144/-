/**
 * 测试导入功能
 * 用于验证JSON导入是否正常工作
 */

import scriptImporter from "./scriptImporter";

// 测试JSON数据
const testScriptData = `[{
  "id": "_meta",
  "name": "测试剧本",
  "author": "测试作者",
  "description": "这是一个测试剧本，用于验证导入功能是否正常工作。",
  "logo": "https://example.com/logo.png",
  "townsfolkName": "镇民",
  "additional": [{
    "剧本介绍": "这是一个测试剧本，包含基本的角色信息。难度：初学者。"
  }]
}, {
  "id": "test_role_1",
  "name": "测试角色1",
  "ability": "这是一个测试角色的能力描述。",
  "team": "townsfolk",
  "firstNight": 1,
  "otherNight": 0,
  "firstNightReminder": "测试提醒",
  "otherNightReminder": "",
  "reminders": ["测试标记"],
  "remindersGlobal": [],
  "setup": false,
  "image": "https://example.com/icon.png",
  "edition": "custom",
  "flavor": ""
}, {
  "id": "test_role_2",
  "name": "测试角色2",
  "ability": "这是另一个测试角色的能力描述。",
  "team": "outsider",
  "firstNight": 2,
  "otherNight": 0,
  "firstNightReminder": "测试提醒2",
  "otherNightReminder": "",
  "reminders": ["测试标记2"],
  "remindersGlobal": [],
  "setup": false,
  "image": "https://example.com/icon2.png",
  "edition": "custom",
  "flavor": ""
}]`;

/**
 * 测试导入功能
 */
export async function testImportFunction() {
  console.log("开始测试导入功能...");

  try {
    // 创建测试文件对象
    const testFile = new File([testScriptData], "test_script.json", {
      type: "application/json",
    });

    // 测试导入
    const result = await scriptImporter.importScriptFile(testFile, "test");

    console.log("导入结果:", result);

    if (result.success) {
      console.log("✅ 导入测试成功");
      console.log("剧本名称:", result.script.name);
      console.log("角色数量:", result.script.roles.length);
      console.log("分类:", result.script.category);
      console.log("难度:", result.script.level);
    } else {
      console.log("❌ 导入测试失败:", result.error);
    }

    return result;
  } catch (error) {
    console.error("测试过程中发生错误:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 测试分类功能
 */
export function testCategoryFunction() {
  console.log("测试分类功能...");

  const testCases = [
    { name: "官方剧本测试", description: "这是一个官方剧本" },
    { name: "混合剧本测试", description: "这是一个混合剧本" },
    { name: "原创剧本测试", description: "这是一个原创剧本" },
    { name: "节日活动剧本", description: "这是一个节日活动剧本" },
    { name: "海外剧本测试", description: "这是一个海外剧本" },
    { name: "快速上手剧本", description: "这是一个快速上手剧本" },
    { name: "体验剧本测试", description: "这是一个体验剧本" },
    { name: "城市赛剧本", description: "这是一个城市赛剧本" },
    { name: "创作大赛剧本", description: "这是一个创作大赛剧本" },
    { name: "世界杯剧本", description: "这是一个世界杯剧本" },
  ];

  testCases.forEach((testCase, index) => {
    const category = scriptImporter.determineCategory(
      testCase.name,
      testCase.description,
    );
    console.log(`测试 ${index + 1}: ${testCase.name} -> ${category}`);
  });
}

/**
 * 测试难度判断功能
 */
export function testLevelFunction() {
  console.log("测试难度判断功能...");

  const testCases = [
    { description: "这是一个初学者剧本，适合新手玩家。", expected: "Beginner" },
    {
      description: "这是一个中级剧本，适合有一定经验的玩家。",
      expected: "Intermediate",
    },
    {
      description: "这是一个高级剧本，适合资深玩家。难度：高级",
      expected: "Veteran",
    },
    {
      description: "这是一个地狱难度的剧本，非常具有挑战性。",
      expected: "Veteran",
    },
  ];

  testCases.forEach((testCase, index) => {
    const level = scriptImporter.determineLevel(testCase.description);
    const isCorrect = level === testCase.expected;
    console.log(
      `测试 ${index + 1}: ${level} ${isCorrect ? "✅" : "❌"} (期望: ${
        testCase.expected
      })`,
    );
  });
}

/**
 * 运行所有测试
 */
export async function runAllTests() {
  console.log("=== 开始运行所有测试 ===");

  // 测试分类功能
  testCategoryFunction();

  // 测试难度判断功能
  testLevelFunction();

  // 测试导入功能
  await testImportFunction();

  console.log("=== 所有测试完成 ===");
}

export default {
  testImportFunction,
  testCategoryFunction,
  testLevelFunction,
  runAllTests,
};
