<template>
  <div id="vote">
    <div class="arrows">
      <span class="nominee" :style="nomineeStyle"></span>
      <span class="nominator" :style="nominatorStyle"></span>
    </div>
    <div class="overlay">
      <audio src="../assets/sounds/countdown.mp3" preload="auto"></audio>
      <em class="blue">{{ nominator.name }}</em> {{ $t("vote.nominated") }}
      <em>{{ nominee.name }}</em
      >!
      <br />
      <em class="blue">
        {{ voters.length }} {{ $t("vote.vote")
        }}{{ voters.length !== 1 ? "s" : "" }}
      </em>
      {{ $t("vote.inFavor") }}
      <em v-if="nominee.role.team !== 'traveler'">
        ({{ $t("vote.majority") }} {{ Math.ceil(alive / 2) }})
      </em>
      <em v-else
        >({{ $t("vote.majority") }} {{ Math.ceil(players.length / 2) }})</em
      >

      <template v-if="!session.isSpectator">
        <div v-if="!session.isVoteInProgress && session.lockedVote < 1">
          {{ $t("vote.timePerPlayer") }}
          <font-awesome-icon
            @mousedown.prevent="setVotingSpeed(-500)"
            icon="minus-circle"
          />
          {{ session.votingSpeed / 1000 }}s
          <font-awesome-icon
            @mousedown.prevent="setVotingSpeed(500)"
            icon="plus-circle"
          />
        </div>
        <div class="button-group">
          <div
            class="button townsfolk"
            v-if="!session.isVoteInProgress"
            @click="countdown"
          >
            {{ $t("vote.countdown") }}
          </div>
          <div class="button" v-if="!session.isVoteInProgress" @click="start">
            {{ session.lockedVote ? $t("vote.restart") : $t("vote.start") }}
          </div>
          <template v-else>
            <div
              class="button townsfolk"
              :class="{ disabled: !session.lockedVote }"
              @click="pause"
            >
              {{ voteTimer ? $t("vote.pause") : $t("vote.resume") }}
            </div>
            <div class="button" @click="stop">{{ $t("vote.reset") }}</div>
          </template>
          <div class="button demon" @click="finish">{{ $t("vote.close") }}</div>
        </div>
        <div class="button-group mark" v-if="nominee.role.team !== 'traveler'">
          <div
            class="button"
            :class="{
              disabled: session.nomination[1] === session.markedPlayer,
            }"
            @click="setMarked"
          >
            {{ $t("vote.markForExecution") }}
          </div>
          <div class="button" @click="removeMarked">
            {{ $t("vote.clearMark") }}
          </div>
        </div>
      </template>
      <template v-else-if="canVote">
        <div v-if="!session.isVoteInProgress">
          {{ session.votingSpeed / 1000 }} {{ $t("vote.secondsBetweenVotes") }}
        </div>
        <div class="button-group">
          <div
            class="button townsfolk"
            @click="vote(false)"
            :class="{ disabled: !currentVote }"
          >
            {{ $t("vote.handDown") }}
          </div>
          <div
            class="button demon"
            @click="vote(true)"
            :class="{ disabled: currentVote }"
          >
            {{ $t("vote.handUp") }}
          </div>
        </div>
      </template>
      <div v-else-if="!player">
        {{ $t("vote.pleaseClaimSeat") }}
      </div>
    </div>
    <transition name="blur">
      <div
        class="countdown"
        v-if="session.isVoteInProgress && !session.lockedVote"
      >
        <span>3</span>
        <span>2</span>
        <span>1</span>
        <span>{{ $t("vote.go") }}</span>
        <audio
          :autoplay="!grimoire.isMuted"
          src="../assets/sounds/countdown.mp3"
          :muted="grimoire.isMuted"
        ></audio>
      </div>
    </transition>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import i18n from "../i18n";

