<template>
  <div class="series-manager">
    <div class="manager-header">
      <h3>剧本系列管理</h3>
      <div class="header-actions">
        <button @click="createSeries" class="create-btn">创建系列</button>
        <button @click="refreshSeries" class="refresh-btn">刷新</button>
      </div>
    </div>

    <div class="series-list">
      <div v-for="series in seriesList" :key="series.id" class="series-item">
        <div class="series-header">
          <h4>{{ series.name }}</h4>
          <div class="series-meta">
            <span class="version-count"
              >{{ series.versions.length }} 个版本</span
            >
            <span class="latest-version"
              >最新: v{{ getLatestVersion(series) }}</span
            >
          </div>
        </div>

        <div class="versions-list">
          <div
            v-for="version in series.versions"
            :key="version.id"
            class="version-item"
            :class="{ latest: version.isLatest }"
          >
            <div class="version-info">
              <span class="version-number">v{{ version.version }}</span>
              <span class="version-date">{{
                formatDate(version.createdAt)
              }}</span>
              <span class="version-status" :class="version.status">
                {{ getStatusText(version.status) }}
              </span>
            </div>
            <div class="version-actions">
              <button @click="editVersion(version)" class="edit-btn">
                编辑
              </button>
              <button
                @click="setAsLatest(version)"
                v-if="!version.isLatest"
                class="latest-btn"
              >
                设为最新
              </button>
              <button @click="deleteVersion(version)" class="delete-btn">
                删除
              </button>
            </div>
          </div>
        </div>

        <div class="series-actions">
          <button @click="addVersion(series)" class="add-version-btn">
            添加版本
          </button>
          <button @click="editSeries(series)" class="edit-series-btn">
            编辑系列
          </button>
          <button @click="deleteSeries(series)" class="delete-series-btn">
            删除系列
          </button>
        </div>
      </div>
    </div>

    <!-- 创建系列模态框 -->
    <div
      v-if="showCreateModal"
      class="modal-backdrop"
      @click="closeCreateModal"
    >
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>创建剧本系列</h3>
          <button @click="closeCreateModal" class="close-btn">&times;</button>
        </div>

        <div class="modal-content">
          <div class="form-group">
            <label>系列名称</label>
            <input
              v-model="newSeries.name"
              type="text"
              placeholder="例如：暗流涌动"
            />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea
              v-model="newSeries.description"
              placeholder="系列描述"
            ></textarea>
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model="newSeries.category">
              <option value="custom">自制剧本</option>
              <option value="official">官方剧本</option>
              <option value="mixed">混合剧本</option>
              <option value="event">节日活动</option>
              <option value="overseas">海外剧本</option>
            </select>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeCreateModal" class="cancel-btn">取消</button>
          <button @click="confirmCreateSeries" class="confirm-btn">创建</button>
        </div>
      </div>
    </div>

    <!-- 添加版本模态框 -->
    <div
      v-if="showVersionModal"
      class="modal-backdrop"
      @click="closeVersionModal"
    >
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>添加版本到 {{ selectedSeries?.name }}</h3>
          <button @click="closeVersionModal" class="close-btn">&times;</button>
        </div>

        <div class="modal-content">
          <div class="form-group">
            <label>版本号</label>
            <input
              v-model="newVersion.version"
              type="text"
              placeholder="例如：2.0"
            />
          </div>
          <div class="form-group">
            <label>版本描述</label>
            <textarea
              v-model="newVersion.description"
              placeholder="版本更新说明"
            ></textarea>
          </div>
          <div class="form-group">
            <label>剧本文件</label>
            <input type="file" @change="handleFileUpload" accept=".json" />
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeVersionModal" class="cancel-btn">取消</button>
          <button @click="confirmAddVersion" class="confirm-btn">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import scriptAPI from "@/utils/scriptAPI";

