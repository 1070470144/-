const userStorage = require("../utils/userStorage").default;
const { getUserSpecificKey } = require("../utils/userStorage");

module.exports = (store) => {
  const updatePagetitle = (isPublic) =>
    (document.title = `Blood on the Clocktower ${
      isPublic ? "Town Square" : "Grimoire"
    }`);

  // 迁移旧数据
  userStorage.migrateOldData();

  // 更新用户角色（确保初始化时角色检测正确）
  userStorage.updateRole();

  console.log("初始化存储，用户信息:", userStorage.getUserInfo());

  // 检查是否有说书人数据需要恢复
  // 只有在没有URL hash时才检查说书人数据，避免裸链接进入时误判
  const hasUrlHash = window.location.hash.substr(1);
  const userId = userStorage.userId;
  const storytellerPlayers = localStorage.getItem(
    `${userId}_storyteller_players`,
  );
  const storytellerSession = localStorage.getItem(
    `${userId}_storyteller_session`,
  );
  const storytellerEdition = localStorage.getItem(
    `${userId}_storyteller_edition`,
  );
  const storytellerFabled = localStorage.getItem(
    `${userId}_storyteller_fabled`,
  );
  const storytellerBluffs = localStorage.getItem(
    `${userId}_storyteller_bluffs`,
  );

  console.log("检查说书人数据:");
  console.log("- URL hash:", hasUrlHash);
  console.log("- 说书人玩家数据:", storytellerPlayers);
  console.log("- 说书人会话数据:", storytellerSession);
  console.log("- 说书人版本数据:", storytellerEdition);
  console.log("- 说书人寓言数据:", storytellerFabled);
  console.log("- 说书人恶魔伪装数据:", storytellerBluffs);

  // 只有在没有URL hash时才检查说书人数据
  if (!hasUrlHash) {
    // 如果有任何说书人数据，强制设置为说书人模式
    if (
      storytellerPlayers ||
      storytellerEdition ||
      storytellerFabled ||
      storytellerBluffs
    ) {
      console.log("检测到说书人数据，强制设置为说书人模式");
      userStorage.setRole("storyteller");
    }

    // 检查全局会话数据，如果是说书人会话则强制设置为说书人模式
    const globalSessionData = localStorage.getItem("session");
    console.log("- 全局会话数据:", globalSessionData);

    if (
      globalSessionData &&
      globalSessionData !== "null" &&
      globalSessionData !== "undefined"
    ) {
      try {
        const [isSpectator] = JSON.parse(globalSessionData);
        if (!isSpectator) {
          console.log("检测到全局说书人会话，强制设置为说书人模式");
          userStorage.setRole("storyteller");
        }
      } catch (e) {
        if (globalSessionData.length > 0) {
          console.log("检测到全局会话字符串，强制设置为说书人模式");
          userStorage.setRole("storyteller");
        }
      }
    }
  } else {
    console.log("检测到URL hash，跳过说书人数据检查，避免误判");
  }

  // initialize data
  if (userStorage.getItem("background")) {
    console.log("恢复背景设置");
    store.commit("setBackground", userStorage.getItem("background"));
  }
  if (userStorage.getItem("muted")) {
    store.commit("toggleMuted", true);
  }
  if (userStorage.getItem("static")) {
    store.commit("toggleStatic", true);
  }
  if (userStorage.getItem("imageOptIn")) {
    store.commit("toggleImageOptIn", true);
  }
  if (userStorage.getItem("zoom")) {
    store.commit("setZoom", parseFloat(userStorage.getItem("zoom")));
  }
  if (userStorage.getItem("isGrimoire")) {
    store.commit("toggleGrimoire", false);
    updatePagetitle(false);
  }
  if (userStorage.getItem("roles") !== null) {
    store.commit("setCustomRoles", userStorage.getItem("roles"));
    store.commit("setEdition", { id: "custom" });
  }
  if (userStorage.getItem("edition") !== null) {
    // this will initialize state.roles for official editions
    store.commit("setEdition", userStorage.getItem("edition"));
  }
  // 恶魔伪装恢复逻辑将在玩家数据恢复后执行
  // 这样可以确保能正确识别当前玩家是否为恶魔
  if (userStorage.getItem("fabled") !== null) {
    // 检查是否有说书人数据
    const userInfo = userStorage.getUserInfo();
    const userId = userStorage.userId;
    const hasStorytellerData =
      localStorage.getItem(`${userId}_storyteller_players`) ||
      localStorage.getItem(`${userId}_storyteller_edition`) ||
      localStorage.getItem(`${userId}_storyteller_fabled`) ||
      localStorage.getItem(`${userId}_storyteller_bluffs`);

    if (userInfo.role === "storyteller" || hasStorytellerData) {
      console.log("检测到说书人数据，恢复寓言数据");
      store.commit("players/setFabled", {
        fabled: userStorage
          .getItem("fabled")
          .map((fabled) => store.state.fabled.get(fabled.id) || fabled),
      });
    }
  }
  if (userStorage.getItem("players") !== null) {
    console.log("找到玩家数据，开始恢复");
    // 检查当前是否为玩家模式
    const sessionData = userStorage.getItem("session");
    const hasUrlHash = window.location.hash.substr(1);
    const isPlayerMode = hasUrlHash || (sessionData && sessionData[0]);

    console.log("会话数据:", sessionData);
    console.log("URL参数:", hasUrlHash);
    console.log("是否为玩家模式:", isPlayerMode);
    console.log("当前玩家ID:", userStorage.getItem("playerId"));
    console.log("存储的玩家数据:", userStorage.getItem("players"));
    console.log("当前用户信息:", userStorage.getUserInfo());
    console.log("存储键前缀:", userStorage.getUserInfo().userId);

    if (isPlayerMode) {
      // 玩家模式：恢复座位信息和自己的角色信息
      const currentPlayerId = userStorage.getItem("playerId");
      const playersData = userStorage.getItem("players");
      console.log("玩家模式恢复，当前玩家ID:", currentPlayerId);
      console.log("玩家数据:", playersData);

      store.commit(
        "players/set",
        playersData.map((player) => {
          if (player.id === currentPlayerId) {
            // 当前玩家：恢复自己的角色信息和座位信息
            const roleId =
              typeof player.role === "string" ? player.role : player.role?.id;
            const role =
              store.state.roles.get(roleId) ||
              store.getters.rolesJSONbyId.get(roleId) ||
              {};
            console.log(`恢复当前玩家角色: ${roleId} ->`, role);
            return {
              ...player,
              role: role,
            };
          } else {
            // 其他玩家：恢复座位信息但不恢复角色信息
            return {
              ...player,
              role: {},
            };
          }
        }),
      );

      // 玩家模式下恢复恶魔伪装（如果是恶魔的话）
      if (userStorage.getItem("bluffs") !== null) {
        console.log("检查玩家是否为恶魔，恢复恶魔伪装");
        const currentPlayer = store.state.players.players.find(
          (p) => p.id === currentPlayerId,
        );

        if (
          currentPlayer &&
          currentPlayer.role &&
          currentPlayer.role.team === "demon"
        ) {
          console.log("检测到恶魔玩家，恢复恶魔伪装");
          const bluffsData = userStorage.getItem("bluffs");
          console.log("恶魔伪装数据:", bluffsData);
          bluffsData.forEach((roleId, index) => {
            const role =
              store.state.roles.get(roleId) ||
              store.getters.rolesJSONbyId.get(roleId) ||
              {};
            console.log(`恢复恶魔伪装 ${index}: ${roleId} ->`, role);
            store.commit("players/setBluff", {
              index,
              role: role,
            });
          });
        } else {
          console.log("非恶魔玩家，不恢复恶魔伪装");
        }
      }
    } else {
      // 说书人模式：检查是否有说书人数据
      const userInfo = userStorage.getUserInfo();
      console.log("说书人模式恢复，用户信息:", userInfo);

      // 检查是否有说书人数据
      const storytellerPlayers = userStorage.getItem("players");
      const storytellerEdition = userStorage.getItem("edition");
      const storytellerFabled = userStorage.getItem("fabled");
      const storytellerBluffs = userStorage.getItem("bluffs");
      const hasStorytellerData =
        storytellerPlayers ||
        storytellerEdition ||
        storytellerFabled ||
        storytellerBluffs;

      console.log("检查说书人数据:");
      console.log("- 说书人玩家数据:", storytellerPlayers);
      console.log("- 说书人版本数据:", storytellerEdition);
      console.log("- 说书人寓言数据:", storytellerFabled);
      console.log("- 说书人恶魔伪装数据:", storytellerBluffs);

      // 只有在明确是说书人且有说书人数据时才恢复
      if (userInfo.role === "storyteller" && hasStorytellerData) {
        console.log("检测到说书人数据，恢复说书人玩家数据");
        console.log("恢复说书人玩家数据:", storytellerPlayers);
        console.log("说书人数据检查结果:", {
          userRole: userInfo.role,
          hasStorytellerData: hasStorytellerData,
          storytellerPlayers: storytellerPlayers,
          storytellerEdition: storytellerEdition,
          storytellerFabled: storytellerFabled,
          storytellerBluffs: storytellerBluffs,
        });

        if (storytellerPlayers && Array.isArray(storytellerPlayers)) {
          const restoredPlayers = storytellerPlayers.map((player) => {
            const roleId =
              typeof player.role === "string" ? player.role : player.role?.id;
            const role =
              store.state.roles.get(roleId) ||
              store.getters.rolesJSONbyId.get(roleId) ||
              {};
            const restoredPlayer = {
              ...player,
              role: role,
            };
            console.log(
              "恢复玩家:",
              player.name,
              "座位ID:",
              player.id,
              "角色:",
              roleId,
              "->",
              role,
            );
            return restoredPlayer;
          });

          store.commit("players/set", restoredPlayers);
          console.log("成功恢复", restoredPlayers.length, "个玩家的数据");

          // 说书人模式下恢复恶魔伪装
          if (userStorage.getItem("bluffs") !== null) {
            console.log("说书人模式，恢复恶魔伪装");
            const bluffsData = userStorage.getItem("bluffs");
            console.log("恶魔伪装数据:", bluffsData);
            bluffsData.forEach((roleId, index) => {
              const role =
                store.state.roles.get(roleId) ||
                store.getters.rolesJSONbyId.get(roleId) ||
                {};
              console.log(`恢复恶魔伪装 ${index}: ${roleId} ->`, role);
              store.commit("players/setBluff", {
                index,
                role: role,
              });
            });
          }
        } else {
          console.log("说书人玩家数据无效:", storytellerPlayers);
        }
      } else {
        console.log("说书人数据恢复条件不满足:", {
          userRole: userInfo.role,
          hasStorytellerData: hasStorytellerData,
          storytellerPlayers: storytellerPlayers,
          storytellerEdition: storytellerEdition,
          storytellerFabled: storytellerFabled,
          storytellerBluffs: storytellerBluffs,
        });
      }
    }
  } else {
    console.log("没有找到玩家数据");
  }
  /**** Session related data *****/
  // 恢复玩家ID（使用用户特定的存储键）
  const playerId = userStorage.getItem("playerId");
  if (playerId) {
    console.log("恢复玩家ID:", playerId);
    store.commit("session/setPlayerId", playerId);
  }
  // 检查用户特定的会话数据
  const userSessionData = userStorage.getItem("session");
  const userInfo = userStorage.getUserInfo();

  // 对于说书人，即使有URL hash也要恢复会话
  // 对于玩家，只有在没有URL hash时才恢复会话（避免冲突）
  const shouldRestoreSession =
    userSessionData &&
    userSessionData !== "null" &&
    userSessionData !== "undefined" &&
    (userInfo.role === "storyteller" || !window.location.hash.substr(1));

  if (shouldRestoreSession) {
    try {
      const [spectator, sessionId] = userSessionData;
      const userInfo = userStorage.getUserInfo();

      console.log("恢复用户会话数据:", { spectator, sessionId, userInfo });

      // 根据当前检测到的角色强制设置会话类型，忽略存储的spectator标志
      if (userInfo.role === "storyteller") {
        // 说书人模式：强制设置为说书人会话
        console.log(
          "恢复说书人会话:",
          sessionId,
          "（忽略存储的spectator标志）",
        );
        store.commit("session/setSpectator", false);
        store.commit("session/setSessionId", sessionId);
      } else if (userInfo.role === "player") {
        // 玩家模式：强制设置为玩家会话
        console.log("恢复玩家会话:", sessionId, "（忽略存储的spectator标志）");
        store.commit("session/setSpectator", true);
        store.commit("session/setSessionId", sessionId);
      } else {
        console.log("未知角色，跳过会话恢复:", {
          spectator,
          role: userInfo.role,
        });
      }
    } catch (e) {
      console.log("解析用户会话数据失败:", e);
    }
  } else {
    const userInfo = userStorage.getUserInfo();
    if (userInfo.role === "storyteller" && window.location.hash.substr(1)) {
      console.log("说书人有URL hash，但会话数据无效，跳过会话恢复");
    } else if (userInfo.role === "player" && window.location.hash.substr(1)) {
      console.log("玩家有URL hash，跳过会话恢复（避免冲突）");
    } else {
      console.log("没有用户会话数据，跳过会话恢复");
    }
  }

  // 加载历史记录
  store.commit("loadHistoryFromStorage");

  // listen to mutations
  store.subscribe(({ type, payload }, state) => {
    switch (type) {
      case "toggleGrimoire":
        if (!state.grimoire.isPublic) {
          userStorage.setItem("isGrimoire", 1);
        } else {
          userStorage.removeItem("isGrimoire");
        }
        updatePagetitle(state.grimoire.isPublic);
        break;
      case "setBackground":
        if (payload) {
          userStorage.setItem("background", payload);
        } else {
          userStorage.removeItem("background");
        }
        break;
      case "toggleMuted":
        if (state.grimoire.isMuted) {
          userStorage.setItem("muted", 1);
        } else {
          userStorage.removeItem("muted");
        }
        break;
      case "toggleStatic":
        if (state.grimoire.isStatic) {
          userStorage.setItem("static", 1);
        } else {
          userStorage.removeItem("static");
        }
        break;
      case "toggleImageOptIn":
        if (state.grimoire.isImageOptIn) {
          userStorage.setItem("imageOptIn", 1);
        } else {
          userStorage.removeItem("imageOptIn");
        }
        break;
      case "setZoom":
        if (payload !== 0) {
          userStorage.setItem("zoom", payload);
        } else {
          userStorage.removeItem("zoom");
        }
        break;
      case "setEdition":
        userStorage.setItem("edition", payload);
        if (state.edition.isOfficial) {
          userStorage.removeItem("roles");
        }
        break;
      case "setCustomRoles":
        if (!payload.length) {
          userStorage.removeItem("roles");
        } else {
          userStorage.setItem("roles", payload);
        }
        break;
      case "players/setBluff":
        userStorage.setItem(
          "bluffs",
          state.players.bluffs.map(({ id }) => id),
        );
        break;
      case "players/setFabled":
        userStorage.setItem(
          "fabled",
          state.players.fabled.map((fabled) =>
            fabled.isCustom ? fabled : { id: fabled.id },
          ),
        );
        break;
      case "players/add":
      case "players/update":
      case "players/remove":
      case "players/clear":
      case "players/set":
      case "players/swap":
      case "players/move":
        if (state.players.players.length) {
          console.log("保存玩家数据:", state.players.players.length, "个玩家");
          console.log("当前用户信息:", userStorage.getUserInfo());
          console.log("当前角色:", userStorage.getUserInfo().role);
          const playerData = state.players.players.map((player) => {
            const roleToSave =
              player.role && player.role.id ? player.role.id : {};
            console.log(`保存玩家 ${player.name} 的数据:`, {
              name: player.name,
              id: player.id,
              role: player.role,
              roleId: player.role?.id,
              savedRole: roleToSave,
              isDead: player.isDead,
              isVoteless: player.isVoteless,
            });
            return {
              ...player,
              // simplify the stored data - 保存角色ID而不是整个角色对象
              role: roleToSave,
            };
          });
          console.log("要保存的玩家数据:", playerData);
          userStorage.setItem("players", playerData);
        } else {
          console.log("清除玩家数据");
          userStorage.removeItem("players");
        }
        break;
      case "session/setSessionId":
        if (payload) {
          const userInfo = userStorage.getUserInfo();
          // 根据当前角色确定正确的isSpectator值
          const isSpectator = userInfo.role === "player";

          console.log("保存会话数据:", {
            isSpectator,
            sessionId: payload,
            role: userInfo.role,
          });
          console.log("当前用户信息:", userInfo);
          console.log(
            "保存到存储键:",
            getUserSpecificKey("session", userInfo.role),
          );
          userStorage.setItem("session", [isSpectator, payload]);
        } else {
          console.log("清除会话数据");
          userStorage.removeItem("session");
        }
        break;
      case "session/setPlayerId":
        if (payload) {
          userStorage.setItem("playerId", payload);
        } else {
          userStorage.removeItem("playerId");
        }
        break;
    }
  });
};

// 导出hash角色标志位相关函数
module.exports.setHashRoleFlag =
  require("../utils/userStorage").setHashRoleFlag;
module.exports.getHashRoleFlag =
  require("../utils/userStorage").getHashRoleFlag;
module.exports.clearHashRoleFlag =
  require("../utils/userStorage").clearHashRoleFlag;
module.exports.getUserSpecificKey =
  require("../utils/userStorage").getUserSpecificKey;
