<template>
  <Modal class="reset-game" @close="$emit('close')">
    <div class="reset-game-content">
      <h3>🎮 重置游戏</h3>
      <div v-if="isStoryteller" class="storyteller-options">
        <h4>📖 说书人重置选项</h4>
        <div class="option-group">
          <div class="option-section">
            <h5>🎭 角色相关</h5>
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.roles"
              />清空所有角色分配</label
            >
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.bluffs"
              />清空恶魔伪装</label
            >
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.reminders"
              />清空角色标记</label
            >
          </div>
          <div class="option-section">
            <h5>💀 玩家状态</h5>
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.deathStatus"
              />重置死亡状态</label
            >
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.nominationStatus"
              />重置待处决状态</label
            >
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.aliveStatus"
              />重置存活状态</label
            >
          </div>
          <div class="option-section">
            <h5>📝 游戏记录</h5>
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.gameHistory"
              />清空游戏历史</label
            >
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.voteHistory"
              />清空投票记录</label
            >
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.roundInfo"
              />重置轮次信息</label
            >
          </div>
          <div class="option-section">
            <h5>⚙️ 游戏设置</h5>
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.voteSettings"
              />重置投票设置</label
            >
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.nightSettings"
              />重置夜晚设置</label
            >
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.markerSettings"
              />重置标记设置</label
            >
          </div>
          <div class="option-section">
            <h5>🪑 座位状态</h5>
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.seatOccupation"
              />清空座位占用</label
            >
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.playerIds"
              />重置玩家ID</label
            >
          </div>
        </div>
      </div>
      <div v-else class="player-options">
        <h4>👤 玩家重置选项</h4>
        <div class="option-group">
          <div class="option-section">
            <h5>🎭 角色相关</h5>
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.roles"
              />清空所有角色分配</label
            >
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.bluffs"
              />清空恶魔伪装</label
            >
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.reminders"
              />清空角色标记</label
            >
          </div>
          <div class="option-section">
            <h5>💀 玩家状态</h5>
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.deathStatus"
              />重置死亡状态</label
            >
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.nominationStatus"
              />重置待处决状态</label
            >
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.aliveStatus"
              />重置存活状态</label
            >
          </div>
          <div class="option-section">
            <h5>📝 游戏记录</h5>
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.gameHistory"
              />清空游戏历史</label
            >
          </div>
          <div class="option-section">
            <h5>⚙️ 游戏设置</h5>
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.voteSettings"
              />重置投票设置</label
            >
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.nightSettings"
              />重置夜晚设置</label
            >
            <label class="checkbox"
              ><input
                type="checkbox"
                v-model="options.markerSettings"
              />重置标记设置</label
            >
          </div>
        </div>
      </div>
      <div class="button-group">
        <div class="button" @click="selectAll">全选</div>
        <div class="button" @click="selectNone">全不选</div>
        <div class="button cancel" @click="$emit('close')">取消</div>
        <div
          class="button confirm"
          :class="{ disabled: !hasSelected }"
          @click="confirmReset"
        >
          确认重置
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from "./Modal.vue";
import { mapState } from "vuex";
export default {
  name: "ResetGameModal",
  components: { Modal },
  data() {
    return {
      options: {
        roles: true,
        bluffs: true,
        reminders: true,
        deathStatus: true,
        nominationStatus: true,
        aliveStatus: true,
        gameHistory: true,
        voteHistory: true,
        roundInfo: true,
        voteSettings: true,
        nightSettings: true,
        markerSettings: true,
        seatOccupation: true,
        playerIds: true,
      },
    };
  },
  computed: {
    ...mapState(["session"]),
    isStoryteller() {
      return !this.session || this.session.isSpectator === false;
    },
    hasSelected() {
      return Object.values(this.filteredOptions).some(Boolean);
    },
    filteredOptions() {
      // 返回一个新对象，玩家端去掉多余属性，保证所有声明都被用到
      const opts = { ...this.options };
      if (!this.isStoryteller) {
        delete opts.voteHistory;
        delete opts.roundInfo;
        delete opts.seatOccupation;
        delete opts.playerIds;
      }
      return opts;
    },
  },
  methods: {
    selectAll() {
      Object.keys(this.filteredOptions).forEach(
        (key) => (this.options[key] = true),
      );
    },
    selectNone() {
      Object.keys(this.filteredOptions).forEach(
        (key) => (this.options[key] = false),
      );
    },
    confirmReset() {
      if (!this.hasSelected) return;
      this.$emit("confirm", { ...this.filteredOptions });
      this.$emit("close");
    },
    closeModal() {
      this.$emit("close");
    },
  },
};
</script>

<style lang="scss" scoped>
.reset-game-content {
  color: white;
  max-width: 800px; // 增加宽度
  max-height: 85vh; // 增加高度
  overflow-y: auto;

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(74, 144, 226, 0.6);
    border-radius: 4px;

    &:hover {
      background: rgba(74, 144, 226, 0.8);
    }
  }

  h3 {
    text-align: center;
    margin-bottom: 20px;
    color: #4a90e2;
    font-size: 24px;
  }

  h4 {
    color: #4a90e2;
    margin-bottom: 15px;
    font-size: 18px;
  }

  h5 {
    color: #4a90e2;
    margin-bottom: 10px;
    font-size: 14px;
  }

  .option-group {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); // 增加最小宽度
    gap: 20px;
    margin-bottom: 20px;
  }

  .option-section {
    background: rgba(74, 144, 226, 0.1);
    border: 1px solid rgba(74, 144, 226, 0.3);
    border-radius: 8px;
    padding: 15px;

    .checkbox {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      cursor: pointer;

      input[type="checkbox"] {
        margin-right: 8px;
        width: 16px;
        height: 16px;
      }

      span {
        color: white;
        font-size: 14px;
      }
    }
  }

  .button-group {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;

    .button {
      background: rgba(74, 144, 226, 0.2);
      border: 1px solid rgba(74, 144, 226, 0.5);
      border-radius: 5px;
      padding: 8px 16px;
      cursor: pointer;
      color: white;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(74, 144, 226, 0.4);
        border-color: rgba(74, 144, 226, 0.8);
      }

      &.cancel {
        background: rgba(220, 53, 69, 0.2);
        border-color: rgba(220, 53, 69, 0.5);

        &:hover {
          background: rgba(220, 53, 69, 0.4);
          border-color: rgba(220, 53, 69, 0.8);
        }
      }

      &.confirm {
        background: rgba(40, 167, 69, 0.2);
        border-color: rgba(40, 167, 69, 0.5);

        &:hover {
          background: rgba(40, 167, 69, 0.4);
          border-color: rgba(40, 167, 69, 0.8);
        }

        &.disabled {
          opacity: 0.5;
          cursor: not-allowed;

          &:hover {
            background: rgba(40, 167, 69, 0.2);
            border-color: rgba(40, 167, 69, 0.5);
          }
        }
      }
    }
  }
}
</style>
