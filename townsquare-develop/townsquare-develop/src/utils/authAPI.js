const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com/api' 
  : 'http://localhost:8081/api';

class AuthAPI {
  constructor() {
    this._isLoggedIn = false;
    this._currentUser = null;
    this._listeners = [];
  }

  addListener(callback) {
    this._listeners.push(callback);
  }

  removeListener(callback) {
    const index = this._listeners.indexOf(callback);
    if (index > -1) {
      this._listeners.splice(index, 1);
    }
  }

  notifyListeners() {
    this._listeners.forEach(callback => callback());
  }

  getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('auth_token', data.token);
        this._isLoggedIn = true;
        this._currentUser = data.user;
        this.notifyListeners();
      }
      
      return data;
    } catch (error) {
      console.error('登录失败:', error);
      return { success: false, error: '网络错误，请重试' };
    }
  }

  async register(username, password) {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('auth_token', data.token);
        this._isLoggedIn = true;
        this._currentUser = data.user;
        this.notifyListeners();
      }
      
      return data;
    } catch (error) {
      console.error('注册失败:', error);
      return { success: false, error: '网络错误，请重试' };
    }
  }

  async logout() {
    try {
      const response = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      localStorage.removeItem('auth_token');
      this._isLoggedIn = false;
      this._currentUser = null;
      this.notifyListeners();
      
      return data;
    } catch (error) {
      console.error('登出失败:', error);
      // 即使网络请求失败，也要清除本地状态
      localStorage.removeItem('auth_token');
      this._isLoggedIn = false;
      this._currentUser = null;
      this.notifyListeners();
      return { success: true };
    }
  }

  async getProfile() {
    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (data.success) {
        this._currentUser = data.user;
        this._isLoggedIn = true;
      } else {
        this._isLoggedIn = false;
        this._currentUser = null;
        localStorage.removeItem('auth_token');
      }
      
      return data;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      this._isLoggedIn = false;
      this._currentUser = null;
      localStorage.removeItem('auth_token');
      return { success: false, error: '网络错误，请重试' };
    }
  }

  isLoggedIn() {
    return this._isLoggedIn;
  }

  getCurrentUser() {
    return this._currentUser;
  }

  isAdmin() {
    return this._currentUser && this._currentUser.role === 'admin';
  }

  hasPermission(permission) {
    if (!this._currentUser) return false;
    
    // 管理员拥有所有权限
    if (this._currentUser.role === 'admin') return true;
    
    // 检查用户自定义权限
    if (this._currentUser.permissions && this._currentUser.permissions.includes(permission)) {
      return true;
    }
    
    return false;
  }

  async refreshToken() {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('auth_token', data.token);
      }
      
      return data;
    } catch (error) {
      console.error('刷新Token失败:', error);
      return { success: false, error: '网络错误，请重试' };
    }
  }

  async getRegistrationStatus() {
    try {
      const response = await fetch(`${API_BASE}/system/registration`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      return data.success ? data.enabled : true;
    } catch (error) {
      console.error("获取注册状态失败:", error);
      return true; // 默认允许注册
    }
  }

  async getAllUsers() {
    try {
      const response = await fetch(`${API_BASE}/auth/users`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("获取用户列表失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }

  async updateUserPermissions(userId, permissions) {
    try {
      const response = await fetch(`${API_BASE}/auth/users/${userId}/permissions`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ permissions })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("更新用户权限失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }

  async toggleRegistration() {
    try {
      const response = await fetch(`${API_BASE}/system/registration`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ enabled: true }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("切换注册状态失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }

  async changeUserRole(userId, newRole) {
    try {
      const response = await fetch(`${API_BASE}/auth/users/${userId}/role`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("更改用户角色失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }

  async deleteUser(userId) {
    try {
      const response = await fetch(`${API_BASE}/auth/users/${userId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("删除用户失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }
}

export default new AuthAPI(); 