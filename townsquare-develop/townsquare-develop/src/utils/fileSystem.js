/**
 * 文件系统操作工具
 * 适用于浏览器环境的文件操作
 */

class FileSystem {
  constructor() {
    this.baseDir = "src/data/scripts";
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
        scripts: this.baseDir,
        custom: this.getDirectoryByType("custom"),
        official: this.getDirectoryByType("official"),
        templates: this.getDirectoryByType("templates"),
      });
    } catch (error) {
      console.error("创建目录失败:", error);
    }
  }

  /**
   * 根据类型获取目录
   */
  getDirectoryByType(type) {
    switch (type) {
      case "custom":
        return `${this.baseDir}/custom`;
      case "official":
        return `${this.baseDir}/official`;
      case "templates":
        return `${this.baseDir}/templates`;
      default:
        return `${this.baseDir}/custom`;
    }
  }

  /**
   * 写入JSON文件（浏览器环境模拟）
   */
  writeJsonFile(filePath, data) {
    try {
      // 在浏览器环境中，我们使用localStorage存储文件内容
      const fileKey = this.getFileKeyFromPath(filePath);
      localStorage.setItem(fileKey, JSON.stringify(data, null, 2));

      console.log(`文件已写入: ${filePath} (缓存键: ${fileKey})`);
      return { success: true };
    } catch (error) {
      console.error(`写入文件失败: ${filePath}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 读取JSON文件（浏览器环境模拟）
   */
  readJsonFile(filePath) {
    try {
      const fileKey = this.getFileKeyFromPath(filePath);
      const content = localStorage.getItem(fileKey);

      if (!content) {
        return { success: false, error: "文件不存在" };
      }

      const data = JSON.parse(content);
      return { success: true, data };
    } catch (error) {
      console.error(`读取文件失败: ${filePath}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除文件（浏览器环境模拟）
   */
  deleteFile(filePath) {
    try {
      const fileKey = this.getFileKeyFromPath(filePath);
      const exists = localStorage.getItem(fileKey);

      if (exists) {
        localStorage.removeItem(fileKey);
        console.log(`文件已删除: ${filePath}`);
        return { success: true };
      } else {
        return { success: false, error: "文件不存在" };
      }
    } catch (error) {
      console.error(`删除文件失败: ${filePath}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 从文件路径生成localStorage键
   */
  getFileKeyFromPath(filePath) {
    // 将文件路径转换为localStorage键
    return `script_file_${filePath.replace(/[/\\]/g, "_")}`;
  }

  /**
   * 列出目录中的所有JSON文件（浏览器环境模拟）
   */
  listJsonFiles(dirPath) {
    try {
      const files = [];
      const keys = Object.keys(localStorage);
      const dirKey = dirPath.replace(/[/\\]/g, "_");

      // 查找该目录下的所有文件
      keys.forEach((key) => {
        if (key.startsWith(`script_file_${dirKey}`)) {
          const fileName = key.replace(`script_file_${dirKey}_`, "");
          files.push({
            name: fileName,
            path: `${dirPath}/${fileName}`,
            size: localStorage.getItem(key)?.length || 0,
          });
        }
      });

      return { success: true, files };
    } catch (error) {
      console.error(`列出文件失败: ${dirPath}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取文件信息（浏览器环境模拟）
   */
  getFileInfo(filePath) {
    try {
      const fileKey = this.getFileKeyFromPath(filePath);
      const content = localStorage.getItem(fileKey);

      if (!content) {
        return { success: false, error: "文件不存在" };
      }

      return {
        success: true,
        info: {
          name: this.getFileNameFromPath(filePath),
          path: filePath,
          size: content.length,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error(`获取文件信息失败: ${filePath}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 从路径获取文件名
   */
  getFileNameFromPath(filePath) {
    return filePath.split("/").pop() || filePath.split("\\").pop() || filePath;
  }

  /**
   * 复制文件（浏览器环境模拟）
   */
  copyFile(sourcePath, targetPath) {
    try {
      const sourceKey = this.getFileKeyFromPath(sourcePath);
      const targetKey = this.getFileKeyFromPath(targetPath);
      const content = localStorage.getItem(sourceKey);

      if (!content) {
        return { success: false, error: "源文件不存在" };
      }

      localStorage.setItem(targetKey, content);
      console.log(`文件已复制: ${sourcePath} -> ${targetPath}`);
      return { success: true };
    } catch (error) {
      console.error(`复制文件失败: ${sourcePath} -> ${targetPath}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 移动文件（浏览器环境模拟）
   */
  moveFile(sourcePath, targetPath) {
    try {
      const copyResult = this.copyFile(sourcePath, targetPath);
      if (copyResult.success) {
        const deleteResult = this.deleteFile(sourcePath);
        if (deleteResult.success) {
          console.log(`文件已移动: ${sourcePath} -> ${targetPath}`);
          return { success: true };
        }
      }
      return copyResult;
    } catch (error) {
      console.error(`移动文件失败: ${sourcePath} -> ${targetPath}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 检查文件是否存在（浏览器环境模拟）
   */
  fileExists(filePath) {
    const fileKey = this.getFileKeyFromPath(filePath);
    return localStorage.getItem(fileKey) !== null;
  }

  /**
   * 获取目录大小（浏览器环境模拟）
   */
  getDirectorySize(dirPath) {
    try {
      const files = this.listJsonFiles(dirPath);
      if (!files.success) {
        return 0;
      }

      let totalSize = 0;
      files.files.forEach((file) => {
        totalSize += file.size;
      });

      return totalSize;
    } catch (error) {
      console.error(`获取目录大小失败: ${dirPath}`, error);
      return 0;
    }
  }

  /**
   * 创建备份（浏览器环境模拟）
   */
  createBackup(sourceDir, backupDir) {
    try {
      const files = this.listJsonFiles(sourceDir);
      if (!files.success) {
        return { success: false, error: "源目录不存在" };
      }

      let copiedCount = 0;
      files.files.forEach((file) => {
        const backupPath = `${backupDir}/${file.name}`;
        const copyResult = this.copyFile(file.path, backupPath);
        if (copyResult.success) {
          copiedCount++;
        }
      });

      console.log(`备份完成: ${copiedCount} 个文件已复制到 ${backupDir}`);
      return { success: true, copiedCount };
    } catch (error) {
      console.error(`创建备份失败: ${sourceDir} -> ${backupDir}`, error);
      return { success: false, error: error.message };
    }
  }
}

const fileSystem = new FileSystem();
export default fileSystem;
