<template>
  <div class="category-management-panel">
    <div class="panel-header">
      <h3>分类管理</h3>
      <button @click="showAddModal = true" class="add-btn">
        <span>+</span> 添加分类
      </button>
    </div>

    <div class="categories-list">
      <div v-if="isLoading" class="loading-state">
        <p>加载中...</p>
      </div>

      <div v-else-if="categories.length === 0" class="empty-state">
        <p>暂无分类</p>
      </div>

      <div v-else class="categories-grid">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-item"
          :class="{ 'inactive': !category.isActive }"
        >
          <div class="category-header">
            <div class="category-color" :style="{ backgroundColor: category.color }"></div>
            <div class="category-info">
              <h4>{{ category.name }}</h4>
              <p class="description">{{ category.description }}</p>
              <div class="category-meta">
                <span class="id">ID: {{ category.id }}</span>
                <span class="status" :class="category.isActive ? 'active' : 'inactive'">
                  {{ category.isActive ? '启用' : '禁用' }}
                </span>
              </div>
            </div>
          </div>

          <div class="category-actions">
            <button
              @click="editCategory(category)"
              class="edit-btn"
            >
              编辑
            </button>
            <button
              @click="toggleCategoryStatus(category)"
              :class="category.isActive ? 'disable-btn' : 'enable-btn'"
            >
              {{ category.isActive ? '禁用' : '启用' }}
            </button>
            <button
              @click="deleteCategory(category)"
              class="delete-btn"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑分类模态框 -->
    <div
      v-if="showAddModal || showEditModal"
      class="modal-backdrop"
      @click="closeModal"
    >
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ showEditModal ? '编辑分类' : '添加分类' }}</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>

        <div class="modal-content">
          <form @submit.prevent="saveCategory">
            <div class="form-group">
              <label>分类名称 *</label>
              <input
                v-model="formData.name"
                type="text"
                required
                placeholder="请输入分类名称"
              />
            </div>

            <div class="form-group">
              <label>分类描述 *</label>
              <textarea
                v-model="formData.description"
                required
                placeholder="请输入分类描述"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label>分类颜色</label>
              <div class="color-picker">
                <input
                  v-model="formData.color"
                  type="color"
                  class="color-input"
                />
                <span class="color-preview" :style="{ backgroundColor: formData.color }"></span>
              </div>
            </div>



            <div class="form-actions">
              <button type="button" @click="closeModal" class="cancel-btn">
                取消
              </button>
              <button type="submit" class="save-btn">
                {{ showEditModal ? '更新' : '添加' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 删除确认模态框 -->
    <div
      v-if="showDeleteModal"
      class="modal-backdrop"
      @click="showDeleteModal = false"
    >
      <div class="modal delete-confirm-modal" @click.stop>
        <div class="modal-header">
          <h3>确认删除</h3>
          <button @click="showDeleteModal = false" class="close-btn">&times;</button>
        </div>

        <div class="modal-content">
          <p>确定要删除分类 "{{ categoryToDelete?.name }}" 吗？</p>
          <p class="warning">此操作不可撤销！</p>

          <div class="form-actions">
            <button @click="showDeleteModal = false" class="cancel-btn">
              取消
            </button>
            <button @click="confirmDelete" class="delete-btn">
              确认删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import systemAPI from '@/utils/systemAPI';

export default {
  name: 'CategoryManagementPanel',
  data() {
    return {
      categories: [],
      isLoading: false,
      showAddModal: false,
      showEditModal: false,
      showDeleteModal: false,
      categoryToDelete: null,
      formData: {
        name: '',
        description: '',
        color: '#4CAF50'
      }
    };
  },
  async mounted() {
    await this.loadCategories();
  },
  methods: {
    async loadCategories() {
      try {
        this.isLoading = true;
        this.categories = await systemAPI.getCategories();
      } catch (error) {
        console.error('加载分类失败:', error);
        alert('加载分类失败: ' + error.message);
      } finally {
        this.isLoading = false;
      }
          },

      editCategory(category) {
        this.formData = {
          name: category.name,
          description: category.description,
          color: category.color
        };
        this.categoryToDelete = category;
        this.showEditModal = true;
      },

      async toggleCategoryStatus(category) {
        try {
          await systemAPI.updateCategory(category.id, {
            isActive: !category.isActive
          });
          await this.loadCategories();
        } catch (error) {
          console.error('切换分类状态失败:', error);
          alert('切换分类状态失败: ' + error.message);
        }
      },

      deleteCategory(category) {
        this.categoryToDelete = category;
        this.showDeleteModal = true;
      },

      async confirmDelete() {
        try {
          await systemAPI.deleteCategory(this.categoryToDelete.id);
          this.showDeleteModal = false;
          this.categoryToDelete = null;
          await this.loadCategories();
        } catch (error) {
          console.error('删除分类失败:', error);
          alert('删除分类失败: ' + error.message);
        }
      },

      closeModal() {
        this.showAddModal = false;
        this.showEditModal = false;
        this.resetForm();
      },

      resetForm() {
        this.formData = {
          name: '',
          description: '',
          color: '#4CAF50'
        };
        this.categoryToDelete = null;
      },

      async saveCategory() {
        try {
          if (this.showEditModal) {
            await systemAPI.updateCategory(this.categoryToDelete.id, this.formData);
          } else {
            await systemAPI.addCategory(this.formData);
          }
          
          this.closeModal();
          await this.loadCategories();
        } catch (error) {
          console.error('保存分类失败:', error);
          alert('保存分类失败: ' + error.message);
        }
      },


    }
  };
</script>

<style scoped>
.category-management-panel {
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.add-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.add-btn:hover {
  background: #45a049;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.category-item {
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 8px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.category-item:hover {
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.4);
}

.category-item.default {
  border-color: rgba(255, 215, 0, 0.4);
  background: rgba(255, 215, 0, 0.1);
}

.category-item.inactive {
  opacity: 0.6;
  background: rgba(255, 255, 255, 0.02);
}

.category-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 15px;
}

.category-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 2px;
}

.category-info h4 {
  margin: 0 0 5px 0;
  color: #ffd700;
  font-size: 16px;
}

.description {
  margin: 0 0 10px 0;
  color: #ccc;
  font-size: 14px;
  line-height: 1.4;
}

.category-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #aaa;
}

