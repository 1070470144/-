<template>
  <div>
    <transition name="drawer">
      <div v-if="isVisible" class="player-drawer">
        <div class="drawer-header">
          <h3>{{ player.name }}</h3>
          <button class="close-btn" @click="$emit('close')" title="关闭面板">
            <font-awesome-icon icon="times" />
          </button>
        </div>

        <div class="drawer-content">
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
      </div>
    </transition>
  </div>
</template>

<script>
import { mapState } from "vuex";
import Token from "./Token.vue";

export default {
  name: "PlayerDrawer",
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
    },
    playerIndex: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      newReminder: "",
    };
  },
  computed: {
    ...mapState(["session"]),
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
  },
};
</script>

<style lang="scss" scoped>
.player-drawer {
  position: fixed;
  left: 0;
  top: 0;
  width: 400px;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  border-right: 2px solid #4a90e2;
  color: white;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(74, 144, 226, 0.6);
    border-radius: 3px;

    &:hover {
      background: rgba(74, 144, 226, 0.8);
    }
  }
}

.drawer-header {
  padding: 20px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    color: #fff;
    font-size: 18px;
    font-weight: bold;
  }

  .close-btn {
    background: none;
    border: none;
    color: #dc3545;
    cursor: pointer;
    padding: 5px;
    border-radius: 3px;
    transition: all 0.3s ease;
    font-size: 16px;

    &:hover {
      color: #e74c3c;
      background: rgba(220, 53, 69, 0.1);
    }
  }
}

.drawer-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 20px;

  .role-section {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #333;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;

    .role-icon {
      width: 80px;
      height: 80px;
      margin-right: 20px;
      flex-shrink: 0;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #333;
    }

    .role-info {
      flex: 1;

      h4 {
        margin: 0 0 10px 0;
        color: #fff;
        font-size: 18px;
        font-weight: bold;
      }

      .role-ability {
        margin: 0;
        font-size: 14px;
        color: #ccc;
        line-height: 1.5;
      }
    }
  }

  .status-section {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 15px 0;
      color: #fff;
      font-size: 16px;
      font-weight: bold;
    }

    .status-buttons {
      display: flex;
      gap: 10px;

      .status-btn {
        flex: 1;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #333;
        color: #fff;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: #4a90e2;
        }

        &.active {
          border-color: #4a90e2;
          background: rgba(74, 144, 226, 0.2);
          color: #4a90e2;
        }

        &.alive.active {
          border-color: #28a745;
          background: rgba(40, 167, 69, 0.2);
          color: #28a745;
        }

        &.dead.active {
          border-color: #dc3545;
          background: rgba(220, 53, 69, 0.2);
          color: #dc3545;
        }

        &.nominated.active {
          border-color: #ffc107;
          background: rgba(255, 193, 7, 0.2);
          color: #ffc107;
        }
      }
    }
  }

  .reminders-section {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 15px 0;
      color: #fff;
      font-size: 16px;
      font-weight: bold;
    }

    .reminders-list {
      max-height: 200px;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(74, 144, 226, 0.6);
        border-radius: 2px;

        &:hover {
          background: rgba(74, 144, 226, 0.8);
        }
      }

      .reminder-item {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid #333;
        border-radius: 4px;
        padding: 12px 16px;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #4a90e2;
        }

        span {
          flex: 1;
          font-size: 14px;
          color: #fff;
        }

        .remove-btn {
          background: none;
          border: none;
          color: #dc3545;
          cursor: pointer;
          padding: 4px 8px;
          font-size: 12px;
          border-radius: 3px;
          transition: all 0.3s ease;

          &:hover {
            color: #e74c3c;
            background: rgba(220, 53, 69, 0.1);
          }
        }
      }
    }
  }

  .add-reminder-section {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 15px 0;
      color: #fff;
      font-size: 16px;
      font-weight: bold;
    }

    .add-reminder-input {
      display: flex;
      gap: 10px;

      .reminder-input {
        flex: 1;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #333;
        color: #fff;
        border-radius: 4px;
        font-size: 14px;
        transition: all 0.3s ease;

        &::placeholder {
          color: #999;
        }

        &:focus {
          outline: none;
          border-color: #4a90e2;
          background: rgba(255, 255, 255, 0.15);
        }
      }

      .add-btn {
        padding: 8px 12px;
        background: #4a90e2;
        border: none;
        color: #fff;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        transition: all 0.3s ease;

        &:hover {
          background: #357abd;
        }
      }
    }
  }

  .change-role-section {
    h4 {
      margin: 0 0 15px 0;
      color: #fff;
      font-size: 16px;
      font-weight: bold;
    }

    .change-role-btn {
      width: 100%;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid #333;
      color: #fff;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: #4a90e2;
      }
    }
  }
}

// 动画效果
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}

.drawer-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.drawer-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
