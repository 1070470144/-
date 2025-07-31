/**
 * 剧本存储管理工具
 * 负责剧本的持久化存储和检索
 * 使用JSON文件存储在项目目录中
 */

import fileSystem from "./fileSystem";

class ScriptStorage {
  constructor() {
    this.scriptsDir = "src/data/scripts";
    this.customDir = `${this.scriptsDir}/custom`;
    this.officialDir = `${this.scriptsDir}/official`;
    this.templatesDir = `${this.scriptsDir}/templates`;
    this.ensureDirectories();
  }

  /**
   * 确保目录存在
   */
  ensureDirectories() {
    try {
      // 在浏览器环境中，这些目录应该已经存在
      // 这里主要是为了确保路径正确
      console.log("剧本存储目录:", {
        scripts: this.scriptsDir,
        custom: this.customDir,
        official: this.officialDir,
        templates: this.templatesDir,
      });
    } catch (error) {
      console.error("创建目录失败:", error);
    }
  }

  /**
   * 获取所有剧本
   */
  getAllScripts() {
    try {
      // 从localStorage读取剧本数据（作为缓存）
      const cachedData = localStorage.getItem("townsquare_scripts_cache");
      if (cachedData) {
        const data = JSON.parse(cachedData);
        return {
          custom: data.custom || [],
          official: data.official || [],
          templates: data.templates || [],
        };
      }

      // 如果没有缓存，返回空数据
      return { custom: [], official: [], templates: [] };
    } catch (error) {
      console.error("获取剧本数据失败:", error);
      return { custom: [], official: [], templates: [] };
    }
  }

