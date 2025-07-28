<template>
  <Modal
    class="roles"
    v-if="modals.roles && nonTravelers >= 5"
    @close="toggleModal('roles')"
  >
    <div v-if="!hasRoles" class="loading">
      {{ $t('roleSelection.loadingRoles') }}
    </div>
    <div v-else>
      <h3>{{ $t('roleSelection.selectCharacters', { count: nonTravelers }) }}</h3>
      <ul class="tokens" v-for="(teamRoles, team) in roleSelection" :key="team">
      <li class="count" :class="[team]">
        {{ teamRoles.reduce((a, { selected }) => a + selected, 0) }} /
        {{ game[nonTravelers - 5][team] }}
      </li>
      <li
        v-for="role in teamRoles"
        :class="[role.team, role.selected ? 'selected' : '']"
        :key="role.id"
        @click="role.selected = role.selected ? 0 : 1"
      >
        <Token :role="role" />
        <font-awesome-icon icon="exclamation-triangle" v-if="role.setup" />
        <div class="buttons" v-if="allowMultiple">
          <font-awesome-icon
            icon="minus-circle"
            @click.stop="role.selected--"
          />
          <span>{{ role.selected > 1 ? "x" + role.selected : "" }}</span>
          <font-awesome-icon icon="plus-circle" @click.stop="role.selected++" />
        </div>
      </li>
    </ul>
    <div class="warning" v-if="hasSelectedSetupRoles">
      <font-awesome-icon icon="exclamation-triangle" />
      <span>
        {{ $t('roleSelection.warningSetupRoles') }}
      </span>
    </div>
    <label class="multiple" :class="{ checked: allowMultiple }">
      <font-awesome-icon :icon="allowMultiple ? 'check-square' : 'square'" />
      <input type="checkbox" name="allow-multiple" v-model="allowMultiple" />
      {{ $t('roleSelection.allowDuplicateCharacters') }}
    </label>
    <div class="button-group">
      <div
        class="button"
        @click="assignRoles"
        :class="{
          disabled: selectedRoles > nonTravelers || !selectedRoles
        }"
      >
        <font-awesome-icon icon="people-arrows" />
        {{ $t('roleSelection.assignCharactersRandomly', { count: selectedRoles }) }}
      </div>
      <div class="button" @click="selectRandomRoles">
        <font-awesome-icon icon="random" />
        {{ $t('roleSelection.shuffleCharacters') }}
      </div>

    </div>
    </div>
  </Modal>
</template>

<script>
import Modal from "./Modal";
import gameJSON from "./../../game";
import Token from "./../Token";
import { mapGetters, mapMutations, mapState } from "vuex";
import i18n from '../../i18n';

const randomElement = arr => arr[Math.floor(Math.random() * arr.length)];

export default {
  components: {
    Token,
    Modal
  },
  data: function() {
    return {
      roleSelection: {},
      game: gameJSON,
      allowMultiple: false
    };
  },
  computed: {
    selectedRoles: function() {
      return Object.values(this.roleSelection)
        .map(roles => roles.reduce((a, { selected }) => a + selected, 0))
        .reduce((a, b) => a + b, 0);
    },
    hasSelectedSetupRoles: function() {
      return Object.values(this.roleSelection).some(roles =>
        roles.some(role => role.selected && role.setup)
      );
    },
    hasRoles() {
      const hasRoles = this.roles && this.roles.size > 0;
      console.log("hasRoles check:", hasRoles, "roles count:", this.roles ? this.roles.size : 0);
      return hasRoles;
    },
    ...mapState(["roles", "modals"]),
    ...mapState("players", ["players"]),
    ...mapGetters({ nonTravelers: "players/nonTravelers" })
  },
  methods: {
    $t(key, params = {}) {
      return i18n.t(key, params);
    },
    selectRandomRoles() {
      // 确保roles存在且有内容
      if (!this.roles || this.roles.size === 0) {
        console.log("No roles available for selection");
        return;
      }
      
      console.log("Initializing role selection with", this.roles.size, "roles");
      this.roleSelection = {};
      
      this.roles.forEach(role => {
        if (!this.roleSelection[role.team]) {
          this.$set(this.roleSelection, role.team, []);
        }
        this.roleSelection[role.team].push(role);
        this.$set(role, "selected", 0);
      });
      
      delete this.roleSelection["traveler"];
      
      const playerCount = Math.max(5, this.nonTravelers);
      const composition = this.game[playerCount - 5];
      
      Object.keys(composition).forEach(team => {
        for (let x = 0; x < composition[team]; x++) {
          if (this.roleSelection[team]) {
            const available = this.roleSelection[team].filter(
              role => !role.selected
            );
            if (available.length) {
              randomElement(available).selected = 1;
            }
          }
        }
      });
      
      console.log("Role selection initialized:", Object.keys(this.roleSelection).length, "teams");
    },
    assignRoles() {
      if (this.selectedRoles <= this.nonTravelers && this.selectedRoles) {
        // generate list of selected roles and randomize it
        const roles = Object.values(this.roleSelection)
          .map(roles =>
            roles
              // duplicate roles selected more than once and filter unselected
              .reduce((a, r) => [...a, ...Array(r.selected).fill(r)], [])
          )
          // flatten into a single array
          .reduce((a, b) => [...a, ...b], [])
          // 过滤掉无效的角色
          .filter(role => role && typeof role === 'object')
          .map(a => [Math.random(), a])
          .sort((a, b) => a[0] - b[0])
          .map(a => a[1]);
        this.players.forEach(player => {
          if (player.role.team !== "traveler" && roles.length) {
            const value = roles.pop();
            this.$store.commit("players/update", {
              player,
              property: "role",
              value
            });
          }
        });
        this.$store.commit("toggleModal", "roles");
      }
    },

    ...mapMutations(["toggleModal"])
  },
  mounted: function() {
    console.log("RolesModal mounted, roles count:", this.roles ? this.roles.size : 0);
    // 在mounted时检查roles是否已经准备好
    if (this.roles && this.roles.size > 0 && !Object.keys(this.roleSelection).length) {
      this.$nextTick(() => {
        this.selectRandomRoles();
      });
    }
  },
  activated() {
    console.log("RolesModal activated, roles count:", this.roles ? this.roles.size : 0);
    // 当模态框被激活时，确保角色列表已初始化
    if (this.roles && this.roles.size > 0) {
      this.$nextTick(() => {
        this.selectRandomRoles();
      });
    }
  },
  watch: {
    roles: {
      handler(newRoles, oldRoles) {
        console.log("Roles changed:", newRoles ? newRoles.size : 0, "old:", oldRoles ? oldRoles.size : 0);
        // 确保roles有内容后再初始化
        if (this.roles && this.roles.size > 0) {
          this.$nextTick(() => {
            this.selectRandomRoles();
          });
        } else {
          // 如果roles为空，清空roleSelection
          this.roleSelection = {};
        }
      },
      immediate: true,
      deep: true
    }
  }
};
</script>

