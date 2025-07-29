// Reminder操作到历史记录的映射工具
import nightOperationRecorder from "./nightOperations";

// Reminder类型到历史记录动作的映射
const reminderToActionMap = {
  // 调查类角色
  investigator: {
    action: "investigate",
    roleName: "调查员",
    defaultInfo: "调查了目标玩家",
  },
  fortune_teller: {
    action: "investigate",
    roleName: "占卜师",
    defaultInfo: "占卜了目标玩家",
  },
  empath: {
    action: "information",
    roleName: "共情者",
    defaultInfo: "感知了周围邪恶数量",
  },
  ravenkeeper: {
    action: "investigate",
    roleName: "渡鸦守护者",
    defaultInfo: "调查了目标玩家",
  },
  seamstress: {
    action: "information",
    roleName: "裁缝",
    defaultInfo: "感知了目标玩家",
  },
  librarian: {
    action: "information",
    roleName: "图书管理员",
    defaultInfo: "获得了初始信息",
  },
  washerwoman: {
    action: "information",
    roleName: "洗衣妇",
    defaultInfo: "获得了初始信息",
  },
  chef: {
    action: "information",
    roleName: "厨师",
    defaultInfo: "感知了邪恶数量",
  },
  slayer: {
    action: "slay",
    roleName: "杀手",
    defaultInfo: "尝试杀死恶魔",
  },
  snake_charmer: {
    action: "investigate",
    roleName: "蛇魅",
    defaultInfo: "调查了目标玩家",
  },
  snitch: {
    action: "information",
    roleName: "告密者",
    defaultInfo: "获得了信息",
  },

  // 保护类角色
  soldier: {
    action: "protect",
    roleName: "士兵",
    defaultInfo: "今晚被保护",
  },
  monk: {
    action: "protect",
    roleName: "僧侣",
    defaultInfo: "今晚被保护",
  },
  virgin: {
    action: "protect",
    roleName: "处女",
    defaultInfo: "被提名时触发保护",
  },

  // 能力类角色
  witch: {
    action: "ability_use",
    roleName: "女巫",
    defaultInfo: "使用了能力",
  },
  poisoner: {
    action: "poison",
    roleName: "毒师",
    defaultInfo: "毒死了目标",
  },
  cerenovus: {
    action: "madness",
    roleName: "塞雷诺维斯",
    defaultInfo: "对目标施加疯狂",
  },
  pit_hag: {
    action: "transform",
    roleName: "坑洞女巫",
    defaultInfo: "转变了目标角色",
  },
  fang_gu: {
    action: "kill",
    roleName: "方古",
    defaultInfo: "今晚杀死目标",
  },
  vigormortis: {
    action: "kill",
    roleName: "维格莫蒂斯",
    defaultInfo: "今晚杀死目标",
  },
  no_dashii: {
    action: "kill",
    roleName: "无破绽",
    defaultInfo: "今晚杀死目标",
  },
  lleech: {
    action: "leech",
    roleName: "利奇",
    defaultInfo: "寄生在目标身上",
  },

  // 恶魔类角色
  imp: {
    action: "kill",
    roleName: "小恶魔",
    defaultInfo: "今晚杀死目标",
  },
  demon: {
    action: "kill",
    roleName: "恶魔",
    defaultInfo: "今晚杀死目标",
  },
  lil_monsta: {
    action: "kill",
    roleName: "小怪物",
    defaultInfo: "今晚杀死目标",
  },
  leviathan: {
    action: "kill",
    roleName: "利维坦",
    defaultInfo: "今晚杀死目标",
  },
  lunatic: {
    action: "information",
    roleName: "疯子",
    defaultInfo: "获得了虚假信息",
  },

  // 其他角色
  recluse: {
    action: "information",
    roleName: "隐士",
    defaultInfo: "可能显示为邪恶",
  },
  drunk: {
    action: "information",
    roleName: "酒鬼",
    defaultInfo: "获得了虚假信息",
  },
  saint: {
    action: "protect",
    roleName: "圣徒",
    defaultInfo: "被提名时游戏结束",
  },
  butler: {
    action: "vote",
    roleName: "管家",
    defaultInfo: "必须跟随主人投票",
  },
  baron: {
    action: "information",
    roleName: "男爵",
    defaultInfo: "影响了游戏设置",
  },
  spy: {
    action: "information",
    roleName: "间谍",
    defaultInfo: "可能显示为善良",
  },
  scarlet_woman: {
    action: "information",
    roleName: "猩红女郎",
    defaultInfo: "可能成为恶魔",
  },
};