  /**
   * 保存剧本到JSON文件
   */
  async saveScript(script, type = "custom") {
    try {
      // 生成文件名
      const fileName = `${script.id}.json`;
      const filePath = `${this.getDirectoryByType(type)}/${fileName}`;

      // 准备剧本数据
      const scriptData = {
        ...script,
        createdAt: script.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: "1.0.0",
        filePath: filePath,
      };

      // 在浏览器环境中，我们使用localStorage作为临时存储
      // 实际项目中，这里应该写入文件系统
      const data = this.getAllScripts();

      // 检查是否已存在
      const existingIndex = data[type].findIndex((s) => s.id === script.id);

      if (existingIndex >= 0) {
        // 更新现有剧本
        data[type][existingIndex] = scriptData;
      } else {
        // 添加新剧本
        data[type].push(scriptData);
      }

      // 保存到localStorage作为缓存
      localStorage.setItem("townsquare_scripts_cache", JSON.stringify(data));

      // 同时保存单个剧本文件
      this.saveScriptFile(scriptData, type);

      console.log(`剧本 ${script.name} 已保存到 ${filePath}`);
      return { success: true, script: scriptData };
    } catch (error) {
      console.error("保存剧本失败:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 保存单个剧本文件
   */
  saveScriptFile(scriptData, type) {
    try {
      const fileName = `${scriptData.id}.json`;
      const filePath = `${this.getDirectoryByType(type)}/${fileName}`;

      // 使用文件系统写入JSON文件
      const result = fileSystem.writeJsonFile(filePath, scriptData);

      if (result.success) {
        console.log(`剧本文件已保存: ${filePath}`);
      } else {
        console.error(`保存剧本文件失败: ${filePath}`, result.error);
      }

      // 同时在localStorage中保存缓存
      const fileKey = `script_file_${type}_${scriptData.id}`;
      localStorage.setItem(fileKey, JSON.stringify(scriptData, null, 2));
    } catch (error) {
      console.error("保存剧本文件失败:", error);
    }
  }

  /**
   * 根据类型获取目录
   */
  getDirectoryByType(type) {
    switch (type) {
      case "custom":
        return this.customDir;
      case "official":
        return this.officialDir;
      case "templates":
        return this.templatesDir;
      default:
        return this.customDir;
    }
  }

  /**
   * 删除剧本
   */
  async deleteScript(scriptId, type = "custom") {
    try {
      const data = this.getAllScripts();
      const index = data[type].findIndex((s) => s.id === scriptId);

      if (index >= 0) {
        const deletedScript = data[type].splice(index, 1)[0];

        // 更新缓存
        localStorage.setItem("townsquare_scripts_cache", JSON.stringify(data));

        // 删除文件缓存
        const fileKey = `script_file_${type}_${scriptId}`;
        localStorage.removeItem(fileKey);

        // 删除实际文件
        const fileName = `${scriptId}.json`;
        const filePath = `${this.getDirectoryByType(type)}/${fileName}`;
        const deleteResult = fileSystem.deleteFile(filePath);

        if (deleteResult.success) {
          console.log(`剧本文件已删除: ${filePath}`);
        }

        console.log(`剧本 ${deletedScript.name} 已删除`);
        return { success: true, script: deletedScript };
      } else {
        return { success: false, error: "剧本不存在" };
      }
    } catch (error) {
      console.error("删除剧本失败:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取剧本
   */
  getScript(scriptId, type = "custom") {
    try {
      const data = this.getAllScripts();
      return data[type].find((s) => s.id === scriptId) || null;
    } catch (error) {
      console.error("获取剧本失败:", error);
      return null;
    }
  }

  /**
   * 更新剧本
   */
  async updateScript(scriptId, updates, type = "custom") {
    try {
      const existingScript = this.getScript(scriptId, type);
      if (!existingScript) {
        return { success: false, error: "剧本不存在" };
      }

      const updatedScript = {
        ...existingScript,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return await this.saveScript(updatedScript, type);
    } catch (error) {
      console.error("更新剧本失败:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取剧本统计
   */
  getScriptStats() {
    try {
      const data = this.getAllScripts();
      const allScripts = [...data.custom, ...data.official, ...data.templates];

      const stats = {
        total: allScripts.length,
        custom: data.custom.length,
        official: data.official.length,
        templates: data.templates.length,
        byLevel: {
          Beginner: 0,
          Intermediate: 0,
          Veteran: 0,
        },
        byCategory: {},
      };

      allScripts.forEach((script) => {
        if (script.level && stats.byLevel[script.level] !== undefined) {
          stats.byLevel[script.level]++;
        }

        if (script.category) {
          stats.byCategory[script.category] =
            (stats.byCategory[script.category] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error("获取剧本统计失败:", error);
      return {
        total: 0,
        custom: 0,
        official: 0,
        templates: 0,
        byLevel: { Beginner: 0, Intermediate: 0, Veteran: 0 },
        byCategory: {},
      };
    }
  }

  /**
   * 清空所有剧本
   */
  clearAllScripts() {
    try {
      // 清空缓存
      localStorage.setItem(
        "townsquare_scripts_cache",
        JSON.stringify({
          custom: [],
          official: [],
          templates: [],
          lastUpdated: new Date().toISOString(),
        }),
      );

      // 清空所有文件缓存
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("script_file_")) {
          localStorage.removeItem(key);
        }
      });

      console.log("所有剧本已清空");
      return { success: true };
    } catch (error) {
      console.error("清空剧本失败:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 导出所有剧本数据
   */
  exportAllData() {
    try {
      const data = this.getAllScripts();
      const exportData = {
        ...data,
        exportDate: new Date().toISOString(),
        version: "1.0.0",
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `townsquare_scripts_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error("导出数据失败:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 导入剧本数据
   */
  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);

      if (!data.custom || !data.official || !data.templates) {
        throw new Error("数据格式不正确");
      }

      // 保存到缓存
      localStorage.setItem(
        "townsquare_scripts_cache",
        JSON.stringify({
          custom: data.custom || [],
          official: data.official || [],
          templates: data.templates || [],
          lastUpdated: new Date().toISOString(),
        }),
      );

      // 保存每个剧本文件
      data.custom.forEach((script) => this.saveScriptFile(script, "custom"));
      data.official.forEach((script) =>
        this.saveScriptFile(script, "official"),
      );
      data.templates.forEach((script) =>
        this.saveScriptFile(script, "templates"),
      );

      console.log("剧本数据导入成功");
      return { success: true };
    } catch (error) {
      console.error("导入数据失败:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取存储信息
   */
  getStorageInfo() {
    try {
      const data = this.getAllScripts();
      const totalSize = new Blob([JSON.stringify(data)]).size;

      return {
        totalScripts:
          data.custom.length + data.official.length + data.templates.length,
        customScripts: data.custom.length,
        officialScripts: data.official.length,
        templateScripts: data.templates.length,
        storageSize: totalSize,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("获取存储信息失败:", error);
      return null;
    }
  }

  /**
   * 生成项目文件结构
   */
  generateProjectStructure() {
    const structure = {
      "src/data/scripts/": {
        "custom/": "自定义剧本目录",
        "official/": "官方剧本目录",
        "templates/": "模板剧本目录",
        "README.md": "剧本管理说明",
      },
    };

    console.log("项目文件结构:");
    console.log(JSON.stringify(structure, null, 2));

    return structure;
  }
}

const scriptStorage = new ScriptStorage();
export default scriptStorage;