<style lang="scss" scoped>
@import "../../vars.scss";

.loading {
  text-align: center;
  padding: 20px;
  color: white;
  font-size: 120%;
  font-style: italic;
}

ul.tokens {
  padding-left: 5%;
  li {
    border-radius: 50%;
    width: 5vw;
    margin: 5px;
    opacity: 0.5;
    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
    transform: scale(1);
    &:hover {
      transform: scale(1.1);
      z-index: 15;
    }
    &.selected {
      opacity: 1;
      transform: scale(1.1);
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
      .buttons {
        display: flex;
      }
      .fa-exclamation-triangle {
        display: block;
      }
    }
    &.townsfolk {
      box-shadow: 0 0 10px $townsfolk, 0 0 10px #004cff;
    }
    &.outsider {
      box-shadow: 0 0 10px $outsider, 0 0 10px $outsider;
    }
    &.minion {
      box-shadow: 0 0 10px $minion, 0 0 10px $minion;
    }
    &.demon {
      box-shadow: 0 0 10px $demon, 0 0 10px $demon;
    }
    &.traveler {
      box-shadow: 0 0 10px $traveler, 0 0 10px $traveler;
    }
    &:hover {
      transform: scale(1.2);
      z-index: 10;
    }
    .fa-exclamation-triangle {
      position: absolute;
      color: red;
      filter: drop-shadow(0 0 3px black) drop-shadow(0 0 3px black);
      top: 5px;
      right: -5px;
      font-size: 150%;
      display: none;
    }
    .buttons {
      display: none;
      position: absolute;
      top: 95%;
      text-align: center;
      width: 100%;
      z-index: 30;
      font-weight: bold;
      filter: drop-shadow(0 0 5px rgba(0, 0, 0, 1));
      span {
        flex-grow: 1;
      }
      svg {
        opacity: 0.25;
        cursor: pointer;
        &:hover {
          opacity: 1;
          color: red;
        }
      }
    }
  }
  .count {
    opacity: 1;
    position: absolute;
    left: 0;
    font-weight: bold;
    font-size: 75%;
    width: 5%;
    display: flex;
    align-items: center;
    justify-content: center;
    &:after {
      content: " ";
      display: block;
      padding-top: 100%;
    }
    &.townsfolk {
      color: $townsfolk;
    }
    &.outsider {
      color: $outsider;
    }
    &.minion {
      color: $minion;
    }
    &.demon {
      color: $demon;
    }
  }
}

.roles .modal {
  .multiple {
    display: block;
    text-align: center;
    cursor: pointer;
    &.checked,
    &:hover {
      color: red;
    }
    &.checked {
      margin-top: 10px;
    }
    svg {
      margin-right: 5px;
    }
    input {
      display: none;
    }
  }

  .warning {
    color: red;
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 10;
    svg {
      font-size: 150%;
      vertical-align: middle;
    }
    span {
      display: none;
      text-align: center;
      position: absolute;
      right: -20px;
      bottom: 30px;
      width: 420px;
      background: rgba(0, 0, 0, 0.75);
      padding: 5px;
      border-radius: 10px;
      border: 2px solid black;
    }
    &:hover span {
      display: block;
    }
  }
}
</style>
