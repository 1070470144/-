/**
 * 剧本管理工具
 */
import defaultEditions from "../editions.json";

class ScriptManager {
  constructor() {
    this.scriptsPath = "src/data/scripts";
    this.officialPath = `${this.scriptsPath}/official`;
    this.customPath = `${this.scriptsPath}/custom`;
    this.templatesPath = `${this.scriptsPath}/templates`;
  }

  // 获取所有剧本
  async getAllScripts() {
    try {
      const scripts = {
        official: await this.getOfficialScripts(),
        custom: await this.getCustomScripts(),
        templates: await this.getTemplateScripts(),
      };
      return scripts;
    } catch (error) {
      console.error("获取剧本列表失败:", error);
      return { official: [], custom: [], templates: [] };
    }
  }

  // 获取官方剧本
  async getOfficialScripts() {
    try {
      const officialScripts = defaultEditions.filter(
        (edition) => edition.isOfficial,
      );
      const additionalScripts = await this.readScriptsFromDirectory(
        this.officialPath,
      );
      return [...officialScripts, ...additionalScripts];
    } catch (error) {
      console.error("获取官方剧本失败:", error);
      return defaultEditions.filter((edition) => edition.isOfficial);
    }
  }

  // 获取自定义剧本
  async getCustomScripts() {
    try {
      return await this.readScriptsFromDirectory(this.customPath);
    } catch (error) {
      console.error("获取自定义剧本失败:", error);
      return [];
    }
  }

  // 获取模板剧本
  async getTemplateScripts() {
    try {
      return await this.readScriptsFromDirectory(this.templatesPath);
    } catch (error) {
      console.error("获取模板剧本失败:", error);
      return [];
    }
  }

  // 从目录读取剧本
  async readScriptsFromDirectory(directoryPath) {
    try {
      // 尝试从本地存储读取该目录下的剧本
      const scripts = [];
      const keys = Object.keys(localStorage);

      // 根据目录路径过滤本地存储的键
      const directoryKey = directoryPath.replace(/\//g, "_");
      const relevantKeys = keys.filter((key) =>
        key.startsWith(`script_${directoryKey}`),
      );

      for (const key of relevantKeys) {
        try {
          const scriptData = JSON.parse(localStorage.getItem(key));
          if (scriptData) {
            scripts.push(scriptData);
          }
        } catch (error) {
          console.error(`解析剧本数据失败: ${key}`, error);
        }
      }

      return scripts;
    } catch (error) {
      console.error(`读取目录 ${directoryPath} 失败:`, error);
      return [];
    }
  }

  // 保存剧本
  async saveScript(script, type = "custom") {
    try {
      const scriptData = {
        ...script,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: "1.0.0",
      };

      const fileName = `${script.id}.json`;
      const filePath = `${this.scriptsPath}/${type}/${fileName}`;
      const key = `script_${type}_${script.id}`;
      localStorage.setItem(key, JSON.stringify(scriptData));

      console.log(`剧本 ${script.name} 已保存到 ${filePath}`);
      return { success: true, script: scriptData };
    } catch (error) {
      console.error("保存剧本失败:", error);
      return { success: false, error: error.message };
    }
  }

  // 读取剧本
  async loadScript(scriptId, type = "custom") {
    try {
      const key = `script_${type}_${scriptId}`;
      const scriptData = localStorage.getItem(key);

      if (scriptData) {
        return JSON.parse(scriptData);
      }

      if (type === "official") {
        const officialScript = defaultEditions.find(
          (edition) => edition.id === scriptId,
        );
        if (officialScript) {
          return officialScript;
        }
      }

      throw new Error(`剧本 ${scriptId} 不存在`);
    } catch (error) {
      console.error("读取剧本失败:", error);
      return null;
    }
  }

  // 更新剧本
  async updateScript(scriptId, updates, type = "custom") {
    try {
      const existingScript = await this.loadScript(scriptId, type);
      if (!existingScript) {
        throw new Error(`剧本 ${scriptId} 不存在`);
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

  // 删除剧本
  async deleteScript(scriptId, type = "custom") {
    try {
      const key = `script_${type}_${scriptId}`;
      localStorage.removeItem(key);

      console.log(`剧本 ${scriptId} 已删除`);
      return { success: true };
    } catch (error) {
      console.error("删除剧本失败:", error);
      return { success: false, error: error.message };
    }
  }

  // 创建新剧本
  async createScript(scriptData, type = "custom") {
    try {
      const newScript = {
        id: scriptData.id || this.generateScriptId(),
        name: scriptData.name || "新剧本",
        author: scriptData.author || "未知作者",
        description: scriptData.description || "",
        level: scriptData.level || "Beginner",
        roles: scriptData.roles || [],
        isOfficial: false,
        isCustom: type === "custom",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: "1.0.0",
      };

      return await this.saveScript(newScript, type);
    } catch (error) {
      console.error("创建剧本失败:", error);
      return { success: false, error: error.message };
    }
  }

  // 生成剧本ID
  generateScriptId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `script_${timestamp}_${random}`;
  }

  // 验证剧本数据
  validateScript(script) {
    const errors = [];

    if (!script.id) {
      errors.push("剧本ID不能为空");
    }

    if (!script.name) {
      errors.push("剧本名称不能为空");
    }

    if (!script.author) {
      errors.push("剧本作者不能为空");
    }

    if (!Array.isArray(script.roles)) {
      errors.push("角色列表必须是数组");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // 导出剧本
  exportScript(scriptId, type = "custom") {
    try {
      const script = this.loadScript(scriptId, type);
      if (!script) {
        throw new Error(`剧本 ${scriptId} 不存在`);
      }

      const exportData = {
        ...script,
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${script.name}_${script.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error("导出剧本失败:", error);
      return { success: false, error: error.message };
    }
  }

  // 导入剧本
  async importScript(file, type = "custom") {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            const scriptData = JSON.parse(e.target.result);
            const validation = this.validateScript(scriptData);

            if (!validation.isValid) {
              reject(
                new Error(`剧本数据验证失败: ${validation.errors.join(", ")}`),
              );
              return;
            }

            const result = await this.saveScript(scriptData, type);
            resolve(result);
          } catch (error) {
            reject(new Error(`解析剧本文件失败: ${error.message}`));
          }
        };

        reader.onerror = () => {
          reject(new Error("读取文件失败"));
        };

        reader.readAsText(file);
      });
    } catch (error) {
      console.error("导入剧本失败:", error);
      return { success: false, error: error.message };
    }
  }

  // 获取剧本统计信息
  async getScriptStats() {
    try {
      const allScripts = await this.getAllScripts();
      const stats = {
        total: 0,
        official: allScripts.official.length,
        custom: allScripts.custom.length,
        templates: allScripts.templates.length,
        byLevel: {
          Beginner: 0,
          Intermediate: 0,
          Veteran: 0,
        },
      };

      const allScriptsList = [
        ...allScripts.official,
        ...allScripts.custom,
        ...allScripts.templates,
      ];

      stats.total = allScriptsList.length;

      allScriptsList.forEach((script) => {
        if (script.level && stats.byLevel[script.level] !== undefined) {
          stats.byLevel[script.level]++;
        }
      });

      return stats;
    } catch (error) {
      console.error("获取剧本统计失败:", error);
      return {
        total: 0,
        official: 0,
        custom: 0,
        templates: 0,
        byLevel: { Beginner: 0, Intermediate: 0, Veteran: 0 },
      };
    }
  }
}

const scriptManager = new ScriptManager();
export default scriptManager;