export default {
  computed: {
    ...mapState("players", ["players"]),
    ...mapState(["session", "grimoire"]),
    ...mapGetters({ alive: "players/alive" }),
    nominator: function () {
      if (!this.session.nomination || !this.session.nomination[0]) {
        return null;
      }
      return this.players[this.session.nomination[0]];
    },
    nominatorStyle: function () {
      const players = this.players.length;
      if (!this.session.nomination || !this.session.nomination[0]) {
        return {
          transform: "rotate(0deg)",
          transitionDuration: this.session.votingSpeed - 100 + "ms",
        };
      }
      const nomination = this.session.nomination[0];
      return {
        transform: `rotate(${Math.round((nomination / players) * 360)}deg)`,
        transitionDuration: this.session.votingSpeed - 100 + "ms",
      };
    },
    nominee: function () {
      if (!this.session.nomination || !this.session.nomination[1]) {
        return null;
      }
      return this.players[this.session.nomination[1]];
    },
    nomineeStyle: function () {
      const players = this.players.length;
      if (!this.session.nomination || !this.session.nomination[1]) {
        return {
          transform: "rotate(0deg)",
          transitionDuration: this.session.votingSpeed - 100 + "ms",
        };
      }
      const nomination = this.session.nomination[1];
      const lock = this.session.lockedVote;
      const rotation = (360 * (nomination + Math.min(lock, players))) / players;
      return {
        transform: `rotate(${Math.round(rotation)}deg)`,
        transitionDuration: this.session.votingSpeed - 100 + "ms",
      };
    },
    player: function () {
      return this.players.find((p) => p.id === this.session.playerId);
    },
    currentVote: function () {
      const index = this.players.findIndex(
        (p) => p.id === this.session.playerId,
      );
      return index >= 0 ? !!this.session.votes[index] : undefined;
    },
    canVote: function () {
      if (!this.player) return false;
      if (this.player.isVoteless && this.nominee.role.team !== "traveler")
        return false;
      const session = this.session;
      const players = this.players.length;
      const index = this.players.indexOf(this.player);
      const indexAdjusted =
        (index - 1 + players - session.nomination[1]) % players;
      return indexAdjusted >= session.lockedVote - 1;
    },
    voters: function () {
      const nomination = this.session.nomination[1];
      const voters = Array(this.players.length)
        .fill("")
        .map((x, index) =>
          this.session.votes[index] ? this.players[index].name : "",
        );
      const reorder = [
        ...voters.slice(nomination + 1),
        ...voters.slice(0, nomination + 1),
      ];
      return (
        this.session.lockedVote
          ? reorder.slice(0, this.session.lockedVote - 1)
          : reorder
      ).filter((n) => !!n);
    },
  },
  data() {
    return {
      voteTimer: null,
    };
  },
  methods: {
    $t(key, params = {}) {
      return i18n.t(key, params);
    },
    countdown() {
      this.$store.commit("session/lockVote", 0);
      this.$store.commit("session/setVoteInProgress", true);
      this.voteTimer = setInterval(() => {
        this.start();
      }, 4000);
    },
    start() {
      this.$store.commit("session/lockVote", 1);
      this.$store.commit("session/setVoteInProgress", true);
      clearInterval(this.voteTimer);
      this.voteTimer = setInterval(() => {
        this.$store.commit("session/lockVote");
        if (this.session.lockedVote > this.players.length) {
          clearInterval(this.voteTimer);
          this.$store.commit("session/setVoteInProgress", false);
        }
      }, this.session.votingSpeed);
    },
    pause() {
      if (this.voteTimer) {
        clearInterval(this.voteTimer);
        this.voteTimer = null;
      } else {
        this.voteTimer = setInterval(() => {
          this.$store.commit("session/lockVote");
          if (this.session.lockedVote > this.players.length) {
            clearInterval(this.voteTimer);
            this.$store.commit("session/setVoteInProgress", false);
          }
        }, this.session.votingSpeed);
      }
    },
    stop() {
      clearInterval(this.voteTimer);
      this.voteTimer = null;
      this.$store.commit("session/setVoteInProgress", false);
      this.$store.commit("session/lockVote", 0);
    },
    finish() {
      clearInterval(this.voteTimer);
      this.$store.commit("session/addHistory", this.players);

      // 移除处决历史记录
      // const nominee = this.nominee;
      // const voteCount = this.voters.length;
      // const majority = Math.ceil(this.alive / 2);
      // const isExecuted = voteCount >= majority;

      // this.$store.commit("addHistoryEvent", {
      //   action: "execution",
      //   summary: `${nominee.name} ${isExecuted ? "被处决" : "未被处决"}`,
      //   details: `投票结果: ${voteCount}/${majority} 票，${
      //     isExecuted ? "达到多数票" : "未达到多数票"
      //   }`,
      //   isPublic: true,
      // });

      this.$store.commit("session/nomination");
    },
    vote(vote) {
      if (!this.canVote) return false;
      const index = this.players.findIndex(
        (p) => p.id === this.session.playerId,
      );
      if (index >= 0 && !!this.session.votes[index] !== vote) {
        this.$store.commit("session/voteSync", [index, vote]);

        // 移除投票历史记录
        // const player = this.players[index];
        // this.$store.commit("addHistoryEvent", {
        //   action: "vote",
        //   summary: `${player.name} ${vote ? "举手" : "手放下"}`,
        //   details: `${player.name} 对 ${this.nominee.name} 的提名进行了投票`,
        //   isPublic: true,
        // });
      }
    },
    setVotingSpeed(diff) {
      const speed = Math.round(this.session.votingSpeed + diff);
      if (speed > 0) {
        this.$store.commit("session/setVotingSpeed", speed);
      }
    },
    setMarked() {
      this.$store.commit("session/setMarkedPlayer", this.session.nomination[1]);
    },
    removeMarked() {
      this.$store.commit("session/setMarkedPlayer", -1);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../vars.scss";

#vote {
  position: absolute;
  width: 20%;
  z-index: 20;
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  background: url("../assets/demon-head.png") center center no-repeat;
  background-size: auto 75%;
  text-align: center;
  text-shadow:
    0 1px 2px #000000,
    0 -1px 2px #000000,
    1px 0 2px #000000,
    -1px 0 2px #000000;

  .mark .button {
    font-size: 75%;
    margin: 0;
  }

  &:after {
    content: " ";
    padding-bottom: 100%;
    display: block;
  }

  em {
    color: $demon;
    font-style: normal;
    font-weight: bold;
    &.blue {
      color: $townsfolk;
    }
  }

  svg {
    cursor: pointer;
    &:hover path {
      fill: url(#demon);
      stroke-width: 30px;
      stroke: white;
    }
  }
}

@keyframes arrow-cw {
  0% {
    opacity: 0;
    transform: rotate(-180deg);
  }
  100% {
    opacity: 1;
    transform: rotate(0deg);
  }
}

@keyframes arrow-ccw {
  0% {
    opacity: 0;
    transform: rotate(180deg);
  }
  100% {
    opacity: 1;
    transform: rotate(0deg);
  }
}

.arrows {
  position: absolute;
  display: flex;
  height: 150%;
  width: 25%;
  pointer-events: none;
  span {
    position: absolute;
    width: 100%;
    height: 100%;
    transition: transform 2.9s cubic-bezier(0.4, 0, 0.2, 1);
  }
  span:before {
    content: " ";
    width: 100%;
    height: 100%;
    display: block;
    background-size: auto 100%;
    background-repeat: no-repeat;
    background-position: center center;
    position: absolute;
    filter: drop-shadow(0px 0px 3px #000);
  }
  .nominator:before {
    background-image: url("../assets/clock-small.png");
    animation: arrow-ccw 1s ease-out;
  }
  .nominee:before {
    background-image: url("../assets/clock-big.png");
    animation: arrow-cw 1s ease-out;
  }
}

@keyframes countdown {
  0% {
    transform: scale(1.5) rotate(-10deg);
    opacity: 0;
    filter: blur(20px);
  }
  10% {
    opacity: 1;
  }
  50% {
    transform: scale(1) rotate(0deg);
    filter: blur(0);
  }
  90% {
    color: $townsfolk;
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
}

@keyframes countdown-go {
  0% {
    transform: scale(1.5);
    opacity: 0;
    filter: blur(20px);
  }
  10% {
    opacity: 1;
  }
  50% {
    transform: scale(1);
    filter: blur(0);
  }
  90% {
    color: $demon;
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.countdown {
  display: flex;
  position: absolute;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  audio {
    height: 0;
    width: 0;
    visibility: hidden;
  }
  span {
    position: absolute;
    font-size: 8em;
    font-weight: bold;
    opacity: 0;
  }
  span:nth-child(1) {
    animation: countdown 1100ms normal forwards;
  }
  span:nth-child(2) {
    animation: countdown 1100ms normal forwards 1000ms;
  }
  span:nth-child(3) {
    animation: countdown 1100ms normal forwards 2000ms;
  }
  span:nth-child(4) {
    animation: countdown-go 1100ms normal forwards 3000ms;
  }
}
</style>
