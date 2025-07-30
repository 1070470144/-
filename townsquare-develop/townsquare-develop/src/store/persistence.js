const userStorage = require("../utils/userStorage").default;
const { getUserSpecificKey, getUserRole } = require("../utils/userStorage");
const { SYSTEM_KEYS, USER_DATA_KEYS } = require("../utils/storageKeys.js");

module.exports = (store) => {
  const updatePagetitle = (isPublic) =>
    (document.title = `Blood on the Clocktower ${
      isPublic ? "Town Square" : "Grimoire"
    }`);

  // 更新用户角色（确保初始化时角色检测正确）
  userStorage.updateRole();

  console.log("初始化存储，用户信息:", userStorage.getUserInfo());

  // 使用新的角色管理器检测用户角色
  const userRole = getUserRole();
  console.log("检测到用户角色:", userRole);

  // 根据角色类型进行不同的数据恢复策略
  if (userRole === "storyteller") {
    console.log("=== 说书人模式：恢复所有数据 ===");
    restoreStorytellerData(store);
  } else if (userRole === "player") {
    console.log("=== 玩家模式：恢复自己本地数据 ===");
    restorePlayerData(store);
  } else {
    console.log("=== 游客模式：清除所有数据并恢复到初始状态 ===");
    clearAllDataAndReset(store);
  }

  // initialize data
  if (userStorage.getItem(USER_DATA_KEYS.BACKGROUND)) {
    console.log("恢复背景设置");
    store.commit(
      "setBackground",
      userStorage.getItem(USER_DATA_KEYS.BACKGROUND),
    );
  }
  if (userStorage.getItem(USER_DATA_KEYS.MUTED)) {
    store.commit("toggleMuted", true);
  }
  if (userStorage.getItem(USER_DATA_KEYS.STATIC)) {
    store.commit("toggleStatic", true);
  }
  if (sessionStorage.getItem(SYSTEM_KEYS.IMAGE_OPT_IN)) {
    store.commit("toggleImageOptIn", true);
  }
  if (userStorage.getItem(USER_DATA_KEYS.ZOOM)) {
    store.commit(
      "setZoom",
      parseFloat(userStorage.getItem(USER_DATA_KEYS.ZOOM)),
    );
  }
  if (userStorage.getItem(USER_DATA_KEYS.IS_GRIMOIRE)) {
    store.commit("toggleGrimoire", false);
    updatePagetitle(false);
  }

  // 加载历史记录
  store.commit("loadHistoryFromStorage");

  // listen to mutations
  store.subscribe(({ type, payload }, state) => {
    switch (type) {
      case "toggleGrimoire":
        if (!state.grimoire.isPublic) {
          userStorage.setItem(USER_DATA_KEYS.IS_GRIMOIRE, 1);
        } else {
          userStorage.removeItem(USER_DATA_KEYS.IS_GRIMOIRE);
        }
        updatePagetitle(state.grimoire.isPublic);
        break;
      case "setBackground":
        if (payload) {
          userStorage.setItem(USER_DATA_KEYS.BACKGROUND, payload);
        } else {
          userStorage.removeItem(USER_DATA_KEYS.BACKGROUND);
        }
        break;
      case "toggleMuted":
        if (state.grimoire.isMuted) {
          userStorage.setItem(USER_DATA_KEYS.MUTED, 1);
        } else {
          userStorage.removeItem(USER_DATA_KEYS.MUTED);
        }
        break;
      case "toggleStatic":
        if (state.grimoire.isStatic) {
          userStorage.setItem(USER_DATA_KEYS.STATIC, 1);
        } else {
          userStorage.removeItem(USER_DATA_KEYS.STATIC);
        }
        break;
      case "toggleImageOptIn":
        if (state.grimoire.isImageOptIn) {
          sessionStorage.setItem(SYSTEM_KEYS.IMAGE_OPT_IN, 1);
        } else {
          sessionStorage.removeItem(SYSTEM_KEYS.IMAGE_OPT_IN);
        }
        break;
      case "setZoom":
        if (payload !== 0) {
          userStorage.setItem(USER_DATA_KEYS.ZOOM, payload);
        } else {
          userStorage.removeItem(USER_DATA_KEYS.ZOOM);
        }
        break;
      case "setEdition":
        userStorage.setItem(USER_DATA_KEYS.EDITION, payload);
        if (state.edition.isOfficial) {
          userStorage.removeItem(USER_DATA_KEYS.ROLES);
        }
        break;
      case "setCustomRoles":
        if (!payload.length) {
          userStorage.removeItem(USER_DATA_KEYS.ROLES);
        } else {
          userStorage.setItem(USER_DATA_KEYS.ROLES, payload);
        }
        break;
      case "players/setBluff":
        userStorage.setItem(
          USER_DATA_KEYS.BLUFFS,
          state.players.bluffs.map(({ id }) => id),
        );
        break;
      case "players/setFabled":
        userStorage.setItem(
          USER_DATA_KEYS.FABLED,
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
          userStorage.setItem(USER_DATA_KEYS.PLAYERS, playerData);
        } else {
          console.log("清除玩家数据");
          userStorage.removeItem(USER_DATA_KEYS.PLAYERS);
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
            getUserSpecificKey(USER_DATA_KEYS.SESSION, userInfo.role),
          );
          userStorage.setItem(USER_DATA_KEYS.SESSION, [isSpectator, payload]);
        } else {
          console.log("清除会话数据");
          userStorage.removeItem(USER_DATA_KEYS.SESSION);
        }
        break;
      case "session/setPlayerId":
        if (payload) {
          userStorage.setItem(USER_DATA_KEYS.PLAYER_ID, payload);
        } else {
          userStorage.removeItem(USER_DATA_KEYS.PLAYER_ID);
        }
        break;
    }
  });
};

