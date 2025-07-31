<template>
  <div class="permission-panel">
    <!-- 角色权限配置 -->
    <div class="role-permissions">
      <h3>角色权限配置</h3>
      <div class="role-list">
        <div class="role-item" v-for="(role, roleKey) in roles" :key="roleKey">
          <h4>{{ role.name }}</h4>
          <div class="permissions-grid">
            <div class="permission-group" v-for="(permissions, groupName) in permissionGroups" :key="groupName">
              <span class="group-title">{{ groupName }}</span>
              <div class="permission-badges">
                <span 
                  v-for="permission in permissions" 
                  :key="permission"
                  class="permission-badge"
                  :class="getPermissionClass(permission)"
                  :title="permissionDescriptions[permission]"
                >
                  {{ getPermissionShortName(permission) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户权限分配 -->
    <div class="user-permissions">
      <h3>用户权限分配</h3>
      <div class="user-list">
        <div class="user-item" v-for="user in users" :key="user.id">
          <div class="user-info">
            <span class="username">{{ user.username }}</span>
            <span class="role-badge">{{ getRoleName(user.role) }}</span>
          </div>
          <div class="user-permissions">
            <div class="permission-group" v-for="(permissions, groupName) in permissionGroups" :key="groupName">
              <span class="group-title">{{ groupName }}</span>
              <div class="permission-checkboxes">
                <label 
                  v-for="permission in permissions" 
                  :key="permission"
                  class="permission-checkbox"
                >
                  <input 
                    type="checkbox" 
                    :value="permission"
                    v-model="userPermissions[user.id]"
                    @change="updateUserPermissions(user.id)"
                    :disabled="!canManageUser()"
                  >
                  <span class="checkbox-label">{{ permissionDescriptions[permission] }}</span>
                </label>
              </div>
            </div>
          </div>
          <div class="user-actions">
            <button 
              @click="saveUserPermissions(user.id)"
              :disabled="!hasChanges(user.id)"
              class="save-btn"
            >
              保存
            </button>
            <button 
              @click="resetUserPermissions(user.id)"
              :disabled="!hasChanges(user.id)"
              class="reset-btn"
            >
              重置
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ROLES, PERMISSION_DESCRIPTIONS, PERMISSION_GROUPS, hasPermission } from '@/utils/permissions.js';
import authAPI from '@/utils/authAPI.js';

export default {
  name: "PermissionManagementPanel",
  data() {
    return {
      users: [],
      userPermissions: {}, // 用户权限缓存
      originalPermissions: {}, // 原始权限备份
      isLoading: false,
      roles: ROLES,
      permissionDescriptions: PERMISSION_DESCRIPTIONS,
      permissionGroups: PERMISSION_GROUPS
    };
  },
  async mounted() {
    await this.loadUsers();
  },
  methods: {
    async loadUsers() {
      try {
        this.isLoading = true;
        const result = await authAPI.getAllUsers();
        if (result && result.success) {
          this.users = result.data || [];
          this.initializeUserPermissions();
        }
      } catch (error) {
        console.error('加载用户失败:', error);
      } finally {
        this.isLoading = false;
      }
    },

    initializeUserPermissions() {
      this.users.forEach(user => {
        // 初始化用户权限
        this.userPermissions[user.id] = user.permissions || [];
        this.originalPermissions[user.id] = [...(user.permissions || [])];
      });
    },

    getRoleName(role) {
      return this.roles[role]?.name || role;
    },

    getPermissionClass(permission) {
      const type = permission.split(':')[1];
      return type;
    },

    getPermissionShortName(permission) {
      const descriptions = {
        'user:create': '创建',
        'user:read': '查看',
        'user:update': '修改',
        'user:delete': '删除',
        'script:upload': '上传',
        'script:read': '查看',
        'script:update': '修改',
        'script:delete': '删除',
        'script:approve': '审核',
        'script:no_approve': '免审'
      };
      return descriptions[permission] || permission;
    },

    canManageUser() {
      const currentUser = authAPI.getCurrentUser();
      if (!currentUser) return false;
      
      // 管理员可以管理所有用户
      if (hasPermission(currentUser, 'user:update')) {
        return true;
      }
      
      return false;
    },

    hasChanges(userId) {
      const current = this.userPermissions[userId] || [];
      const original = this.originalPermissions[userId] || [];
      
      if (current.length !== original.length) return true;
      
      return !current.every(perm => original.includes(perm)) ||
             !original.every(perm => current.includes(perm));
    },

    async updateUserPermissions(userId) {
      // 权限变更时的处理逻辑
      console.log(`用户 ${userId} 权限已更新:`, this.userPermissions[userId]);
    },

    async saveUserPermissions(userId) {
      try {
        const permissions = this.userPermissions[userId] || [];
        const result = await authAPI.updateUserPermissions(userId, permissions);
        
        if (result && result.success) {
          // 更新原始权限备份
          this.originalPermissions[userId] = [...permissions];
          this.$emit('user-updated');
        } else {
          alert('保存失败: ' + (result?.error || '未知错误'));
        }
      } catch (error) {
        console.error('保存用户权限失败:', error);
        alert('保存失败，请重试');
      }
    },

    resetUserPermissions(userId) {
      const original = this.originalPermissions[userId] || [];
      this.userPermissions[userId] = [...original];
    }
  }
};
</script>

<style scoped>
.permission-panel {
  padding: 20px;
}

.role-permissions {
  margin-bottom: 30px;
}

.role-permissions h3 {
  color: #fff;
  margin-bottom: 20px;
  font-size: 18px;
}

.role-list {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.role-item {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
  min-width: 300px;
  flex: 1;
}

.role-item h4 {
  color: #fff;
  margin-bottom: 15px;
  font-size: 16px;
}

.permissions-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.permission-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-title {
  color: #ccc;
  font-size: 14px;
  font-weight: bold;
}

.permission-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.permission-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
  background: #4a90e2;
}

.permission-badge.create {
  background: #27ae60;
}

.permission-badge.read {
  background: #3498db;
}

.permission-badge.update {
  background: #f39c12;
}

.permission-badge.delete {
  background: #e74c3c;
}

.permission-badge.approve {
  background: #9b59b6;
}

.permission-badge.no_approve {
  background: #1abc9c;
}

.user-permissions h3 {
  color: #fff;
  margin-bottom: 20px;
  font-size: 18px;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-item {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.username {
  color: #fff;
  font-weight: bold;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
  background: #666;
}

.user-permissions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 15px;
}

.permission-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.permission-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ccc;
  font-size: 14px;
  cursor: pointer;
}

.permission-checkbox input[type="checkbox"] {
  margin: 0;
}

.checkbox-label {
  color: #ccc;
}

.user-actions {
  display: flex;
  gap: 10px;
}

.save-btn, .reset-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.save-btn {
  background: #27ae60;
  color: #fff;
}

.save-btn:hover:not(:disabled) {
  background: #229954;
}

.reset-btn {
  background: #666;
  color: #fff;
}

.reset-btn:hover:not(:disabled) {
  background: #555;
}

.save-btn:disabled, .reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 