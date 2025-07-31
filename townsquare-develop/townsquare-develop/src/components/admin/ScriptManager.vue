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
        <button @click="showBatchImport()" class="btn-secondary">
          批量导入JSON
        </button>
      </div>
    </div>

    <!-- 存储信息 -->
    <div class="storage-info">
      <div class="info-item">
        <span class="label">总剧本数:</span>
        <span class="value">{{ getTotalScriptCount() }}</span>
      </div>
      <div class="info-item">
        <span class="label">自定义剧本:</span>
        <span class="value">{{
          scripts.custom ? scripts.custom.length : 0
        }}</span>
      </div>
      <div class="info-item">
        <span class="label">官方剧本:</span>
        <span class="value">{{
          scripts.official ? scripts.official.length : 0
        }}</span>
      </div>
      <div class="info-item">
        <span class="label">模板剧本:</span>
        <span class="value">{{
          scripts.templates ? scripts.templates.length : 0
        }}</span>
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

    <!-- 分类筛选器 -->
    <div v-if="activeTab === 'custom'" class="category-filter">
      <label>分类筛选:</label>
      <select v-model="selectedCategory" @change="filterByCategory">
        <option value="">全部分类</option>
        <option v-for="(name, key) in categories" :key="key" :value="key">
          {{ name }}
        </option>
      </select>
    </div>

    <div class="script-list">
      <div v-if="loading" class="loading">正在加载剧本...</div>

      <div v-else-if="getCurrentScripts().length === 0" class="empty-state">
        <p>暂无{{ getCurrentTabName() }}剧本</p>
        <button
          v-if="activeTab === 'custom'"
          @click="showCreateModal = true"
          class="btn-primary"
        >
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
              <button
                @click="exportScript(script)"
                class="btn-icon"
                title="导出"
              >
                📤
              </button>
              <button
                @click="deleteScript(script)"
                class="btn-icon"
                title="删除"
              >
                🗑️
              </button>
            </div>
          </div>

          <div class="script-info">
            <p class="script-author">作者: {{ script.author }}</p>
            <p class="script-level">难度: {{ script.level }}</p>
            <p class="script-roles">
              角色数: {{ script.roles ? script.roles.length : 0 }}
            </p>
            <p class="script-description">
              {{ script.description || "暂无描述" }}
            </p>
            <p v-if="script.filePath" class="script-file-path">
              📁 文件: {{ getFileName(script.filePath) }}
            </p>
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
            <span v-if="script.category" class="script-badge category">
              {{ categories[script.category] || script.category }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑剧本模态框 -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ showEditModal ? "编辑剧本" : "创建新剧本" }}</h3>
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
                      <label
                        v-for="role in townsfolkRoles"
                        :key="role.id"
                        class="role-item"
                      >
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
                      <label
                        v-for="role in outsiderRoles"
                        :key="role.id"
                        class="role-item"
                      >
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
                      <label
                        v-for="role in minionRoles"
                        :key="role.id"
                        class="role-item"
                      >
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
                      <label
                        v-for="role in demonRoles"
                        :key="role.id"
                        class="role-item"
                      >
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
            {{ showEditModal ? "更新" : "创建" }}
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
          <button @click="showImportModal = false" class="btn-secondary">
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 批量导入模态框 -->
    <div v-if="showBatchImportModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>批量导入JSON文件</h3>
          <button @click="showBatchImportModal = false" class="btn-close">
            ×
          </button>
        </div>

        <div class="modal-body">
          <div class="import-section">
            <div class="form-group">
              <label>选择分类:</label>
              <select v-model="importCategory">
                <option
                  v-for="(name, key) in categories"
                  :key="key"
                  :value="key"
                >
                  {{ name }}
                </option>
              </select>
            </div>

            <div class="file-upload">
              <input
                type="file"
                multiple
                accept=".json"
                @change="handleBatchImport"
                ref="batchImportInput"
                style="display: none"
              />
              <button
                @click="$refs.batchImportInput.click()"
                class="upload-btn"
              >
                选择JSON文件
              </button>
            </div>

            <div v-if="importResults.length > 0" class="import-results">
              <h4>导入结果:</h4>
              <div class="results-summary">
                <span class="summary-text">
                  总计: {{ importResults.length }} 个文件
                </span>
                <span class="summary-success">
                  成功: {{ importResults.filter((r) => r.success).length }} 个
                </span>
                <span class="summary-error">
                  失败: {{ importResults.filter((r) => !r.success).length }} 个
                </span>
              </div>
              <div
                v-for="result in importResults"
                :key="result.fileName"
                class="result-item"
              >
                <span :class="['status', result.success ? 'success' : 'error']">
                  {{ result.success ? "✓" : "✗" }}
                </span>
                <div class="result-details">
                  <div class="file-name">{{ result.fileName }}</div>
                  <div v-if="result.success" class="script-info">
                    <span class="script-name">{{ result.scriptName }}</span>
                    <span class="role-count"
                      >({{ result.roleCount }} 个角色)</span
                    >
                  </div>
                  <div v-else class="error-message">{{ result.error }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showBatchImportModal = false" class="btn-secondary">
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import scriptImporter from "../../utils/scriptImporter";
import scriptAPI from "../../utils/scriptAPI";

export default {
  name: "ScriptManager",
  data() {
    return {
      loading: false,
      activeTab: "official",
      showCreateModal: false,
      showEditModal: false,
      showImportModal: false,
      showBatchImportModal: false,
      scripts: {
        official: [],
        custom: [],
        templates: [],
      },
      scriptForm: {
        id: "",
        name: "",
        author: "",
        description: "",
        level: "Beginner",
        roles: [],
        category: "mixed",
      },
      editingScript: null,
      selectedCategory: "",
      importCategory: "mixed",
      importResults: [],
      categories: scriptImporter.getCategories(),
      tabs: [
        { key: "official", name: "官方剧本" },
        { key: "custom", name: "自定义剧本" },
        { key: "templates", name: "模板剧本" },
      ],
    };
  },

  computed: {
    townsfolkRoles() {
      return this.$store.getters.rolesJSONbyId
        ? Array.from(this.$store.getters.rolesJSONbyId.values()).filter(
            (role) => role.team === "townsfolk",
          )
        : [];
    },
    outsiderRoles() {
      return this.$store.getters.rolesJSONbyId
        ? Array.from(this.$store.getters.rolesJSONbyId.values()).filter(
            (role) => role.team === "outsider",
          )
        : [];
    },
    minionRoles() {
      return this.$store.getters.rolesJSONbyId
        ? Array.from(this.$store.getters.rolesJSONbyId.values()).filter(
            (role) => role.team === "minion",
          )
        : [];
    },
    demonRoles() {
      return this.$store.getters.rolesJSONbyId
        ? Array.from(this.$store.getters.rolesJSONbyId.values()).filter(
            (role) => role.team === "demon",
          )
        : [];
    },
  },

  async mounted() {
    await this.loadScripts();
  },

  methods: {
    async loadScripts() {
      this.loading = true;
      try {
        // 使用新的API系统
        const data = await scriptAPI.getAllScripts();
        this.scripts = data;

        // 确保所有分类都存在
        if (!this.scripts.custom) this.scripts.custom = [];
        if (!this.scripts.official) this.scripts.official = [];
        if (!this.scripts.templates) this.scripts.templates = [];

        console.log("剧本加载完成:", this.scripts);
      } catch (error) {
        console.error("加载剧本失败:", error);
        this.scripts = { custom: [], official: [], templates: [] };
      } finally {
        this.loading = false;
      }
    },

    getScriptCount(tabKey) {
      return this.scripts[tabKey] ? this.scripts[tabKey].length : 0;
    },

    getCurrentTabName() {
      const tab = this.tabs.find((t) => t.key === this.activeTab);
      return tab ? tab.name : "";
    },

    editScript(script) {
      this.editingScript = script;
      this.scriptForm = {
        id: script.id,
        name: script.name,
        author: script.author,
        description: script.description || "",
        level: script.level || "Beginner",
        roles: script.roles || [],
      };
      this.showEditModal = true;
    },

    async saveScript() {
      try {
        if (this.showEditModal) {
          const result = await scriptAPI.updateScript(
            this.editingScript.id,
            this.scriptForm,
            "custom",
          );
          if (!result.success) {
            throw new Error(result.error);
          }
        } else {
          const result = await scriptAPI.saveScript(this.scriptForm, "custom");
          if (!result.success) {
            throw new Error(result.error);
          }
        }

        await this.loadScripts();
        this.closeModal();
        this.$emit("script-updated");
      } catch (error) {
        console.error("保存剧本失败:", error);
        alert("保存剧本失败: " + error.message);
      }
    },

    async deleteScript(script) {
      if (!confirm(`确定要删除剧本 "${script.name}" 吗？`)) {
        return;
      }

      try {
        await scriptAPI.deleteScript(script.id, "custom");
        await this.loadScripts();
        this.$emit("script-updated");
      } catch (error) {
        console.error("删除剧本失败:", error);
        alert("删除剧本失败: " + error.message);
      }
    },

    async exportScript() {
      try {
        await scriptAPI.exportAllScripts();
      } catch (error) {
        console.error("导出剧本失败:", error);
        alert("导出剧本失败: " + error.message);
      }
    },

    async handleFileImport(event) {
      const file = event.target.files[0];
      if (!file) return;

      try {
        // 使用scriptImporter来处理JSON格式的剧本文件
        const result = await scriptImporter.importScriptFile(file, "custom");

        if (result.success) {
          await this.loadScripts();
          this.showImportModal = false;
          this.$emit("script-updated");
          alert(
            `剧本导入成功！\n剧本名称: ${result.script.name}\n角色数量: ${result.script.roles.length}`,
          );
        } else {
          alert("剧本导入失败: " + result.error);
        }
      } catch (error) {
        console.error("导入剧本失败:", error);
        alert("导入剧本失败: " + error.message);
      }
    },

    closeModal() {
      this.showCreateModal = false;
      this.showEditModal = false;
      this.editingScript = null;
      this.scriptForm = {
        id: "",
        name: "",
        author: "",
        description: "",
        level: "Beginner",
        roles: [],
      };
    },

    formatDate(dateString) {
      if (!dateString) return "未知";
      return new Date(dateString).toLocaleDateString("zh-CN");
    },

    getFileName(filePath) {
      if (!filePath) return "";
      return (
        filePath.split("/").pop() || filePath.split("\\").pop() || filePath
      );
    },

    getTotalScriptCount() {
      const custom = this.scripts.custom ? this.scripts.custom.length : 0;
      const official = this.scripts.official ? this.scripts.official.length : 0;
      const templates = this.scripts.templates
        ? this.scripts.templates.length
        : 0;
      return custom + official + templates;
    },

    // 分类筛选
    filterByCategory() {
      this.loadScripts();
    },

    // 获取当前显示的剧本（重写原有方法）
    getCurrentScripts() {
      if (this.activeTab === "custom" && this.selectedCategory) {
        return this.scripts.custom.filter(
          (script) => script.category === this.selectedCategory,
        );
      }
      return this.scripts[this.activeTab] || [];
    },

    // 批量导入
    async handleBatchImport(event) {
      const files = Array.from(event.target.files);
      this.importResults = [];

      let successCount = 0;
      let totalCount = files.length;

      for (const file of files) {
        try {
          const result = await scriptImporter.importScriptFile(
            file,
            this.importCategory,
          );

          this.importResults.push({
            fileName: file.name,
            success: result.success,
            error: result.error || "",
            scriptName: result.script ? result.script.name : "",
            roleCount: result.script ? result.script.roles.length : 0,
          });

          if (result.success) {
            successCount++;
          }
        } catch (error) {
          this.importResults.push({
            fileName: file.name,
            success: false,
            error: error.message,
            scriptName: "",
            roleCount: 0,
          });
        }
      }

      // 显示导入结果
      if (successCount > 0) {
        this.$message.success(`成功导入 ${successCount}/${totalCount} 个剧本`);
      }

      // 重新加载剧本列表
      await this.loadScripts();
    },

    // 显示批量导入模态框
    showBatchImport() {
      this.showBatchImportModal = true;
      this.importResults = [];
    },
  },
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

.storage-info {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  font-size: 14px;
}

.storage-info .info-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.storage-info .info-item .label {
  color: rgba(255, 255, 255, 0.7);
}

.storage-info .info-item .value {
  color: #ffd700;
  font-weight: bold;
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

.category-filter {
  margin: 15px 0;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;

  label {
    margin-right: 10px;
    color: #ffd700;
  }

  select {
    padding: 5px 10px;
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    color: white;

    &:focus {
      outline: none;
      border-color: #ffd700;
    }
  }
}

.script-badge.category {
  background: #17a2b8;
  color: white;
}

.import-section {
  .form-group {
    margin-bottom: 15px;
  }

  .file-upload {
    margin: 15px 0;

    .upload-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background: #218838;
      }
    }
  }

  .import-results {
    margin-top: 20px;
    padding: 15px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;

    h4 {
      color: #ffd700;
      margin-bottom: 10px;
    }

    .results-summary {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 4px;
      font-size: 14px;

      .summary-text {
        color: rgba(255, 255, 255, 0.8);
      }

      .summary-success {
        color: #28a745;
        font-weight: bold;
      }

      .summary-error {
        color: #dc3545;
        font-weight: bold;
      }
    }

    .result-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 8px;
      padding: 8px;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 4px;

      .status {
        margin-right: 10px;
        font-weight: bold;
        font-size: 16px;
        margin-top: 2px;

        &.success {
          color: #28a745;
        }

        &.error {
          color: #dc3545;
        }
      }

      .result-details {
        flex: 1;

        .file-name {
          font-weight: bold;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 2px;
        }

        .script-info {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);

          .script-name {
            color: #ffd700;
            margin-right: 5px;
          }

          .role-count {
            color: rgba(255, 255, 255, 0.6);
          }
        }

        .error-message {
          font-size: 12px;
          color: #dc3545;
        }
      }
    }
  }
}
</style>
