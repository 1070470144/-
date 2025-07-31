/**
 * 批量导入脚本
 * 处理现有的JSON文件并导入到系统中
 */

import scriptImporter from "./scriptImporter";

// 文件夹分类映射
const FOLDER_CATEGORY_MAP = {
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

class BatchImportScripts {
  constructor() {
    this.importResults = [];
  }

  /**
   * 模拟文件读取（在实际环境中需要Node.js fs模块）
   */
  async readDirectoryFiles(directoryPath) {
    // 这里需要根据实际的文件系统API来实现
    // 暂时返回空数组，实际使用时需要实现文件读取
    console.log(`读取目录: ${directoryPath}`);
    return [];
  }

  /**
   * 批量导入指定文件夹的剧本
   */
  async importFolderScripts(folderName) {
    const category = FOLDER_CATEGORY_MAP[folderName] || "mixed";
    const folderPath = `src/data/scripts/custom/json/${folderName}`;

    console.log(`开始导入文件夹: ${folderName} -> 分类: ${category}`);

    try {
      // 读取文件夹中的所有JSON文件
      const files = await this.readDirectoryFiles(folderPath);

      const results = [];
      for (const file of files) {
        if (file.endsWith(".json")) {
          try {
            const result = await scriptImporter.importScriptFile(
              file,
              category,
            );
            results.push({
              fileName: file,
              success: result.success,
              error: result.error || "",
              script: result.script,
            });
          } catch (error) {
            results.push({
              fileName: file,
              success: false,
              error: error.message,
            });
          }
        }
      }

      this.importResults.push({
        folder: folderName,
        category: category,
        results: results,
      });

      console.log(
        `文件夹 ${folderName} 导入完成: ${
          results.filter((r) => r.success).length
        }/${results.length} 成功`,
      );

      return results;
    } catch (error) {
      console.error(`导入文件夹 ${folderName} 失败:`, error);
      return [];
    }
  }

  /**
   * 导入所有文件夹的剧本
   */
  async importAllScripts() {
    console.log("开始批量导入所有剧本...");

    const folders = Object.keys(FOLDER_CATEGORY_MAP);
    const allResults = [];

    for (const folder of folders) {
      const results = await this.importFolderScripts(folder);
      allResults.push(...results);
    }

    console.log(
      `批量导入完成: ${allResults.filter((r) => r.success).length}/${
        allResults.length
      } 成功`,
    );

    return {
      total: allResults.length,
      success: allResults.filter((r) => r.success).length,
      failed: allResults.filter((r) => !r.success).length,
      results: allResults,
    };
  }

  /**
   * 获取导入统计
   */
  getImportStats() {
    const stats = {
      total: 0,
      success: 0,
      failed: 0,
      byCategory: {},
    };

    this.importResults.forEach((folderResult) => {
      folderResult.results.forEach((result) => {
        stats.total++;
        if (result.success) {
          stats.success++;
        } else {
          stats.failed++;
        }

        // 按分类统计
        const category = folderResult.category;
        if (!stats.byCategory[category]) {
          stats.byCategory[category] = { total: 0, success: 0, failed: 0 };
        }
        stats.byCategory[category].total++;
        if (result.success) {
          stats.byCategory[category].success++;
        } else {
          stats.byCategory[category].failed++;
        }
      });
    });

    return stats;
  }

  /**
   * 清除导入结果
   */
  clearResults() {
    this.importResults = [];
  }

  /**
   * 获取导入结果
   */
  getResults() {
    return this.importResults;
  }
}

// 创建单例实例
const batchImportScripts = new BatchImportScripts();

export default batchImportScripts;
