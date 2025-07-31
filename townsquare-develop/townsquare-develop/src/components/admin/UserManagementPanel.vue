<template>
  <div class="user-management-panel">
    <div class="panel-header">
      <h3>用户管理</h3>
      <div class="header-actions">
        <button @click="toggleRegistration" class="toggle-btn">
          {{ registrationEnabled ? "禁用注册" : "启用注册" }}
        </button>
        <button @click="refreshUsers" class="refresh-btn">刷新</button>
      </div>
    </div>

    <div class="users-list">
      <div class="list-header">
        <div class="header-item">用户名</div>
        <div class="header-item">角色</div>
        <div class="header-item">注册时间</div>
        <div class="header-item">状态</div>
        <div class="header-item">操作</div>
      </div>

      <div v-for="user in users" :key="user.id" class="user-item">
        <div class="user-info">
          <div class="username">{{ user.username }}</div>
          <div class="role">
            <span :class="user.role">{{ getRoleText(user.role) }}</span>
          </div>
          <div class="created-at">{{ formatDate(user.createdAt) }}</div>
          <div class="status">
            <span class="status-active">活跃</span>
          </div>
          <div class="actions">
            <button
              v-if="user.role !== 'admin'"
              @click="
                changeUserRole(user.id, user.role === 'user' ? 'admin' : 'user')
              "
              class="role-btn"
            >
              {{ user.role === "user" ? "设为管理员" : "取消管理员" }}
            </button>
            <button
              v-if="user.role !== 'admin'"
              @click="deleteUser(user.id)"
              class="delete-btn"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <h4>用户统计</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">总用户数</span>
          <span class="stat-value">{{ users.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">管理员</span>
          <span class="stat-value">{{ adminCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">普通用户</span>
          <span class="stat-value">{{ userCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">注册状态</span>
          <span
            class="stat-value"
            :class="registrationEnabled ? 'enabled' : 'disabled'"
          >
            {{ registrationEnabled ? "已启用" : "已禁用" }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import authAPI from "@/utils/authAPI";

export default {
  name: "UserManagementPanel",
  data() {
    return {
      users: [],
      registrationEnabled: true,
      isLoading: false,
    };
  },
  computed: {
    adminCount() {
      return this.users.filter((user) => user.role === "admin").length;
    },
    userCount() {
      return this.users.filter((user) => user.role === "user").length;
    },
  },
  async mounted() {
    await this.loadUsers();
    await this.loadRegistrationStatus();
  },
  methods: {
    async loadUsers() {
      try {
        this.isLoading = true;
        const result = await authAPI.getAllUsers();

        if (result.success) {
          this.users = result.data;
        } else {
          console.error("加载用户失败:", result.error);
        }
      } catch (error) {
        console.error("加载用户错误:", error);
      } finally {
        this.isLoading = false;
      }
    },

    async loadRegistrationStatus() {
      try {
        this.registrationEnabled = await authAPI.getRegistrationStatus();
      } catch (error) {
        console.error("获取注册状态失败:", error);
      }
    },

    async toggleRegistration() {
      try {
        const result = await authAPI.toggleRegistration();
        if (result.success) {
          this.registrationEnabled = result.enabled;
          alert(`注册功能已${this.registrationEnabled ? "启用" : "禁用"}`);
        } else {
          alert("操作失败: " + result.error);
        }
      } catch (error) {
        console.error("切换注册状态失败:", error);
        alert("操作失败，请重试");
      }
    },

    async changeUserRole(userId, newRole) {
      try {
        const result = await authAPI.changeUserRole(userId, newRole);
        if (result.success) {
          await this.loadUsers();
          alert("用户角色更新成功");
        } else {
          alert("更新失败: " + result.error);
        }
      } catch (error) {
        console.error("更新用户角色失败:", error);
        alert("更新失败，请重试");
      }
    },

    async deleteUser(userId) {
      if (!confirm("确定要删除这个用户吗？此操作不可撤销。")) {
        return;
      }

      try {
        const result = await authAPI.deleteUser(userId);
        if (result.success) {
          await this.loadUsers();
          alert("用户删除成功");
        } else {
          alert("删除失败: " + result.error);
        }
      } catch (error) {
        console.error("删除用户失败:", error);
        alert("删除失败，请重试");
      }
    },

    async refreshUsers() {
      await this.loadUsers();
    },

    formatDate(dateString) {
      if (!dateString) return "未知";
      return new Date(dateString).toLocaleDateString("zh-CN");
    },

    getRoleText(role) {
      const roleMap = {
        admin: "管理员",
        user: "普通用户",
      };
      return roleMap[role] || "未知";
    },
  },
};
</script>

<style scoped lang="scss">
.user-management-panel {
  padding: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    color: #fff;
    font-size: 18px;
  }

  .header-actions {
    display: flex;
    gap: 10px;

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;

      &.toggle-btn {
        background: #f39c12;
        color: #fff;

        &:hover {
          background: #e67e22;
        }
      }

      &.refresh-btn {
        background: #4a90e2;
        color: #fff;

        &:hover {
          background: #357abd;
        }
      }
    }
  }
}

.users-list {
  background: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;

  .list-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 2fr;
    gap: 15px;
    padding: 15px 20px;
    background: #333;
    font-weight: bold;
    color: #fff;
    font-size: 14px;
  }

  .user-item {
    border-bottom: 1px solid #444;

    &:last-child {
      border-bottom: none;
    }

    .user-info {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 2fr;
      gap: 15px;
      padding: 15px 20px;
      align-items: center;

      .username {
        color: #fff;
        font-weight: bold;
      }

      .role {
        .admin {
          background: #e74c3c;
          color: #fff;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
        }

        .user {
          background: #4a90e2;
          color: #fff;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
        }
      }

      .created-at {
        color: #ccc;
        font-size: 12px;
      }

      .status {
        .status-active {
          background: #27ae60;
          color: #fff;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
        }
      }

      .actions {
        display: flex;
        gap: 8px;

        button {
          padding: 4px 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;

          &.role-btn {
            background: #f39c12;
            color: #fff;

            &:hover {
              background: #e67e22;
            }
          }

          &.delete-btn {
            background: #e74c3c;
            color: #fff;

            &:hover {
              background: #c0392b;
            }
          }
        }
      }
    }
  }
}

.stats-section {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;

  h4 {
    margin: 0 0 15px 0;
    color: #fff;
    font-size: 16px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 15px;
      background: #333;
      border-radius: 6px;

      .stat-label {
        color: #ccc;
        font-size: 12px;
        margin-bottom: 5px;
      }

      .stat-value {
        color: #fff;
        font-size: 18px;
        font-weight: bold;

        &.enabled {
          color: #27ae60;
        }

        &.disabled {
          color: #e74c3c;
        }
      }
    }
  }
}
</style>