// 从reminder名称推断角色
function inferRoleFromReminder(reminderName) {
  const name = reminderName.toLowerCase();

  // 跳过已经特殊处理的标记类型
  if (
    name.includes("毒") ||
    name.includes("poison") ||
    name.includes("代处决") ||
    name.includes("executed") ||
    name.includes("死亡") ||
    name.includes("dead") ||
    name.includes("died") ||
    name.includes("保护") ||
    name.includes("protect") ||
    name.includes("士兵") ||
    name.includes("soldier") ||
    name.includes("僧侣") ||
    name.includes("monk") ||
    name.includes("处女") ||
    name.includes("virgin")
  ) {
    return null; // 这些标记已经特殊处理，不需要额外记录
  }

  // 直接匹配
  for (const [roleId, config] of Object.entries(reminderToActionMap)) {
    if (
      name.includes(roleId.replace("_", "")) ||
      name.includes(config.roleName.toLowerCase())
    ) {
      return config;
    }
  }

  // 关键词匹配
  if (name.includes("调查") || name.includes("investigate")) {
    return reminderToActionMap.investigator;
  }
  if (name.includes("杀死") || name.includes("kill")) {
    return reminderToActionMap.imp;
  }
  if (name.includes("信息") || name.includes("information")) {
    return reminderToActionMap.librarian;
  }

  return null;
}

