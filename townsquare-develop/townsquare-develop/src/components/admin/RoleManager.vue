<template>
  <div class="role-manager">
    <div class="role-header">
      <div class="search-section">
        <input
          v-model="searchQuery"
          placeholder="搜索角色..."
          class="search-input"
        />
        <select v-model="teamFilter" class="team-filter">
          <option value="">所有阵营</option>
          <option value="townsfolk">镇民</option>
          <option value="outsider">外来者</option>
          <option value="minion">爪牙</option>
          <option value="demon">恶魔</option>
          <option value="traveler">旅行者</option>
          <option value="fabled">传奇角色</option>
        </select>
      </div>
      <button @click="showAddRole = true" class="add-btn">添加角色</button>
    </div>

    <div class="role-list">
      <div
        v-for="role in filteredRoles"
        :key="role.id"
        class="role-item"
        @click="editRole(role)"
      >
        <div class="role-icon">
          <img
            :src="getRoleIcon(role.id)"
            :alt="role.name"
            @error="handleImageError"
          />
        </div>
        <div class="role-info">
          <h4>{{ role.name }}</h4>
          <p class="role-team">{{ getTeamName(role.team) }}</p>
          <p class="role-ability">{{ role.ability }}</p>
        </div>
        <div class="role-actions">
          <button @click.stop="editRole(role)" class="edit-btn">编辑</button>
          <button @click.stop="deleteRole(role)" class="delete-btn">删除</button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑角色模态框 -->
    <div v-if="showAddRole || editingRole" class="role-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingRole ? '编辑角色' : '添加角色' }}</h3>
          <button @click="cancelEdit" class="close-btn">×</button>
        </div>
        
        <div class="form-group">
          <label>角色ID:</label>
          <input v-model="roleForm.id" placeholder="角色唯一标识符" />
        </div>
        
        <div class="form-group">
          <label>角色名称:</label>
          <input v-model="roleForm.name" placeholder="角色显示名称" />
        </div>
        
        <div class="form-group">
          <label>阵营:</label>
          <select v-model="roleForm.team">
            <option value="townsfolk">镇民</option>
            <option value="outsider">外来者</option>
            <option value="minion">爪牙</option>
            <option value="demon">恶魔</option>
            <option value="traveler">旅行者</option>
            <option value="fabled">传奇角色</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>能力描述:</label>
          <textarea v-model="roleForm.ability" placeholder="角色能力描述"></textarea>
        </div>
        
        <div class="form-group">
          <label>首夜行动顺序:</label>
          <input v-model="roleForm.firstNight" type="number" placeholder="0表示不行动" />
        </div>
        
        <div class="form-group">
          <label>其他夜晚行动顺序:</label>
          <input v-model="roleForm.otherNight" type="number" placeholder="0表示不行动" />
        </div>
        
        <div class="form-group">
          <label>首夜提醒:</label>
          <textarea v-model="roleForm.firstNightReminder" placeholder="首夜提醒文本"></textarea>
        </div>
        
        <div class="form-group">
          <label>其他夜晚提醒:</label>
          <textarea v-model="roleForm.otherNightReminder" placeholder="其他夜晚提醒文本"></textarea>
        </div>
        
        <div class="form-group">
          <label>提醒标记:</label>
          <input v-model="roleForm.reminders" placeholder="用逗号分隔多个标记" />
        </div>
        
        <div class="form-group">
          <label>
            <input v-model="roleForm.setup" type="checkbox" />
            影响游戏设置
          </label>
        </div>
        
        <div class="modal-actions">
          <button @click="saveRole" class="save-btn">保存</button>
          <button @click="cancelEdit" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoleManager',
  data() {
    return {
      searchQuery: '',
      teamFilter: '',
      showAddRole: false,
      editingRole: null,
      roleForm: {
        id: '',
        name: '',
        team: 'townsfolk',
        ability: '',
        firstNight: 0,
        otherNight: 0,
        firstNightReminder: '',
        otherNightReminder: '',
        reminders: '',
        setup: false
      }
    }
  },
  computed: {
    allRoles() {
      return Array.from(this.$store.getters.rolesJSONbyId.values());
    },
    filteredRoles() {
      let roles = this.allRoles;
      
      if (this.searchQuery) {
        roles = roles.filter(role => 
          role.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          role.ability.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }
      
      if (this.teamFilter) {
        roles = roles.filter(role => role.team === this.teamFilter);
      }
      
      return roles.sort((a, b) => a.name.localeCompare(b.name));
    }
  },
  methods: {
    getTeamName(team) {
      const teamNames = {
        townsfolk: '镇民',
        outsider: '外来者',
        minion: '爪牙',
        demon: '恶魔',
        traveler: '旅行者',
        fabled: '传奇角色'
      };
      return teamNames[team] || team;
    },
    getRoleIcon(roleId) {
      try {
        return require(`../../assets/icons/${roleId}.png`);
      } catch {
        return require('../../assets/icons/custom.png');
      }
    },
    handleImageError(event) {
      event.target.src = require('../../assets/icons/custom.png');
    },
    editRole(role) {
      this.editingRole = role;
      this.roleForm = {
        id: role.id,
        name: role.name,
        team: role.team,
        ability: role.ability,
        firstNight: role.firstNight || 0,
        otherNight: role.otherNight || 0,
        firstNightReminder: role.firstNightReminder || '',
        otherNightReminder: role.otherNightReminder || '',
        reminders: Array.isArray(role.reminders) ? role.reminders.join(', ') : '',
        setup: role.setup || false
      };
    },
    saveRole() {
      // 验证必填字段
      if (!this.roleForm.id || !this.roleForm.name || !this.roleForm.ability) {
        alert('请填写必填字段：角色ID、名称和能力描述');
        return;
      }

      const roleData = {
        ...this.roleForm,
        reminders: this.roleForm.reminders.split(',').map(r => r.trim()).filter(r => r)
      };

      // 这里应该调用store的mutation来保存角色
      console.log('保存角色:', roleData);

      this.cancelEdit();
    },
    cancelEdit() {
      this.showAddRole = false;
      this.editingRole = null;
      this.roleForm = {
        id: '',
        name: '',
        team: 'townsfolk',
        ability: '',
        firstNight: 0,
        otherNight: 0,
        firstNightReminder: '',
        otherNightReminder: '',
        reminders: '',
        setup: false
      };
    },
    deleteRole(role) {
      if (confirm(`确定要删除角色"${role.name}"吗？`)) {
        console.log('删除角色:', role.id);
        // 这里应该调用store的mutation来删除角色
      }
    }
  }
}
</script>

