<template>
  <div id="controls">
    <span
      class="nomlog-summary"
      v-show="session.voteHistory.length && session.sessionId"
      @click="toggleModal('voteHistory')"
      :title="`${session.voteHistory.length} ${$t(
        'voteHistorySummary.recent',
      )} ${
        session.voteHistory.length == 1
          ? $t('voteHistorySummary.nomination')
          : $t('voteHistorySummary.nominations')
      }`"
    >
      <font-awesome-icon icon="book-dead" />
      {{ session.voteHistory.length }}
    </span>
    <span
      class="session"
      :class="{
        spectator: session.isSpectator,
        reconnecting: session.isReconnecting,
      }"
      v-if="session.sessionId"
      @click="leaveSession"
      :title="`${session.playerCount} other players in this session${
        session.ping ? ' (' + session.ping + 'ms latency)' : ''
      }`"
    >
      <font-awesome-icon icon="broadcast-tower" />
      {{ session.playerCount }}
    </span>
    <div class="menu" :class="{ open: grimoire.isMenuOpen }">
      <font-awesome-icon icon="cog" @click="toggleMenu" />
      <ul>
        <li class="tabs" :class="tab">
          <font-awesome-icon icon="book-open" @click="tab = 'grimoire'" />
          <font-awesome-icon icon="broadcast-tower" @click="tab = 'session'" />
          <font-awesome-icon
            icon="users"
            v-if="!session.isSpectator"
            @click="tab = 'players'"
          />
          <font-awesome-icon icon="theater-masks" @click="tab = 'characters'" />
          <font-awesome-icon icon="question" @click="tab = 'help'" />
        </li>

        <template v-if="tab === 'grimoire'">
          <!-- Grimoire -->
          <li class="headline">{{ $t("menu.grimoire") }}</li>
          <li @click="toggleGrimoire" v-if="players.length">
            <template v-if="!grimoire.isPublic">{{ $t("menu.hide") }}</template>
            <template v-if="grimoire.isPublic">{{ $t("menu.show") }}</template>
            <em>[G]</em>
          </li>
          <li @click="toggleNight" v-if="!session.isSpectator">
            <template v-if="!grimoire.isNight">{{
              $t("menu.switchToNight")
            }}</template>
            <template v-if="grimoire.isNight">{{
              $t("menu.switchToDay")
            }}</template>
            <em>[S]</em>
          </li>
          <li @click="toggleNightOrder" v-if="players.length">
            {{ $t("menu.nightOrder") }}
            <em>
              <font-awesome-icon
                :icon="[
                  'fas',
                  grimoire.isNightOrder ? 'check-square' : 'square',
                ]"
              />
            </em>
          </li>
          <li v-if="players.length">
            {{ $t("menu.zoom") }}
            <em>
              <font-awesome-icon
                @click="setZoom(grimoire.zoom - 1)"
                icon="search-minus"
              />
              {{ Math.round(100 + grimoire.zoom * 10) }}%
              <font-awesome-icon
                @click="setZoom(grimoire.zoom + 1)"
                icon="search-plus"
              />
            </em>
          </li>
          <li @click="setBackground">
            {{ $t("menu.backgroundImage") }}
            <em><font-awesome-icon icon="image" /></em>
          </li>
          <li @click="toggleStatic">
            {{ $t("menu.disableAnimations") }}
            <em
              ><font-awesome-icon
                :icon="['fas', grimoire.isStatic ? 'check-square' : 'square']"
            /></em>
          </li>
          <li @click="toggleMuted">
            {{ $t("menu.muteSounds") }}
            <em
              ><font-awesome-icon
                :icon="['fas', grimoire.isMuted ? 'volume-mute' : 'volume-up']"
            /></em>
          </li>
        </template>

        <template v-if="tab === 'session'">
          <!-- Session -->
          <li class="headline" v-if="session.sessionId">
            {{ session.isSpectator ? $t("menu.playing") : $t("menu.hosting") }}
          </li>
          <li class="headline" v-else>
            {{ $t("menu.liveSession") }}
          </li>
          <template v-if="!session.sessionId">
            <li @click="hostSession">
              {{ $t("menu.hostStoryteller") }}<em>[H]</em>
            </li>
            <li @click="joinSession">
              {{ $t("menu.joinPlayer") }}<em>[J]</em>
            </li>
          </template>
          <template v-else>
            <li v-if="session.ping">
              {{
                session.isSpectator
                  ? $t("menu.delayToHost")
                  : $t("menu.delayToPlayers")
              }}
              <em>{{ session.ping }}ms</em>
            </li>
            <li @click="copySessionUrl">
              {{ $t("menu.copyPlayerLink") }}
              <em><font-awesome-icon icon="copy" /></em>
            </li>
            <li v-if="!session.isSpectator" @click="distributeRoles">
              {{ $t("menu.sendCharacters") }}
              <em><font-awesome-icon icon="theater-masks" /></em>
            </li>
            <li
              v-if="session.voteHistory.length || !session.isSpectator"
              @click="toggleModal('voteHistory')"
            >
              {{ $t("menu.voteHistory") }}<em>[V]</em>
            </li>
            <li @click="toggleHistoryPanel">
              {{ $t("menu.gameHistory") }}<em>[H]</em>
            </li>
            <li @click="resetGame">
              {{ $t("menu.resetGame") }}
              <em><font-awesome-icon icon="trash-alt" /></em>
            </li>
            <li @click="leaveSession">
              {{ $t("menu.leaveSession") }}
              <em>{{ session.sessionId }}</em>
            </li>
          </template>
        </template>

        <template v-if="tab === 'players' && !session.isSpectator">
          <!-- Users -->
          <li class="headline">{{ $t("menu.players") }}</li>
          <li @click="addPlayer" v-if="players.length < 20">
            {{ $t("menu.addPlayer") }}<em>[A]</em>
          </li>
          <li @click="randomizeSeatings" v-if="players.length > 2">
            {{ $t("menu.randomizeSeatings") }}
            <em><font-awesome-icon icon="dice" /></em>
          </li>
          <li @click="clearPlayers" v-if="players.length">
            {{ $t("menu.removeAll") }}
            <em><font-awesome-icon icon="trash-alt" /></em>
          </li>
        </template>

        <template v-if="tab === 'characters'">
          <!-- Characters -->
          <li class="headline">{{ $t("menu.characters") }}</li>
          <li v-if="!session.isSpectator" @click="toggleModal('edition')">
            {{ $t("menu.selectEdition") }}
            <em>[E]</em>
          </li>
          <li
            @click="toggleModal('roles')"
            v-if="!session.isSpectator && players.length > 4"
          >
            {{ $t("menu.chooseAndAssign") }}
            <em>[C]</em>
          </li>
          <li v-if="!session.isSpectator" @click="toggleModal('fabled')">
            {{ $t("menu.addFabled") }}
            <em><font-awesome-icon icon="dragon" /></em>
          </li>
          <li @click="clearRoles" v-if="players.length">
            {{ $t("menu.removeAllRoles") }}
            <em><font-awesome-icon icon="trash-alt" /></em>
          </li>
        </template>

        <template v-if="tab === 'help'">
          <!-- Help -->
          <li class="headline">{{ $t("menu.help") }}</li>
          <li @click="toggleLanguage">
            {{ $t("language.switch") }}
            <em>{{
              currentLanguage === "zh-CN"
                ? $t("language.chinese")
                : $t("language.english")
            }}</em>
          </li>
          <li @click="toggleModal('reference')">
            {{ $t("menu.referenceSheet") }}
            <em>[R]</em>
          </li>
          <li @click="toggleModal('nightOrder')">
            {{ $t("menu.nightOrderSheet") }}
            <em>[N]</em>
          </li>
          <li @click="toggleModal('gameState')">
            {{ $t("menu.gameStateJSON") }}
            <em><font-awesome-icon icon="file-code" /></em>
          </li>
          <li>
            <a href="https://discord.gg/Gd7ybwWbFk" target="_blank">
              {{ $t("menu.joinDiscord") }}
            </a>
            <em>
              <a href="https://discord.gg/Gd7ybwWbFk" target="_blank">
                <font-awesome-icon :icon="['fab', 'discord']" />
              </a>
            </em>
          </li>
          <li>
            <a href="https://github.com/bra1n/townsquare" target="_blank">
              {{ $t("menu.sourceCode") }}
            </a>
            <em>
              <a href="https://github.com/bra1n/townsquare" target="_blank">
                <font-awesome-icon :icon="['fab', 'github']" />
              </a>
            </em>
          </li>
        </template>
      </ul>
    </div>
    <ResetGameModal
      v-if="showResetModal"
      @close="showResetModal = false"
      @confirm="handleResetConfirm"
    />
  </div>
</template>

<script>
import { mapMutations, mapState } from "vuex";
import i18n from "../i18n";
import ResetGameModal from "./modals/ResetGameModal.vue";

export default {
  components: {
    ResetGameModal,
  },
  computed: {
    ...mapState(["grimoire", "session", "edition", "roles", "history"]),
    ...mapState("players", ["players"]),
    currentLanguage() {
      return i18n.getCurrentLanguage();
    },
    hasCustomImages() {
      // 检查当前角色中是否有自定义图片
      return Array.from(this.roles.values()).some(
        (role) => role.image && role.image.trim() !== "",
      );
    },
  },
  data() {
    return {
      tab: "grimoire",
      showResetModal: false,
    };
  },
  methods: {
    $t(key, params = {}) {
      return i18n.t(key, params);
    },
    setBackground() {
      const background = prompt(this.$t("prompts.enterBackgroundUrl"));
      if (background || background === "") {
        this.$store.commit("setBackground", background);
      }
    },
    hostSession() {
      if (this.session.sessionId) return;
      const sessionId = prompt(
        this.$t("prompts.enterSessionName"),
        Math.round(Math.random() * 10000),
      );
      if (sessionId) {
        this.$store.commit("session/clearVoteHistory");
        // 先清除现有会话，确保不会触发socket.js中的自动设置逻辑
        this.$store.commit("session/setSessionId", "");
        // 强制设置说书人模式
        this.$store.commit("session/setSpectator", false);
        // 确保isSpectator已经被设置后再设置sessionId
        this.$nextTick(() => {
          console.log("设置说书人会话，isSpectator:", this.session.isSpectator);
          this.$store.commit("session/setSessionId", sessionId);
          
          // 更新说书人的URL hash，确保刷新后能正确识别
          const currentUrl = window.location.href.split("#")[0];
          const newUrl = currentUrl + "#" + sessionId;
          window.history.pushState(null, "", newUrl);
          console.log("说书人创建对局，更新URL hash:", newUrl);
          
          // 设置hash角色标志位
          const { setHashRoleFlag } = require("../utils/userStorage");
          setHashRoleFlag(sessionId, "storyteller");
          
          this.copySessionUrl();
        });
      }
    },
    async copySessionUrl() {
      const url = window.location.href.split("#")[0];
      const link = url + "#" + this.session.sessionId;
      
      try {
        // 尝试使用现代剪贴板API
        await navigator.clipboard.writeText(link);
        console.log("链接已复制到剪贴板:", link);
      } catch (error) {
        console.warn("现代剪贴板API失败，尝试备用方法:", error);
        
        // 备用方法：使用传统的document.execCommand
        const textArea = document.createElement("textarea");
        textArea.value = link;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand("copy");
          if (successful) {
            console.log("链接已复制到剪贴板（备用方法）:", link);
          } else {
            console.error("复制失败");
            alert("复制失败，请手动复制链接：" + link);
          }
        } catch (err) {
          console.error("备用复制方法也失败:", err);
          alert("复制失败，请手动复制链接：" + link);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    },
    distributeRoles() {
      if (this.session.isSpectator) return;

      // 检查是否有玩家
      if (this.players.length === 0) {
        alert("没有玩家可以发送角色！请先添加玩家。");
        return;
      }

      // 检查是否有玩家有角色
      const playersWithRoles = this.players.filter(
        (player) => player.role && player.role.id,
      );
      if (playersWithRoles.length === 0) {
        alert("没有玩家分配了角色！请先分配角色。");
        return;
      }

      // 检查是否有玩家有ID（已认领座位）
      const playersWithId = this.players.filter((player) => player.id);
      if (playersWithId.length === 0) {
        alert("没有玩家认领座位！玩家需要先认领座位才能接收角色。");
        return;
      }

      const popup = this.$t("prompts.distributeCharacters");
      if (confirm(popup)) {
        console.log("Distributing roles to players:", {
          totalPlayers: this.players.length,
          playersWithRoles: playersWithRoles.length,
          playersWithId: playersWithId.length,
        });

        this.$store.commit("session/distributeRoles", true);
        setTimeout(
          (() => {
            this.$store.commit("session/distributeRoles", false);
          }).bind(this),
          2000,
        );
      }
    },
    imageOptIn() {
      this.toggleImageOptIn();
    },
    resetGame() {
      this.openResetModal();
    },
    openResetModal() {
      this.showResetModal = true;
    },
    handleResetConfirm(options) {
      // 说书人和玩家分别处理重置逻辑
      if (!this.session || this.session.isSpectator === false) {
        // 说书人重置（同步所有玩家）
        this.resetAllGameWithOptions(options);
      } else {
        // 玩家本地重置
        this.resetPlayerGameWithOptions(options);
      }
    },
    resetAllGameWithOptions(options) {
      // 说书人重置：先执行本地重置，再发送网络消息
      console.log("说书人执行重置，选项:", options);

      // 先执行本地重置
      this.resetPlayerGameWithOptions(options);

      // 再发送socket消息给所有玩家
      if (this.$store.state.socket) {
        console.log("发送重置消息给所有玩家");
        this.$store.state.socket.sendReset("all", options);
      } else {
        console.log("Socket实例不存在，无法发送重置消息");
      }
    },
    resetPlayerGameWithOptions(options) {
      // 本地重置所有玩家数据，根据options
      const players = this.players;
      if (options.roles) {
        players.forEach((player) => {
          this.$store.commit("players/update", {
            player,
            property: "role",
            value: { id: null, name: null },
          });
        });
      }
      if (options.bluffs) {
        this.$store.commit("players/setBluff", {});
      }
      if (options.reminders) {
        players.forEach((player) => {
          this.$store.commit("players/update", {
            player,
            property: "reminders",
            value: [],
          });
        });
      }
      if (options.deathStatus) {
        players.forEach((player) => {
          this.$store.commit("players/update", {
            player,
            property: "isDead",
            value: false,
          });
        });
      }
      if (options.nominationStatus) {
        players.forEach((player) => {
          this.$store.commit("players/update", {
            player,
            property: "isNominated",
            value: false,
          });
        });
      }
      if (options.aliveStatus) {
        players.forEach((player) => {
          this.$store.commit("players/update", {
            player,
            property: "isDead",
            value: false,
          });
        });
      }
      if (options.gameHistory) {
        this.$store.commit("clearHistory");
      }
      if (options.voteSettings) {
        this.$store.commit("session/clearVoteHistory");
      }
      if (options.nightSettings) {
        // 可根据实际夜晚状态重置逻辑补充
        this.$store.commit("toggleNight", false);
      }
      if (options.markerSettings) {
        this.$store.commit("session/setMarkedPlayer", -1);
      }
    },
    joinSession() {
      if (this.session.sessionId) return this.leaveSession();
      let sessionId = prompt(this.$t("prompts.enterJoinSession"));
      if (sessionId.match(/^https?:\/\//i)) {
        sessionId = sessionId.split("#").pop();
      }
      if (sessionId) {
        this.$store.commit("session/clearVoteHistory");
        this.$store.commit("session/setSpectator", true);
        this.$store.commit("toggleGrimoire", false);
        this.$store.commit("session/setSessionId", sessionId);
        
        // 更新URL hash，确保游客模式被正确识别为玩家模式
        this.$nextTick(() => {
          const currentUrl = window.location.href.split("#")[0];
          const newUrl = currentUrl + "#" + sessionId;
          window.history.pushState(null, "", newUrl);
          console.log("游客加入对局，更新URL hash:", newUrl);
          
          // 设置hash角色标志位
          const { setHashRoleFlag } = require("../utils/userStorage");
          setHashRoleFlag(sessionId, "player");
        });
      }
    },
    leaveSession() {
      if (confirm(this.$t("confirm.leaveActiveGame"))) {
        const sessionId = this.session.sessionId;
        this.$store.commit("session/setSpectator", false);
        this.$store.commit("session/setSessionId", "");
        
        // 清除hash角色标志位
        if (sessionId) {
          const { clearHashRoleFlag } = require("../utils/userStorage");
          clearHashRoleFlag(sessionId);
        }
      }
    },
    addPlayer() {
      if (this.session.isSpectator) return;
      if (this.players.length >= 20) return;
      const name = prompt(this.$t("prompts.playerName"));
      if (name) {
        this.$store.commit("players/add", name);
      }
    },
    randomizeSeatings() {
      if (this.session.isSpectator) return;
      if (confirm(this.$t("confirm.randomizeSeatings"))) {
        this.$store.dispatch("players/randomize");
      }
    },
    clearPlayers() {
      if (this.session.isSpectator) return;
      if (confirm(this.$t("confirm.removeAllPlayers"))) {
        // abort vote if in progress
        if (this.session.nomination) {
          this.$store.commit("session/nomination");
        }
        this.$store.commit("players/clear");
      }
    },
    clearRoles() {
      if (confirm(this.$t("confirm.removeAllRoles"))) {
        this.$store.dispatch("players/clearRoles");
      }
    },
    toggleHistoryPanel() {
      this.$parent.showHistoryPanel = !this.$parent.showHistoryPanel;
    },
    toggleNight() {
      this.$store.commit("toggleNight");
      if (this.grimoire.isNight) {
        this.$store.commit("session/setMarkedPlayer", -1);

        // 设置夜晚阶段
        this.$store.commit("setCurrentPhase", "night");

        // 如果是第一次夜晚，设置为首夜
        if (!this.history.currentRound || this.history.currentRound === 1) {
          this.$store.commit("setCurrentRound", 1);
        }

        // 记录夜晚切换历史
        this.$store.commit("addHistoryEvent", {
          action: "phase_change",
          summary: "切换到夜晚阶段",
          details: "说书人开始夜晚操作",
          phase: "night",
          round: this.history.currentRound,
          isPublic: false,
        });
      } else {
        // 设置白天阶段
        this.$store.commit("setCurrentPhase", "day");

        // 如果是第一次白天，设置为第一个白天
        if (!this.history.currentRound || this.history.currentRound === 1) {
          this.$store.commit("setCurrentRound", 1);
        }

        // 记录白天切换历史
        this.$store.commit("addHistoryEvent", {
          action: "phase_change",
          summary: "切换到白天阶段",
          details: "夜晚结束，开始白天讨论",
          phase: "day",
          round: this.history.currentRound,
          isPublic: false,
        });
      }
    },
    toggleLanguage() {
      const newLocale = this.currentLanguage === "zh-CN" ? "en-US" : "zh-CN";
      i18n.setLanguage(newLocale);
    },
    ...mapMutations([
      "toggleGrimoire",
      "toggleMenu",
      "toggleImageOptIn",
      "toggleMuted",
      "toggleNightOrder",
      "toggleStatic",
      "setZoom",
      "toggleModal",
      "setLocale",
    ]),
  },
};
</script>

<style scoped lang="scss">
@import "../vars.scss";

// success animation
@keyframes greenToWhite {
  from {
    color: green;
  }
  to {
    color: white;
  }
}

// Controls
#controls {
  position: absolute;
  right: 3px;
  top: 3px;
  text-align: right;
  padding-right: 50px;
  z-index: 75;

  svg {
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 1));
    &.success {
      animation: greenToWhite 1s normal forwards;
      animation-iteration-count: 1;
    }
  }

  > span {
    display: inline-block;
    cursor: pointer;
    z-index: 5;
    margin-top: 7px;
    margin-left: 10px;
  }

  span.nomlog-summary {
    color: $townsfolk;
  }

  span.session {
    color: $demon;
    &.spectator {
      color: $townsfolk;
    }
    &.reconnecting {
      animation: blink 1s infinite;
    }
  }
}

@keyframes blink {
  50% {
    opacity: 0.5;
    color: gray;
  }
}

.menu {
  width: 220px;
  transform-origin: 200px 22px;
  transition: transform 600ms cubic-bezier(0.68, -0.55, 0.27, 1.55);
  transform: rotate(-90deg);
  position: absolute;
  right: 0;
  top: 0;

  &.open {
    transform: rotate(0deg);
  }

  > svg {
    cursor: pointer;
    background: rgba(0, 0, 0, 0.5);
    border: 3px solid black;
    width: 40px;
    height: 50px;
    margin-bottom: -8px;
    border-bottom: 0;
    border-radius: 10px 10px 0 0;
    padding: 5px 5px 15px;
  }

  a {
    color: white;
    text-decoration: none;
    &:hover {
      color: red;
    }
  }

  ul {
    display: flex;
    list-style-type: none;
    padding: 0;
    margin: 0;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 0 10px black;
    border: 3px solid black;
    border-radius: 10px 0 10px 10px;

    li {
      padding: 2px 5px;
      color: white;
      text-align: left;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 30px;

      &.tabs {
        display: flex;
        padding: 0;
        svg {
          flex-grow: 1;
          flex-shrink: 0;
          height: 35px;
          border-bottom: 3px solid black;
          border-right: 3px solid black;
          padding: 5px 0;
          cursor: pointer;
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
          &:hover {
            color: red;
            transform: scale(1.1);
          }
          &:last-child {
            border-right: 0;
          }
        }
        &.grimoire .fa-book-open,
        &.players .fa-users,
        &.characters .fa-theater-masks,
        &.session .fa-broadcast-tower,
        &.help .fa-question {
          background: linear-gradient(
            to bottom,
            $townsfolk 0%,
            rgba(0, 0, 0, 0.5) 100%
          );
        }
      }

      &:not(.headline):not(.tabs):hover {
        cursor: pointer;
        color: red;
      }

      em {
        flex-grow: 0;
        font-style: normal;
        margin-left: 10px;
        font-size: 80%;
      }

      .custom-images-notice {
        color: #90ee90;
        font-size: 70%;
        margin-top: 2px;
        font-style: italic;
      }
    }

    .headline {
      font-family: PiratesBay, sans-serif;
      letter-spacing: 1px;
      padding: 0 10px;
      text-align: center;
      justify-content: center;
      background: linear-gradient(
        to right,
        $townsfolk 0%,
        rgba(0, 0, 0, 0.5) 20%,
        rgba(0, 0, 0, 0.5) 80%,
        $demon 100%
      );
    }
  }
}
</style>
