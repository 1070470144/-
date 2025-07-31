/**
 * 剧本API调用工具
 * 用于与后端剧本管理API交互
 */

// API基础URL
const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://localhost:8080/api"
    : "http://localhost:8081/api";

class ScriptAPI {
  /**
   * 获取所有剧本（支持分页和筛选）
   */
  async getAllScripts(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category = "all",
        search = "",
        sortBy = "name",
        status = "approved",
        userId = "",
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        category,
        search,
        sortBy,
        status,
        userId,
      });

      const response = await fetch(`${API_BASE}/scripts?${queryParams}`);

      // 检查响应类型
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        await response.text(); // 读取响应内容但不使用
        throw new Error(`服务器错误 (${response.status}): 返回了非JSON响应`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "获取剧本失败");
      }

      return result.data;
    } catch (error) {
      console.error("❌ 获取剧本失败:", error);
      throw error;
    }
  }

  /**
   * 获取单个剧本
   */
  async getScript(scriptId, type = "custom") {
    try {
      const response = await fetch(
        `${API_BASE}/scripts/${scriptId}?type=${type}`,
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "获取剧本失败");
      }

      return result.data;
    } catch (error) {
      console.error("获取剧本失败:", error);
      throw error;
    }
  }

  /**
   * 保存剧本
   */
  async saveScript(scriptData, type = "custom") {
    try {
      const response = await fetch(`${API_BASE}/scripts?type=${type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scriptData),
      });

      console.log("📊 响应状态:", response.status);

      const result = await response.json();
      console.log("📄 服务器响应:", result);

      if (!result.success) {
        console.error("❌ 保存剧本失败:", result.error);
        throw new Error(result.error || "保存剧本失败");
      }

      console.log("✅ 剧本保存成功");
      return result.data;
    } catch (error) {
      console.error("❌ 保存剧本请求异常:", error);
      console.error("🔍 错误详情:", {
        message: error.message,
        stack: error.stack,
        API_BASE: API_BASE,
      });
      throw error;
    }
  }

  /**
   * 更新剧本
   */
  async updateScript(scriptId, scriptData, type = "custom") {
    try {
      const response = await fetch(
        `${API_BASE}/scripts/${scriptId}?type=${type}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(scriptData),
        },
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "更新剧本失败");
      }

      return result.data;
    } catch (error) {
      console.error("更新剧本失败:", error);
      throw error;
    }
  }

  /**
   * 删除剧本
   */
  async deleteScript(scriptId, type = "custom") {
    try {
      const response = await fetch(
        `${API_BASE}/scripts/${scriptId}?type=${type}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "删除剧本失败");
      }

      return result.data;
    } catch (error) {
      console.error("删除剧本失败:", error);
      throw error;
    }
  }

  /**
   * 批量导入剧本
   */
  async importScripts(scripts, type = "custom") {
    try {
      const response = await fetch(`${API_BASE}/scripts/import?type=${type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scripts, type }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "批量导入失败");
      }

      return result.data;
    } catch (error) {
      console.error("批量导入失败:", error);
      throw error;
    }
  }

  /**
   * 导出所有剧本
   */
  async exportAllScripts() {
    try {
      const response = await fetch(`${API_BASE}/scripts/export/all`);

      if (!response.ok) {
        throw new Error("导出失败");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scripts_export_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    } catch (error) {
      console.error("导出失败:", error);
      throw error;
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats() {
    try {
      const response = await fetch(`${API_BASE}/scripts/stats/info`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "获取统计信息失败");
      }

      return result.data;
    } catch (error) {
      console.error("获取统计信息失败:", error);
      throw error;
    }
  }

  /**
   * 点赞剧本
   */
  async toggleLike(scriptId) {
    try {
      const response = await fetch(`${API_BASE}/scripts/${scriptId}/like`, {
        method: "POST",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("点赞失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }

  /**
   * 使用剧本
   */
  async useScript(scriptId) {
    try {
      const response = await fetch(`${API_BASE}/scripts/${scriptId}/use`, {
        method: "POST",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("使用剧本失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }

  /**
   * 更新剧本状态（审核功能）
   */
  async updateScriptStatus(scriptId, status) {
    try {
      const response = await fetch(`${API_BASE}/scripts/${scriptId}/status`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("更新剧本状态失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }

  /**
   * 获取待审核剧本
   */
        async getPendingScripts() {
        try {
          const response = await fetch(`${API_BASE}/scripts/pending`, {
            method: "GET",
            headers: this.getAuthHeaders(),
          });

          const data = await response.json();
          return data;
        } catch (error) {
          console.error("获取待审核剧本失败:", error);
          return { success: false, error: "网络错误，请重试" };
        }
      }

  /**
   * 获取剧本系列
   */
  async getScriptSeries() {
    try {
      const response = await fetch(`${API_BASE}/scripts/series`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("获取剧本系列失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }

  /**
   * 创建剧本系列
   */
  async createScriptSeries(seriesData) {
    try {
      const response = await fetch(`${API_BASE}/scripts/series`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(seriesData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("创建剧本系列失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }

  /**
   * 添加剧本版本
   */
  async addScriptVersion(formData) {
    try {
      const response = await fetch(`${API_BASE}/scripts/series/version`, {
        method: "POST",
        headers: {
          Authorization: this.getAuthHeaders().Authorization,
        },
        body: formData,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("添加剧本版本失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }

  /**
   * 设置最新版本
   */
  async setLatestVersion(versionId) {
    try {
      const response = await fetch(
        `${API_BASE}/scripts/series/version/${versionId}/latest`,
        {
          method: "PUT",
          headers: this.getAuthHeaders(),
        },
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("设置最新版本失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }

  /**
   * 删除剧本版本
   */
  async deleteScriptVersion(versionId) {
    try {
      const response = await fetch(
        `${API_BASE}/scripts/series/version/${versionId}`,
        {
          method: "DELETE",
          headers: this.getAuthHeaders(),
        },
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("删除剧本版本失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }

  /**
   * 删除剧本系列
   */
  async deleteScriptSeries(seriesId) {
    try {
      const response = await fetch(`${API_BASE}/scripts/series/${seriesId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("删除剧本系列失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }

  /**
   * 获取剧本使用统计
   */
  async getScriptUsage(scriptId) {
    try {
      const response = await fetch(`${API_BASE}/scripts/${scriptId}/usage`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("获取使用统计失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }

  /**
   * 获取剧本点赞统计
   */
  async getScriptLikes(scriptId) {
    try {
      const response = await fetch(`${API_BASE}/scripts/${scriptId}/likes`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("获取点赞统计失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }

  /**
   * 获取认证头
   */
  getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  /**
   * 测试API连接
   */
  async testConnection() {
    try {
      const response = await fetch(`${API_BASE}/scripts/stats/info`);
      return response.ok;
    } catch (error) {
      console.error("API连接测试失败:", error);
      return false;
    }
  }
}

const scriptAPI = new ScriptAPI();
export default scriptAPI;
