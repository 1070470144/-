<template>
  <Modal
    v-if="modals.reminder && availableReminders.length && players[playerIndex]"
    @close="toggleModal('reminder')"
  >
    <h3>{{ $t("reminder.chooseReminder") }}</h3>
    <ul class="reminders">
      <li
        v-for="reminder in availableReminders"
        class="reminder"
        :class="[reminder.role]"
        :key="reminder.role + ' ' + reminder.name"
        @click="addReminder(reminder)"
      >
        <span
          class="icon"
          :style="{
            backgroundImage: `url(${
              reminder.image && grimoire.isImageOptIn
                ? reminder.image
                : require(
                    '../../assets/icons/' +
                      (reminder.imageAlt || reminder.role) +
                      '.png',
                  )
            })`,
          }"
        ></span>
        <span class="text">{{ reminder.name }}</span>
      </li>
    </ul>
  </Modal>
</template>

<script>
import Modal from "./Modal";
import { mapMutations, mapState } from "vuex";
import i18n from "../../i18n";
import {
  recordReminderAdded,
  recordCustomReminder,
} from "../../utils/reminderToHistory";

/**
 * Helper function that maps a reminder name with a role-based object that provides necessary visual data.
 * @param role The role for which the reminder should be generated
 * @return {function(*): {image: string|string[]|string|*, role: *, name: *, imageAlt: string|*}}
 */
const mapReminder =
  ({ id, image, imageAlt }) =>
  (name) => ({
    role: id,
    image,
    imageAlt,
    name,
  });

export default {
  components: { Modal },
  computed: {
    playerIndex() {
      return this.$store.state.selectedPlayer;
    },
    availableReminders() {
      let reminders = [];
      const { players, bluffs } = this.$store.state.players;
      this.$store.state.roles.forEach((role) => {
        // add reminders from player roles
        if (players.some((p) => p.role.id === role.id)) {
          reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
        }
        // add reminders from bluff/other roles
        else if (bluffs.some((bluff) => bluff.id === role.id)) {
          reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
        }
        // add global reminders
        if (role.remindersGlobal && role.remindersGlobal.length) {
          reminders = [
            ...reminders,
            ...role.remindersGlobal.map(mapReminder(role)),
          ];
        }
      });
      // add fabled reminders
      this.$store.state.players.fabled.forEach((role) => {
        reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
      });

      // add out of script traveler reminders
      this.$store.state.otherTravelers.forEach((role) => {
        if (players.some((p) => p.role.id === role.id)) {
          reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
        }
      });

      // add basic reminders
      reminders.push({ role: "good", name: this.$t("reminder.good") });
      reminders.push({ role: "evil", name: this.$t("reminder.evil") });
      reminders.push({ role: "custom", name: this.$t("reminder.custom") });
      return reminders;
    },
    ...mapState(["modals", "grimoire", "session"]),
    ...mapState("players", ["players"]),
  },
  methods: {
    $t(key, params = {}) {
      return i18n.t(key, params);
    },
    addReminder(reminder) {
      console.log("addReminder called with:", reminder);
      const player = this.$store.state.players.players[this.playerIndex];
      console.log("player:", player);
      let value;

      if (reminder.role === "custom") {
        const name = prompt(this.$t("reminder.addCustomReminder"));
        if (!name) return;
        value = [...player.reminders, { role: "custom", name }];

        // 记录自定义reminder
        if (!this.session.isSpectator) {
          console.log("Recording custom reminder");
          try {
            recordCustomReminder(name, player, this.$store);
          } catch (error) {
            console.error("Error recording custom reminder:", error);
          }
        }
      } else {
        value = [...player.reminders, reminder];

        // 记录reminder添加
        if (!this.session.isSpectator) {
          console.log("Recording reminder added");
          try {
            recordReminderAdded(reminder, player, this.$store);
          } catch (error) {
            console.error("Error recording reminder added:", error);
          }
        }
      }

      this.$store.commit("players/update", {
        player,
        property: "reminders",
        value,
      });
      this.$store.commit("toggleModal", "reminder");
    },
    ...mapMutations(["toggleModal"]),
  },
};
</script>

<style scoped lang="scss">
ul.reminders .reminder {
  background: url("../../assets/reminder.png") center center;
  background-size: 100%;
  width: 14vh;
  height: 14vh;
  max-width: 100px;
  max-height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1%;

  border-radius: 50%;
  border: 3px solid black;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  line-height: 100%;
  transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    transform: scale(1.1) rotate(5deg);
  }

  .icon {
    position: absolute;
    top: 0;
    width: 90%;
    height: 90%;
    background-size: 100%;
    background-position: center center;
    background-repeat: no-repeat;
  }

  .text {
    color: black;
    font-size: 65%;
    font-weight: bold;
    text-align: center;
    top: 28%;
    width: 80%;
    line-height: 1;
  }

  &:hover {
    transform: scale(1.2);
  }
}
</style>
