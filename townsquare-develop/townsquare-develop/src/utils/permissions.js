// 权限定义
export const PERMISSIONS = {
  // 用户管理权限（4个）
  USER_CREATE: 'user:create',      // 创建用户
  USER_READ: 'user:read',          // 查看用户
  USER_UPDATE: 'user:update',      // 修改用户
  USER_DELETE: 'user:delete',      // 删除用户

  // 剧本管理权限（6个）
  SCRIPT_UPLOAD: 'script:upload',  // 上传剧本
  SCRIPT_READ: 'script:read',      // 查看剧本
  SCRIPT_UPDATE: 'script:update',  // 修改剧本
  SCRIPT_DELETE: 'script:delete',  // 删除剧本
  SCRIPT_APPROVE: 'script:approve', // 审核剧本
  SCRIPT_NO_APPROVE: 'script:no_approve' // 免审核权限
}

// 角色配置
export const ROLES = {
  ADMIN: {
    name: '管理员',
    permissions: [
      'user:create', 'user:read', 'user:update', 'user:delete',
      'script:upload', 'script:read', 'script:update', 'script:delete',
      'script:approve', 'script:no_approve'
    ]
  },
  MODERATOR: {
    name: '审核员',
    permissions: [
      'script:upload', 'script:read', 'script:update', 'script:delete',
      'script:approve'
    ]
  },
  USER: {
    name: '用户',
    permissions: [
      'script:upload'
    ]
  }
}

// 权限检查函数
export function getUserPermissions(user) {
  if (!user) return [];
  if (user.permissions && user.permissions.length > 0) {
    return user.permissions;
  }
  return ROLES[user.role]?.permissions || [];
}

export function hasPermission(user, permission) {
  return getUserPermissions(user).includes(permission);
}

// 权限描述
export const PERMISSION_DESCRIPTIONS = {
  'user:create': '创建用户',
  'user:read': '查看用户',
  'user:update': '修改用户',
  'user:delete': '删除用户',
  'script:upload': '上传剧本',
  'script:read': '查看剧本',
  'script:update': '修改剧本',
  'script:delete': '删除剧本',
  'script:approve': '审核剧本',
  'script:no_approve': '免审核权限'
}

// 权限分组
export const PERMISSION_GROUPS = {
  '用户管理': ['user:create', 'user:read', 'user:update', 'user:delete'],
  '剧本管理': ['script:upload', 'script:read', 'script:update', 'script:delete', 'script:approve', 'script:no_approve']
} 