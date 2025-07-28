<template>
  <div>
    <transition name="history-slide">
      <div v-if="isVisible" class="history-panel" :class="{ mobile: isMobile }">
        <!-- 移动端遮罩 -->
        <div v-if="isMobile" class="history-backdrop" @click="close"></div>

        <!-- 面板内容 -->
        <div class="history-content">
          <!-- 头部 -->
          <div class="history-header">
            <h3>游戏历史记录</h3>
            <div class="header-info">
              <span class="record-count">{{ history.events.length }}/200</span>
            </div>
            <div class="header-actions">
              <button
                v-if="isStoryteller"
                @click="restartGame"
                class="btn-restart"
                title="重新开始游戏"
              >
                🔄
              </button>
              <button
                v-if="isStoryteller"
                @click="exportHistory"
                class="btn-export"
                title="导出历史记录"
              >
                📄
              </button>
              <button @click="close" class="btn-close">×</button>
            </div>
          </div>

          <!-- 筛选器 -->
          <div class="history-filters">
            <select v-model="filterPhase" class="filter-select">
              <option value="">所有阶段</option>
              <option value="night">夜晚</option>
              <option value="day">白天</option>
            </select>
            <select v-model="filterRound" class="filter-select">
              <option value="">所有轮次</option>
              <option value="first_night">首夜</option>
              <option value="first_day">第一个白天</option>
              <option value="second_night">第二个夜晚</option>
              <option value="second_day">第二个白天</option>
              <option value="third_night">第三个夜晚</option>
              <option value="third_day">第三个白天</option>
              <option value="fourth_night">第四个夜晚</option>
              <option value="fourth_day">第四个白天</option>
              <option value="fifth_night">第五个夜晚</option>
              <option value="fifth_day">第五个白天</option>
              <option value="sixth_night">第六个夜晚</option>
              <option value="sixth_day">第六个白天</option>
              <option value="seventh_night">第七个夜晚</option>
              <option value="seventh_day">第七个白天</option>
              <option value="eighth_night">第八个夜晚</option>
              <option value="eighth_day">第八个白天</option>
              <option value="ninth_night">第九个夜晚</option>
              <option value="ninth_day">第九个白天</option>
              <option value="tenth_night">第十个夜晚</option>
              <option value="tenth_day">第十个白天</option>
              <option value="eleventh_night">第十一个夜晚</option>
              <option value="eleventh_day">第十一个白天</option>
              <option value="twelfth_night">第十二个夜晚</option>
              <option value="twelfth_day">第十二个白天</option>
              <option value="thirteenth_night">第十三个夜晚</option>
              <option value="thirteenth_day">第十三个白天</option>
              <option value="fourteenth_night">第十四个夜晚</option>
              <option value="fourteenth_day">第十四个白天</option>
              <option value="fifteenth_night">第十五个夜晚</option>
              <option value="fifteenth_day">第十五个白天</option>
            </select>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索..."
              class="search-input"
            />
          </div>

          <!-- 事件列表 -->
          <div class="history-list">
            <div
              v-for="event in filteredEvents"
              :key="event.id"
              class="history-card"
              :class="{
                'public-event': event.isPublic,
                expanded: expandedEvents.includes(event.id),
              }"
              @click="toggleEventDetails(event.id)"
            >
              <!-- 卡片头部 -->
              <div class="card-header">
                <div class="event-icon">
                  {{ getEventIcon(event.action) }}
                </div>
                <div class="event-info">
                  <div class="event-summary">{{ event.summary }}</div>
                  <div class="event-meta">
                    <span class="event-time">{{
                      formatTime(event.timestamp)
                    }}</span>
                    <span v-if="event.isPublic" class="public-badge">公开</span>
                  </div>
                </div>
                <div class="expand-indicator">▼</div>
              </div>

              <!-- 可展开的详细信息 -->
              <div
                v-if="expandedEvents.includes(event.id)"
                class="card-details"
              >
                <div class="detail-item" v-if="event.details">
                  <span class="label">详情:</span>
                  <span class="value">{{ event.details }}</span>
                </div>
                <div class="detail-item" v-if="event.note">
                  <span class="label">备注:</span>
                  <span class="value">{{ event.note }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredEvents.length === 0" class="empty-state">
            <p>暂无历史记录</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- 清除历史记录确认对话框 -->
    <div v-if="showClearConfirm" class="clear-confirm-overlay">
      <div class="clear-confirm-modal">
        <h3>清除历史记录</h3>
        <p>检测到历史记录，是否清除上一局的记录？</p>
        <div class="confirm-buttons">
          <button @click="confirmClear" class="btn-confirm">确认清除</button>
          <button @click="cancelClear" class="btn-cancel">保留记录</button>
        </div>
      </div>
    </div>

    <!-- 重新开始游戏确认对话框 -->
    <div v-if="showRestartConfirm" class="restart-confirm-overlay">
      <div class="restart-confirm-modal">
        <h3>重新开始游戏</h3>
        <p>确认重新开始游戏吗？这将：</p>
        <ul>
          <li>清除所有历史记录</li>
          <li>重置游戏状态</li>
          <li>切换到夜晚阶段</li>
          <li>设置为首夜</li>
        </ul>
        <div class="confirm-buttons">
          <button @click="confirmRestart" class="btn-confirm">
            确认重新开始
          </button>
          <button @click="cancelRestart" class="btn-cancel">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "HistoryPanel",
  props: {
    isVisible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      expandedEvents: [],
      isMobile: window.innerWidth <= 768,
      showClearConfirm: false,
      showRestartConfirm: false,
      filterPhase: "",
      filterRound: "",
      searchQuery: "",
    };
  },
  computed: {
    ...mapState(["history", "session", "grimoire"]),
    isStoryteller() {
      return !this.session.isSpectator;
    },
    filteredEvents() {
      let events = this.history.events;

      // 玩家只能看到公开事件
      if (!this.isStoryteller) {
        events = events.filter((event) => event.isPublic);
      }

      // 按阶段筛选
      if (this.filterPhase) {
        events = events.filter((event) => {
          // 如果是阶段切换事件，直接比较phase字段
          if (event.action === "phase_change") {
            return event.phase === this.filterPhase;
          }
          // 对于其他事件，根据轮次来判断阶段
          if (this.filterPhase === "night") {
            return event.round && event.round.includes("night");
          } else if (this.filterPhase === "day") {
            return event.round && event.round.includes("day");
          }
          return true;
        });
      }

      // 按轮次筛选
      if (this.filterRound) {
        events = events.filter((event) => event.round === this.filterRound);
      }

      // 搜索筛选
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        events = events.filter(
          (event) =>
            (event.summary && event.summary.toLowerCase().includes(query)) ||
            (event.details && event.details.toLowerCase().includes(query)) ||
            (event.playerName &&
              event.playerName.toLowerCase().includes(query)) ||
            (event.roleName && event.roleName.toLowerCase().includes(query)),
        );
      }

      // 按时间倒序排列
      return events.sort((a, b) => b.timestamp - a.timestamp);
    },
  },
  methods: {
    close() {
      this.$emit("close");
    },
    toggleEventDetails(eventId) {
      const index = this.expandedEvents.indexOf(eventId);
      if (index > -1) {
        this.expandedEvents.splice(index, 1);
      } else {
        this.expandedEvents.push(eventId);
      }
    },
    getEventIcon(action) {
      const icons = {
        wake_up: "🌙",
        vote: "🗳️",
        execution: "💀",
        role_assignment: "🎭",
        nomination: "📢",
        player_died: "💀",
        player_revived: "🔄",
        player_voteless: "🚫",
        player_vote_restored: "✅",
        player_nominated: "⚖️",
        player_nomination_cancelled: "❌",
        player_protected: "🛡️",
        player_poisoned: "☠️",
        custom: "✏️",
        reminder_added: "🏷️",
        reminder_removed: "🗑️",
        custom_reminder_added: "✏️",
        role_ability: "⚡",
        phase_change: "⚙️",
        game_start: "🎮",
      };
      return icons[action] || "📝";
    },
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    confirmClear() {
      this.$store.commit("clearHistory");
      this.showClearConfirm = false;
    },
    cancelClear() {
      this.showClearConfirm = false;
    },
    restartGame() {
      this.showRestartConfirm = true;
    },
    confirmRestart() {
      // 清除历史记录
      this.$store.commit("clearHistory");

      // 重置游戏状态
      this.$store.commit("resetGameState");

      // 确保切换到夜晚阶段（不管当前是什么阶段）
      if (!this.grimoire.isNight) {
        this.$store.commit("toggleNight");
      }

      // 设置为首夜
      this.$store.commit("setCurrentRound", 1);
      this.$store.commit("setCurrentPhase", "night");

      // 记录首夜开始
      this.$store.commit("addHistoryEvent", {
        action: "game_start",
        summary: "游戏开始",
        details: "说书人开始新游戏，进入首夜阶段",
        phase: "night",
        round: "first_night",
        isPublic: false,
      });

      this.showRestartConfirm = false;
    },
    cancelRestart() {
      this.showRestartConfirm = false;
    },
    exportHistory() {
      const data = JSON.stringify(this.history.events, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "game_history.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  },
  mounted() {
    // 监听窗口大小变化
    window.addEventListener("resize", () => {
      this.isMobile = window.innerWidth <= 768;
    });
  },
};
</script>

<style scoped lang="scss">
.history-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  border-left: 2px solid #4a90e2;
  z-index: 1000;
  display: flex;
  flex-direction: column;

  &.mobile {
    width: 100vw;
    border-left: none;
  }
}

.history-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.history-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-header {
  padding: 20px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    color: #fff;
    font-size: 18px;
  }

  .header-info {
    .record-count {
      color: #ccc;
      font-size: 12px;
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
  }

  .header-actions {
    display: flex;
    gap: 10px;

    button {
      background: none;
      border: none;
      color: #ccc;
      cursor: pointer;
      padding: 5px;
      border-radius: 3px;
      transition: all 0.3s ease;
      font-size: 16px;

      &:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
      }

      &.btn-restart {
        color: #ffc107;

        &:hover {
          color: #ffca2c;
          background: rgba(255, 193, 7, 0.1);
        }
      }

      &.btn-export {
        color: #4a90e2;

        &:hover {
          color: #357abd;
          background: rgba(74, 144, 226, 0.1);
        }
      }

      &.btn-close {
        color: #dc3545;

        &:hover {
          color: #e74c3c;
          background: rgba(220, 53, 69, 0.1);
        }
      }
    }
  }
}

