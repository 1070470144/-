<template>
  <div v-if="show" class="script-edit-backdrop" @click="closeModal">
    <div class="script-edit-modal" @click.stop>
      <div class="modal-header">
        <h3>编辑剧本</h3>
        <button @click="closeModal" class="close-btn">×</button>
      </div>

      <div class="modal-content">
        <form @submit.prevent="saveScript" class="edit-form">
          <div class="form-group">
            <label>剧本名称</label>
            <input 
              v-model="formData.name" 
              type="text" 
              required 
              placeholder="请输入剧本名称"
            />
          </div>

          <div class="form-group">
            <label>作者</label>
            <input 
              v-model="formData.author" 
              type="text" 
              placeholder="请输入作者名称"
            />
          </div>

          <div class="form-group">
            <label>分类</label>
            <select v-model="formData.category" required>
              <option value="">请选择分类</option>
              <option 
                v-for="category in categories" 
                :key="category.id" 
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>剧本介绍</label>
            <textarea 
              v-model="formData.description" 
              rows="4" 
              placeholder="请输入剧本介绍"
            ></textarea>
          </div>

          <div class="form-group">
            <label>状态</label>
            <select v-model="formData.status">
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>

          <div class="form-group" v-if="formData.status === 'rejected'">
            <label>拒绝原因</label>
            <textarea 
              v-model="formData.reviewNote" 
              rows="3" 
              placeholder="请输入拒绝原因"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-btn">
              取消
            </button>
            <button type="submit" class="save-btn" :disabled="isSaving">
              {{ isSaving ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import systemAPI from '@/utils/systemAPI'

export default {
  name: 'ScriptEditModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    script: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      formData: {
        name: '',
        author: '',
        category: '',
        description: '',
        status: 'pending',
        reviewNote: ''
      },
      categories: [],
      isSaving: false
    }
  },
  watch: {
    show(newVal) {
      if (newVal && this.script) {
        this.initFormData()
      }
    },
    script: {
      handler(newVal) {
        if (newVal && this.show) {
          this.initFormData()
        }
      },
      immediate: true,
      deep: true
    }
  },
  async mounted() {
    console.log('ScriptEditModal mounted, props:', { show: this.show, script: this.script })
    await this.loadCategories()
  },
  methods: {
    async loadCategories() {
      try {
        const result = await systemAPI.getCategories()
        if (result.success) {
          this.categories = result.data.categories || []
        }
      } catch (error) {
        console.error('加载分类失败:', error)
      }
    },
    
    initFormData() {
      if (!this.script) return
      
      console.log('初始化表单数据，剧本:', this.script)
      
      this.formData = {
        name: this.script.name || '',
        author: this.script.author || '',
        category: this.script.category || '',
        description: this.script.description || '',
        status: this.script.status || 'pending',
        reviewNote: this.script.reviewNote || ''
      }
      
      console.log('表单数据已初始化:', this.formData)
    },
    
    async saveScript() {
      if (!this.script) return
      
      try {
        this.isSaving = true
        
        // 构建更新数据
        const updateData = {
          ...this.formData,
          id: this.script.id
        }
        
        // 触发保存事件
        this.$emit('save', updateData)
        
      } catch (error) {
        console.error('保存失败:', error)
        alert('保存失败')
      } finally {
        this.isSaving = false
      }
    },
    
    closeModal() {
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.script-edit-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.script-edit-modal {
  background: #1a1a1a;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  background: rgba(255, 255, 255, 0.05);
}

.modal-header h3 {
  color: #ffd700;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.modal-content {
  padding: 20px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #ffd700;
  font-size: 14px;
  font-weight: bold;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: rgba(255, 215, 0, 0.6);
  background: rgba(0, 0, 0, 0.9);
}

.form-group select option {
  background: #1a1a1a;
  color: #fff;
  padding: 8px 12px;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 215, 0, 0.2);
}

.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

.save-btn {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
}

.save-btn:hover:not(:disabled) {
  background: rgba(255, 215, 0, 0.3);
  border-color: rgba(255, 215, 0, 0.5);
}

.save-btn:disabled {
  background: rgba(255, 215, 0, 0.1);
  color: #ccc;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .script-edit-modal {
    width: 95%;
    max-height: 95vh;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style> 