// 说书人数据恢复函数
function restoreStorytellerData(store) {
  console.log("开始恢复说书人数据...");
  
  // 设置角色
  userStorage.setRole("storyteller");
  
  // 恢复版本和角色数据
  if (userStorage.getItem(USER_DATA_KEYS.ROLES) !== null) {
    store.commit("setCustomRoles", userStorage.getItem(USER_DATA_KEYS.ROLES));
    store.commit("setEdition", { id: "custom" });
  }
  if (userStorage.getItem(USER_DATA_KEYS.EDITION) !== null) {
    store.commit("setEdition", userStorage.getItem(USER_DATA_KEYS.EDITION));
  }
  
  // 恢复寓言数据
  if (userStorage.getItem(USER_DATA_KEYS.FABLED) !== null) {
    console.log("恢复寓言数据");
    store.commit("players/setFabled", {
      fabled: userStorage
        .getItem(USER_DATA_KEYS.FABLED)
        .map((fabled) => store.state.fabled.get(fabled.id) || fabled),
    });
  }
  
  // 恢复玩家数据
  if (userStorage.getItem(USER_DATA_KEYS.PLAYERS) !== null) {
    console.log("恢复说书人玩家数据");
    const playersData = userStorage.getItem(USER_DATA_KEYS.PLAYERS);
    
    if (playersData && Array.isArray(playersData)) {
      const restoredPlayers = playersData.map((player) => {
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
    }
  }
  
  // 恢复恶魔伪装
  if (userStorage.getItem(USER_DATA_KEYS.BLUFFS) !== null) {
    console.log("恢复恶魔伪装");
    const bluffsData = userStorage.getItem(USER_DATA_KEYS.BLUFFS);
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
  
  // 恢复会话数据
  const sessionResult = restoreSessionData();
  if (sessionResult) {
    if (sessionResult.type === "storyteller") {
      store.commit("session/setSpectator", false);
      store.commit("session/setSessionId", sessionResult.sessionId);
    } else if (sessionResult.type === "player") {
      store.commit("session/setSpectator", true);
      store.commit("session/setSessionId", sessionResult.sessionId);
    }
  }
  
  console.log("说书人数据恢复完成");
}

// 玩家数据恢复函数
function restorePlayerData(store) {
  console.log("开始恢复玩家数据...");
  
  // 设置角色
  userStorage.setRole("player");
  
  // 恢复玩家ID
  const playerId = userStorage.getItem(USER_DATA_KEYS.PLAYER_ID);
  if (playerId) {
    console.log("恢复玩家ID:", playerId);
    store.commit("session/setPlayerId", playerId);
  }
  
  // 恢复玩家数据（只恢复自己的角色信息）
  if (userStorage.getItem(USER_DATA_KEYS.PLAYERS) !== null) {
    console.log("恢复玩家本地数据");
    const playersData = userStorage.getItem(USER_DATA_KEYS.PLAYERS);
    const currentPlayerId = userStorage.getItem(USER_DATA_KEYS.PLAYER_ID);
    
    console.log("当前玩家ID:", currentPlayerId);
    console.log("玩家数据:", playersData);

    store.commit(
      "players/set",
      playersData.map((player) => {
        if (player.id === currentPlayerId) {
          // 当前玩家：恢复自己的角色信息和座位信息
          const roleId =
            typeof player.role === "string" ? player.role : player.role?.id;
          
          // 确保角色ID存在且有效
          if (roleId && roleId !== "{}" && roleId !== "") {
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
            console.log(`当前玩家角色ID无效: ${roleId}，保持空角色`);
            return {
              ...player,
              role: {},
            };
          }
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
    if (userStorage.getItem(USER_DATA_KEYS.BLUFFS) !== null) {
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
        const bluffsData = userStorage.getItem(USER_DATA_KEYS.BLUFFS);
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
  }
  
  // 恢复会话数据
  const sessionResult = restoreSessionData();
  if (sessionResult) {
    if (sessionResult.type === "storyteller") {
      store.commit("session/setSpectator", false);
      store.commit("session/setSessionId", sessionResult.sessionId);
    } else if (sessionResult.type === "player") {
      store.commit("session/setSpectator", true);
      store.commit("session/setSessionId", sessionResult.sessionId);
    }
  }
  
  console.log("玩家数据恢复完成");
}

// 游客数据清除和重置函数
function clearAllDataAndReset(store) {
  console.log("开始清除所有数据并重置到初始状态...");
  
  // 设置角色
  userStorage.setRole("spectator");
  
  // 清除所有游戏相关数据
  store.commit("players/clear");
  store.commit("session/setSessionId", "");
  store.commit("session/setPlayerId", "");
  store.commit("session/setSpectator", false);
  store.commit("clearHistory");
  store.commit("session/clearVoteHistory");
  
  // 清除存储的游戏数据
  userStorage.removeItem(USER_DATA_KEYS.PLAYERS);
  userStorage.removeItem(USER_DATA_KEYS.SESSION);
  userStorage.removeItem(USER_DATA_KEYS.PLAYER_ID);
  userStorage.removeItem(USER_DATA_KEYS.EDITION);
  userStorage.removeItem(USER_DATA_KEYS.FABLED);
  userStorage.removeItem(USER_DATA_KEYS.BLUFFS);
  userStorage.removeItem(USER_DATA_KEYS.ROLES);
  
  console.log("游客数据清除和重置完成");
}

// 恢复会话数据函数
function restoreSessionData() {
  const userSessionData = userStorage.getItem(USER_DATA_KEYS.SESSION);
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
        return { type: "storyteller", sessionId };
      } else if (userInfo.role === "player") {
        // 玩家模式：强制设置为玩家会话
        console.log("恢复玩家会话:", sessionId, "（忽略存储的spectator标志）");
        return { type: "player", sessionId };
      } else {
        console.log("未知角色，跳过会话恢复:", {
          spectator,
          role: userInfo.role,
        });
        return null;
      }
    } catch (e) {
      console.log("解析用户会话数据失败:", e);
      return null;
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
    return null;
  }
}

// 导出hash角色标志位相关函数
module.exports.setHashRoleFlag =
  require("../utils/userStorage").setHashRoleFlag;
module.exports.getHashRoleFlag =
  require("../utils/userStorage").getHashRoleFlag;
module.exports.clearHashRoleFlag =
  require("../utils/userStorage").clearHashRoleFlag;
module.exports.getUserSpecificKey =
  require("../utils/userStorage").getUserSpecificKey;
