<template>
  <div class="edition-manager">
    <div class="edition-header">
      <h3>剧本管理</h3>
      <button @click="showAddEdition = true" class="add-btn">添加剧本</button>
    </div>

    <div class="edition-list">
      <div 
        v-for="edition in editions" 
        :key="edition.id" 
        class="edition-item"
      >
        <div class="edition-info">
          <h4>{{ edition.name }}</h4>
          <p class="edition-author">作者: {{ edition.author }}</p>
          <p class="edition-level">难度: {{ edition.level }}</p>
        </div>
        <div class="edition-actions">
          <button @click="editEdition(edition)" class="edit-btn">编辑</button>
          <button @click="deleteEdition(edition)" class="delete-btn">删除</button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑剧本模态框 -->
    <div v-if="showAddEdition || editingEdition" class="edition-modal">
      <div class="modal-content">
        <h3>{{ editingEdition ? '编辑剧本' : '添加剧本' }}</h3>
        
        <div class="form-group">
          <label>剧本ID:</label>
          <input v-model="editionForm.id" placeholder="剧本唯一标识符" />
        </div>
        
        <div class="form-group">
          <label>剧本名称:</label>
          <input v-model="editionForm.name" placeholder="剧本显示名称" />
        </div>
        
        <div class="form-group">
          <label>作者:</label>
          <input v-model="editionForm.author" placeholder="剧本作者" />
        </div>
        
        <div class="form-group">
          <label>难度:</label>
          <select v-model="editionForm.level">
            <option value="Beginner">初学者</option>
            <option value="Intermediate">中级</option>
            <option value="Veteran">高级</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>描述:</label>
          <textarea v-model="editionForm.description" placeholder="剧本描述"></textarea>
        </div>
        
        <div class="modal-actions">
          <button @click="saveEdition" class="save-btn">保存</button>
          <button @click="cancelEdit" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EditionManager',
  data() {
    return {
      showAddEdition: false,
      editingEdition: null,
      editionForm: {
        id: '',
        name: '',
        author: '',
        description: '',
        level: 'Beginner',
        roles: [],
        isOfficial: false
      }
    }
  },
  computed: {
    editions() {
      return this.$store.state.edition ? [this.$store.state.edition] : [];
    }
  },
  methods: {
    editEdition(edition) {
      this.editingEdition = edition;
      this.editionForm = {
        id: edition.id,
        name: edition.name,
        author: edition.author || '',
        description: edition.description || '',
        level: edition.level || 'Beginner',
        roles: edition.roles || [],
        isOfficial: edition.isOfficial || false
      };
    },
    saveEdition() {
      if (!this.editionForm.id || !this.editionForm.name) {
        alert('请填写必填字段：剧本ID和名称');
        return;
      }
      
      console.log('保存剧本:', this.editionForm);
      this.cancelEdit();
    },
    cancelEdit() {
      this.showAddEdition = false;
      this.editingEdition = null;
      this.editionForm = {
        id: '',
        name: '',
        author: '',
        description: '',
        level: 'Beginner',
        roles: [],
        isOfficial: false
      };
    },
    deleteEdition(edition) {
      if (confirm(`确定要删除剧本"${edition.name}"吗？`)) {
        console.log('删除剧本:', edition.id);
      }
    }
  }
}
</script>

<style scoped lang="scss">
.edition-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.edition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  
  h3 {
    color: #gold;
    margin: 0;
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

.edition-list {
  flex: 1;
  overflow-y: auto;
}

.edition-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 215, 0, 0.4);
  }
  
  .edition-info {
    h4 {
      margin: 0 0 10px 0;
      color: #gold;
      font-size: 18px;
    }
    
    .edition-author, .edition-level {
      margin: 0 0 5px 0;
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
    }
  }
  
  .edition-actions {
    margin-top: 15px;
    display: flex;
    gap: 8px;
    
    .edit-btn, .delete-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      font-family: 'Papyrus', serif;
    }
    
    .edit-btn {
      background: rgba(255, 215, 0, 0.2);
      color: #gold;
      
      &:hover {
        background: rgba(255, 215, 0, 0.3);
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

.edition-modal {
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
    
    h3 {
      color: #gold;
      margin-bottom: 20px;
    }
    
    .form-group {
      margin-bottom: 15px;
      
      label {
        display: block;
        margin-bottom: 5px;
        color: #gold;
        font-size: 14px;
      }
      
      input, select, textarea {
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