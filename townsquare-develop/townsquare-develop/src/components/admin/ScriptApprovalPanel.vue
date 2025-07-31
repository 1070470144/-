<template>
  <div class="approval-panel">
    <div class="panel-header">
      <h3>剧本审核</h3>
      <div class="filter-controls">
        <select v-model="statusFilter" @change="filterScripts">
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
        </select>
      </div>
    </div>

    <div class="scripts-list">
      <!-- 空状态显示 -->
      <div v-if="!isLoading && filteredScripts.length === 0" class="empty-state">
        <p>暂无待审核剧本</p>
        <p v-if="scripts.length > 0">当前筛选条件下没有匹配的剧本</p>
        <p v-else>没有找到任何待审核的剧本</p>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <p>加载中...</p>
      </div>
      
      <!-- 剧本列表 -->
      <div
        v-for="script in filteredScripts"
        :key="script.id"
        class="script-item"
        :class="script.status"
      >
        <div class="script-header">
          <h4>{{ script.name }}</h4>
          <div class="script-meta">
            <span class="author">作者: {{ script.author || "未知" }}</span>
            <span class="upload-time">{{ formatDate(script.uploadedAt) }}</span>
            <span class="status" :class="script.status">
              {{ getStatusText(script.status) }}
            </span>
          </div>
        </div>

        <div class="script-content">
          <p class="description">{{ script.description || "暂无描述" }}</p>
          <div class="script-stats">
            <span>角色数量: {{ script.roles?.length || 0 }}</span>
            <span>难度: {{ script.level || "Intermediate" }}</span>
            <span>分类: {{ getCategoryName(script.category) }}</span>
          </div>
        </div>

        <div class="script-actions">
          <button
            v-if="script.status === 'pending'"
            @click="approveScript(script.id)"
            class="approve-btn"
          >
            通过
          </button>
          <button
            v-if="script.status === 'pending'"
            @click="rejectScript(script.id)"
            class="reject-btn"
          >
            拒绝
          </button>
          <button @click="viewScript(script)" class="view-btn">查看详情</button>
          <button @click="editScript(script)" class="edit-btn">编辑</button>
        </div>
      </div>
    </div>

    <!-- 剧本详情模态框 -->
    <div
      v-if="showScriptModal"
      class="script-modal-backdrop"
      @click="closeScriptModal"
    >
      <div class="script-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedScript?.name }}</h3>
          <button @click="closeScriptModal" class="close-btn">&times;</button>
        </div>

        <div class="modal-content">
          <div class="script-details">
            <div class="detail-item">
              <label>作者:</label>
              <span>{{ selectedScript?.author || "未知" }}</span>
            </div>
            <div class="detail-item">
              <label>分类:</label>
              <span>{{ getCategoryName(selectedScript?.category) }}</span>
            </div>
            <div class="detail-item">
              <label>难度:</label>
              <span>{{ selectedScript?.level || "Intermediate" }}</span>
            </div>
            <div class="detail-item">
              <label>角色数量:</label>
              <span>{{ selectedScript?.roles?.length || 0 }}</span>
            </div>
            <div class="detail-item">
              <label>描述:</label>
              <p>{{ selectedScript?.description || "暂无描述" }}</p>
            </div>
            <div class="detail-item">
              <label>角色列表:</label>
              <div class="roles-list">
                <span
                  v-for="role in selectedScript?.roles"
                  :key="role"
                  class="role-tag"
                >
                  {{ role }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import scriptAPI from "@/utils/scriptAPI";

export default {
  name: "ScriptApprovalPanel",
  data() {
    return {
      scripts: [],
      statusFilter: "",
      showScriptModal: false,
      selectedScript: null,
      isLoading: false,
    };
  },
  computed: {
    filteredScripts() {
      if (!this.statusFilter) {
        return this.scripts;
      }
      return this.scripts.filter(
        (script) => script.status === this.statusFilter,
      );
    },
  },
  async mounted() {
    await this.loadScripts();
  },
  methods: {
    async loadScripts() {
      try {
        this.isLoading = true;

        const result = await scriptAPI.getPendingScripts();

        if (result && result.success) {
          this.scripts = result.data || [];
        } else {
          console.error("❌ 获取待审核剧本失败:", result?.error);
          this.scripts = [];
        }
      } catch (error) {
        console.error("❌ 加载待审核剧本错误:", error);
        this.scripts = [];
      } finally {
        this.isLoading = false;
      }
    },

    filterScripts() {
      // 筛选逻辑已在computed中处理
    },

    async approveScript(scriptId) {
      try {
        const result = await scriptAPI.updateScriptStatus(scriptId, "approved");
        if (result.success) {
          await this.loadScripts();
          this.$emit("script-updated");
        } else {
          alert("审核失败: " + result.error);
        }
      } catch (error) {
        console.error("审核失败:", error);
        alert("审核失败，请重试");
      }
    },

    async rejectScript(scriptId) {
      try {
        const result = await scriptAPI.updateScriptStatus(scriptId, "rejected");
        if (result.success) {
          await this.loadScripts();
          this.$emit("script-updated");
        } else {
          alert("拒绝失败: " + result.error);
        }
      } catch (error) {
        console.error("拒绝失败:", error);
        alert("拒绝失败，请重试");
      }
    },

    viewScript(script) {
      this.selectedScript = script;
      this.showScriptModal = true;
    },

    editScript(script) {
      // TODO: 实现编辑功能
      console.log("编辑剧本:", script);
    },

    closeScriptModal() {
      this.showScriptModal = false;
      this.selectedScript = null;
    },

    formatDate(dateString) {
      if (!dateString) return "未知";
      return new Date(dateString).toLocaleDateString("zh-CN");
    },

    getStatusText(status) {
      const statusMap = {
        pending: "待审核",
        approved: "已通过",
        rejected: "已拒绝",
      };
      return statusMap[status] || "未知";
    },

    getCategoryName(category) {
      const categoryNames = {
        official: "官方剧本",
        custom: "自制剧本",
        mixed: "混合剧本",
        event: "节日活动",
        overseas: "海外剧本",
      };
      return categoryNames[category] || "未知分类";
    },
  },
};
</script>

<style scoped lang="scss">
.approval-panel {
  padding: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    color: #fff;
    font-size: 18px;
  }

  .filter-controls {
    select {
      padding: 8px 12px;
      border: 1px solid #444;
      border-radius: 4px;
      background: #333;
      color: #fff;
      font-size: 14px;

      &:focus {
        outline: none;
        border-color: #666;
      }
    }
  }
}

