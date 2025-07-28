export default {
  // Common
  common: {
    menu: "Menu",
    close: "Close",
    open: "Open",
    add: "Add",
    remove: "Remove",
    clear: "Clear",
    random: "Random",
    copy: "Copy",
    join: "Join",
    leave: "Leave",
    host: "Host",
    play: "Play",
    help: "Help",
    settings: "Settings",
  },

  // Intro page
  intro: {
    welcome: "Welcome to the (unofficial)",
    title: "Virtual Town Square and Grimoire",
    subtitle: "Blood on the Clocktower",
    addPlayers: "Please add more players through the",
    menuButton: "Menu",
    orPress: "or by pressing",
    toAddPlayers:
      "to add more players. You can also join a game session by pressing",
    toJoinSession: ".",
    footer:
      'This project is free and open source and can be found on GitHub. It is not affiliated with The Pandemonium Institute. "Blood on the Clocktower" is a trademark of Steven Medway and The Pandemonium Institute.',
    chineseVersion: "Do you want to use the Chinese version of the Grimoire?",
  },

  // Town info
  townInfo: {
    addMorePlayers: "Please add more players!",
    players: "players",
    alive: "alive",
    votes: "votes",
    townsfolk: "townsfolk",
    outsider: "outsider",
    minion: "minion",
    demon: "demon",
    traveler: "traveler",
    nightPhase: "Night phase",
  },

  // Town square
  townSquare: {
    demonBluffs: "Demon bluffs",
    otherCharacters: "Other characters",
    fabled: "Fabled",
  },

  // Menu
  menu: {
    grimoire: "Grimoire",
    session: "Session",
    players: "Players",
    characters: "Characters",
    help: "Help",

    // Grimoire menu
    hide: "Hide",
    show: "Show",
    switchToNight: "Switch to Night",
    switchToDay: "Switch to Day",
    nightOrder: "Night order",
    zoom: "Zoom",
    backgroundImage: "Background image",
    showCustomImages: "Show Custom Images",
    customImagesAvailable: "(enabled)",
    disableAnimations: "Disable Animations",
    muteSounds: "Mute Sounds",

    // Session menu
    hosting: "Hosting",
    playing: "Playing",
    liveSession: "Live Session",
    hostStoryteller: "Host (Storyteller)",
    joinPlayer: "Join (Player)",
    delayToHost: "Delay to host",
    delayToPlayers: "Delay to players",
    copyPlayerLink: "Copy player link",
    sendCharacters: "Send Characters",
    voteHistory: "Vote history",
    gameHistory: "Game History",
    leaveSession: "Leave Session",

    // Players menu
    addPlayer: "Add",
    randomizeSeatings: "Randomize",
    removeAll: "Remove all",

    // Characters menu
    selectEdition: "Select Edition",
    chooseAndAssign: "Choose & Assign",
    addFabled: "Add Fabled",
    removeAllRoles: "Remove all",

    // Help menu
    referenceSheet: "Reference Sheet",
    nightOrderSheet: "Night Order Sheet",
    gameStateJSON: "Game State JSON",
    joinDiscord: "Join Discord",
    sourceCode: "Source code",
  },

  // Vote
  vote: {
    nomination: "Nomination",
    vote: "Vote",
    yes: "Yes",
    no: "No",
    abstain: "Abstain",
    nominated: "nominated",
    inFavor: "in favor",
    majority: "majority is",
    timePerPlayer: "Time per player:",
    countdown: "Countdown",
    start: "Start",
    restart: "Restart",
    pause: "Pause",
    resume: "Resume",
    reset: "Reset",
    close: "Close",
    markForExecution: "Mark for execution",
    clearMark: "Clear mark",
    handDown: "Hand DOWN",
    handUp: "Hand UP",
    pleaseClaimSeat: "Please claim a seat to vote.",
    secondsBetweenVotes: "seconds between votes",
    go: "GO",
  },

  // Role types
  roles: {
    townsfolk: "Townsfolk",
    outsider: "Outsider",
    minion: "Minion",
    demon: "Demon",
    traveler: "Traveler",
    fabled: "Fabled",
  },

  // Game state
  gameState: {
    day: "Day",
    night: "Night",
    alive: "Alive",
    dead: "Dead",
    poisoned: "Poisoned",
    drunk: "Drunk",
  },

  // Role selection
  roleSelection: {
    selectCharacters: "Select the characters for {count} players:",
    warningSetupRoles:
      "Warning: there are characters selected that modify the game setup! The randomizer does not account for these characters.",
    allowDuplicateCharacters: "Allow duplicate characters",
    assignCharactersRandomly: "Assign {count} characters randomly",
    shuffleCharacters: "Shuffle characters",
    loadingRoles: "Loading roles...",
  },

  // Confirm dialogs
  confirm: {
    leaveActiveGame: "Are you sure you want to leave the active live game?",
    randomizeSeatings: "Are you sure you want to randomize seatings?",
    removeAllPlayers: "Are you sure you want to remove all players?",
    removeAllRoles: "Are you sure you want to remove all player roles?",
  },

  // Prompts
  prompts: {
    enterBackgroundUrl: "Enter custom background URL",
    enterSessionName: "Enter a channel number / name for your session",
    distributeCharacters:
      "Do you want to distribute assigned characters to all SEATED players?",
    allowCustomImages:
      "Are you sure you want to allow custom images? A malicious script file author might track your IP address this way.",
    enterJoinSession:
      "Enter the channel number / name of the session you want to join",
    confirmRemovePlayer: "Do you really want to remove {name}?",
    playerName: "Player name",
  },

  // Tooltips
  tooltips: {
    handUp: "Hand UP",
    handDown: "Hand DOWN",
    cancel: "Cancel",
    swapSeats: "Swap seats with this player",
    movePlayer: "Move player to this seat",
    nominatePlayer: "Nominate this player",
    ghostVote: "Ghost vote",
    clearVoteHistory: "Clear vote history",
    showNightOrder: "Show Night Order",
    showCharacterReference: "Show Character Reference",
  },

  // Vote history
  voteHistory: {
    title: "Vote history",
    accessibleToPlayers: "Accessible to players",
    clearForEveryone: "Clear for everyone",
    time: "Time",
    nominator: "Nominator",
    nominee: "Nominee",
    type: "Type",
    votes: "Votes",
    majority: "Majority",
    voters: "Voters",
  },

  // Night order
  nightOrder: {
    title: "Night Order",
    firstNight: "First Night",
    otherNights: "Other Nights",
    customScript: "Custom Script",
    minionInfo: "Minion info",
    demonInfo: "Demon info & bluffs",
  },

  // Character reference
  reference: {
    title: "Character Reference",
  },

  // Game state
  gameStateModal: {
    title: "Current Game State",
    copyJson: "Copy JSON",
    loadState: "Load State",
    unableToParseJson: "Unable to parse JSON: ",
  },

  // Reminder
  reminder: {
    good: "Good",
    evil: "Evil",
    custom: "Custom note",
    chooseReminder: "Choose a reminder token:",
    addCustomReminder: "Add a custom reminder note",
  },

  // Player
  player: {
    pronouns: "Player pronouns",
  },

  // Vote history summary
  voteHistorySummary: {
    recent: "recent",
    nomination: "nomination",
    nominations: "nominations",
  },

  // Edition selection
  edition: {
    customScript: "Custom Script / Characters",
    loadCustomScript: "Load custom script / characters",
    customScriptDescription:
      'To play with a custom script, you need to select the characters you want to play with in the official Script Tool and then upload the generated "custom-list.json" either directly here or provide a URL to such a hosted JSON file.',
    customCharactersDescription:
      "To play with custom characters, please read the documentation on how to write a custom character definition file.",
    onlyLoadTrusted: "Only load custom JSON files from sources that you trust!",
    popularScripts: "Some popular custom scripts:",
    uploadJson: "Upload JSON",
    enterUrl: "Enter URL",
    useJsonFromClipboard: "Use JSON from Clipboard",
    back: "Back",
    enterUrlPrompt: "Enter URL to a custom-script.json file",
    errorReadingScript: "Error reading custom script: ",
    errorLoadingScript: "Error loading custom script: ",
    enableCustomImages: "Custom images automatically enabled",
  },

  // Language switch
  language: {
    switch: "Language / 语言",
    chinese: "中文",
    english: "English",
  },

  // History
  history: {
    title: "Game History",
    allPhases: "All Phases",
    night: "Night",
    day: "Day",
    allActions: "All Actions",
    wakeUp: "Wake Up",
    vote: "Vote",
    execution: "Execution",
    roleAssignment: "Role Assignment",
    details: "Details",
    note: "Note",
    addNote: "Add Note",
    editNote: "Edit Note",
    public: "Public",
    noEvents: "No history events",
    addCustomEvent: "Add Custom Event",
    summary: "Summary",
    isPublic: "Public Event",
    save: "Save",
    cancel: "Cancel",
    confirmUndo: "Confirm undo last action?",
  },
};
