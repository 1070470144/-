<template>
  <div class="edition-manager">
    <div class="edition-header">
      <h3>剧本管理</h3>
      <button @click="showAddEdition = true" class="add-btn">添加剧本</button>
    </div>

    <div class="edition-list">
      <div v-for="edition in editions" :key="edition.id" class="edition-item">
        <div class="edition-info">
          <h4>{{ edition.name }}</h4>
          <p class="edition-author">作者: {{ edition.author }}</p>
          <p class="edition-level">难度: {{ edition.level }}</p>
          <p
            class="edition-type"
            :class="{
              official: edition.isOfficial,
              custom: !edition.isOfficial,
            }"
          >
            {{ edition.isOfficial ? "官方剧本" : "自定义剧本" }}
          </p>
        </div>
        <div class="edition-actions">
          <button
            v-if="!edition.isOfficial"
            @click="editEdition(edition)"
            class="edit-btn"
          >
            编辑
          </button>
          <button
            v-if="!edition.isOfficial"
            @click="deleteEdition(edition)"
            class="delete-btn"
          >
            删除
          </button>
          <span v-if="edition.isOfficial" class="official-note">官方剧本</span>
        </div>
      </div>
    </div>

    <!-- 添加/编辑剧本模态框 -->
    <div v-if="showAddEdition || editingEdition" class="edition-modal">
      <div class="modal-content">
        <h3>{{ editingEdition ? "编辑剧本" : "添加剧本" }}</h3>

        <div class="form-group">
          <label>剧本名称:</label>
          <input
            v-model="editionForm.name"
            placeholder="剧本显示名称"
            @input="generateId"
          />
        </div>

        <div class="form-group">
          <label>作者:</label>
          <input v-model="editionForm.author" placeholder="剧本作者" />
        </div>

        <div class="form-group">
          <label>描述:</label>
          <textarea
            v-model="editionForm.description"
            placeholder="剧本描述"
          ></textarea>
        </div>

        <div class="form-group">
          <label>导入方式:</label>
          <div class="import-options">
            <button
              type="button"
              @click="showJsonUpload = true"
              class="import-btn"
              :class="{ active: showJsonUpload }"
            >
              上传JSON文件
            </button>
            <button
              type="button"
              @click="showJsonUpload = false"
              class="import-btn"
              :class="{ active: !showJsonUpload }"
            >
              手动添加角色
            </button>
          </div>
        </div>

        <div v-if="showJsonUpload" class="form-group">
          <label>JSON文件:</label>
          <input
            type="file"
            @change="handleJsonUpload"
            accept=".json"
            class="file-input"
          />
          <p class="help-text">支持从脚本工具导出的JSON文件</p>
        </div>

        <div v-if="!showJsonUpload" class="form-group">
          <label>角色列表:</label>
          <div class="role-selection">
            <div class="role-categories">
              <div class="category">
                <h4>镇民</h4>
                <div class="role-list">
                  <label
                    v-for="role in townsfolkRoles"
                    :key="role.id"
                    class="role-item"
                  >
                    <input
                      type="checkbox"
                      v-model="editionForm.roles"
                      :value="role.id"
                    />
                    <span>{{ role.name }}</span>
                  </label>
                </div>
              </div>
              <div class="category">
                <h4>外来者</h4>
                <div class="role-list">
                  <label
                    v-for="role in outsiderRoles"
                    :key="role.id"
                    class="role-item"
                  >
                    <input
                      type="checkbox"
                      v-model="editionForm.roles"
                      :value="role.id"
                    />
                    <span>{{ role.name }}</span>
                  </label>
                </div>
              </div>
              <div class="category">
                <h4>爪牙</h4>
                <div class="role-list">
                  <label
                    v-for="role in minionRoles"
                    :key="role.id"
                    class="role-item"
                  >
                    <input
                      type="checkbox"
                      v-model="editionForm.roles"
                      :value="role.id"
                    />
                    <span>{{ role.name }}</span>
                  </label>
                </div>
              </div>
              <div class="category">
                <h4>恶魔</h4>
                <div class="role-list">
                  <label
                    v-for="role in demonRoles"
                    :key="role.id"
                    class="role-item"
                  >
                    <input
                      type="checkbox"
                      v-model="editionForm.roles"
                      :value="role.id"
                    />
                    <span>{{ role.name }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
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
import defaultEditions from "../../editions.json";

export default {
  name: "EditionManager",
  data() {
    return {
      showAddEdition: false,
      editingEdition: null,
      showJsonUpload: false,
      editionForm: {
        id: "",
        name: "",
        author: "",
        description: "",
        roles: [],
        isOfficial: false,
      },
    };
  },
  computed: {
    editions() {
      // 获取所有剧本，包括默认剧本和自定义剧本
      const defaultEditionsList = defaultEditions || [];
      const customEditions = this.$store.state.customEditions || [];
      return [...defaultEditionsList, ...customEditions];
    },
    allRoles() {
      return Array.from(this.$store.getters.rolesJSONbyId.values());
    },
    townsfolkRoles() {
      return this.allRoles.filter((role) => role.team === "townsfolk");
    },
    outsiderRoles() {
      return this.allRoles.filter((role) => role.team === "outsider");
    },
    minionRoles() {
      return this.allRoles.filter((role) => role.team === "minion");
    },
    demonRoles() {
      return this.allRoles.filter((role) => role.team === "demon");
    },
  },
  methods: {
    editEdition(edition) {
      // 检查是否为默认剧本
      const isDefaultEdition = defaultEditions.some(
        (defaultEdition) => defaultEdition.id === edition.id,
      );

      if (isDefaultEdition) {
        alert("默认剧本不能编辑，请创建自定义剧本");
        return;
      }

      this.editingEdition = edition;
      this.editionForm = {
        id: edition.id,
        name: edition.name,
        author: edition.author || "",
        description: edition.description || "",
        level: edition.level || "Beginner",
        roles: edition.roles || [],
        isOfficial: edition.isOfficial || false,
      };
    },
    saveEdition() {
      if (!this.editionForm.id || !this.editionForm.name) {
        alert("请填写必填字段：剧本ID和名称");
        return;
      }

      // 检查是否为默认剧本
      const isDefaultEdition = defaultEditions.some(
        (edition) => edition.id === this.editionForm.id,
      );

      if (isDefaultEdition) {
        alert("默认剧本不能修改，请创建自定义剧本");
        return;
      }

      // 保存到store
      const editionData = {
        ...this.editionForm,
        isOfficial: false, // 自定义剧本
      };

      // 这里应该调用store的mutation来保存剧本
      console.log("保存剧本:", editionData);

      // 模拟保存成功
      alert("剧本保存成功！");
      this.cancelEdit();
    },
    generateId() {
      // 根据剧本名称自动生成ID
      if (this.editionForm.name) {
        const id = this.editionForm.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .substring(0, 10);
        this.editionForm.id = `custom_${id}`;
      }
    },
    handleJsonUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = JSON.parse(e.target.result);
            this.parseJsonScript(jsonData);
          } catch (error) {
            alert("JSON文件格式错误：" + error.message);
          }
        };
        reader.readAsText(file);
      }
    },
    parseJsonScript(jsonData) {
      // 解析JSON脚本文件
      const roles = [];

      if (Array.isArray(jsonData)) {
        // 处理脚本工具格式
        jsonData.forEach((item) => {
          if (item.id && item.id !== "_meta") {
            roles.push(item.id);
          }
        });
      } else if (jsonData.roles) {
        // 处理其他格式
        roles.push(...jsonData.roles);
      }

      this.editionForm.roles = roles;
      alert(`成功导入 ${roles.length} 个角色`);
    },
    cancelEdit() {
      this.showAddEdition = false;
      this.editingEdition = null;
      this.showJsonUpload = false;
      this.editionForm = {
        id: "",
        name: "",
        author: "",
        description: "",
        roles: [],
        isOfficial: false,
      };
    },
    deleteEdition(edition) {
      // 检查是否为默认剧本
      const isDefaultEdition = defaultEditions.some(
        (defaultEdition) => defaultEdition.id === edition.id,
      );

      if (isDefaultEdition) {
        alert("默认剧本不能删除");
        return;
      }

      if (confirm(`确定要删除剧本"${edition.name}"吗？`)) {
        // 这里应该调用store的mutation来删除剧本
        console.log("删除剧本:", edition.id);
        alert("剧本删除成功！");
      }
    },
  },
};
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
    font-family: "Papyrus", serif;

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

    .edition-author,
    .edition-level {
      margin: 0 0 5px 0;
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
    }

    .edition-type {
      margin: 0 0 10px 0;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 3px;
      display: inline-block;

      &.official {
        background: rgba(76, 175, 80, 0.2);
        color: #4caf50;
        border: 1px solid rgba(76, 175, 80, 0.3);
      }

      &.custom {
        background: rgba(255, 215, 0, 0.2);
        color: #gold;
        border: 1px solid rgba(255, 215, 0, 0.3);
      }
    }
  }

  .edition-actions {
    margin-top: 15px;
    display: flex;
    gap: 8px;

    .edit-btn,
    .delete-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      font-family: "Papyrus", serif;
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

    .official-note {
      color: rgba(255, 255, 255, 0.6);
      font-size: 12px;
      font-style: italic;
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

      input,
      textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid rgba(255, 215, 0, 0.3);
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border-radius: 5px;
        font-family: "Papyrus", serif;

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
        font-family: "Papyrus", serif;
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

      .import-options {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;

        .import-btn {
          padding: 8px 16px;
          border: 1px solid rgba(255, 215, 0, 0.3);
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-radius: 5px;
          cursor: pointer;
          font-family: "Papyrus", serif;
          transition: all 0.3s ease;

          &:hover {
            background: rgba(255, 215, 0, 0.2);
          }

          &.active {
            background: rgba(255, 215, 0, 0.3);
            border-color: #gold;
            color: #gold;
          }
        }
      }

      .file-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid rgba(255, 215, 0, 0.3);
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border-radius: 5px;
        font-family: "Papyrus", serif;

        &::file-selector-button {
          background: rgba(255, 215, 0, 0.2);
          border: 1px solid #gold;
          color: #gold;
          padding: 6px 12px;
          border-radius: 3px;
          cursor: pointer;
          font-family: "Papyrus", serif;

          &:hover {
            background: rgba(255, 215, 0, 0.3);
          }
        }
      }

      .help-text {
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
        margin-top: 5px;
      }

      .role-selection {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 5px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);

        .role-categories {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;

          .category {
            h4 {
              color: #gold;
              margin: 0 0 10px 0;
              font-size: 14px;
              border-bottom: 1px solid rgba(255, 215, 0, 0.2);
              padding-bottom: 5px;
            }

            .role-list {
              display: flex;
              flex-direction: column;
              gap: 5px;

              .role-item {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                padding: 3px 0;

                input[type="checkbox"] {
                  margin: 0;
                  cursor: pointer;
                }

                span {
                  color: rgba(255, 255, 255, 0.8);
                  font-size: 13px;
                }

                &:hover span {
                  color: white;
                }
              }
            }
          }
        }
      }
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;

      .save-btn,
      .cancel-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-family: "Papyrus", serif;
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
