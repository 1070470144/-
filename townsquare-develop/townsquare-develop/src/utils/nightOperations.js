// 夜晚操作记录工具函数
import historyHelpers from "./historyHelpers";

// 记录角色叫醒
export const recordRoleWakeUp = (roleName, playerName, store) => {
  const event = historyHelpers.recordWakeUp(roleName, playerName);
  store.commit("addHistoryEvent", event);
};

// 记录角色能力使用
export const recordRoleAbility = (
  roleName,
  abilityType,
  targetPlayer,
  information,
  store,
) => {
  let event;

  // 根据角色名称选择对应的记录函数
  switch (roleName) {
    case "占卜师":
      event = historyHelpers.recordFortuneTeller(targetPlayer, information);
      break;
    case "调查员":
      event = historyHelpers.recordInvestigator(targetPlayer, information);
      break;
    case "共情者":
      event = historyHelpers.recordEmpath(information);
      break;
    case "渡鸦守护者":
      event = historyHelpers.recordRavenkeeper(targetPlayer, information);
      break;
    case "裁缝":
      event = historyHelpers.recordSeamstress(information);
      break;
    case "图书管理员":
      event = historyHelpers.recordLibrarian(information);
      break;
    case "洗衣妇":
      event = historyHelpers.recordWasherwoman(information);
      break;
    case "厨师":
      event = historyHelpers.recordChef(information);
      break;
    case "杀手":
      event = historyHelpers.recordSlayer(
        targetPlayer,
        information === "成功杀死恶魔",
      );
      break;
    case "蛇魅":
      event = historyHelpers.recordSnakeCharmer(targetPlayer, information);
      break;
    case "告密者":
      event = historyHelpers.recordSnitch(information);
      break;
    case "士兵":
      event = historyHelpers.recordSoldier(targetPlayer);
      break;
    case "僧侣":
      event = historyHelpers.recordMonk(targetPlayer);
      break;
    case "处女":
      event = historyHelpers.recordVirgin(
        targetPlayer,
        information === "成功保护",
      );
      break;
    case "女巫": {
      const actionType = information.includes("毒死") ? "poison" : "save";
      event = historyHelpers.recordWitch(actionType, targetPlayer);
      break;
    }
    case "毒师":
      event = historyHelpers.recordPoisoner(targetPlayer);
      break;
    case "塞雷诺维斯":
      event = historyHelpers.recordCerenovus(targetPlayer, information);
      break;
    case "坑洞女巫":
      event = historyHelpers.recordPitHag(targetPlayer, information);
      break;
    case "方古":
      event = historyHelpers.recordFangGu(targetPlayer);
      break;
    case "维格莫蒂斯":
      event = historyHelpers.recordVigormortis(targetPlayer);
      break;
    case "无破绽":
      event = historyHelpers.recordNoDashii(targetPlayer);
      break;
    case "利奇":
      event = historyHelpers.recordLleech(targetPlayer);
      break;
    case "小恶魔":
      event = historyHelpers.recordImp(targetPlayer);
      break;
    case "恶魔":
      event = historyHelpers.recordDemon(targetPlayer);
      break;
    case "小怪物":
      event = historyHelpers.recordLilMonsta(targetPlayer);
      break;
    case "利维坦":
      event = historyHelpers.recordLeviathan(targetPlayer);
      break;
    case "疯子":
      event = historyHelpers.recordLunatic(information);
      break;
    case "隐士":
      event = historyHelpers.recordRecluse(information);
      break;
    case "酒鬼":
      event = historyHelpers.recordDrunk(information);
      break;
    case "圣徒":
      event = historyHelpers.recordSaint(targetPlayer);
      break;
    case "管家":
      event = historyHelpers.recordButler(targetPlayer);
      break;
    case "男爵":
      event = historyHelpers.recordBaron(information);
      break;
    case "间谍":
      event = historyHelpers.recordSpy(information);
      break;
    case "猩红女郎":
      event = historyHelpers.recordScarletWoman(information);
      break;
    default:
      // 通用记录
      event = {
        action: "role_ability",
        roleName,
        abilityType,
        targetPlayer,
        information,
        isPublic: false,
      };
  }

  store.commit("addHistoryEvent", event);
};

// 记录信息传递
export const recordInformationGiven = (
  roleName,
  playerName,
  information,
  store,
) => {
  const event = historyHelpers.recordInformationGiven(
    roleName,
    playerName,
    information,
  );
  store.commit("addHistoryEvent", event);
};

// 记录玩家状态变更
export const recordPlayerStatusChange = (playerName, status, reason, store) => {
  let event;

  switch (status) {
    case "died":
      event = historyHelpers.recordPlayerDied(playerName, reason);
      break;
    case "protected":
      event = historyHelpers.recordPlayerProtected(playerName);
      break;
    case "poisoned":
      event = historyHelpers.recordPlayerPoisoned(playerName);
      break;
    default:
      event = {
        action: "player_status_change",
        playerName,
        status,
        reason,
        isPublic: false,
      };
  }

  store.commit("addHistoryEvent", event);
};

// 记录存活人数变化
export const recordSurvivorCount = (count, store) => {
  const event = historyHelpers.recordSurvivorCount(count);
  store.commit("addHistoryEvent", event);
};

// 夜晚操作记录工具
export const nightOperationRecorder = {
  // 记录角色叫醒
  wakeUpRole: (roleName, playerName, store) => {
    recordRoleWakeUp(roleName, playerName, store);
  },

  // 记录角色能力使用
  useAbility: (roleName, abilityType, targetPlayer, information, store) => {
    recordRoleAbility(roleName, abilityType, targetPlayer, information, store);
  },

  // 记录信息传递
  giveInformation: (roleName, playerName, information, store) => {
    recordInformationGiven(roleName, playerName, information, store);
  },

  // 记录玩家状态变更
  changePlayerStatus: (playerName, status, reason, store) => {
    recordPlayerStatusChange(playerName, status, reason, store);
  },

  // 记录存活人数
  updateSurvivorCount: (count, store) => {
    recordSurvivorCount(count, store);
  },
};

export default nightOperationRecorder;
