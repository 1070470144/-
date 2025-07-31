<template>
  <div class="embedded-admin-panel">
    <div class="admin-tabs">
      <button
        @click="activeTab = 'roles'"
        :class="{ active: activeTab === 'roles' }"
        class="tab-btn"
      >
        角色管理
      </button>
      <button
        @click="activeTab = 'scripts'"
        :class="{ active: activeTab === 'scripts' }"
        class="tab-btn"
      >
        剧本管理
      </button>
      <button
        @click="activeTab = 'approval'"
        :class="{ active: activeTab === 'approval' }"
        class="tab-btn"
      >
        剧本审核
      </button>
      <button
        @click="activeTab = 'users'"
        :class="{ active: activeTab === 'users' }"
        class="tab-btn"
      >
        用户管理
      </button>
      <button
        @click="activeTab = 'series'"
        :class="{ active: activeTab === 'series' }"
        class="tab-btn"
      >
        系列管理
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

      <div v-if="activeTab === 'scripts'" class="tab-content">
        <ScriptManager />
      </div>

      <div v-if="activeTab === 'approval'" class="tab-content">
        <ScriptApprovalPanel />
      </div>

      <div v-if="activeTab === 'users'" class="tab-content">
        <UserManagementPanel />
      </div>

      <div v-if="activeTab === 'series'" class="tab-content">
        <ScriptSeriesManager />
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
</template>

<script>
import RoleManager from "../admin/RoleManager.vue";
import ScriptManager from "../admin/ScriptManager.vue";
import ScriptApprovalPanel from "../admin/ScriptApprovalPanel.vue";
import UserManagementPanel from "../admin/UserManagementPanel.vue";
import ScriptSeriesManager from "../admin/ScriptSeriesManager.vue";

export default {
  name: "EmbeddedAdminPanel",
  components: {
    RoleManager,
    ScriptManager,
    ScriptApprovalPanel,
    UserManagementPanel,
    ScriptSeriesManager,
  },
  data() {
    return {
      activeTab: "roles",
    };
  },
  methods: {
    exportData() {
      const data = {
        roles: this.$store.getters.rolesJSONbyId,
        editions: this.$store.state.edition,
        timestamp: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `townsquare-data-${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    importData() {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result);
              console.log("导入的数据:", data);
              alert("数据导入成功！");
            } catch (error) {
              alert("数据格式错误：" + error.message);
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
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("townsquare-backup", JSON.stringify(backupData));
      alert("数据备份成功！");
    },
  },
};
</script>

<style scoped lang="scss">
.embedded-admin-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.admin-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  padding: 0 20px;

  .tab-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    padding: 15px 20px;
    font-family: "Papyrus", serif;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;

    &:hover {
      color: #ffd700;
      background: rgba(255, 215, 0, 0.1);
    }

    &.active {
      color: #ffd700;
      background: rgba(255, 215, 0, 0.15);

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: #ffd700;
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
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
    color: #ffd700;
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
    color: #ffd700;
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
      color: #ffd700;
      margin-bottom: 15px;
      font-size: 18px;
      text-shadow: 0 0 8px rgba(255, 215, 0, 0.2);
    }

    .action-btn {
      background: rgba(255, 215, 0, 0.15);
      border: 1px solid rgba(255, 215, 0, 0.4);
      color: #ffd700;
      padding: 12px 24px;
      margin-right: 12px;
      margin-bottom: 12px;
      border-radius: 6px;
      cursor: pointer;
      font-family: "Papyrus", serif;
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