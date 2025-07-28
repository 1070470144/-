// 历史记录工具函数

// 通用记录函数
const recordRoleAbility = (
  roleName,
  abilityType,
  targetPlayer,
  information,
) => {
  return {
    action: "role_ability",
    roleName,
    abilityType,
    targetPlayer,
    information,
    isPublic: false,
  };
};

// 调查类角色记录函数
export const recordInvestigator = (targetPlayer, information) => {
  return recordRoleAbility("调查员", "investigate", targetPlayer, information);
};

export const recordFortuneTeller = (targetPlayer, information) => {
  return recordRoleAbility("占卜师", "investigate", targetPlayer, information);
};

export const recordEmpath = (information) => {
  return {
    action: "role_ability",
    roleName: "共情者",
    abilityType: "information",
    information,
    isPublic: false,
  };
};

export const recordRavenkeeper = (targetPlayer, information) => {
  return recordRoleAbility(
    "渡鸦守护者",
    "investigate",
    targetPlayer,
    information,
  );
};

export const recordSeamstress = (information) => {
  return {
    action: "role_ability",
    roleName: "裁缝",
    abilityType: "information",
    information,
    isPublic: false,
  };
};

export const recordLibrarian = (information) => {
  return recordRoleAbility("图书管理员", "information", null, information);
};

export const recordWasherwoman = (information) => {
  return recordRoleAbility("洗衣妇", "information", null, information);
};

export const recordChef = (information) => {
  return recordRoleAbility("厨师", "information", null, information);
};

export const recordSlayer = (targetPlayer, success) => {
  return recordRoleAbility(
    "杀手",
    "slay",
    targetPlayer,
    success ? "成功杀死恶魔" : "未杀死恶魔",
  );
};

export const recordSnakeCharmer = (targetPlayer, information) => {
  return recordRoleAbility("蛇魅", "investigate", targetPlayer, information);
};

export const recordSnitch = (information) => {
  return recordRoleAbility("告密者", "information", null, information);
};

// 保护类角色记录函数
export const recordSoldier = (targetPlayer) => {
  return recordRoleAbility("士兵", "protect", targetPlayer, "今晚被保护");
};

export const recordMonk = (targetPlayer) => {
  return recordRoleAbility("僧侣", "protect", targetPlayer, "今晚被保护");
};

export const recordVirgin = (targetPlayer, success) => {
  return recordRoleAbility(
    "处女",
    "protect",
    targetPlayer,
    success ? "成功保护" : "保护失败",
  );
};

// 能力类角色记录函数
export const recordWitch = (actionType, targetPlayer) => {
  const action = actionType === "poison" ? "毒死" : "救活";
  return recordRoleAbility(
    "女巫",
    "ability_use",
    targetPlayer,
    `今晚${action}${targetPlayer}`,
  );
};

export const recordPoisoner = (targetPlayer) => {
  return recordRoleAbility("毒师", "poison", targetPlayer, "今晚被毒死");
};

export const recordCerenovus = (targetPlayer, information) => {
  return recordRoleAbility("塞雷诺维斯", "madness", targetPlayer, information);
};

export const recordPitHag = (targetPlayer, newRole) => {
  return recordRoleAbility(
    "坑洞女巫",
    "transform",
    targetPlayer,
    `转变为${newRole}`,
  );
};

export const recordFangGu = (targetPlayer) => {
  return recordRoleAbility("方古", "kill", targetPlayer, "今晚杀死目标");
};

export const recordVigormortis = (targetPlayer) => {
  return recordRoleAbility("维格莫蒂斯", "kill", targetPlayer, "今晚杀死目标");
};

export const recordNoDashii = (targetPlayer) => {
  return recordRoleAbility("无破绽", "kill", targetPlayer, "今晚杀死目标");
};

export const recordLleech = (targetPlayer) => {
  return recordRoleAbility("利奇", "leech", targetPlayer, "寄生在目标身上");
};

// 恶魔类角色记录函数
export const recordImp = (targetPlayer) => {
  return recordRoleAbility("小恶魔", "kill", targetPlayer, "今晚杀死目标");
};

export const recordDemon = (targetPlayer) => {
  return recordRoleAbility("恶魔", "kill", targetPlayer, "今晚杀死目标");
};

export const recordLilMonsta = (targetPlayer) => {
  return recordRoleAbility("小怪物", "kill", targetPlayer, "今晚杀死目标");
};

export const recordLeviathan = (targetPlayer) => {
  return recordRoleAbility("利维坦", "kill", targetPlayer, "今晚杀死目标");
};

export const recordLunatic = (information) => {
  return recordRoleAbility("疯子", "information", null, information);
};

// 其他角色记录函数
export const recordRecluse = (information) => {
  return recordRoleAbility("隐士", "information", null, information);
};

export const recordDrunk = (information) => {
  return recordRoleAbility("酒鬼", "information", null, information);
};

export const recordSaint = (targetPlayer) => {
  return recordRoleAbility("圣徒", "protect", targetPlayer, "被提名时游戏结束");
};

export const recordButler = (targetPlayer) => {
  return recordRoleAbility("管家", "vote", targetPlayer, "必须跟随主人投票");
};

export const recordBaron = (information) => {
  return recordRoleAbility("男爵", "information", null, information);
};

export const recordSpy = (information) => {
  return recordRoleAbility("间谍", "information", null, information);
};

export const recordScarletWoman = (information) => {
  return recordRoleAbility("猩红女郎", "information", null, information);
};

// 通用记录函数
export const recordWakeUp = (roleName, playerName) => {
  return {
    action: "wake_up",
    roleName,
    playerName,
    isPublic: false,
  };
};

export const recordPlayerDied = (playerName, reason) => {
  return {
    action: "player_died",
    playerName,
    reason,
    isPublic: true,
  };
};

export const recordPlayerProtected = (playerName) => {
  return {
    action: "player_protected",
    playerName,
    isPublic: false,
  };
};

export const recordPlayerPoisoned = (playerName) => {
  return {
    action: "player_poisoned",
    playerName,
    isPublic: false,
  };
};

export const recordSurvivorCount = (count) => {
  return {
    action: "survivor_count",
    count,
    isPublic: true,
  };
};

export const recordInformationGiven = (roleName, playerName, information) => {
  return {
    action: "information_given",
    roleName,
    playerName,
    information,
    isPublic: false,
  };
};

// 导出所有记录函数
export default {
  // 调查类
  recordInvestigator,
  recordFortuneTeller,
  recordEmpath,
  recordRavenkeeper,
  recordSeamstress,
  recordLibrarian,
  recordWasherwoman,
  recordChef,
  recordSlayer,
  recordSnakeCharmer,
  recordSnitch,

  // 保护类
  recordSoldier,
  recordMonk,
  recordVirgin,

  // 能力类
  recordWitch,
  recordPoisoner,
  recordCerenovus,
  recordPitHag,
  recordFangGu,
  recordVigormortis,
  recordNoDashii,
  recordLleech,

  // 恶魔类
  recordImp,
  recordDemon,
  recordLilMonsta,
  recordLeviathan,
  recordLunatic,

  // 其他
  recordRecluse,
  recordDrunk,
  recordSaint,
  recordButler,
  recordBaron,
  recordSpy,
  recordScarletWoman,

  // 通用
  recordWakeUp,
  recordPlayerDied,
  recordPlayerProtected,
  recordPlayerPoisoned,
  recordSurvivorCount,
  recordInformationGiven,
};