export default {
  name: "ScriptSeriesManager",
  data() {
    return {
      seriesList: [],
      showCreateModal: false,
      showVersionModal: false,
      selectedSeries: null,
      newSeries: {
        name: "",
        description: "",
        category: "custom",
      },
      newVersion: {
        version: "",
        description: "",
        file: null,
      },
      isLoading: false,
    };
  },
  async mounted() {
    await this.loadSeries();
  },
  methods: {
    async loadSeries() {
      try {
        this.isLoading = true;
        const result = await scriptAPI.getScriptSeries();

        if (result.success) {
          this.seriesList = result.data;
        } else {
          console.error("加载系列失败:", result.error);
        }
      } catch (error) {
        console.error("加载系列错误:", error);
      } finally {
        this.isLoading = false;
      }
    },

    createSeries() {
      this.newSeries = {
        name: "",
        description: "",
        category: "custom",
      };
      this.showCreateModal = true;
    },

    async confirmCreateSeries() {
      try {
        const result = await scriptAPI.createScriptSeries(this.newSeries);
        if (result.success) {
          await this.loadSeries();
          this.closeCreateModal();
          alert("系列创建成功");
        } else {
          alert("创建失败: " + result.error);
        }
      } catch (error) {
        console.error("创建系列失败:", error);
        alert("创建失败，请重试");
      }
    },

    closeCreateModal() {
      this.showCreateModal = false;
    },

    addVersion(series) {
      this.selectedSeries = series;
      this.newVersion = {
        version: "",
        description: "",
        file: null,
      };
      this.showVersionModal = true;
    },

    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.newVersion.file = file;
      }
    },

    async confirmAddVersion() {
      try {
        if (!this.newVersion.file) {
          alert("请选择剧本文件");
          return;
        }

        const formData = new FormData();
        formData.append("file", this.newVersion.file);
        formData.append("version", this.newVersion.version);
        formData.append("description", this.newVersion.description);
        formData.append("seriesId", this.selectedSeries.id);

        const result = await scriptAPI.addScriptVersion(formData);
        if (result.success) {
          await this.loadSeries();
          this.closeVersionModal();
          alert("版本添加成功");
        } else {
          alert("添加失败: " + result.error);
        }
      } catch (error) {
        console.error("添加版本失败:", error);
        alert("添加失败，请重试");
      }
    },

    closeVersionModal() {
      this.showVersionModal = false;
      this.selectedSeries = null;
    },

    async editVersion(version) {
      // TODO: 实现版本编辑功能
      console.log("编辑版本:", version);
    },

    async setAsLatest(version) {
      try {
        const result = await scriptAPI.setLatestVersion(version.id);
        if (result.success) {
          await this.loadSeries();
          alert("已设为最新版本");
        } else {
          alert("操作失败: " + result.error);
        }
      } catch (error) {
        console.error("设置最新版本失败:", error);
        alert("操作失败，请重试");
      }
    },

    async deleteVersion(version) {
      if (!confirm("确定要删除这个版本吗？此操作不可撤销。")) {
        return;
      }

      try {
        const result = await scriptAPI.deleteScriptVersion(version.id);
        if (result.success) {
          await this.loadSeries();
          alert("版本删除成功");
        } else {
          alert("删除失败: " + result.error);
        }
      } catch (error) {
        console.error("删除版本失败:", error);
        alert("删除失败，请重试");
      }
    },

    async editSeries(series) {
      // TODO: 实现系列编辑功能
      console.log("编辑系列:", series);
    },

    async deleteSeries(series) {
      if (!confirm("确定要删除这个系列吗？此操作不可撤销。")) {
        return;
      }

      try {
        const result = await scriptAPI.deleteScriptSeries(series.id);
        if (result.success) {
          await this.loadSeries();
          alert("系列删除成功");
        } else {
          alert("删除失败: " + result.error);
        }
      } catch (error) {
        console.error("删除系列失败:", error);
        alert("删除失败，请重试");
      }
    },

    async refreshSeries() {
      await this.loadSeries();
    },

    getLatestVersion(series) {
      const latest = series.versions.find((v) => v.isLatest);
      return latest ? latest.version : "未知";
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
  },
};
</script>

<style scoped lang="scss">
.series-manager {
  padding: 20px;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    color: #fff;
    font-size: 18px;
  }

  .header-actions {
    display: flex;
    gap: 10px;

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;

      &.create-btn {
        background: #27ae60;
        color: #fff;

        &:hover {
          background: #229954;
        }
      }

      &.refresh-btn {
        background: #4a90e2;
        color: #fff;

        &:hover {
          background: #357abd;
        }
      }
    }
  }
}

.series-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.series-item {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;

  .series-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;

    h4 {
      margin: 0;
      color: #fff;
      font-size: 16px;
    }

    .series-meta {
      display: flex;
      gap: 15px;
      font-size: 12px;
      color: #ccc;

      .version-count {
        color: #4a90e2;
      }

      .latest-version {
        color: #27ae60;
      }
    }
  }

  .versions-list {
    margin-bottom: 15px;

    .version-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: #333;
      border-radius: 4px;
      margin-bottom: 8px;

      &.latest {
        border-left: 4px solid #27ae60;
      }

      .version-info {
        display: flex;
        gap: 15px;
        align-items: center;

        .version-number {
          color: #fff;
          font-weight: bold;
        }

        .version-date {
          color: #ccc;
          font-size: 12px;
        }

        .version-status {
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

      .version-actions {
        display: flex;
        gap: 8px;

        button {
          padding: 4px 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;

          &.edit-btn {
            background: #4a90e2;
            color: #fff;

            &:hover {
              background: #357abd;
            }
          }

          &.latest-btn {
            background: #f39c12;
            color: #fff;

            &:hover {
              background: #e67e22;
            }
          }

          &.delete-btn {
            background: #e74c3c;
            color: #fff;

            &:hover {
              background: #c0392b;
            }
          }
        }
      }
    }
  }

  .series-actions {
    display: flex;
    gap: 10px;

    button {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;

      &.add-version-btn {
        background: #27ae60;
        color: #fff;

        &:hover {
          background: #229954;
        }
      }

      &.edit-series-btn {
        background: #4a90e2;
        color: #fff;

        &:hover {
          background: #357abd;
        }
      }

      &.delete-series-btn {
        background: #e74c3c;
        color: #fff;

        &:hover {
          background: #c0392b;
        }
      }
    }
  }
}

.modal-backdrop {
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

.modal {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
  min-width: 400px;
  max-width: 500px;
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

  .modal-content {
    margin-bottom: 20px;

    .form-group {
      margin-bottom: 15px;

      label {
        display: block;
        margin-bottom: 5px;
        color: #ccc;
        font-size: 14px;
      }

      input,
      select,
      textarea {
        width: 100%;
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

      textarea {
        height: 80px;
        resize: vertical;
      }
    }
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;

      &.cancel-btn {
        background: #666;
        color: #fff;

        &:hover {
          background: #555;
        }
      }

      &.confirm-btn {
        background: #27ae60;
        color: #fff;

        &:hover {
          background: #229954;
        }
      }
    }
  }
}
</style>
