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
  width: 320px;
  height: 100vh;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.95) 0%,
    rgba(20, 20, 20, 0.98) 100%
  );
  border-right: 3px solid #gold;
  color: white;
  z-index: 1000;
  overflow-y: auto;
  backdrop-filter: blur(15px);
  box-shadow:
    4px 0 30px rgba(0, 0, 0, 0.8),
    inset 0 0 50px rgba(255, 215, 0, 0.05);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.6);
    border-radius: 3px;

    &:hover {
      background: rgba(255, 215, 0, 0.8);
    }
  }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 20px;
  background: linear-gradient(
    135deg,
    rgba(255, 215, 0, 0.15) 0%,
    rgba(255, 215, 0, 0.05) 100%
  );
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 215, 0, 0.1) 50%,
      transparent 70%
    );
    animation: shimmer 3s ease-in-out infinite;
  }

  h3 {
    margin: 0;
    color: #gold;
    font-size: 22px;
    font-weight: bold;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    position: relative;
    z-index: 1;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 215, 0, 0.5);
    color: #gold;
    cursor: pointer;
    font-size: 16px;
    padding: 10px;
    border-radius: 50%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 1;

    &:hover {
      color: #fff;
      background: rgba(255, 215, 0, 0.3);
      border-color: #gold;
      transform: scale(1.1) rotate(90deg);
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    }
  }
}

.drawer-content {
  padding: 25px 20px;

  .role-section {
    display: flex;
    align-items: center;
    margin-bottom: 30px;
    padding: 20px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.08) 0%,
      rgba(255, 255, 255, 0.03) 100%
    );
    border-radius: 15px;
    border: 1px solid rgba(255, 215, 0, 0.2);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #gold, #ffd700, #gold);
      border-radius: 15px;
      z-index: -1;
      opacity: 0.3;
    }

    .role-icon {
      width: 90px;
      height: 90px;
      margin-right: 20px;
      flex-shrink: 0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
      border: 2px solid rgba(255, 215, 0, 0.3);
    }

    .role-info {
      flex: 1;

      h4 {
        margin: 0 0 10px 0;
        color: #gold;
        font-size: 20px;
        font-weight: bold;
        text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
      }

      .role-ability {
        margin: 0;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);
        line-height: 1.6;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }
    }
  }

  .status-section {
    margin-bottom: 30px;

    h4 {
      margin: 0 0 18px 0;
      color: #gold;
      font-size: 18px;
      font-weight: bold;
      text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
      display: flex;
      align-items: center;

      &::before {
        content: "⚡";
        margin-right: 8px;
        font-size: 16px;
      }
    }

    .status-buttons {
      display: flex;
      gap: 12px;

      .status-btn {
        flex: 1;
        padding: 15px 12px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.1) 0%,
          rgba(255, 255, 255, 0.05) 100%
        );
        color: white;
        border-radius: 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;

        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 0.5s ease;
        }

        &:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);

          &::before {
            left: 100%;
          }
        }

        &.active {
          border-color: #gold;
          background: linear-gradient(
            135deg,
            rgba(255, 215, 0, 0.2) 0%,
            rgba(255, 215, 0, 0.1) 100%
          );
          color: #gold;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
        }

        &.alive.active {
          border-color: #4caf50;
          background: linear-gradient(
            135deg,
            rgba(76, 175, 80, 0.2) 0%,
            rgba(76, 175, 80, 0.1) 100%
          );
          color: #4caf50;
          box-shadow: 0 0 15px rgba(76, 175, 80, 0.3);
        }

        &.dead.active {
          border-color: #f44336;
          background: linear-gradient(
            135deg,
            rgba(244, 67, 54, 0.2) 0%,
            rgba(244, 67, 54, 0.1) 100%
          );
          color: #f44336;
          box-shadow: 0 0 15px rgba(244, 67, 54, 0.3);
        }

        &.nominated.active {
          border-color: #ff9800;
          background: linear-gradient(
            135deg,
            rgba(255, 152, 0, 0.2) 0%,
            rgba(255, 152, 0, 0.1) 100%
          );
          color: #ff9800;
          box-shadow: 0 0 15px rgba(255, 152, 0, 0.3);
        }
      }
    }
  }

  .reminders-section {
    margin-bottom: 30px;

    h4 {
      margin: 0 0 18px 0;
      color: #gold;
      font-size: 18px;
      font-weight: bold;
      text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
      display: flex;
      align-items: center;

      &::before {
        content: "🏷️";
        margin-right: 8px;
        font-size: 16px;
      }
    }

    .reminders-list {
      max-height: 180px;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(255, 215, 0, 0.6);
        border-radius: 2px;

        &:hover {
          background: rgba(255, 215, 0, 0.8);
        }
      }

      .reminder-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 18px;
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.08) 0%,
          rgba(255, 255, 255, 0.03) 100%
        );
        border-radius: 10px;
        margin-bottom: 10px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;

        &:hover {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.12) 0%,
            rgba(255, 255, 255, 0.06) 100%
          );
          transform: translateX(5px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        span {
          flex: 1;
          font-size: 14px;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .remove-btn {
          background: none;
          border: none;
          color: #f44336;
          cursor: pointer;
          padding: 6px 10px;
          font-size: 12px;
          border-radius: 6px;
          transition: all 0.3s ease;

          &:hover {
            color: #ff6b6b;
            background: rgba(244, 67, 54, 0.15);
            transform: scale(1.1);
          }
        }
      }
    }
  }

  .add-reminder-section {
    margin-bottom: 30px;

    h4 {
      margin: 0 0 18px 0;
      color: #gold;
      font-size: 18px;
      font-weight: bold;
      text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
      display: flex;
      align-items: center;

      &::before {
        content: "➕";
        margin-right: 8px;
        font-size: 16px;
      }
    }

    .add-reminder-input {
      display: flex;
      gap: 12px;

      .reminder-input {
        flex: 1;
        padding: 15px 18px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.1) 0%,
          rgba(255, 255, 255, 0.05) 100%
        );
        color: white;
        border-radius: 12px;
        font-size: 14px;
        transition: all 0.3s ease;

        &::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        &:focus {
          outline: none;
          border-color: #gold;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0.08) 100%
          );
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
        }
      }

      .add-btn {
        padding: 15px 18px;
        background: linear-gradient(135deg, #gold 0%, #ffd700 100%);
        border: none;
        color: black;
        border-radius: 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);

        &:hover {
          background: linear-gradient(135deg, #ffd700 0%, #gold 100%);
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
        }

        &:active {
          transform: translateY(-1px);
        }
      }
    }
  }

  .change-role-section {
    h4 {
      margin: 0 0 18px 0;
      color: #gold;
      font-size: 18px;
      font-weight: bold;
      text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
      display: flex;
      align-items: center;

      &::before {
        content: "🔄";
        margin-right: 8px;
        font-size: 16px;
      }
    }

    .change-role-btn {
      width: 100%;
      padding: 18px;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.1) 0%,
        rgba(255, 255, 255, 0.05) 100%
      );
      border: 2px solid rgba(255, 255, 255, 0.2);
      color: white;
      border-radius: 12px;
      cursor: pointer;
      font-size: 15px;
      font-weight: bold;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 215, 0, 0.2),
          transparent
        );
        transition: left 0.6s ease;
      }

      &:hover {
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.15) 0%,
          rgba(255, 255, 255, 0.08) 100%
        );
        border-color: #gold;
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);

        &::before {
          left: 100%;
        }
      }
    }
  }
}

// 动画效果
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.drawer-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

@keyframes shimmer {
  0%,
  100% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
}
</style>
