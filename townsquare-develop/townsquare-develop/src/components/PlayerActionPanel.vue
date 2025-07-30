<template>
  <transition name="slide">
    <div
      v-if="isVisible"
      class="player-action-panel"
      :style="panelStyle"
      :class="{ draggable: isDraggable, resizable: isResizable }"
      ref="panel"
    >
      <!-- 拖拽手柄 -->
      <div
        class="drag-handle"
        @mousedown.prevent="startDrag"
        @touchstart.prevent="startDrag"
        :title="isDraggable ? '拖拽移动' : '点击启用拖拽'"
      >
        <font-awesome-icon icon="arrows-alt" />
      </div>

      <div class="panel-header" @mousedown.stop @touchstart.stop>
        <h3>{{ player.name }}</h3>
        <div class="header-controls">
          <button
            class="drag-toggle-btn"
            @click="toggleDrag"
            :title="isDraggable ? '禁用拖拽' : '启用拖拽'"
            :class="{ active: isDraggable }"
          >
            <font-awesome-icon icon="hand-paper" />
          </button>
          <button
            class="resize-toggle-btn"
            @click="toggleResize"
            :title="isResizable ? '禁用缩放' : '启用缩放'"
            :class="{ active: isResizable }"
          >
            <font-awesome-icon :icon="isResizable ? 'compress' : 'expand'" />
          </button>
          <button class="close-btn" @click="$emit('close')" title="关闭面板">
            <font-awesome-icon icon="times" />
          </button>
        </div>
      </div>

      <div class="panel-content" @mousedown.stop @touchstart.stop>
        <!-- 角色信息 -->
        <div class="role-section">
          <div class="role-icon">
            <Token :role="player.role" :disable-click="true" />
          </div>
          <div class="role-info">
            <h4>{{ player.role.name || "无角色" }}</h4>
            <p class="role-ability">
              {{ player.role.ability || "无能力描述" }}
            </p>
          </div>
        </div>

        <!-- 状态切换 -->
        <div class="status-section">
          <h4>状态</h4>
          <div class="status-buttons">
            <button
              @click="toggleStatus('alive')"
              :class="{ active: !player.isDead && !player.isNominated }"
              class="status-btn alive"
            >
              存活
            </button>
            <button
              @click="toggleStatus('dead')"
              :class="{ active: player.isDead }"
              class="status-btn dead"
            >
              死亡
            </button>
            <button
              @click="toggleStatus('nominated')"
              :class="{ active: player.isNominated }"
              class="status-btn nominated"
            >
              待处决
            </button>
          </div>
        </div>

        <!-- 当前标记 -->
        <div
          class="reminders-section"
          v-if="player.reminders && player.reminders.length > 0"
        >
          <h4>当前标记</h4>
          <div class="reminders-list">
            <div
              v-for="reminder in player.reminders"
              :key="reminder"
              class="reminder-item"
            >
              <span>{{ reminder }}</span>
              <button @click="removeReminder(reminder)" class="remove-btn">
                <font-awesome-icon icon="times" />
              </button>
            </div>
          </div>
        </div>

        <!-- 添加标记 -->
        <div class="add-reminder-section">
          <h4>添加标记</h4>
          <div class="add-reminder-input">
            <input
              v-model="newReminder"
              @keyup.enter="addReminder"
              placeholder="输入标记内容"
              class="reminder-input"
            />
            <button @click="addReminder" class="add-btn">
              <font-awesome-icon icon="plus" />
            </button>
          </div>
        </div>

        <!-- 切换角色 -->
        <div class="change-role-section">
          <h4>切换角色</h4>
          <button @click="openRoleModal" class="change-role-btn">
            <font-awesome-icon icon="exchange-alt" />
            选择角色
          </button>
        </div>
      </div>

      <!-- 缩放控制点 -->
      <div
        v-if="isResizable"
        class="resize-handle"
        @mousedown="startResize"
        @touchstart="startResize"
        title="拖拽调整大小"
      >
        <font-awesome-icon icon="expand-arrows-alt" />
      </div>
    </div>
  </transition>
</template>

<script>
import { mapState } from "vuex";
import Token from "./Token.vue";

