<template>
  <Modal
    class="role-ability-modal"
    @close="toggleModal('roleAbility')"
    v-if="modals.roleAbility"
  >
    <h3>记录角色能力</h3>

    <div class="ability-form">
      <!-- 角色选择 -->
      <div class="form-group">
        <label>角色:</label>
        <select v-model="selectedRole" class="form-select">
          <option value="">选择角色</option>
          <option v-for="role in availableRoles" :key="role.id" :value="role">
            {{ role.name }}
          </option>
        </select>
      </div>

      <!-- 玩家选择 -->
      <div
        class="form-group"
        v-if="selectedRole && selectedRole.team !== 'fabled'"
      >
        <label>目标玩家:</label>
        <select v-model="selectedPlayer" class="form-select">
          <option value="">选择玩家</option>
          <option
            v-for="player in availablePlayers"
            :key="player.id"
            :value="player"
          >
            {{ player.name }}
          </option>
        </select>
      </div>

      <!-- 能力类型 -->
      <div class="form-group">
        <label>能力类型:</label>
        <select v-model="abilityType" class="form-select">
          <option value="">选择能力类型</option>
          <option value="investigate">调查</option>
          <option value="protect">保护</option>
          <option value="kill">杀死</option>
          <option value="poison">毒死</option>
          <option value="save">救活</option>
          <option value="information">信息</option>
          <option value="ability_use">能力使用</option>
        </select>
      </div>

      <!-- 信息输入 -->
      <div class="form-group">
        <label>信息/结果:</label>
        <textarea
          v-model="information"
          class="form-textarea"
          placeholder="输入给玩家的信息或能力使用结果..."
        ></textarea>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <button
          @click="recordAbility"
          class="btn-record"
          :disabled="!canRecord"
        >
          记录能力
        </button>
        <button @click="toggleModal('roleAbility')" class="btn-cancel">
          取消
        </button>
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from "./Modal";
import { mapState, mapMutations } from "vuex";
import nightOperationRecorder from "../../utils/nightOperations";

export default {
  name: "RoleAbilityModal",
  components: {
    Modal,
  },
  data() {
    return {
      selectedRole: null,
      selectedPlayer: null,
      abilityType: "",
      information: "",
    };
  },
  computed: {
    ...mapState(["roles", "modals"]),
    ...mapState("players", ["players"]),
    availableRoles() {
      return Array.from(this.roles.values()).filter(
        (role) =>
          role.team !== "traveler" &&
          this.players.some((p) => p.role.id === role.id),
      );
    },
    availablePlayers() {
      if (!this.selectedRole) return [];
      return this.players.filter((p) => p.role.id === this.selectedRole.id);
    },
    canRecord() {
      return this.selectedRole && this.abilityType && this.information.trim();
    },
  },
  methods: {
    recordAbility() {
      if (!this.canRecord) return;

      const playerName = this.selectedPlayer ? this.selectedPlayer.name : null;

      // 记录角色能力使用
      nightOperationRecorder.useAbility(
        this.selectedRole.name,
        this.abilityType,
        playerName,
        this.information,
        this.$store,
      );

      // 如果选择了玩家，也记录信息传递
      if (this.selectedPlayer) {
        nightOperationRecorder.giveInformation(
          this.selectedRole.name,
          this.selectedPlayer.name,
          this.information,
          this.$store,
        );
      }

      // 重置表单
      this.selectedRole = null;
      this.selectedPlayer = null;
      this.abilityType = "";
      this.information = "";

      // 关闭模态框
      this.toggleModal("roleAbility");
    },
    ...mapMutations(["toggleModal"]),
  },
};
</script>

<style lang="scss" scoped>
@import "../../vars.scss";

.role-ability-modal {
  max-width: 500px;

  h3 {
    text-align: center;
    margin-bottom: 20px;
    color: #fff;
  }
}

.ability-form {
  .form-group {
    margin-bottom: 15px;

    label {
      display: block;
      margin-bottom: 5px;
      color: #fff;
      font-weight: bold;
    }

    .form-select {
      width: 100%;
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

    .form-textarea {
      width: 100%;
      min-height: 80px;
      padding: 8px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid #333;
      color: #fff;
      border-radius: 4px;
      resize: vertical;

      &::placeholder {
        color: #999;
      }
    }
  }

  .form-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;

      &.btn-record {
        background: #4a90e2;
        color: #fff;

        &:hover:not(:disabled) {
          background: #357abd;
        }

        &:disabled {
          background: #666;
          cursor: not-allowed;
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
</style>
