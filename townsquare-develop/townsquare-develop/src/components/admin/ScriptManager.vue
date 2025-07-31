<template>
  <div class="script-manager">
    <div class="script-manager-header">
      <h2>剧本管理</h2>
      <div class="header-actions">
        <button @click="showCreateModal = true" class="btn-primary">
          创建新剧本
        </button>
        <button @click="showImportModal = true" class="btn-secondary">
          导入剧本
        </button>
      </div>
    </div>

    <div class="script-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.name }}
        <span class="tab-count">({{ getScriptCount(tab.key) }})</span>
      </button>
    </div>

    <div class="script-list">
      <div v-if="loading" class="loading">
        正在加载剧本...
      </div>
      
      <div v-else-if="getCurrentScripts().length === 0" class="empty-state">
        <p>暂无{{ getCurrentTabName() }}剧本</p>
        <button v-if="activeTab === 'custom'" @click="showCreateModal = true" class="btn-primary">
          创建第一个剧本
        </button>
      </div>
      
      <div v-else class="script-grid">
        <div 
          v-for="script in getCurrentScripts()" 
          :key="script.id"
          class="script-card"
        >
          <div class="script-header">
            <h3>{{ script.name }}</h3>
            <div class="script-actions">
              <button @click="editScript(script)" class="btn-icon" title="编辑">
                ✏️
              </button>
              <button @click="exportScript(script)" class="btn-icon" title="导出">
                📤
              </button>
              <button @click="deleteScript(script)" class="btn-icon" title="删除">
                🗑️
              </button>
            </div>
          </div>
          
          <div class="script-info">
            <p class="script-author">作者: {{ script.author }}</p>
            <p class="script-level">难度: {{ script.level }}</p>
            <p class="script-roles">角色数: {{ script.roles ? script.roles.length : 0 }}</p>
            <p class="script-description">{{ script.description || '暂无描述' }}</p>
          </div>
          
          <div class="script-footer">
            <span class="script-date">
              创建于: {{ formatDate(script.createdAt) }}
            </span>
            <span v-if="script.isOfficial" class="script-badge official">
              官方
            </span>
            <span v-if="script.isCustom" class="script-badge custom">
              自定义
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑剧本模态框 -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ showEditModal ? '编辑剧本' : '创建新剧本' }}</h3>
          <button @click="closeModal" class="btn-close">×</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveScript">
            <div class="form-group">
              <label>剧本名称 *</label>
              <input 
                v-model="scriptForm.name" 
                type="text" 
                required 
                placeholder="输入剧本名称"
              />
            </div>
            
            <div class="form-group">
              <label>作者 *</label>
              <input 
                v-model="scriptForm.author" 
                type="text" 
                required 
                placeholder="输入作者名称"
              />
            </div>
            
            <div class="form-group">
              <label>难度等级</label>
              <select v-model="scriptForm.level">
                <option value="Beginner">新手</option>
                <option value="Intermediate">中级</option>
                <option value="Veteran">高级</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>描述</label>
              <textarea 
                v-model="scriptForm.description" 
                placeholder="输入剧本描述"
                rows="4"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label>角色列表</label>
              <div class="roles-selector">
                <div class="role-categories">
                  <div class="role-category">
                    <h4>镇民</h4>
                    <div class="role-list">
                      <label v-for="role in townsfolkRoles" :key="role.id" class="role-item">
                        <input 
                          type="checkbox" 
                          :value="role.id"
                          v-model="scriptForm.roles"
                        />
                        {{ role.name }}
                      </label>
                    </div>
                  </div>
                  
                  <div class="role-category">
                    <h4>外来者</h4>
                    <div class="role-list">
                      <label v-for="role in outsiderRoles" :key="role.id" class="role-item">
                        <input 
                          type="checkbox" 
                          :value="role.id"
                          v-model="scriptForm.roles"
                        />
                        {{ role.name }}
                      </label>
                    </div>
                  </div>
                  
                  <div class="role-category">
                    <h4>爪牙</h4>
                    <div class="role-list">
                      <label v-for="role in minionRoles" :key="role.id" class="role-item">
                        <input 
                          type="checkbox" 
                          :value="role.id"
                          v-model="scriptForm.roles"
                        />
                        {{ role.name }}
                      </label>
                    </div>
                  </div>
                  
                  <div class="role-category">
                    <h4>恶魔</h4>
                    <div class="role-list">
                      <label v-for="role in demonRoles" :key="role.id" class="role-item">
                        <input 
                          type="checkbox" 
                          :value="role.id"
                          v-model="scriptForm.roles"
                        />
                        {{ role.name }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button @click="closeModal" class="btn-secondary">取消</button>
          <button @click="saveScript" class="btn-primary">
            {{ showEditModal ? '更新' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 导入剧本模态框 -->
    <div v-if="showImportModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>导入剧本</h3>
          <button @click="showImportModal = false" class="btn-close">×</button>
        </div>
        
        <div class="modal-body">
          <div class="import-area">
            <input 
              type="file" 
              ref="fileInput" 
              @change="handleFileImport" 
              accept=".json"
              style="display: none"
            />
            <div class="drop-zone" @click="$refs.fileInput.click()">
              <p>点击选择文件或拖拽文件到此处</p>
              <p class="file-hint">支持 JSON 格式的剧本文件</p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="showImportModal = false" class="btn-secondary">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import scriptManager from '../../utils/scriptManager';

export default {
  name: 'ScriptManager',
  data() {
    return {
      loading: false,
      activeTab: 'official',
      showCreateModal: false,
      showEditModal: false,
      showImportModal: false,
      scripts: {
        official: [],
        custom: [],
        templates: []
      },
      scriptForm: {
        id: '',
        name: '',
        author: '',
        description: '',
        level: 'Beginner',
        roles: []
      },
      editingScript: null,
      tabs: [
        { key: 'official', name: '官方剧本' },
        { key: 'custom', name: '自定义剧本' },
        { key: 'templates', name: '模板剧本' }
      ]
    };
  },
  
  computed: {
    townsfolkRoles() {
      return this.$store.getters.rolesJSONbyId ? 
        Array.from(this.$store.getters.rolesJSONbyId.values()).filter(role => role.team === 'townsfolk') : [];
    },
    outsiderRoles() {
      return this.$store.getters.rolesJSONbyId ? 
        Array.from(this.$store.getters.rolesJSONbyId.values()).filter(role => role.team === 'outsider') : [];
    },
    minionRoles() {
      return this.$store.getters.rolesJSONbyId ? 
        Array.from(this.$store.getters.rolesJSONbyId.values()).filter(role => role.team === 'minion') : [];
    },
    demonRoles() {
      return this.$store.getters.rolesJSONbyId ? 
        Array.from(this.$store.getters.rolesJSONbyId.values()).filter(role => role.team === 'demon') : [];
    }
  },
  
  async mounted() {
    await this.loadScripts();
  },
  
  methods: {
    async loadScripts() {
      this.loading = true;
      try {
        this.scripts = await scriptManager.getAllScripts();
      } catch (error) {
        console.error('加载剧本失败:', error);
      } finally {
        this.loading = false;
      }
    },
    
    getCurrentScripts() {
      return this.scripts[this.activeTab] || [];
    },
    
    getScriptCount(tabKey) {
      return this.scripts[tabKey] ? this.scripts[tabKey].length : 0;
    },
    
    getCurrentTabName() {
      const tab = this.tabs.find(t => t.key === this.activeTab);
      return tab ? tab.name : '';
    },
    
    editScript(script) {
      this.editingScript = script;
      this.scriptForm = {
        id: script.id,
        name: script.name,
        author: script.author,
        description: script.description || '',
        level: script.level || 'Beginner',
        roles: script.roles || []
      };
      this.showEditModal = true;
    },
    
    async saveScript() {
      try {
        if (this.showEditModal) {
          await scriptManager.updateScript(this.editingScript.id, this.scriptForm, 'custom');
        } else {
          await scriptManager.createScript(this.scriptForm, 'custom');
        }
        
        await this.loadScripts();
        this.closeModal();
        this.$emit('script-updated');
      } catch (error) {
        console.error('保存剧本失败:', error);
        alert('保存剧本失败: ' + error.message);
      }
    },
    
    async deleteScript(script) {
      if (!confirm(`确定要删除剧本 "${script.name}" 吗？`)) {
        return;
      }
      
      try {
        await scriptManager.deleteScript(script.id, 'custom');
        await this.loadScripts();
        this.$emit('script-updated');
      } catch (error) {
        console.error('删除剧本失败:', error);
        alert('删除剧本失败: ' + error.message);
      }
    },
    
    async exportScript(script) {
      try {
        await scriptManager.exportScript(script.id, 'custom');
      } catch (error) {
        console.error('导出剧本失败:', error);
        alert('导出剧本失败: ' + error.message);
      }
    },
    
    handleFileImport(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      scriptManager.importScript(file, 'custom')
        .then(result => {
          if (result.success) {
            this.loadScripts();
            this.showImportModal = false;
            this.$emit('script-updated');
            alert('剧本导入成功！');
          } else {
            alert('剧本导入失败: ' + result.error);
          }
        })
        .catch(error => {
          console.error('导入剧本失败:', error);
          alert('导入剧本失败: ' + error.message);
        });
    },
    
    closeModal() {
      this.showCreateModal = false;
      this.showEditModal = false;
      this.editingScript = null;
      this.scriptForm = {
        id: '',
        name: '',
        author: '',
        description: '',
        level: 'Beginner',
        roles: []
      };
    },
    
    formatDate(dateString) {
      if (!dateString) return '未知';
      return new Date(dateString).toLocaleDateString('zh-CN');
    }
  }
};
</script>

<style scoped>
.script-manager {
  padding: 20px;
}

.script-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.script-tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab-btn.active {
  border-bottom-color: #007bff;
  color: #007bff;
}

.tab-count {
  font-size: 0.8em;
  color: #666;
}

.script-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.script-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background: white;
}

.script-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.script-header h3 {
  margin: 0;
  color: #333;
}

.script-actions {
  display: flex;
  gap: 5px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
}

.btn-icon:hover {
  background: #f0f0f0;
}

.script-info {
  margin-bottom: 15px;
}

.script-info p {
  margin: 5px 0;
  font-size: 0.9em;
  color: #666;
}

.script-description {
  font-style: italic;
  color: #888;
}

.script-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8em;
  color: #999;
}

.script-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7em;
}

.script-badge.official {
  background: #28a745;
  color: white;
}

.script-badge.custom {
  background: #007bff;
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.roles-selector {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

.role-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.role-category h4 {
  margin: 0 0 10px 0;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.role-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
  cursor: pointer;
}

.role-item input[type="checkbox"] {
  margin: 0;
}

.import-area {
  text-align: center;
}

.drop-zone {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.drop-zone:hover {
  border-color: #007bff;
}

.file-hint {
  font-size: 0.8em;
  color: #666;
  margin-top: 10px;
}

.loading,
.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary:hover {
  background: #545b62;
}
</style> 