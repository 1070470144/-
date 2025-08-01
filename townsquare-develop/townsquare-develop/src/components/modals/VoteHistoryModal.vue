<template>
  <Modal
    class="vote-history"
    v-if="modals.voteHistory && (session.voteHistory || !session.isSpectator)"
    @close="toggleModal('voteHistory')"
  >
    <font-awesome-icon
      @click="clearVoteHistory"
      icon="trash-alt"
      class="clear"
      :title="$t('tooltips.clearVoteHistory')"
      v-if="session.isSpectator"
    />

    <h3>{{ $t("voteHistory.title") }}</h3>

    <template v-if="!session.isSpectator">
      <div class="options">
        <div class="option" @click="setRecordVoteHistory">
          <font-awesome-icon
            :icon="[
              'fas',
              session.isVoteHistoryAllowed ? 'check-square' : 'square',
            ]"
          />
          {{ $t("voteHistory.accessibleToPlayers") }}
        </div>
        <div class="option" @click="clearVoteHistory">
          <font-awesome-icon icon="trash-alt" />
          {{ $t("voteHistory.clearForEveryone") }}
        </div>
      </div>
    </template>
    <table>
      <thead>
        <tr>
          <td>{{ $t("voteHistory.time") }}</td>
          <td>{{ $t("voteHistory.nominator") }}</td>
          <td>{{ $t("voteHistory.nominee") }}</td>
          <td>{{ $t("voteHistory.type") }}</td>
          <td>{{ $t("voteHistory.votes") }}</td>
          <td>{{ $t("voteHistory.majority") }}</td>
          <td>
            <font-awesome-icon icon="user-friends" />
            {{ $t("voteHistory.voters") }}
          </td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(vote, index) in session.voteHistory" :key="index">
          <td>
            {{ vote.timestamp.getHours().toString().padStart(2, "0") }}:{{
              vote.timestamp.getMinutes().toString().padStart(2, "0")
            }}
          </td>
          <td>{{ vote.nominator }}</td>
          <td>{{ vote.nominee }}</td>
          <td>{{ vote.type }}</td>
          <td>
            {{ vote.votes.length }}
            <font-awesome-icon icon="hand-paper" />
          </td>
          <td>
            {{ vote.majority }}
            <font-awesome-icon
              :icon="[
                'fas',
                vote.votes.length >= vote.majority ? 'check-square' : 'square',
              ]"
            />
          </td>
          <td>
            {{ vote.votes.join(", ") }}
          </td>
        </tr>
      </tbody>
    </table>
  </Modal>
</template>

<script>
import Modal from "./Modal";
import { mapMutations, mapState } from "vuex";
import i18n from "../../i18n";

export default {
  components: {
    Modal,
  },
  computed: {
    ...mapState(["session", "modals"]),
  },
  methods: {
    $t(key, params = {}) {
      return i18n.t(key, params);
    },
    clearVoteHistory() {
      this.$store.commit("session/clearVoteHistory");
    },
    setRecordVoteHistory() {
      this.$store.commit(
        "session/setVoteHistoryAllowed",
        !this.session.isVoteHistoryAllowed,
      );
    },
    ...mapMutations(["toggleModal"]),
  },
};
</script>

<style lang="scss" scoped>
@import "../../vars.scss";

.clear {
  position: absolute;
  left: 20px;
  top: 15px;
  cursor: pointer;
  &:hover {
    color: red;
  }
}

.options {
  display: flex;
  justify-content: center;
  align-items: center;
  justify-content: center;
  align-content: center;
}

.option {
  color: white;
  text-decoration: none;
  margin: 0 15px;
  &:hover {
    color: red;
    cursor: pointer;
  }
}

h3 {
  margin: 0 40px 0 10px;
  svg {
    vertical-align: middle;
  }
}

table {
  border-spacing: 10px 0;
  margin-left: auto;
  margin-right: auto;
}

thead td {
  font-weight: bold;
  border-bottom: 1px solid white;
  text-align: center;
  padding: 0 3px;
}

tbody {
  td:nth-child(2) {
    color: $townsfolk;
  }
  td:nth-child(3) {
    color: $demon;
  }
  td:nth-child(5) {
    text-align: center;
  }
  td:nth-child(6) {
    text-align: center;
  }
}
</style>