// 记录reminder添加操作
export function recordReminderAdded(reminder, player, store) {
  console.log("recordReminderAdded called with:", reminder, player);

  // 特殊处理：中毒标记
  if (
    reminder.name.toLowerCase().includes("毒") ||
    reminder.name.toLowerCase().includes("poison")
  ) {
    try {
      store.commit("addHistoryEvent", {
        action: "reminder_added",
        playerName: player.name,
        reminderName: reminder.name,
        summary: `为 ${player.name} 添加了标记: ${reminder.name}`,
        details: `说书人为 ${player.name} 添加了 ${reminder.name} 标记`,
        isPublic: false,
      });
      console.log("Poison record added successfully");
    } catch (error) {
      console.error("Error recording poison:", error);
    }
    return; // 中毒标记只记录一个，不进行其他记录
  }

  // 特殊处理：代处决标记
  if (
    reminder.name.toLowerCase().includes("代处决") ||
    reminder.name.toLowerCase().includes("executed")
  ) {
    try {
      store.commit("addHistoryEvent", {
        action: "reminder_added",
        playerName: player.name,
        reminderName: reminder.name,
        summary: `为 ${player.name} 添加了标记: ${reminder.name}`,
        details: `说书人为 ${player.name} 添加了 ${reminder.name} 标记`,
        isPublic: true,
      });
      console.log("Execution record added successfully");
    } catch (error) {
      console.error("Error recording execution:", error);
    }
    return; // 代处决标记只记录一个，不进行其他记录
  }

  // 特殊处理：死亡标记
  if (
    reminder.name.toLowerCase().includes("死亡") ||
    reminder.name.toLowerCase().includes("dead") ||
    reminder.name.toLowerCase().includes("died")
  ) {
    try {
      store.commit("addHistoryEvent", {
        action: "reminder_added",
        playerName: player.name,
        reminderName: reminder.name,
        summary: `为 ${player.name} 添加了标记: ${reminder.name}`,
        details: `说书人为 ${player.name} 添加了 ${reminder.name} 标记`,
        isPublic: true,
      });
      console.log("Death record added successfully");
    } catch (error) {
      console.error("Error recording death:", error);
    }
    return; // 死亡标记只记录一个，不进行其他记录
  }

  // 特殊处理：保护类标记
  if (
    reminder.name.toLowerCase().includes("保护") ||
    reminder.name.toLowerCase().includes("protect") ||
    reminder.name.toLowerCase().includes("士兵") ||
    reminder.name.toLowerCase().includes("soldier") ||
    reminder.name.toLowerCase().includes("僧侣") ||
    reminder.name.toLowerCase().includes("monk") ||
    reminder.name.toLowerCase().includes("处女") ||
    reminder.name.toLowerCase().includes("virgin")
  ) {
    try {
      store.commit("addHistoryEvent", {
        action: "reminder_added",
        playerName: player.name,
        reminderName: reminder.name,
        summary: `为 ${player.name} 添加了标记: ${reminder.name}`,
        details: `说书人为 ${player.name} 添加了 ${reminder.name} 标记`,
        isPublic: false,
      });
      console.log("Protection record added successfully");
    } catch (error) {
      console.error("Error recording protection:", error);
    }
    return; // 保护类标记只记录一个，不进行其他记录
  }

  // 其他标记的正常处理
  try {
    store.commit("addHistoryEvent", {
      action: "reminder_added",
      roleName: reminder.role,
      playerName: player.name,
      reminderName: reminder.name,
      summary: `为 ${player.name} 添加了标记: ${reminder.name}`,
      details: `说书人为 ${player.name} 添加了 ${reminder.name} 标记`,
      isPublic: false,
    });
    console.log("Basic reminder record added successfully");
  } catch (error) {
    console.error("Error adding basic reminder record:", error);
  }

  // 然后尝试智能识别（排除特殊标记）
  try {
    const roleConfig = inferRoleFromReminder(reminder.name);
    console.log("roleConfig:", roleConfig);

    if (roleConfig) {
      // 记录角色能力使用
      console.log("Recording role ability");
      nightOperationRecorder.useAbility(
        roleConfig.roleName,
        roleConfig.action,
        player.name,
        reminder.name,
        store,
      );

      // 记录信息传递
      console.log("Recording information given");
      nightOperationRecorder.giveInformation(
        roleConfig.roleName,
        player.name,
        reminder.name,
        store,
      );
    }
  } catch (error) {
    console.error("Error in smart reminder recording:", error);
  }
}

// 记录reminder移除操作
export function recordReminderRemoved(reminder, player, store) {
  console.log("recordReminderRemoved called with:", reminder, player);

  try {
    store.commit("addHistoryEvent", {
      action: "reminder_removed",
      roleName: reminder.role,
      playerName: player.name,
      reminderName: reminder.name,
      summary: `移除了 ${player.name} 的标记: ${reminder.name}`,
      details: `说书人移除了 ${player.name} 的 ${reminder.name} 标记`,
      isPublic: false,
    });
    console.log("Reminder removed record added successfully");
  } catch (error) {
    console.error("Error recording reminder removed:", error);
  }
}

// 记录自定义reminder
export function recordCustomReminder(reminderName, player, store) {
  console.log("recordCustomReminder called with:", reminderName, player);

  try {
    store.commit("addHistoryEvent", {
      action: "custom_reminder_added",
      playerName: player.name,
      reminderName: reminderName,
      summary: `为 ${player.name} 添加了自定义标记: ${reminderName}`,
      details: `说书人为 ${player.name} 添加了自定义标记 "${reminderName}"`,
      isPublic: false,
    });
    console.log("Custom reminder record added successfully");
  } catch (error) {
    console.error("Error recording custom reminder:", error);
  }
}

export default {
  recordReminderAdded,
  recordReminderRemoved,
  recordCustomReminder,
  inferRoleFromReminder,
};
