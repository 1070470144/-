// 系统API工具
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com/api' 
  : 'http://localhost:8081/api';

class SystemAPI {
  constructor() {
    this.baseURL = API_BASE;
  }

  // 获取认证头
  getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  // 获取所有分类
  async getCategories() {
    try {
      const response = await fetch(`${this.baseURL}/system/categories`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      // 检查响应类型
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error('❌ 非JSON响应:', text);
        throw new Error(`服务器错误 (${response.status}): 返回了非JSON响应`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '获取分类失败');
      }

      return result.data;
    } catch (error) {
      console.error('❌ 获取分类失败:', error);
      throw error;
    }
  }

  // 添加新分类
  async addCategory(categoryData) {
    try {
      const response = await fetch(`${this.baseURL}/system/categories`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(categoryData)
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '添加分类失败');
      }

      return result.data;
    } catch (error) {
      console.error('添加分类失败:', error);
      throw error;
    }
  }

  // 更新分类
  async updateCategory(categoryId, updateData) {
    try {
      const response = await fetch(`${this.baseURL}/system/categories/${categoryId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '更新分类失败');
      }

      return result.data;
    } catch (error) {
      console.error('更新分类失败:', error);
      throw error;
    }
  }

  // 删除分类
  async deleteCategory(categoryId) {
    try {
      const response = await fetch(`${this.baseURL}/system/categories/${categoryId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '删除分类失败');
      }

      return result;
    } catch (error) {
      console.error('删除分类失败:', error);
      throw error;
    }
  }

  // 获取系统设置
  async getSettings() {
    try {
      const response = await fetch(`${this.baseURL}/system/settings`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '获取系统设置失败');
      }

      return result.data;
    } catch (error) {
      console.error('获取系统设置失败:', error);
      throw error;
    }
  }

  // 更新系统设置
  async updateSettings(settings) {
    try {
      const response = await fetch(`${this.baseURL}/system/settings`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(settings)
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '更新系统设置失败');
      }

      return result;
    } catch (error) {
      console.error('更新系统设置失败:', error);
      throw error;
    }
  }

  // 获取系统统计
  async getStats() {
    try {
      const response = await fetch(`${this.baseURL}/system/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '获取系统统计失败');
      }

      return result.data;
    } catch (error) {
      console.error('获取系统统计失败:', error);
      throw error;
    }
  }
}

export default new SystemAPI(); 