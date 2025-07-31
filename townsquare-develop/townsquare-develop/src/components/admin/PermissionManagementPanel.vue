<template>
  <div class="permission-panel">
    <!-- 角色权限配置 -->
    <div class="role-permissions">
      <h3>角色权限配置</h3>
      <div class="role-list">
        <div class="role-item" v-for="(role, roleKey) in roles" :key="roleKey">
          <h4>{{ role.name }}</h4>
          <div class="permissions-grid">
            <div class="permission-group" v-for="(permissions, groupName) in filteredRolePermissionGroups(roleKey)" :key="groupName">
              <span class="group-title">{{ groupName }}</span>
              <div class="permission-badges">
                <span 
                  v-for="permission in filteredRolePermissions(role, permissions)" 
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
            <div class="user-main-info">
              <span class="username">{{ user.username }}</span>
              <span class="role-badge">{{ getRoleName(user.role) }}</span>
            </div>
            <div class="user-permission-summary">
              <span class="permission-count">权限数量: {{ userPermissions[user.id]?.length || 0 }}</span>
              <span class="permission-status-indicator" v-if="hasChanges(user.id)">* 已修改</span>
              <span class="current-user-indicator" v-if="isCurrentUser(user.id)">(当前用户)</span>
              <span class="role-permission-info" v-if="!canManageUser(user.id) && !isCurrentUser(user.id)">(无管理权限)</span>
            </div>
          </div>
          <div class="user-permissions">
            <div class="permission-group" v-for="(permissions, groupName) in permissionGroups" :key="groupName">
              <span class="group-title">{{ groupName }}</span>
              <div class="permission-checkboxes">
                <div 
                  v-for="permission in permissions" 
                  :key="permission"
                  class="permission-checkbox-wrapper"
                  :class="{ 
                    'permission-active': hasUserPermission(user.id, permission),
                    'permission-disabled': isPermissionDisabled(user.id)
                  }"
                  @click="!isPermissionDisabled(user.id) && toggleUserPermission(user.id, permission)"
                >
                  <input 
                    type="checkbox" 
                    :value="permission"
                    :checked="hasUserPermission(user.id, permission)"
                    :disabled="isPermissionDisabled(user.id)"
                    @change.stop
                  >
                  <span class="checkbox-label">{{ permissionDescriptions[permission] }}</span>
                  <span class="permission-status" v-if="hasUserPermission(user.id, permission)">✓</span>
                </div>
              </div>
            </div>
          </div>
          <div class="user-actions">
            <button 
              @click="selectAllPermissions(user.id)"
              :disabled="!canManageUser(user.id)"
              class="select-all-btn"
            >
              全选
            </button>
            <button 
              @click="clearAllPermissions(user.id)"
              :disabled="!canManageUser(user.id)"
              class="clear-all-btn"
            >
              清空
            </button>
            <button 
              @click="saveUserPermissions(user.id)"
              :disabled="!hasChanges(user.id) || !canManageUser(user.id)"
              class="save-btn"
            >
              保存
            </button>
            <button 
              @click="resetUserPermissions(user.id)"
              :disabled="!hasChanges(user.id) || !canManageUser(user.id)"
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
import { ROLES, PERMISSION_DESCRIPTIONS, PERMISSION_GROUPS, hasPermission, getUserPermissions } from '@/utils/permissions.js';
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
  computed: {
    // 根据角色过滤权限组
    filteredRolePermissionGroups() {
      return (roleKey) => {
        console.log('过滤角色权限组，角色:', roleKey);
        const filtered = {};
        Object.entries(this.permissionGroups).forEach(([groupName, permissions]) => {
          console.log(`检查权限组: ${groupName}, 权限:`, permissions);
          if (this.shouldShowRolePermissionGroup()) {
            filtered[groupName] = permissions;
            console.log(`添加权限组: ${groupName}`);
          }
        });
        console.log('过滤后的权限组:', filtered);
        return filtered;
      };
    },
    

    
    // 根据权限组过滤角色权限
    filteredRolePermissions() {
      return (role, permissions) => {
        const rolePerms = this.getRolePermissions(role);
        return rolePerms.filter(permission => permissions.includes(permission));
      };
    }
  },
  async mounted() {
    await this.loadUsers();
  },
  methods: {
    async loadUsers() {
      try {
        this.isLoading = true;
        const result = await authAPI.getAllUsers();
        console.log('获取用户列表结果:', result);
        if (result && result.success) {
          this.users = result.data || [];
          console.log('用户列表:', this.users);
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
        console.log('处理用户:', user);
        
        // 获取角色默认权限
        const defaultPermissions = this.getDefaultPermissionsByRole(user.role);
        console.log(`用户 ${user.username} 角色 ${user.role} 的默认权限:`, defaultPermissions);
        
        // 如果用户有自定义权限，使用自定义权限；否则使用角色默认权限
        let userPerms = [];
        if (user.permissions && user.permissions.length > 0) {
          userPerms = [...user.permissions];
          console.log(`用户 ${user.username} 使用自定义权限:`, userPerms);
        } else {
          userPerms = [...defaultPermissions];
          console.log(`用户 ${user.username} 使用角色默认权限:`, userPerms);
        }
        
        this.$set(this.userPermissions, user.id, userPerms);
        this.$set(this.originalPermissions, user.id, [...userPerms]);
        console.log(`最终初始化用户 ${user.username} 权限:`, userPerms);
      });
    },

    getDefaultPermissionsByRole(role) {
      console.log('获取角色权限，角色:', role);
      const rolePermissions = this.roles[role]?.permissions || [];
      console.log('角色权限:', rolePermissions);
      return [...rolePermissions];
    },

    getRolePermissions(role) {
      return role.permissions || [];
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
        'user:create': '新增',
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

    canManageUser(userId) {
      const currentUser = authAPI.getCurrentUser();
      console.log('canManageUser 检查:', { userId, currentUser });
      
      if (!currentUser) {
        console.log('当前用户未登录');
        return false;
      }
      
      // 管理员不能修改自己的权限
      if (currentUser.id === userId) {
        console.log('不能修改自己的权限');
        return false;
      }
      
      // 管理员角色直接拥有所有权限
      if (currentUser.role === 'admin') {
        console.log('管理员角色，有权限管理用户');
        return true;
      }
      
      // 检查用户权限
      const userPerms = getUserPermissions(currentUser);
      console.log('当前用户权限:', userPerms);
      console.log('检查 user:update 权限:', userPerms.includes('user:update'));
      
      // 检查是否有 user:update 权限
      if (hasPermission(currentUser, 'user:update')) {
        console.log('有权限管理用户');
        return true;
      }
      
      console.log('没有权限管理用户');
      return false;
    },

    isCurrentUser(userId) {
      const currentUser = authAPI.getCurrentUser();
      return currentUser && currentUser.id === userId;
    },

    // 控制权限组显示
    shouldShowPermissionGroup() {
      // 管理员可以管理所有权限组
      return true;
    },

    // 控制角色权限配置中的权限组显示
    shouldShowRolePermissionGroup() {
      // 角色权限配置中显示所有权限组
      return true;
    },

    // 检查用户是否拥有某个权限
    hasUserPermission(userId, permission) {
      const userPerms = this.userPermissions[userId] || [];
      const hasPerm = userPerms.includes(permission);
      console.log(`检查用户 ${userId} 权限 ${permission}: ${hasPerm}`, userPerms);
      return hasPerm;
    },

    // 获取用户当前权限列表
    getUserCurrentPermissions(userId) {
      const userPerms = this.userPermissions[userId] || [];
      console.log(`用户 ${userId} 当前权限:`, userPerms);
      return userPerms;
    },

    // 检查权限是否应该显示为禁用状态
    isPermissionDisabled(userId) {
      const currentUser = authAPI.getCurrentUser();
      if (!currentUser) return true;
      
      // 管理员不能修改自己的权限
      if (currentUser.id === userId) return true;
      
      // 检查当前用户是否有权限管理此用户
      return !this.canManageUser(userId);
    },

    hasChanges(userId) {
      const current = this.userPermissions[userId] || [];
      const original = this.originalPermissions[userId] || [];
      
      if (current.length !== original.length) return true;
      
      return !current.every(perm => original.includes(perm)) ||
             !original.every(perm => current.includes(perm));
    },

    toggleUserPermission(userId, permission) {
      // 检查是否可以管理此用户
      if (!this.canManageUser(userId)) {
        console.log(`无法管理用户 ${userId} 的权限`);
        return;
      }
      
      // 检查权限是否被禁用
      if (this.isPermissionDisabled(userId)) {
        console.log(`用户 ${userId} 的权限被禁用，无法修改`);
        return;
      }
      
      console.log(`切换权限: 用户 ${userId}, 权限 ${permission}`);
      const userPerms = this.userPermissions[userId] || [];
      const hasPermission = userPerms.includes(permission);
      
      console.log(`当前权限:`, userPerms);
      console.log(`是否拥有权限:`, hasPermission);
      
      if (hasPermission) {
        // 移除权限
        const newPerms = userPerms.filter(p => p !== permission);
        this.$set(this.userPermissions, userId, newPerms);
        console.log(`移除权限 ${permission}, 新权限列表:`, newPerms);
      } else {
        // 添加权限
        const newPerms = [...userPerms, permission];
        this.$set(this.userPermissions, userId, newPerms);
        console.log(`添加权限 ${permission}, 新权限列表:`, newPerms);
      }
      
      // 强制更新视图
      this.$forceUpdate();
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
      this.$set(this.userPermissions, userId, [...original]);
    },

    selectAllPermissions(userId) {
      // 检查是否可以管理此用户
      if (!this.canManageUser(userId)) {
        console.log(`无法管理用户 ${userId} 的权限`);
        return;
      }
      
      // 获取所有权限
      const allPermissions = Object.values(this.permissionGroups).flat();
      this.$set(this.userPermissions, userId, [...allPermissions]);
      console.log(`用户 ${userId} 全选权限:`, allPermissions);
    },

    clearAllPermissions(userId) {
      // 检查是否可以管理此用户
      if (!this.canManageUser(userId)) {
        console.log(`无法管理用户 ${userId} 的权限`);
        return;
      }
      
      this.$set(this.userPermissions, userId, []);
      console.log(`用户 ${userId} 清空权限`);
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
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  align-items: flex-start;
  margin-bottom: 15px;
  flex-direction: column;
  gap: 8px;
}

.user-main-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-permission-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
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

.permission-count {
  color: #ccc;
  font-size: 12px;
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
  gap: 12px;
}

.permission-checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ccc;
  font-size: 14px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  user-select: none;
}

.permission-checkbox-wrapper:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.permission-checkbox-wrapper input[type="checkbox"] {
  margin: 0;
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #4a90e2;
}

.permission-checkbox-wrapper input[type="checkbox"]:checked {
  accent-color: #27ae60;
}

.checkbox-label {
  color: #ccc;
  font-weight: 500;
  cursor: pointer;
}

.permission-checkbox-wrapper:has(input:checked) {
  background: rgba(74, 144, 226, 0.1);
  border-color: rgba(74, 144, 226, 0.3);
}

.permission-active {
  background: rgba(39, 174, 96, 0.1) !important;
  border-color: rgba(39, 174, 96, 0.3) !important;
}

.permission-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.02) !important;
  border-color: rgba(255, 255, 255, 0.05) !important;
}

.permission-disabled:hover {
  background: rgba(255, 255, 255, 0.02) !important;
  border-color: rgba(255, 255, 255, 0.05) !important;
}

.permission-status {
  color: #27ae60;
  font-weight: bold;
  margin-left: 4px;
  font-size: 12px;
}

.user-actions {
  display: flex;
  gap: 10px;
}

.save-btn, .reset-btn, .select-all-btn, .clear-all-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.select-all-btn {
  background: #3498db;
  color: #fff;
}

.select-all-btn:hover {
  background: #2980b9;
}

.clear-all-btn {
  background: #95a5a6;
  color: #fff;
}

.clear-all-btn:hover {
  background: #7f8c8d;
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

.permission-status-indicator {
  color: #f39c12;
  font-size: 12px;
  margin-left: 8px;
}

.current-user-indicator {
  color: #3498db;
  font-size: 12px;
  margin-left: 8px;
  font-weight: bold;
}

.role-permission-info {
  color: #95a5a6;
  font-size: 12px;
  margin-left: 8px;
  font-style: italic;
}
</style> 