.scripts-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.script-item {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #666;

  &.pending {
    border-left-color: #f39c12;
  }

  &.approved {
    border-left-color: #27ae60;
  }

  &.rejected {
    border-left-color: #e74c3c;
  }

  .script-header {
    margin-bottom: 15px;

    h4 {
      margin: 0 0 8px 0;
      color: #fff;
      font-size: 16px;
    }

    .script-meta {
      display: flex;
      gap: 15px;
      font-size: 12px;
      color: #ccc;

      .author {
        color: #4a90e2;
      }

      .status {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;

        &.pending {
          background: rgba(243, 156, 18, 0.2);
          color: #f39c12;
        }

        &.approved {
          background: rgba(39, 174, 96, 0.2);
          color: #27ae60;
        }

        &.rejected {
          background: rgba(231, 76, 60, 0.2);
          color: #e74c3c;
        }
      }
    }
  }

  .script-content {
    margin-bottom: 15px;

    .description {
      color: #ccc;
      font-size: 14px;
      line-height: 1.4;
      margin: 0 0 10px 0;
    }

    .script-stats {
      display: flex;
      gap: 15px;
      font-size: 12px;
      color: #888;
    }
  }

  .script-actions {
    display: flex;
    gap: 10px;

    button {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;

      &.approve-btn {
        background: #27ae60;
        color: #fff;

        &:hover {
          background: #229954;
        }
      }

      &.reject-btn {
        background: #e74c3c;
        color: #fff;

        &:hover {
          background: #c0392b;
        }
      }

      &.view-btn {
        background: #4a90e2;
        color: #fff;

        &:hover {
          background: #357abd;
        }
      }

      &.edit-btn {
        background: #666;
        color: #fff;

        &:hover {
          background: #555;
        }
      }
    }
  }
}

.script-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.script-modal {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
  min-width: 500px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      color: #fff;
      font-size: 18px;
    }

    .close-btn {
      background: none;
      border: none;
      color: #ccc;
      font-size: 24px;
      cursor: pointer;

      &:hover {
        color: #fff;
      }
    }
  }

  .script-details {
    .detail-item {
      margin-bottom: 15px;

      label {
        display: block;
        margin-bottom: 5px;
        color: #ccc;
        font-size: 14px;
        font-weight: bold;
      }

      span,
      p {
        color: #fff;
        font-size: 14px;
        margin: 0;
      }

      .roles-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .role-tag {
          padding: 4px 8px;
          background: #4a90e2;
          color: #fff;
          border-radius: 12px;
          font-size: 12px;
        }
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #ccc;
  
  p {
    margin: 10px 0;
    font-size: 16px;
  }
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
  color: #ccc;
  
  p {
    margin: 10px 0;
    font-size: 16px;
  }
}
</style>
