/**
 * 用户认证API
 * 处理登录、注册、权限验证等功能
 */

// API基础URL
const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://localhost:8080/api"
    : "http://localhost:8081/api";

class AuthAPI {
  constructor() {
    this.token = localStorage.getItem("auth_token");
    this.user = JSON.parse(localStorage.getItem("auth_user") || "null");
    this.listeners = []; // 添加监听器数组

    // 添加响应式状态标记
    this._isLoggedIn = !!this.token && !!this.user;
  }

  // 添加事件监听机制
  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 通知所有监听器
  notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback(this.user, this.token);
      } catch (error) {
        console.error("监听器执行错误:", error);
      }
    });
  }

  /**
   * 设置认证头
   */
  getAuthHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * 用户登录
   */
  async login(username, password) {
    try {
      console.log("🔍 开始登录请求...");
      console.log("📡 API地址:", `${API_BASE}/auth/login`);

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      console.log("📊 响应状态:", response.status);
      console.log("📊 响应头:", Object.fromEntries(response.headers.entries()));

      // 检查响应类型
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("❌ 服务器返回非JSON响应:", text.substring(0, 200));
        return {
          success: false,
          error: `服务器错误 (${response.status}): 返回了非JSON响应`,
        };
      }

      const data = await response.json();
      console.log("📄 响应数据:", data);

      if (data.success) {
        this.token = data.token;
        this.user = data.user;
        this._isLoggedIn = true; // 更新登录状态
        localStorage.setItem("auth_token", this.token);
        localStorage.setItem("auth_user", JSON.stringify(this.user));
        console.log("✅ 登录成功");
        this.notifyListeners(); // 通知监听器
        return { success: true, user: this.user };
      } else {
        console.log("❌ 登录失败:", data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("❌ 登录请求异常:", error);
      console.error("🔍 错误详情:", {
        message: error.message,
        stack: error.stack,
        API_BASE: API_BASE,
      });
      return { success: false, error: `网络错误: ${error.message}` };
    }
  }

  /**
   * 用户注册
   */
  async register(username, password) {
    try {
      console.log("🔍 开始注册请求...");
      console.log("📡 API地址:", `${API_BASE}/auth/register`);

      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      console.log("📊 响应状态:", response.status);
      console.log("📊 响应头:", Object.fromEntries(response.headers.entries()));

      // 检查响应类型
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("❌ 服务器返回非JSON响应:", text.substring(0, 200));
        return {
          success: false,
          error: `服务器错误 (${response.status}): 返回了非JSON响应`,
        };
      }

      const data = await response.json();
      console.log("📄 响应数据:", data);

      if (data.success) {
        this.token = data.token;
        this.user = data.user;
        this._isLoggedIn = true; // 更新登录状态
        localStorage.setItem("auth_token", this.token);
        localStorage.setItem("auth_user", JSON.stringify(this.user));
        console.log("✅ 注册成功");
        this.notifyListeners(); // 通知监听器
        return { success: true, user: this.user };
      } else {
        console.log("❌ 注册失败:", data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("❌ 注册请求异常:", error);
      console.error("🔍 错误详情:", {
        message: error.message,
        stack: error.stack,
        API_BASE: API_BASE,
      });
      return { success: false, error: `网络错误: ${error.message}` };
    }
  }

  /**
   * 用户登出
   */
  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error("登出请求失败:", error);
    } finally {
      this.token = null;
      this.user = null;
      this._isLoggedIn = false; // 更新登录状态
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      this.notifyListeners(); // 通知监听器
    }
  }

  /**
   * 获取当前用户信息
   */
  async getProfile() {
    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        this.user = data.user;
        localStorage.setItem("auth_user", JSON.stringify(this.user));
        return { success: true, user: this.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("获取用户信息失败:", error);
      return { success: false, error: "网络错误，请重试" };
    }
  }

  /**
   * 检查是否已登录
   */
  isLoggedIn() {
    return this._isLoggedIn;
  }

  /**
   * 获取当前用户
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * 检查是否为管理员
   */
  isAdmin() {
    return this.user && this.user.role === "admin";
  }

  /**
   * 检查是否有权限
   */
  hasPermission(permission) {
    if (!this.user) return false;

    // 管理员拥有所有权限
    if (this.user.role === "admin") return true;

    // 检查用户特定权限
    return this.user.permissions && this.user.permissions.includes(permission);
  }

  /**
   * 刷新Token
   */
  async refreshToken() {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        this.token = data.token;
        localStorage.setItem("auth_token", this.token);
        return { success: true };
      } else {
        // Token刷新失败，清除用户信息
        this.logout();
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Token刷新失败:", error);
      this.logout();
      return { success: false, error: "网络错误，请重试" };
    }
  }

  /**
   * 检查注册开关状态
   */
  async getRegistrationStatus() {
    try {
      const response = await fetch(`${API_BASE}/system/registration`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      return data.enabled || false;
    } catch (error) {
      console.error("获取注册状态失败:", error);
      return true; // 默认允许注册
    }
  }

  /**
   * 获取所有用户（管理员功能）
   */
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

  /**
   * 切换注册开关（管理员功能）
   */
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

  /**
   * 更改用户角色（管理员功能）
   */
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

  /**
   * 删除用户（管理员功能）
   */
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
