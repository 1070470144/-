import Vue from "vue";
import Vuex from "vuex";
import persistence from "./persistence";
import socket from "./socket";
import players from "./modules/players";
import session from "./modules/session";
import editionJSON from "../editions.json";
import rolesJSON from "../roles.json";
import fabledJSON from "../fabled.json";
import jinxesJSON from "../hatred.json";

Vue.use(Vuex);

// helper functions
const getRolesByEdition = (edition = editionJSON[0]) => {
  return new Map(
    rolesJSON
      .filter((r) => r.edition === edition.id || edition.roles.includes(r.id))
      .sort((a, b) => b.team.localeCompare(a.team))
      .map((role) => [role.id, role]),
  );
};

const getTravelersNotInEdition = (edition = editionJSON[0]) => {
  return new Map(
    rolesJSON
      .filter(
        (r) =>
          r.team === "traveler" &&
          r.edition !== edition.id &&
          !edition.roles.includes(r.id),
      )
      .map((role) => [role.id, role]),
  );
};

const set =
  (key) =>
  ({ grimoire }, val) => {
    grimoire[key] = val;
  };

const toggle =
  (key) =>
  ({ grimoire }, val) => {
    if (val === true || val === false) {
      grimoire[key] = val;
    } else {
      grimoire[key] = !grimoire[key];
    }
  };

const clean = (id) => id.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");

const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 数字转中文
const getChineseNumber = (num) => {
  const chineseNumbers = {
    1: "first",
    2: "second",
    3: "third",
    4: "fourth",
    5: "fifth",
    6: "sixth",
    7: "seventh",
    8: "eighth",
    9: "ninth",
    10: "tenth",
    11: "eleventh",
    12: "twelfth",
    13: "thirteenth",
    14: "fourteenth",
    15: "fifteenth",
  };
  return chineseNumbers[num] || `round_${num}`;
};

// global data maps
const editionJSONbyId = new Map(
  editionJSON.map((edition) => [edition.id, edition]),
);
const rolesJSONbyId = new Map(rolesJSON.map((role) => [role.id, role]));
const fabled = new Map(fabledJSON.map((role) => [role.id, role]));

// jinxes
let jinxes = {};
try {
  // Note: can't fetch live list due to lack of CORS headers
  // fetch("https://bloodontheclocktower.com/script/data/hatred.json")
  //   .then(res => res.json())
  //   .then(jinxesJSON => {
  jinxes = new Map(
    jinxesJSON.map(({ id, hatred }) => [
      clean(id),
      new Map(hatred.map(({ id, reason }) => [clean(id), reason])),
    ]),
  );
  // });
} catch (e) {
  console.error("couldn't load jinxes", e);
}

// base definition for custom roles
const customRole = {
  id: "",
  name: "",
  image: "",
  ability: "",
  edition: "custom",
  firstNight: 0,
  firstNightReminder: "",
  otherNight: 0,
  otherNightReminder: "",
  reminders: [],
  remindersGlobal: [],
  setup: false,
  team: "townsfolk",
  isCustom: true,
};