export default {
  name: "PlayerActionPanel",
  components: {
    Token,
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false,
    },
    player: {
      type: Object,
      required: true,
      default: () => ({
        name: "未知玩家",
        role: {},
        isDead: false,
        isNominated: false,
        reminders: []
      })
    },
    playerIndex: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      newReminder: "",
      isResizable: true,
      isDraggable: true,
      isDragging: false,
      isResizing: false,
      startX: 0,
      startY: 0,
      startLeft: 0,
      startTop: 0,
      startWidth: 300,
      startHeight: 400,
      panelLeft: 20,
      panelTop: 50,
    };
  },
  computed: {
    ...mapState(["session"]),
    panelStyle() {
      return {
        left: `${this.panelLeft}px`,
        top: `${this.panelTop}%`,
        transform: "translateY(-50%)",
        width: this.isResizable ? `${this.startWidth}px` : "300px",
        height: this.isResizable ? `${this.startHeight}px` : "auto",
        maxHeight: "80vh",
      };
    },
  },
  methods: {
    toggleStatus(status) {
      if (this.session.isSpectator) return;

      switch (status) {
        case "alive":
          this.updatePlayer("isDead", false);
          this.updatePlayer("isNominated", false);
          break;
        case "dead":
          this.updatePlayer("isDead", true);
          this.updatePlayer("isNominated", false);
          break;
        case "nominated":
          this.updatePlayer("isNominated", true);
          this.updatePlayer("isDead", false);
          break;
      }
    },

    updatePlayer(property, value) {
      if (this.session.isSpectator) return;

      this.$store.commit("players/update", {
        player: this.player,
        property,
        value,
      });
    },

    addReminder() {
      if (!this.newReminder.trim()) return;

      const reminders = [
        ...(this.player.reminders || []),
        this.newReminder.trim(),
      ];
      this.updatePlayer("reminders", reminders);
      this.newReminder = "";
    },

    removeReminder(reminder) {
      const reminders = [...this.player.reminders];
      const index = reminders.indexOf(reminder);
      if (index > -1) {
        reminders.splice(index, 1);
        this.updatePlayer("reminders", reminders);
      }
    },

    openRoleModal() {
      this.$emit("open-role-modal", this.playerIndex);
    },

    startDrag(e) {
      console.log("拖拽事件触发", {
        isDraggable: this.isDraggable,
        event: e.type,
      });
      if (!this.isDraggable) {
        console.log("拖拽功能未启用");
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      console.log("开始拖拽", {
        isDraggable: this.isDraggable,
        clientX: e.clientX,
        clientY: e.clientY,
      });
      this.isDragging = true;
      this.startX = e.clientX || e.touches[0].clientX;
      this.startY = e.clientY || e.touches[0].clientY;
      this.startLeft = this.$el.offsetLeft;
      this.startTop = this.$el.offsetTop;
      document.addEventListener("mousemove", this.drag);
      document.addEventListener("touchmove", this.drag, { passive: false });
      document.addEventListener("mouseup", this.endDrag);
      document.addEventListener("touchend", this.endDrag);
    },

    drag(e) {
      if (!this.isDraggable || !this.isDragging) return;
      e.preventDefault();
      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;
      const dx = clientX - this.startX;
      const dy = clientY - this.startY;

      // 更新面板位置
      this.panelLeft = this.startLeft + dx;
      this.panelTop = this.startTop + dy;

      // 边界检查
      const maxX = window.innerWidth - this.$el.offsetWidth;
      const maxY = window.innerHeight - this.$el.offsetHeight;

      if (this.panelLeft < 0) this.panelLeft = 0;
      if (this.panelLeft > maxX) this.panelLeft = maxX;
      if (this.panelTop < 0) this.panelTop = 0;
      if (this.panelTop > maxY) this.panelTop = maxY;

      console.log("拖拽中", {
        dx,
        dy,
        panelLeft: this.panelLeft,
        panelTop: this.panelTop,
      });
    },

    endDrag() {
      console.log("结束拖拽");
      this.isDragging = false;
      document.removeEventListener("mousemove", this.drag);
      document.removeEventListener("touchmove", this.drag);
      document.removeEventListener("mouseup", this.endDrag);
      document.removeEventListener("touchend", this.endDrag);
    },

    startResize(e) {
      if (!this.isResizable) return;
      e.preventDefault();
      this.isResizing = true;
      this.startX = e.clientX || e.touches[0].clientX;
      this.startY = e.clientY || e.touches[0].clientY;
      this.startWidth = this.$el.offsetWidth;
      this.startHeight = this.$el.offsetHeight;
      document.addEventListener("mousemove", this.resize);
      document.addEventListener("touchmove", this.resize, { passive: false });
      document.addEventListener("mouseup", this.endResize);
      document.addEventListener("touchend", this.endResize);
    },

    resize(e) {
      if (!this.isResizable || !this.isResizing) return;
      e.preventDefault();
      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;
      const dx = clientX - this.startX;
      const dy = clientY - this.startY;

      // 计算新尺寸
      const newWidth = this.startWidth + dx;
      const newHeight = this.startHeight + dy;

      // 最小尺寸限制
      const minWidth = 250;
      const minHeight = 300;

      if (newWidth >= minWidth) {
        this.startWidth = newWidth;
      }

      if (newHeight >= minHeight) {
        this.startHeight = newHeight;
      }
    },

    endResize() {
      this.isResizing = false;
      document.removeEventListener("mousemove", this.resize);
      document.removeEventListener("touchmove", this.resize);
      document.removeEventListener("mouseup", this.endResize);
      document.removeEventListener("touchend", this.endResize);
    },

    toggleResize() {
      this.isResizable = !this.isResizable;
    },

    toggleDrag() {
      this.isDraggable = !this.isDraggable;
    },
  },
};
</script>