<style scoped lang="scss">
.role-manager {
  .role-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .search-section {
      display: flex;
      gap: 10px;
      
      .search-input {
        padding: 8px 12px;
        border: 1px solid rgba(255, 215, 0, 0.3);
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border-radius: 5px;
        font-family: 'Papyrus', serif;
        width: 200px;
        
        &::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
      }
      
      .team-filter {
        padding: 8px 12px;
        border: 1px solid rgba(255, 215, 0, 0.3);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 5px;
        font-family: 'Papyrus', serif;
        cursor: pointer;
        
        option {
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 8px 12px;
        }
        
        &:focus {
          outline: none;
          border-color: #gold;
          box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
        }
      }
    }
    
    .add-btn {
      background: rgba(255, 215, 0, 0.2);
      border: 1px solid #gold;
      color: #gold;
      padding: 8px 16px;
      border-radius: 5px;
      cursor: pointer;
      font-family: 'Papyrus', serif;
      
      &:hover {
        background: rgba(255, 215, 0, 0.3);
        color: white;
      }
    }
  }
  
  .role-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 15px;
    
    .role-item {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 215, 0, 0.2);
      border-radius: 8px;
      padding: 15px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 215, 0, 0.4);
      }
      
      .role-icon {
        width: 40px;
        height: 40px;
        margin-bottom: 10px;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 5px;
        }
      }
      
      .role-info {
        h4 {
          color: #gold;
          margin: 0 0 5px 0;
          font-size: 16px;
        }
        
        .role-team {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          margin: 0 0 8px 0;
        }
        
        .role-ability {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          margin: 0;
          line-height: 1.4;
        }
      }
      
      .role-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
        
        .edit-btn, .delete-btn {
          padding: 5px 10px;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-family: 'Papyrus', serif;
          font-size: 12px;
        }
        
        .edit-btn {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
          
          &:hover {
            background: rgba(76, 175, 80, 0.3);
          }
        }
        
        .delete-btn {
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;
          
          &:hover {
            background: rgba(244, 67, 54, 0.3);
          }
        }
      }
    }
  }
}

.role-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  
  .modal-content {
    background: rgba(0, 0, 0, 0.95);
    border: 2px solid #gold;
    border-radius: 10px;
    padding: 30px;
    width: 90vw;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    color: white;
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      
      h3 {
        color: #gold;
        margin: 0;
      }
      
      .close-btn {
        background: none;
        border: none;
        color: #gold;
        font-size: 24px;
        cursor: pointer;
        padding: 5px;
        
        &:hover {
          color: white;
        }
      }
    }
    
    .form-group {
      margin-bottom: 15px;
      
      label {
        display: block;
        margin-bottom: 5px;
        color: #gold;
        font-size: 14px;
      }
      
      input, textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid rgba(255, 215, 0, 0.3);
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border-radius: 5px;
        font-family: 'Papyrus', serif;
        
        &::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
      }
      
      select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid rgba(255, 215, 0, 0.3);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 5px;
        font-family: 'Papyrus', serif;
        cursor: pointer;
        
        option {
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 8px 12px;
        }
        
        &:focus {
          outline: none;
          border-color: #gold;
          box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
        }
      }
      
      textarea {
        min-height: 80px;
        resize: vertical;
      }
    }
    
    .modal-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      
      .save-btn, .cancel-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-family: 'Papyrus', serif;
      }
      
      .save-btn {
        background: rgba(76, 175, 80, 0.2);
        color: #4caf50;
        
        &:hover {
          background: rgba(76, 175, 80, 0.3);
        }
      }
      
      .cancel-btn {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
        
        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }
    }
  }
}
</style> 