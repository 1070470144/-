<template>
  <transition name="modal-fade">
    <div class="admin-panel-backdrop" @click="closePanel">
      <div class="admin-panel" @click.stop v-if="isAdmin">
        <div class="admin-header">
          <h2>管理员面板</h2>
          <button @click="closePanel" class="close-btn">×</button>
        </div>

        <div class="admin-tabs">
          <button 
            @click="activeTab = 'roles'" 
            :class="{ active: activeTab === 'roles' }"
            class="tab-btn"
          >
            角色管理
          </button>
          <button 
            @click="activeTab = 'editions'" 
            :class="{ active: activeTab === 'editions' }"
            class="tab-btn"
          >
            剧本管理
          </button>
          <button 
            @click="activeTab = 'settings'" 
            :class="{ active: activeTab === 'settings' }"
            class="tab-btn"
          >
            系统设置
          </button>
        </div>

        <div class="admin-content">
          <div v-if="activeTab === 'roles'" class="tab-content">
            <RoleManager />
          </div>
          
          <div v-if="activeTab === 'editions'" class="tab-content">
            <EditionManager />
          </div>
          
          <div v-if="activeTab === 'settings'" class="settings-panel">
            <h3>系统设置</h3>
            <div class="setting-group">
              <h4>数据管理</h4>
              <button @click="exportData" class="action-btn">导出数据</button>
              <button @click="importData" class="action-btn">导入数据</button>
              <button @click="backupData" class="action-btn">备份数据</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import RoleManager from './RoleManager.vue'
import EditionManager from './EditionManager.vue'

export default {
  name: 'AdminPanel',
  components: {
    RoleManager,
    EditionManager
  },
  data() {
    return {
      activeTab: 'roles'
    }
  },
  computed: {
    isAdmin() {
      return this.$store.state.session.isSpectator === false && 
             this.$store.state.session.sessionId;
    }
  },
  methods: {
    closePanel() {
      this.$emit('close');
    },
    exportData() {
      const data = {
        roles: this.$store.getters.rolesJSONbyId,
        editions: this.$store.state.edition,
        timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `townsquare-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    importData() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result);
              console.log('导入的数据:', data);
              alert('数据导入成功！');
            } catch (error) {
              alert('数据格式错误：' + error.message);
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    },
    backupData() {
      const backupData = {
        roles: this.$store.getters.rolesJSONbyId,
        editions: this.$store.state.edition,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('townsquare-backup', JSON.stringify(backupData));
      alert('数据备份成功！');
    }
  }
}
</script>

<style scoped lang="scss">
.admin-panel-backdrop {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  backdrop-filter: blur(5px);
}

.admin-panel {
  background: rgba(0, 0, 0, 0.95);
  border: 2px solid #gold;
  padding: 0;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 215, 0, 0.2);
  display: flex;
  flex-direction: column;
  max-height: 85%;
  max-width: 85%;
  width: 90vw;
  max-width: 1200px;
  height: 80vh;
  color: white;
  font-family: 'Papyrus', serif;
  position: relative;
  backdrop-filter: blur(10px);
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  
  h2 {
    margin: 0;
    color: #gold;
    font-size: 24px;
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

.admin-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  
  .tab-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    padding: 15px 20px;
    cursor: pointer;
    font-family: 'Papyrus', serif;
    font-size: 16px;
    border-bottom: 3px solid transparent;
    transition: all 0.3s ease;
    position: relative;
    
    &:hover {
      color: white;
      background: rgba(255, 215, 0, 0.15);
    }
    
    &.active {
      color: #gold;
      border-bottom-color: #gold;
      background: rgba(255, 215, 0, 0.1);
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #gold, rgba(255, 215, 0, 0.6));
      }
    }
  }
}

.admin-content {
  flex: 1;
  padding: 25px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.02);
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.3);
    border-radius: 4px;
    
    &:hover {
      background: rgba(255, 215, 0, 0.5);
    }
  }
}

.tab-content {
  h3 {
    color: #gold;
    margin-bottom: 20px;
    font-size: 20px;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  }
  
  p {
    color: rgba(255, 255, 255, 0.9);
    font-size: 16px;
    line-height: 1.6;
  }
}

.settings-panel {
  h3 {
    color: #gold;
    margin-bottom: 20px;
    font-size: 20px;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  }
  
  .setting-group {
    margin-bottom: 30px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    border: 1px solid rgba(255, 215, 0, 0.1);
    
    h4 {
      color: #gold;
      margin-bottom: 15px;
      font-size: 18px;
      text-shadow: 0 0 8px rgba(255, 215, 0, 0.2);
    }
    
    .action-btn {
      background: rgba(255, 215, 0, 0.15);
      border: 1px solid rgba(255, 215, 0, 0.4);
      color: #gold;
      padding: 12px 24px;
      margin-right: 12px;
      margin-bottom: 12px;
      border-radius: 6px;
      cursor: pointer;
      font-family: 'Papyrus', serif;
      font-size: 14px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      
      &:hover {
        background: rgba(255, 215, 0, 0.25);
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
  }
}
</style> 