<style lang="scss" scoped>
.player-action-panel {
  position: fixed;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 300px;
  max-height: 80vh;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #gold;
  border-radius: 10px;
  color: white;
  z-index: 1000;
  overflow-y: auto;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
  transition: all 0.3s ease;

  &.draggable {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }

  &.resizable {
    .resize-handle {
      display: flex;
    }
  }

  .drag-handle {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 30px;
    height: 30px;
    background: #gold;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    z-index: 1000;
    color: black;
    font-size: 16px;
    opacity: 0.8;
    transition: all 0.3s ease;
    pointer-events: auto;
    user-select: none;

    &:hover {
      background: #ffd700;
      opacity: 1;
      transform: scale(1.1);
    }

    &:active {
      cursor: grabbing;
      transform: scale(0.95);
    }
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  padding-left: 50px;
  border-bottom: 1px solid #gold;

  h3 {
    margin: 0;
    color: #gold;
    font-size: 18px;
  }

  .header-controls {
    display: flex;
    gap: 8px;
  }

  .drag-toggle-btn,
  .resize-toggle-btn {
    background: none;
    border: none;
    color: #gold;
    cursor: pointer;
    font-size: 16px;
    padding: 5px;
    border-radius: 5px;
    transition: all 0.3s ease;

    &:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    &.active {
      color: #fff;
      background: rgba(255, 215, 0, 0.2);
    }
  }

  .close-btn {
    background: none;
    border: none;
    color: #gold;
    cursor: pointer;
    font-size: 16px;
    padding: 5px;

    &:hover {
      color: #fff;
    }
  }
}

.panel-content {
  padding: 15px;

  .role-section {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);

    .role-icon {
      width: 60px;
      height: 60px;
      margin-right: 15px;
      flex-shrink: 0;
    }

    .role-info {
      flex: 1;

      h4 {
        margin: 0 0 5px 0;
        color: #gold;
        font-size: 16px;
      }

      .role-ability {
        margin: 0;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.4;
      }
    }
  }

  .status-section {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 10px 0;
      color: #gold;
      font-size: 14px;
    }

    .status-buttons {
      display: flex;
      gap: 8px;

      .status-btn {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        &.active {
          border-color: #gold;
          background: rgba(255, 215, 0, 0.2);
          color: #gold;
        }

        &.alive.active {
          border-color: #4caf50;
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
        }

        &.dead.active {
          border-color: #f44336;
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;
        }

        &.nominated.active {
          border-color: #ff9800;
          background: rgba(255, 152, 0, 0.2);
          color: #ff9800;
        }
      }
    }
  }

  .reminders-section {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 10px 0;
      color: #gold;
      font-size: 14px;
    }

    .reminders-list {
      max-height: 120px;
      overflow-y: auto;

      .reminder-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        margin-bottom: 5px;

        span {
          flex: 1;
          font-size: 12px;
        }

        .remove-btn {
          background: none;
          border: none;
          color: #f44336;
          cursor: pointer;
          padding: 2px 5px;
          font-size: 10px;

          &:hover {
            color: #ff6b6b;
          }
        }
      }
    }
  }

  .add-reminder-section {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 10px 0;
      color: #gold;
      font-size: 14px;
    }

    .add-reminder-input {
      display: flex;
      gap: 8px;

      .reminder-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border-radius: 5px;
        font-size: 12px;

        &::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        &:focus {
          outline: none;
          border-color: #gold;
        }
      }

      .add-btn {
        padding: 8px 12px;
        background: #gold;
        border: none;
        color: black;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;

        &:hover {
          background: #ffd700;
        }
      }
    }
  }

  .change-role-section {
    h4 {
      margin: 0 0 10px 0;
      color: #gold;
      font-size: 14px;
    }

    .change-role-btn {
      width: 100%;
      padding: 10px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      border-radius: 5px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: #gold;
      }
    }
  }
}

.resize-handle {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 25px;
  height: 25px;
  background: #gold;
  border-radius: 50%;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: nwse-resize;
  z-index: 10;
  color: black;
  font-size: 12px;
  opacity: 0.8;
  transition: all 0.3s ease;

  &:hover {
    background: #ffd700;
    opacity: 1;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-50%) translateX(-100%);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(-100%);
}
</style>