.status.active {
  color: #4CAF50;
}

.status.inactive {
  color: #f44336;
}

.default-badge {
  background: rgba(255, 215, 0, 0.8);
  color: #000;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
}

.category-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.category-actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.edit-btn {
  background: rgba(255, 215, 0, 0.8);
  color: #000;
}

.edit-btn:hover {
  background: rgba(255, 215, 0, 1);
}

.enable-btn {
  background: rgba(76, 175, 80, 0.8);
  color: white;
}

.enable-btn:hover {
  background: rgba(76, 175, 80, 1);
}

.disable-btn {
  background: rgba(255, 152, 0, 0.8);
  color: white;
}

.disable-btn:hover {
  background: rgba(255, 152, 0, 1);
}

.delete-btn {
  background: rgba(244, 67, 54, 0.8);
  color: white;
}

.delete-btn:hover {
  background: rgba(244, 67, 54, 1);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 40px;
  color: #ccc;
}

/* 模态框样式 */
.modal-backdrop {
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
  background: rgba(40, 40, 40, 0.95);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #ffd700;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #ccc;
}

.close-btn:hover {
  color: #ffd700;
}

.modal-content {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #ccc;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 4px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: rgba(255, 215, 0, 0.8);
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-input {
  width: 50px;
  height: 40px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.color-preview {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.cancel-btn {
  padding: 8px 16px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.save-btn {
  padding: 8px 16px;
  border: none;
  background: rgba(76, 175, 80, 0.8);
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn:hover {
  background: rgba(76, 175, 80, 1);
}

.delete-confirm-modal .modal-content {
  text-align: center;
}

.warning {
  color: #ff6b6b;
  font-weight: 500;
  margin: 10px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-input {
  width: auto;
  margin: 0;
}

.checkbox-text {
  font-weight: normal;
  color: #ccc;
}
</style> 