.history-filters {
  padding: 15px 20px;
  display: flex;
  gap: 10px;

  .filter-select {
    flex: 1;
    padding: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #333;
    color: #fff;
    border-radius: 4px;

    option {
      background: #000;
      color: #fff;
    }
  }

  .search-input {
    flex: 1;
    padding: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #333;
    color: #fff;
    border-radius: 4px;

    &::placeholder {
      color: #999;
    }
  }
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
}

.history-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #333;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #4a90e2;
  }

  &.public-event {
    border-color: #28a745;

    .public-badge {
      background: #28a745;
      color: #fff;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
  }

  &.expanded {
    .expand-indicator {
      transform: rotate(180deg);
    }
  }
}

.card-header {
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;

  .event-icon {
    width: 40px;
    height: 40px;
    background: rgba(74, 144, 226, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4a90e2;
    font-size: 18px;
  }

  .event-info {
    flex: 1;

    .event-summary {
      color: #fff;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .event-meta {
      display: flex;
      align-items: center;
      gap: 10px;

      .event-time {
        color: #ccc;
        font-size: 12px;
      }
    }
  }

  .expand-indicator {
    color: #ccc;
    transition: transform 0.3s ease;
  }
}

.card-details {
  padding: 0 15px 15px;
  border-top: 1px solid #333;
  margin-top: 10px;

  .detail-item {
    margin-bottom: 10px;

    .label {
      color: #ccc;
      font-size: 12px;
      margin-right: 10px;
    }

    .value {
      color: #fff;
    }
  }

  .event-actions {
    margin-top: 15px;

    .btn-edit-note {
      background: #4a90e2;
      border: none;
      color: #fff;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;

      &:hover {
        background: #357abd;
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #ccc;
}

// 动画
.history-slide-enter-active,
.history-slide-leave-active {
  transition: transform 0.3s ease;
}

.history-slide-enter,
.history-slide-leave-to {
  transform: translateX(100%);
}

// 移动端适配
@media (max-width: 768px) {
  .history-panel {
    .history-header {
      padding: 15px;

      h3 {
        font-size: 16px;
      }
    }

    .history-filters {
      padding: 10px 15px;
      flex-direction: column;
    }

    .history-list {
      padding: 0 15px 15px;
    }

    .card-header {
      padding: 12px;

      .event-icon {
        width: 35px;
        height: 35px;
        font-size: 16px;
      }
    }
  }
}

// 清除确认对话框样式
.clear-confirm-overlay,
.restart-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.clear-confirm-modal,
.restart-confirm-modal {
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #4a90e2;
  border-radius: 10px;
  padding: 30px;
  text-align: center;
  max-width: 400px;
  width: 90%;

  h3 {
    color: #fff;
    margin: 0 0 20px 0;
    font-size: 18px;
  }

  p {
    color: #ccc;
    margin: 0 0 20px 0;
    line-height: 1.5;
  }

  ul {
    color: #ccc;
    text-align: left;
    margin: 0 0 30px 0;
    padding-left: 20px;

    li {
      margin-bottom: 8px;
      line-height: 1.4;
    }
  }

  .confirm-buttons {
    display: flex;
    gap: 15px;
    justify-content: center;

    button {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;

      &.btn-confirm {
        background: #dc3545;
        color: #fff;

        &:hover {
          background: #c82333;
        }
      }

      &.btn-cancel {
        background: #6c757d;
        color: #fff;

        &:hover {
          background: #5a6268;
        }
      }
    }
  }
}

.restart-confirm-modal {
  border-color: #ffc107;

  .btn-confirm {
    background: #ffc107 !important;
    color: #000 !important;

    &:hover {
      background: #ffca2c !important;
    }
  }
}
</style>
