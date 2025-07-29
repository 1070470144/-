<template>
  <Modal
    v-if="modals.role && availableRoles.length && playerIndex !== undefined"
    @close="close"
  >
    <h3>
      Choose a new character for
      {{
        playerIndex >= 0 && players.length > playerIndex
          ? players[playerIndex].name
          : "bluffing"
      }}
    </h3>
    <ul class="tokens" v-if="tab === 'editionRoles' || !otherTravelers.size">
      <li
        v-for="role in availableRoles"
        :class="[role.team]"
        :key="role.id"
        @click="setRole(role)"
      >
        <Token :role="role" />
      </li>
    </ul>
    <ul class="tokens" v-if="tab === 'otherTravelers' && otherTravelers.size">
      <li
        v-for="role in otherTravelers.values()"
        :class="[role.team]"
        :key="role.id"
        @click="setRole(role)"
      >
        <Token :role="role" />
      </li>
    </ul>
    <div
      class="button-group"
      v-if="playerIndex >= 0 && otherTravelers.size && !session.isSpectator"
    >
      <span
        class="button"
        :class="{ townsfolk: tab === 'editionRoles' }"
        @click="tab = 'editionRoles'"
        >Edition Roles</span
      >
      <span
        class="button"
        :class="{ townsfolk: tab === 'otherTravelers' }"
        @click="tab = 'otherTravelers'"
        >Other Travelers</span
      >
    </div>
  </Modal>
</template>

<script>
import { mapMutations, mapState } from "vuex";
import Modal from "./Modal";
import Token from "../Token";

export default {
  components: { Token, Modal },
  computed: {
    playerIndex() {
      return this.$store.state.selectedPlayer;
    },
    availableRoles() {
      const availableRoles = [];
      const players = this.$store.state.players.players;
      this.$store.state.roles.forEach((role) => {
        // don't show bluff roles that are already assigned to players
        if (
          this.playerIndex >= 0 ||
          (this.playerIndex < 0 &&
            !players.some((player) => player.role.id === role.id))
        ) {
          availableRoles.push(role);
        }
      });
      availableRoles.push({});
      return availableRoles;
    },
    ...mapState(["modals", "roles", "session"]),
    ...mapState("players", ["players"]),
    ...mapState(["otherTravelers"]),
  },
  data() {
    return {
      tab: "editionRoles",
    };
  },
  methods: {
    setRole(role) {
      console.log("setRole called with role:", role);
      console.log("playerIndex:", this.playerIndex);

      if (this.playerIndex < 0) {
        // assign to bluff slot (index < 0)
        const bluffIndex = this.playerIndex * -1 - 1;
        console.log("计算恶魔伪装索引:", bluffIndex);
        console.log("当前bluffs数组:", this.$store.state.players.bluffs);

        this.$store.commit("players/setBluff", {
          index: bluffIndex,
          role,
        });

        console.log("设置后的bluffs数组:", this.$store.state.players.bluffs);
      } else {
        if (this.session.isSpectator && role.team === "traveler") return;
        // assign to player
        const players = this.$store.state.players.players;
        if (this.playerIndex >= 0 && players.length > this.playerIndex) {
          const player = players[this.playerIndex];
          this.$store.commit("players/update", {
            player,
            property: "role",
            value: role,
          });
        }
      }
      this.tab = "editionRoles";
      this.$store.commit("toggleModal", "role");
    },
    close() {
      this.tab = "editionRoles";
      this.toggleModal("role");
    },
    ...mapMutations(["toggleModal"]),
  },
};
</script>

<style scoped lang="scss">
@import "../../vars.scss";

ul.tokens li {
  border-radius: 50%;
  width: 6vw;
  margin: 1%;
  transition: transform 500ms ease;

  &.townsfolk {
    box-shadow:
      0 0 10px $townsfolk,
      0 0 10px #004cff;
  }
  &.outsider {
    box-shadow:
      0 0 10px $outsider,
      0 0 10px $outsider;
  }
  &.minion {
    box-shadow:
      0 0 10px $minion,
      0 0 10px $minion;
  }
  &.demon {
    box-shadow:
      0 0 10px $demon,
      0 0 10px $demon;
  }
  &.traveler {
    box-shadow:
      0 0 10px $traveler,
      0 0 10px $traveler;
  }
  &:hover {
    transform: scale(1.2);
    z-index: 10;
  }
}

#townsquare.spectator ul.tokens li.traveler {
  display: none;
}
</style>
