/**
 * 剧本导入工具
 * 处理JSON文件并添加分类功能
 */

import scriptManager from "./scriptManager";
import scriptStorage from "./scriptStorage";

// 分类映射（用于文件夹名称到分类的映射）
const FOLDER_CATEGORY_MAPPING = {
  官方已发行剧本: "official",
  经典混合剧本: "mixed",
  部分原创角色剧本: "custom",
  全原创角色剧本: "custom",
  "节日&活动主题剧本": "event",
  "脏镇7-9人中型剧本": "medium",
  特别的玩法: "special",
  "海外综艺《No Rolls Barred》剧本": "overseas",
  海外官网推荐剧本: "overseas",
  '海外"自制角色"体验剧本': "overseas",
  汀西维尔剧本: "tingxi",
  快速上手与角色主题竞赛剧本: "beginner",
  山雨欲来体验剧本: "experience",
  城市赛专属剧本: "tournament",
  华灯初上角色设计大赛: "competition",
  华灯初上剧本创作大赛: "competition",
  "SUI染钟楼投稿&火乐杯剧本": "competition",
  "BWG·剧本大乱斗": "competition",
  BOTC世界杯优选剧本: "worldcup",
};

// 分类显示名称
const CATEGORY_NAMES = {
  official: "官方剧本",
  mixed: "经典混合",
  custom: "自制剧本",
  event: "节日活动",
  medium: "中型剧本",
  special: "特别玩法",
  overseas: "海外剧本",
  tingxi: "汀西维尔",
  beginner: "快速上手",
  experience: "体验剧本",
  tournament: "城市赛",
  competition: "创作大赛",
  worldcup: "世界杯",
};

class ScriptImporter {
  constructor() {
    this.categories = CATEGORY_NAMES;
  }

  /**
   * 解析JSON文件内容
   */
  parseScriptJSON(jsonContent) {
    try {
      const data = JSON.parse(jsonContent);

      // 查找meta信息
      const meta = data.find((item) => item.id === "_meta");
      if (!meta) {
        throw new Error("未找到剧本meta信息");
      }

      // 提取角色列表并处理角色数据
      const roles = [];
      const roleDetails = [];

      data.forEach((item) => {
        if (item.id !== "_meta" && item.team) {
          roles.push(item.id);

          // 保存角色详细信息
          roleDetails.push({
            id: item.id,
            name: item.name,
            ability: item.ability,
            team: item.team,
            firstNight: item.firstNight || 0,
            otherNight: item.otherNight || 0,
            firstNightReminder: item.firstNightReminder || "",
            otherNightReminder: item.otherNightReminder || "",
            reminders: item.reminders || [],
            remindersGlobal: item.remindersGlobal || [],
            setup: item.setup || false,
            image: item.image || "",
            edition: item.edition || "custom",
            flavor: item.flavor || "",
          });
        }
      });

      // 处理additional信息
      const additionalInfo = this.processAdditionalInfo(meta.additional);

      return {
        id: this.generateScriptId(meta.name),
        name: meta.name,
        author: meta.author || "未知作者",
        description: this.cleanDescription(meta.description),
        level: this.determineLevel(meta.description, additionalInfo),
        roles: roles,
        roleDetails: roleDetails,
        isOfficial: false,
        isCustom: true,
        category: this.determineCategory(meta.name, meta.description),
        logo: meta.logo || "",
        additional: additionalInfo,
        townsfolkName: meta.townsfolkName || "镇民",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: "1.0.0",
      };
    } catch (error) {
      console.error("解析JSON失败:", error);
      throw error;
    }
  }

  /**
   * 清理描述文本
   */
  cleanDescription(description) {
    if (!description) return "";

    // 移除HTML标签
    return description
      .replace(/<br>/g, "\n")
      .replace(/<[^>]*>/g, "")
      .trim();
  }

  /**
   * 处理additional信息
   */
  processAdditionalInfo(additional) {
    if (!additional || !Array.isArray(additional)) {
      return [];
    }

    return additional.map((item) => {
      const processed = {};
      Object.keys(item).forEach((key) => {
        if (typeof item[key] === "string") {
          processed[key] = this.cleanDescription(item[key]);
        } else {
          processed[key] = item[key];
        }
      });
      return processed;
    });
  }

  /**
   * 确定剧本难度
   */
  determineLevel(description, additionalInfo = []) {
    if (!description) return "Intermediate";

    const desc = description.toLowerCase();

    // 从additional信息中查找难度信息
    let additionalText = "";
    additionalInfo.forEach((item) => {
      Object.values(item).forEach((value) => {
        if (typeof value === "string") {
          additionalText += value.toLowerCase() + " ";
        }
      });
    });

    const allText = desc + " " + additionalText;

    if (
      allText.includes("初学者") ||
      allText.includes("新手") ||
      allText.includes("beginner") ||
      allText.includes("难度：初学者")
    ) {
      return "Beginner";
    } else if (
      allText.includes("高级") ||
      allText.includes("veteran") ||
      allText.includes("地狱难度") ||
      allText.includes("难度：高级")
    ) {
      return "Veteran";
    } else {
      return "Intermediate";
    }
  }

