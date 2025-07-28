export default {
  // 通用
  common: {
    menu: "菜单",
    close: "关闭",
    open: "打开",
    add: "添加",
    remove: "移除",
    clear: "清除",
    random: "随机",
    copy: "复制",
    join: "加入",
    leave: "离开",
    host: "主持",
    play: "游戏",
    help: "帮助",
    settings: "设置",
  },

  // 欢迎页面
  intro: {
    welcome: "欢迎使用（非官方）",
    title: "虚拟城镇广场和魔典",
    subtitle: "血染钟楼",
    addPlayers: "请通过右上角的",
    menuButton: "菜单",
    orPress: "或按",
    toAddPlayers: "来添加更多玩家。您也可以按",
    toJoinSession: "加入游戏会话。",
    footer:
      '本项目免费开源，可在GitHub上找到。与The Pandemonium Institute无关联。"血染钟楼"是Steven Medway和The Pandemonium Institute的商标。',
    chineseVersion: "你想使用中文版魔典吗？",
  },

  // 城镇信息
  townInfo: {
    addMorePlayers: "请添加更多玩家！",
    players: "玩家",
    alive: "存活",
    votes: "投票",
    townsfolk: "镇民",
    outsider: "外来者",
    minion: "爪牙",
    demon: "恶魔",
    traveler: "旅行者",
    nightPhase: "夜晚阶段",
  },

  // 城镇广场
  townSquare: {
    demonBluffs: "恶魔伪装",
    otherCharacters: "其他角色",
    fabled: "寓言",
  },

  // 菜单
  menu: {
    grimoire: "魔典",
    session: "会话",
    players: "玩家",
    characters: "角色",
    help: "帮助",

    // 魔典菜单
    hide: "隐藏",
    show: "显示",
    switchToNight: "切换到夜晚",
    switchToDay: "切换到白天",
    nightOrder: "夜晚顺序",
    zoom: "缩放",
    backgroundImage: "背景图片",
    showCustomImages: "显示自定义图片",
    customImagesAvailable: "（已启用）",
    disableAnimations: "禁用动画",
    muteSounds: "静音",

    // 会话菜单
    hosting: "主持中",
    playing: "游戏中",
    liveSession: "实时会话",
    hostStoryteller: "说书人",
    joinPlayer: "加入（玩家）",
    delayToHost: "到说书人的延迟",
    delayToPlayers: "到玩家的延迟",
    copyPlayerLink: "复制玩家链接",
    sendCharacters: "发送角色",
    voteHistory: "投票历史",
    gameHistory: "游戏历史",
    leaveSession: "离开会话",

    // 玩家菜单
    addPlayer: "添加",
    randomizeSeatings: "随机座位",
    removeAll: "移除所有",

    // 角色菜单
    selectEdition: "选择版本",
    chooseAndAssign: "选择并分配",
    addFabled: "添加寓言",
    removeAllRoles: "移除所有角色",

    // 帮助菜单
    referenceSheet: "参考表",
    nightOrderSheet: "夜晚顺序表",
    gameStateJSON: "游戏状态JSON",
    joinDiscord: "加入Discord",
    sourceCode: "源代码",
  },

  // 投票
  vote: {
    nomination: "提名",
    vote: "投票",
    yes: "是",
    no: "否",
    abstain: "弃权",
    nominated: "提名了",
    inFavor: "赞成",
    majority: "多数票",
    timePerPlayer: "每人时间",
    countdown: "倒计时",
    start: "开始",
    restart: "重新开始",
    pause: "暂停",
    resume: "继续",
    reset: "重置",
    close: "关闭",
    markForExecution: "标记处决",
    clearMark: "清除标记",
    handDown: "手放下",
    handUp: "手举起",
    pleaseClaimSeat: "请认领座位来投票",
    secondsBetweenVotes: "秒间隔投票",
    go: "开始",
  },

  // 角色类型
  roles: {
    townsfolk: "镇民",
    outsider: "外来者",
    minion: "爪牙",
    demon: "恶魔",
    traveler: "旅行者",
    fabled: "传奇角色",
  },

  // 游戏状态
  gameState: {
    day: "白天",
    night: "夜晚",
    alive: "存活",
    dead: "死亡",
    poisoned: "中毒",
    drunk: "醉酒",
  },

  // 角色选择
  roleSelection: {
    selectCharacters: "为 {count} 名玩家选择角色：",
    warningSetupRoles:
      "警告：已选择修改游戏设置的角色！随机生成器不会考虑这些角色。",
    allowDuplicateCharacters: "允许重复角色",
    assignCharactersRandomly: "随机分配 {count} 个角色",
    shuffleCharacters: "洗牌角色",
    loadingRoles: "正在加载角色...",
  },

  // 确认对话框
  confirm: {
    leaveActiveGame: "您确定要离开当前活跃的游戏吗？",
    randomizeSeatings: "您确定要随机化座位吗？",
    removeAllPlayers: "您确定要移除所有玩家吗？",
    removeAllRoles: "您确定要移除所有玩家角色吗？",
  },

  // 提示文本
  prompts: {
    enterBackgroundUrl: "请输入自定义背景图片URL",
    enterSessionName: "请输入您的会话频道号/名称",
    distributeCharacters: "您想要向所有就座的玩家分发分配的角色吗？",
    allowCustomImages:
      "您确定要允许自定义图片吗？恶意脚本文件作者可能会通过这种方式跟踪您的IP地址。",
    enterJoinSession: "请输入您要加入的会话频道号/名称",
    confirmRemovePlayer: "您确定要移除 {name} 吗？",
    playerName: "玩家姓名",
  },

  // 工具提示
  tooltips: {
    handUp: "举手",
    handDown: "手放下",
    cancel: "取消",
    swapSeats: "与此玩家交换座位",
    movePlayer: "将玩家移动到此座位",
    nominatePlayer: "提名此玩家",
    ghostVote: "幽灵投票",
    clearVoteHistory: "清除投票历史",
    showNightOrder: "显示夜晚顺序",
    showCharacterReference: "显示角色参考",
  },

  // 投票历史
  voteHistory: {
    title: "投票历史",
    accessibleToPlayers: "对玩家可见",
    clearForEveryone: "为所有人清除",
    time: "时间",
    nominator: "提名者",
    nominee: "被提名者",
    type: "类型",
    votes: "投票",
    majority: "多数票",
    voters: "投票者",
  },

  // 夜晚顺序
  nightOrder: {
    title: "夜晚顺序",
    firstNight: "第一夜",
    otherNights: "其他夜晚",
    customScript: "自定义剧本",
    minionInfo: "爪牙信息",
    demonInfo: "恶魔信息与伪装",
  },

  // 角色参考
  reference: {
    title: "角色参考",
  },

  // 游戏状态
  gameStateModal: {
    title: "当前游戏状态",
    copyJson: "复制JSON",
    loadState: "加载状态",
    unableToParseJson: "无法解析JSON：",
  },

  // 提醒
  reminder: {
    good: "善良",
    evil: "邪恶",
    custom: "自定义备注",
    chooseReminder: "选择提醒标记：",
    addCustomReminder: "添加自定义提醒备注",
  },

  // 玩家
  player: {
    pronouns: "玩家代词",
  },

  // 投票历史
  voteHistorySummary: {
    recent: "最近的",
    nomination: "提名",
    nominations: "提名",
  },

  // 版本选择
  edition: {
    customScript: "自定义剧本/角色",
    loadCustomScript: "加载自定义剧本/角色",
    customScriptDescription:
      '要使用自定义剧本，您需要在官方脚本工具中选择想要的角色，然后上传生成的"custom-list.json"文件或提供托管JSON文件的URL。',
    customCharactersDescription:
      "要使用自定义角色，请阅读文档了解如何编写自定义角色定义文件。",
    onlyLoadTrusted: "只加载您信任的来源的自定义JSON文件！",
    popularScripts: "一些流行的自定义剧本：",
    uploadJson: "上传JSON",
    enterUrl: "输入URL",
    useJsonFromClipboard: "使用剪贴板中的JSON",
    back: "返回",
    enterUrlPrompt: "输入自定义剧本JSON文件的URL",
    errorReadingScript: "读取自定义剧本时出错：",
    errorLoadingScript: "加载自定义剧本时出错：",
    enableCustomImages: "已自动启用自定义图片",
  },

  // 语言切换
  language: {
    switch: "语言 / Language",
    chinese: "中文",
    english: "English",
  },

  // 历史记录
  history: {
    title: "游戏历史记录",
    allPhases: "所有阶段",
    night: "夜晚",
    day: "白天",
    allActions: "所有操作",
    wakeUp: "叫醒",
    vote: "投票",
    execution: "处决",
    roleAssignment: "角色分配",
    details: "详情",
    note: "备注",
    addNote: "添加备注",
    editNote: "编辑备注",
    public: "公开",
    noEvents: "暂无历史记录",
    addCustomEvent: "添加自定义事件",
    summary: "摘要",
    isPublic: "公开事件",
    save: "保存",
    cancel: "取消",
    confirmUndo: "确认撤销最后一个操作？",
  },
};
