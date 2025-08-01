/**
 * 剧本API调用工具
 * 用于与后端剧本管理API交互
 */

// API基础URL
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com/api' 
  : 'http://localhost:8081/api';

class ScriptAPI {
  /**
   * 获取所有剧本（支持分页和筛选）
   */
  async getAllScripts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.category) queryParams.append('category', params.category);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.status) queryParams.append('status', params.status);
      
      const response = await fetch(`${API_BASE}/scripts?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('获取剧本列表失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取单个剧本
   */
  async getScript(scriptId, type = "custom") {
    try {
      const response = await fetch(`${API_BASE}/scripts/${scriptId}?type=${type}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('获取剧本失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 保存剧本
   */
  async saveScript(scriptData, type = "custom") {
    try {
      const response = await fetch(`${API_BASE}/scripts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({ ...scriptData, type })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('保存剧本失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 更新剧本
   */
  async updateScript(scriptId, scriptData, type = "custom") {
    try {
      const response = await fetch(`${API_BASE}/scripts/${scriptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({ ...scriptData, type })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('更新剧本失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除剧本
   */
  async deleteScript(scriptId, type = "custom") {
    try {
      const response = await fetch(`${API_BASE}/scripts/${scriptId}?type=${type}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('删除剧本失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 导入剧本
   */
  async importScripts(scripts, type = "custom") {
    try {
      const response = await fetch(`${API_BASE}/scripts/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({ scripts, type })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('导入剧本失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 导出所有剧本
   */
  async exportAllScripts() {
    try {
      const response = await fetch(`${API_BASE}/scripts/export`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('导出剧本失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取存储统计
   */
  async getStorageStats() {
    try {
      const response = await fetch(`${API_BASE}/scripts/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('获取存储统计失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 点赞/取消点赞剧本
   */
  async toggleLike(scriptId) {
    try {
      const response = await fetch(`${API_BASE}/scripts/${scriptId}/like`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('点赞失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 使用剧本
   */
  async useScript(scriptId) {
    try {
      const response = await fetch(`${API_BASE}/scripts/${scriptId}/use`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('使用剧本失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 更新剧本状态
   */
  async updateScriptStatus(scriptId, status, reviewedBy, reviewNote = '') {
    try {
      console.log('前端状态更新请求:', { scriptId, status, reviewedBy, reviewNote });
      
      const response = await fetch(`${API_BASE}/scripts/status/${scriptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({ status, reviewedBy, reviewNote })
      });

      const result = await response.json();
      console.log('前端状态更新响应:', result);
      return result;
    } catch (error) {
      console.error('更新剧本状态失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取剧本状态
   */
  async getScriptStatus(scriptId) {
    try {
      const response = await fetch(`${API_BASE}/scripts/${scriptId}/status`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('获取剧本状态失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取所有状态
   */
  async getAllStatus() {
    try {
      const response = await fetch(`${API_BASE}/scripts/status/all`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      console.log('getAllStatus API响应:', result);
      console.log('getAllStatus data内容:', result.data);
      console.log('getAllStatus data类型:', typeof result.data);
      console.log('getAllStatus data键:', Object.keys(result.data || {}));
      return result;
    } catch (error) {
      console.error('获取所有状态失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取待审核剧本
   */
  async getPendingScripts() {
    try {
      const response = await fetch(`${API_BASE}/scripts/pending`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('获取待审核剧本失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取剧本系列
   */
  async getScriptSeries() {
    try {
      const response = await fetch(`${API_BASE}/scripts/series`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('获取剧本系列失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 创建剧本系列
   */
  async createScriptSeries(seriesData) {
    try {
      const response = await fetch(`${API_BASE}/scripts/series`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify(seriesData)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('创建剧本系列失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 更新剧本系列
   */
  async updateScriptSeries(seriesData) {
    try {
      const response = await fetch(`${API_BASE}/scripts/series/${seriesData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify(seriesData)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('更新剧本系列失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 添加剧本版本
   */
  async addScriptVersion(formData) {
    try {
      const response = await fetch(`${API_BASE}/scripts/series/version`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders()
        },
        body: formData
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('添加剧本版本失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 设置最新版本
   */
  async setLatestVersion(versionId) {
    try {
      const response = await fetch(`${API_BASE}/scripts/series/version/${versionId}/latest`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('设置最新版本失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除剧本版本
   */
  async deleteScriptVersion(versionId) {
    try {
      const response = await fetch(`${API_BASE}/scripts/series/version/${versionId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('删除剧本版本失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除剧本系列
   */
  async deleteScriptSeries(seriesId) {
    try {
      const response = await fetch(`${API_BASE}/scripts/series/${seriesId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('删除剧本系列失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取剧本使用统计
   */
  async getScriptUsage(scriptId) {
    try {
      const response = await fetch(`${API_BASE}/scripts/${scriptId}/usage`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('获取剧本使用统计失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取剧本点赞统计
   */
  async getScriptLikes(scriptId) {
    try {
      const response = await fetch(`${API_BASE}/scripts/${scriptId}/likes`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('获取剧本点赞统计失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取认证头
   */
  getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * 测试连接
   */
  async testConnection() {
    try {
      const response = await fetch(`${API_BASE}/scripts/test`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API连接测试失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取剧本图片
   */
  async getScriptImages(scriptId) {
    try {
      const response = await fetch(`${API_BASE}/scripts/${scriptId}/images`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('获取剧本图片失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 根据ID获取剧本详情
   */
  async getScriptById(scriptId, type = 'custom') {
    try {
      const response = await fetch(`${API_BASE}/scripts/${scriptId}?type=${type}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '获取剧本详情失败');
      }

      return result;
    } catch (error) {
      console.error('获取剧本详情失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 下载图片
   */
  async downloadImage(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = imageUrl.split('/').pop() || 'image.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error) {
      console.error('下载图片失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 上传剧本图片
   */
  async uploadScriptImages(scriptId, files, scriptName) {
    try {
      const formData = new FormData();
      
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }
      
      if (scriptName) {
        formData.append('scriptName', scriptName);
      }

      const response = await fetch(`${API_BASE}/scripts/${scriptId}/images`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders()
        },
        body: formData
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('上传剧本图片失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除剧本图片
   */
  async deleteScriptImage(scriptId, imageId) {
    try {
      const response = await fetch(`${API_BASE}/scripts/${scriptId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          ...this.getAuthHeaders()
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('删除剧本图片失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 替换剧本图片
   */
  async replaceScriptImage(scriptId, imageId, file) {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE}/scripts/${scriptId}/images/${imageId}`, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders()
        },
        body: formData
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('替换剧本图片失败:', error);
      return { success: false, error: error.message };
    }
  }
}

const scriptAPI = new ScriptAPI();
export default scriptAPI;