  /**
   * 确定剧本分类
   */
  determineCategory(name, description) {
    // 根据名称和描述判断分类
    const nameLower = name.toLowerCase();
    const descLower = description.toLowerCase();

    if (nameLower.includes("官方") || descLower.includes("官方")) {
      return "official";
    } else if (nameLower.includes("混合") || descLower.includes("混合")) {
      return "mixed";
    } else if (nameLower.includes("原创") || descLower.includes("原创")) {
      return "custom";
    } else if (nameLower.includes("节日") || nameLower.includes("活动")) {
      return "event";
    } else if (nameLower.includes("海外") || descLower.includes("海外")) {
      return "overseas";
    } else if (nameLower.includes("快速") || descLower.includes("快速")) {
      return "beginner";
    } else if (nameLower.includes("体验")) {
      return "experience";
    } else if (nameLower.includes("城市赛") || nameLower.includes("比赛")) {
      return "tournament";
    } else if (nameLower.includes("大赛") || nameLower.includes("竞赛")) {
      return "competition";
    } else if (nameLower.includes("世界杯")) {
      return "worldcup";
    } else {
      return "mixed"; // 默认分类
    }
  }

  /**
   * 根据文件夹名称获取分类
   */
  getCategoryByFolder(folderName) {
    return FOLDER_CATEGORY_MAPPING[folderName] || "mixed";
  }

  /**
   * 验证剧本数据
   */
  validateScriptData(scriptData) {
    const errors = [];

    if (!scriptData.name || scriptData.name.trim() === "") {
      errors.push("剧本名称不能为空");
    }

    if (!scriptData.roles || !Array.isArray(scriptData.roles)) {
      errors.push("角色列表格式错误");
    }

    if (scriptData.roles && scriptData.roles.length === 0) {
      errors.push("剧本必须包含至少一个角色");
    }

    if (!scriptData.roleDetails || !Array.isArray(scriptData.roleDetails)) {
      errors.push("角色详细信息格式错误");
    }

    // 验证角色详细信息
    if (scriptData.roleDetails) {
      scriptData.roleDetails.forEach((role, index) => {
        if (!role.id || !role.name || !role.ability || !role.team) {
          errors.push(`角色 ${index + 1} 缺少必要信息`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * 生成剧本ID
   */
  generateScriptId(name) {
    // 添加空值检查
    if (!name || typeof name !== "string") {
      name = "unnamed_script";
    }

    // 移除文件名中的特殊字符，保留中文和英文
    const cleanName = name
      .replace(/[#\s\-_]/g, "") // 移除 # 空格 - _
      .replace(/[^\w\u4e00-\u9fa5]/g, "") // 只保留字母数字中文
      .toLowerCase();

    // 添加时间戳确保唯一性
    const timestamp = Date.now().toString().slice(-6);
    return `${cleanName}_${timestamp}`;
  }

  /**
   * 导入单个JSON文件
   */
  async importScriptFile(file, category = "custom") {
    try {
      // 验证文件
      if (!file || !file.name.endsWith(".json")) {
        throw new Error("文件格式错误，只支持JSON文件");
      }

      const content = await this.readFileAsText(file);
      const scriptData = this.parseScriptJSON(content);

      // 验证剧本数据
      const validation = this.validateScriptData(scriptData);
      if (!validation.isValid) {
        throw new Error(`剧本数据验证失败: ${validation.errors.join(", ")}`);
      }

      // 设置分类
      scriptData.category = category;

      // 保存剧本到新的存储系统
      const result = await scriptStorage.saveScript(scriptData, "custom");

      return {
        success: true,
        script: scriptData,
        result: result,
        fileName: file.name,
      };
    } catch (error) {
      console.error("导入剧本失败:", error);
      return {
        success: false,
        error: error.message,
        fileName: file.name,
      };
    }
  }

  /**
   * 批量导入JSON文件
   */
  async importBatchFiles(files, category = "custom") {
    const results = [];

    for (const file of files) {
      const result = await this.importScriptFile(file, category);
      results.push(result);
    }

    return results;
  }

  /**
   * 读取文件为文本
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  /**
   * 获取所有分类
   */
  getCategories() {
    return this.categories;
  }

  /**
   * 根据分类获取剧本
   */
  async getScriptsByCategory(category) {
    try {
      const allScripts = await scriptManager.getCustomScripts();
      return allScripts.filter((script) => script.category === category);
    } catch (error) {
      console.error("获取分类剧本失败:", error);
      return [];
    }
  }

  /**
   * 获取分类统计
   */
  async getCategoryStats() {
    try {
      const allScripts = await scriptManager.getCustomScripts();
      const stats = {};

      Object.keys(this.categories).forEach((category) => {
        stats[category] = allScripts.filter(
          (script) => script.category === category,
        ).length;
      });

      return stats;
    } catch (error) {
      console.error("获取分类统计失败:", error);
      return {};
    }
  }

  /**
   * 更新剧本分类
   */
  async updateScriptCategory(scriptId, newCategory) {
    try {
      const script = await scriptManager.loadScript(scriptId, "custom");
      if (!script) {
        throw new Error("剧本不存在");
      }

      script.category = newCategory;
      script.updatedAt = new Date().toISOString();

      return await scriptManager.saveScript(script, "custom");
    } catch (error) {
      console.error("更新剧本分类失败:", error);
      return { success: false, error: error.message };
    }
  }
}

const scriptImporter = new ScriptImporter();
export default scriptImporter;