export default new Vuex.Store({
  modules: {
    players,
    session,
  },
  state: {
    grimoire: {
      isPublic: true,
      isNight: false,
      isNightOrder: false,
      isMenuOpen: false,
      isStatic: false,
      isMuted: false,
      isImageOptIn: true,
      zoom: 0,
      background: null,
    },
    modals: {
      grimoire: false,
      edition: false,
      roles: false,
      reference: false,
      nightOrder: false,
      fabled: false,
      voteHistory: false,
      gameState: false,
      reminder: false,
      roleAbility: false,
    },
    edition: editionJSON[0],
    roles: getRolesByEdition(),
    travelers: getTravelersNotInEdition(),
    fabled,
    jinxes,
    session: {
      sessionId: null,
      playerId: null,
      isSpectator: false,
      isReconnecting: false,
      playerCount: 0,
      ping: null,
      nomination: null,
      lockedVote: false,
      voteHistory: [],
      distributeRoles: false,
    },
    selectedPlayer: -1, // 添加选中的玩家索引
    history: {
      events: [],
      currentRound: 1,
      currentPhase: "night",
    },
    locale: "en-US", // 添加语言设置
  },
  getters: {
    /**
     * Return all custom roles, with default values and non-essential data stripped.
     * Role object keys will be replaced with a numerical index to conserve bandwidth.
     * @param roles
     * @returns {[]}
     */
    customRolesStripped: ({ roles }) => {
      const customRoles = [];
      const customKeys = Object.keys(customRole);
      const strippedProps = [
        "firstNightReminder",
        "otherNightReminder",
        "isCustom",
      ];
      roles.forEach((role) => {
        if (!role.isCustom) {
          customRoles.push({ id: role.id });
        } else {
          const strippedRole = {};
          for (let prop in role) {
            if (strippedProps.includes(prop)) {
              continue;
            }
            const value = role[prop];
            if (customKeys.includes(prop) && value !== customRole[prop]) {
              strippedRole[customKeys.indexOf(prop)] = value;
            }
          }
          customRoles.push(strippedRole);
        }
      });
      return customRoles;
    },
    rolesJSONbyId: () => rolesJSONbyId,
  },
  mutations: {
    setZoom: set("zoom"),
    setBackground: set("background"),
    toggleMuted: toggle("isMuted"),
    toggleMenu: toggle("isMenuOpen"),
    toggleNightOrder: toggle("isNightOrder"),
    toggleStatic: toggle("isStatic"),
    toggleNight: toggle("isNight"),
    toggleGrimoire: toggle("isPublic"),
    toggleImageOptIn: toggle("isImageOptIn"),
    setLocale(state, locale) {
      state.locale = locale;
      localStorage.setItem("language", locale);
    },
    toggleModal({ modals }, name) {
      if (name) {
        modals[name] = !modals[name];
      }
      for (let modal in modals) {
        if (modal === name) continue;
        modals[modal] = false;
      }
    },
    /**
     * Store custom roles
     * @param state
     * @param roles Array of role IDs or full role definitions
     */
    setCustomRoles(state, roles) {
      // 检查roles参数是否有效
      if (!roles || !Array.isArray(roles)) {
        console.warn("Invalid roles parameter:", roles);
        return;
      }

      console.log("Processing custom roles:", roles.length);
      const processedRoles = roles
        // replace numerical role object keys with matching key names
        .map((role) => {
          // 检查role是否存在且有效
          if (!role || typeof role !== "object") {
            console.warn("Invalid role object:", role);
            return null;
          }

          if (role[0]) {
            const customKeys = Object.keys(customRole);
            const mappedRole = {};
            for (let prop in role) {
              if (customKeys[prop]) {
                mappedRole[customKeys[prop]] = role[prop];
              }
            }
            return mappedRole;
          } else {
            return role;
          }
        })
        // 过滤掉无效的角色对象
        .filter((role) => role !== null)
        // clean up role.id but preserve original for lookup
        .map((role) => {
          // 检查role.id是否存在
          if (!role.id) {
            console.warn("Role missing id:", role);
            return null;
          }

          const originalId = role.id;
          role.id = clean(role.id);
          role.originalId = originalId; // 保留原始ID用于查找
          return role;
        })
        // 再次过滤掉无效的角色对象
        .filter((role) => role !== null)
        // map existing roles to base definition or pre-populate custom roles to ensure all properties
        .map((role) => {
          // 首先尝试用清理后的ID查找
          let foundRole =
            rolesJSONbyId.get(role.id) || state.roles.get(role.id);

          // 如果没找到，尝试用原始ID查找
          if (!foundRole && role.originalId) {
            foundRole =
              rolesJSONbyId.get(role.originalId) ||
              state.roles.get(role.originalId);
          }

          // 如果还是没找到，创建自定义角色
          if (!foundRole) {
            foundRole = Object.assign({}, customRole, role);
          }

          return foundRole;
        })
        // default empty icons and placeholders, clean up firstNight / otherNight
        .map((role) => {
          // 确保角色ID的一致性
          if (role.originalId && !rolesJSONbyId.get(role.id)) {
            // 如果是自定义角色，使用清理后的ID
            role.id = clean(role.originalId);
          }

          if (rolesJSONbyId.get(role.id)) return role;

          // 对于自定义角色，处理image字段
          if (role.image) {
            console.log(`Processing image for role ${role.id}:`, role.image);
            // 检查image是否是有效的URL
            try {
              new URL(role.image);
              // 如果是有效URL，保留image字段
              console.log(`Valid URL for role ${role.id}:`, role.image);
            } catch (e) {
              // 如果不是有效URL，设置为null并设置imageAlt
              console.warn(`Invalid URL for role ${role.id}:`, role.image);
              role.image = null;
              role.imageAlt = // map team to generic icon
                {
                  townsfolk: "good",
                  outsider: "outsider",
                  minion: "minion",
                  demon: "evil",
                  fabled: "fabled",
                }[role.team] || "custom";
            }
          } else {
            // 如果没有image字段，设置默认的imageAlt
            role.imageAlt = // map team to generic icon
              {
                townsfolk: "good",
                outsider: "outsider",
                minion: "minion",
                demon: "evil",
                fabled: "fabled",
              }[role.team] || "custom";
          }

          role.firstNight = Math.abs(role.firstNight);
          role.otherNight = Math.abs(role.otherNight);
          return role;
        })
        // filter out roles that don't match an existing role and also don't have name/ability/team
        .filter((role) => {
          // 如果是已知角色（存在于rolesJSONbyId中），保留
          if (
            rolesJSONbyId.get(role.id) ||
            rolesJSONbyId.get(role.originalId)
          ) {
            return true;
          }
          // 如果是自定义角色，必须有name、ability和team
          return role.name && role.ability && role.team;
        })
        // sort by team
        .sort((a, b) => b.team.localeCompare(a.team));
      // convert to Map without Fabled
      const finalRoles = processedRoles.filter(
        (role) => role.team !== "fabled",
      );
      console.log("Final roles to load:", finalRoles.length);

      // 清空现有角色并重新设置，确保Vue能够检测到变化
      state.roles.clear();
      finalRoles.forEach((role) => {
        state.roles.set(role.id, role);
      });

      // 强制触发Vue的响应式更新
      console.log("Roles updated, triggering reactivity");
      // 确保Vue能够检测到Map的变化
      state.roles = new Map(state.roles);
      // update Fabled to include custom Fabled from this script
      state.fabled = new Map([
        ...processedRoles
          .filter((r) => r.team === "fabled")
          .map((r) => [r.id, r]),
        ...fabledJSON.map((role) => [role.id, role]),
      ]);
      // update extraTravelers map to only show travelers not in this script
      state.otherTravelers = new Map(
        rolesJSON
          .filter(
            (r) => r.team === "traveler" && !roles.some((i) => i.id === r.id),
          )
          .map((role) => [role.id, role]),
      );
    },
    setEdition(state, edition) {
      console.log("Setting edition:", edition.id);
      if (editionJSONbyId.has(edition.id)) {
        state.edition = editionJSONbyId.get(edition.id);
        state.roles = getRolesByEdition(state.edition);
        state.otherTravelers = getTravelersNotInEdition(state.edition);
        console.log("Official edition set, roles count:", state.roles.size);
      } else {
        state.edition = edition;
        console.log("Custom edition set, roles count:", state.roles.size);
      }
      state.modals.edition = false;
    },
    // 历史记录相关 mutations
    addHistoryEvent(state, event) {
      const historyEvent = {
        id: generateUniqueId(),
        timestamp: Date.now(),
        round: state.history.currentRound,
        phase: state.history.currentPhase,
        ...event,
      };

      // 限制记录数量为200条
      if (state.history.events.length >= 200) {
        state.history.events.shift(); // 删除最旧的记录
      }

      state.history.events.push(historyEvent);
      // 保存到本地存储
      localStorage.setItem("gameHistory", JSON.stringify(state.history.events));
    },
    undoHistoryEvent(state) {
      if (state.history.events.length > 0) {
        state.history.events.pop();
        localStorage.setItem(
          "gameHistory",
          JSON.stringify(state.history.events),
        );
      }
    },
    addHistoryNote(state, { eventId, note }) {
      const event = state.history.events.find((e) => e.id === eventId);
      if (event) {
        event.note = note;
        localStorage.setItem(
          "gameHistory",
          JSON.stringify(state.history.events),
        );
      }
    },
    setCurrentRound(state, round) {
      state.history.currentRound = round;
    },
    setCurrentPhase(state, phase) {
      state.history.currentPhase = phase;

      // 自动更新轮次
      if (phase === "day" && state.history.currentRound === 1) {
        // 第一个白天
        state.history.currentRound = "first_day";
      } else if (phase === "night" && state.history.currentRound === 1) {
        // 首夜
        state.history.currentRound = "first_night";
      } else if (
        phase === "day" &&
        typeof state.history.currentRound === "number"
      ) {
        // 后续白天
        const roundNumber = state.history.currentRound;
        if (roundNumber === 1) {
          state.history.currentRound = "first_day";
        } else {
          state.history.currentRound = `${getChineseNumber(roundNumber)}_day`;
        }
      } else if (
        phase === "night" &&
        typeof state.history.currentRound === "number"
      ) {
        // 后续夜晚
        const roundNumber = state.history.currentRound;
        if (roundNumber === 1) {
          state.history.currentRound = "first_night";
        } else {
          state.history.currentRound = `${getChineseNumber(roundNumber)}_night`;
        }
      } else if (
        phase === "day" &&
        state.history.currentRound &&
        state.history.currentRound.includes("night")
      ) {
        // 从夜晚切换到白天，增加轮次
        const currentRound = state.history.currentRound;
        if (currentRound === "first_night") {
          state.history.currentRound = "first_day";
        } else {
          // 提取轮次数字
          const roundMatch = currentRound.match(/(\d+)_night/);
          if (roundMatch) {
            const roundNumber = parseInt(roundMatch[1]);
            state.history.currentRound = `${getChineseNumber(roundNumber)}_day`;
          }
        }
      } else if (
        phase === "night" &&
        state.history.currentRound &&
        state.history.currentRound.includes("day")
      ) {
        // 从白天切换到夜晚，增加轮次
        const currentRound = state.history.currentRound;
        if (currentRound === "first_day") {
          state.history.currentRound = "second_night";
        } else {
          // 提取轮次数字
          const roundMatch = currentRound.match(/(\d+)_day/);
          if (roundMatch) {
            const roundNumber = parseInt(roundMatch[1]) + 1;
            state.history.currentRound = `${getChineseNumber(
              roundNumber,
            )}_night`;
          }
        }
      }
    },
    loadHistoryFromStorage(state) {
      const savedHistory = localStorage.getItem("gameHistory");
      if (savedHistory) {
        try {
          state.history.events = JSON.parse(savedHistory);
        } catch (e) {
          console.warn("Failed to load history from storage:", e);
        }
      }
    },
    clearHistory(state) {
      state.history.events = [];
      localStorage.removeItem("gameHistory");
    },
    checkNewGame(state) {
      // 检查是否有历史记录
      if (state.history.events.length > 0) {
        return true; // 需要询问是否清除
      }
      return false;
    },
    resetGameState(state) {
      // 重置游戏状态
      state.history.currentRound = 1;
      state.history.currentPhase = "night";
    },
    setSelectedPlayer(state, index) {
      state.selectedPlayer = index;
    },
  },
  plugins: [persistence, socket],
});
