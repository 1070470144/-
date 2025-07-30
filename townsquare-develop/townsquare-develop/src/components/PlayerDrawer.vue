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

          <!-- 切换角色 -->
          <div class="change-role-section">
            <h4>切换角色</h4>
            <button @click="openRoleModal" class="change-role-btn">
              <font-awesome-icon icon="exchange-alt" />
              选择角色
            </button>
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
            <div class="reminders-grid">
              <div
                v-for="reminder in player.reminders"
                :key="reminder.role + ' ' + reminder.name"
                class="reminder-item"
              >
                <div class="reminder-icon">
                  <span
                    class="icon"
                    :style="{
                      backgroundImage: `url(${
                        reminder.image && grimoire.isImageOptIn
                          ? reminder.image
                          : require(
                              '../assets/icons/' +
                                (reminder.imageAlt || reminder.role) +
                                '.png',
                            )
                      })`,
                    }"
                  ></span>
                </div>
                <div class="reminder-text">{{ reminder.name }}</div>
                <button @click="removeReminder(reminder)" class="remove-btn">
                  <font-awesome-icon icon="times" />
                </button>
              </div>
            </div>
          </div>

          <!-- 添加标记 -->
          <div class="add-reminder-section">
            <h4>添加标记</h4>
            <button @click="openReminderModal" class="add-reminder-btn">
              <font-awesome-icon icon="plus" />
              选择标记
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
import { recordReminderRemoved } from "../utils/reminderToHistory";

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
  computed: {
    ...mapState(["session", "grimoire"]),
  },
  methods: {
    toggleStatus(status) {
      // 玩家和说书人都可以使用状态切换功能
      let oldStatus = "存活";
      if (this.player.isDead) oldStatus = "死亡";
      if (this.player.isNominated) oldStatus = "待处决";

      switch (status) {
        case "alive":
          this.updatePlayer("isDead", false);
          this.updatePlayer("isNominated", false);
          this.recordStatusChange("存活", oldStatus);
          break;
        case "dead":
          this.updatePlayer("isDead", true);
          this.updatePlayer("isNominated", false);
          this.recordStatusChange("死亡", oldStatus);
          break;
        case "nominated":
          this.updatePlayer("isNominated", true);
          this.updatePlayer("isDead", false);
          this.recordStatusChange("待处决", oldStatus);
          break;
      }
    },

    recordStatusChange(newStatus, oldStatus) {
      try {
        this.$store.commit("addHistoryEvent", {
          action: "status_change",
          playerName: this.player.name,
          oldStatus,
          newStatus,
          summary: `${this.player.name} 状态从 ${oldStatus} 变为 ${newStatus}`,
          details: `${this.session.isSpectator ? "说书人" : "玩家"}将 ${
            this.player.name
          } 的状态从 ${oldStatus} 更改为 ${newStatus}`,
          isPublic: true,
        });
        console.log("Status change recorded successfully");
      } catch (error) {
        console.error("Error recording status change:", error);
      }
    },

    updatePlayer(property, value) {
      // 玩家和说书人都可以更新玩家状态
      this.$store.commit("players/update", {
        player: this.player,
        property,
        value,
      });
    },

    removeReminder(reminder) {
      console.log("removeReminder called with:", reminder);
      const reminders = [...this.player.reminders];
      const index = reminders.indexOf(reminder);
      if (index > -1) {
        reminders.splice(index, 1);
        this.updatePlayer("reminders", reminders);

        // 记录reminder移除
        console.log("Recording reminder removed");
        try {
          recordReminderRemoved(reminder, this.player, this.$store);
        } catch (error) {
          console.error("Error recording reminder removed:", error);
        }
      }
    },

    openReminderModal() {
      // 玩家和说书人都可以打开标记模态框
      this.$store.commit("toggleModal", "reminder");
      // 设置选中的玩家索引
      this.$store.commit("setSelectedPlayer", this.playerIndex);
    },

    openRoleModal() {
      // 玩家和说书人都可以打开角色模态框
      this.$store.commit("setSelectedPlayer", this.playerIndex);
      this.$store.commit("toggleModal", "role");
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
      position: relative;
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

    .reminders-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 10px;
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
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 8px;
        background: rgba(255, 255, 255, 0.08);
        border: 2px solid #333;
        border-radius: 8px;
        position: relative;
        transition: all 0.3s ease;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);

        &:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: #4a90e2;
          box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
          transform: translateY(-2px);
        }
      }

      .reminder-icon {
        width: 40px;
        height: 40px;
        margin-bottom: 6px;
        flex-shrink: 0;
        border-radius: 6px;
        overflow: hidden;
        border: 2px solid #4a90e2;
        position: relative;
        background: rgba(74, 144, 226, 0.1);
        box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);

        .icon {
          display: block;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          filter: brightness(1.2) contrast(1.1);
        }
      }

      .reminder-text {
        flex: 1;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        text-align: center;
        word-break: break-word;
        line-height: 1.3;
        margin-bottom: 6px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        letter-spacing: 0.5px;
      }

      .remove-btn {
        background: rgba(220, 53, 69, 0.2);
        border: 1px solid #dc3545;
        color: #ff6b6b;
        cursor: pointer;
        padding: 6px 10px;
        font-size: 14px;
        border-radius: 4px;
        transition: all 0.3s ease;
        position: absolute;
        top: 6px;
        right: 6px;
        box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);

        &:hover {
          color: #fff;
          background: rgba(220, 53, 69, 0.8);
          box-shadow: 0 4px 8px rgba(220, 53, 69, 0.5);
          transform: scale(1.1);
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

    .add-reminder-btn {
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
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: #4a90e2;
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
