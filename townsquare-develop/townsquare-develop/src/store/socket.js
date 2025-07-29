class LiveSession {
  constructor(store) {
    this._wss = "wss://live.clocktower.online:8080/";
    // this._wss = "ws://localhost:8081/"; // uncomment if using local server with NODE_ENV=development
    this._socket = null;
    this._isSpectator = true;
    this._gamestate = [];
    this._store = store;
    this._pingInterval = 30 * 1000; // 30 seconds between pings
    this._pingTimer = null;
    this._reconnectTimer = null;
    this._players = {}; // map of players connected to a session
    this._pings = {}; // map of player IDs to ping
    this._isInitializing = true; // 添加初始化标志
    // reconnect to previous session
    if (this._store.state.session.sessionId) {
      this.connect(this._store.state.session.sessionId);
    }
  }

  /**
   * Open a new session for the passed channel.
   * @param channel
   * @private
   */
  _open(channel) {
    this.disconnect();
    this._socket = new WebSocket(
      this._wss +
        channel +
        "/" +
        (this._isSpectator ? this._store.state.session.playerId : "host"),
    );
    this._socket.addEventListener("message", this._handleMessage.bind(this));
    this._socket.onopen = this._onOpen.bind(this);
    this._socket.onclose = (err) => {
      this._socket = null;
      clearInterval(this._pingTimer);
      this._pingTimer = null;
      if (err.code !== 1000) {
        // connection interrupted, reconnect after 3 seconds
        this._store.commit("session/setReconnecting", true);
        this._reconnectTimer = setTimeout(
          () => this.connect(channel),
          3 * 1000,
        );
      } else {
        this._store.commit("session/setSessionId", "");
        if (err.reason) alert(err.reason);
      }
    };
  }

  /**
   * Send a message through the socket.
   * @param command
   * @param params
   * @private
   */
  _send(command, params) {
    if (this._socket && this._socket.readyState === 1) {
      this._socket.send(JSON.stringify([command, params]));
    }
  }

  /**
   * Send a message directly to a single playerId, if provided.
   * Otherwise broadcast it.
   * @param playerId player ID or "host", optional
   * @param command
   * @param params
   * @private
   */
  _sendDirect(playerId, command, params) {
    if (playerId) {
      this._send("direct", { [playerId]: [command, params] });
    } else {
      this._send(command, params);
    }
  }

  /**
   * Open event handler for socket.
   * @private
   */
  _onOpen() {
    if (this._isSpectator) {
      this._sendDirect(
        "host",
        "getGamestate",
        this._store.state.session.playerId,
      );
    } else {
      // 说书人连接时只发送基本信息，不包含角色信息
      this.sendGamestate("", false, false);
    }
    this._isInitializing = false; // 设置初始化完成
    this._ping();
  }

  /**
   * Send a ping message with player ID and ST flag.
   * @private
   */
  _ping() {
    this._handlePing();
    this._send("ping", [
      this._isSpectator
        ? this._store.state.session.playerId
        : Object.keys(this._players).length,
      "latency",
    ]);
    clearTimeout(this._pingTimer);
    this._pingTimer = setTimeout(this._ping.bind(this), this._pingInterval);
  }

  /**
   * Handle an incoming socket message.
   * @param data
   * @private
   */
  _handleMessage({ data }) {
    let command, params;
    try {
      [command, params] = JSON.parse(data);
      console.log("收到socket消息:", command, params);
    } catch (err) {
      console.log("unsupported socket message", data);
    }
    switch (command) {
      case "getGamestate":
        // 玩家请求游戏状态时，不包含角色信息
        this.sendGamestate(params, false, false);
        break;
      case "edition":
        this._updateEdition(params);
        break;
      case "fabled":
        this._updateFabled(params);
        break;
      case "gs":
        this._updateGamestate(params);
        break;
      case "player":
        this._updatePlayer(params);
        break;
      case "claim":
        this._updateSeat(params);
        break;
      case "ping":
        this._handlePing(params);
        break;
      case "nomination":
        if (!this._isSpectator) return;
        if (!params) {
          // create vote history record
          this._store.commit(
            "session/addHistory",
            this._store.state.players.players,
          );
        }
        this._store.commit("session/nomination", { nomination: params });
        break;
      case "swap":
        if (!this._isSpectator) return;
        this._store.commit("players/swap", params);
        break;
      case "move":
        if (!this._isSpectator) return;
        this._store.commit("players/move", params);
        break;
      case "remove":
        if (!this._isSpectator) return;
        this._store.commit("players/remove", params);
        break;
      case "marked":
        if (!this._isSpectator) return;
        this._store.commit("session/setMarkedPlayer", params);
        break;
      case "isNight":
        if (!this._isSpectator) return;
        this._store.commit("toggleNight", params);
        break;
      case "isVoteHistoryAllowed":
        if (!this._isSpectator) return;
        this._store.commit("session/setVoteHistoryAllowed", params);
        this._store.commit("session/clearVoteHistory");
        break;
      case "votingSpeed":
        if (!this._isSpectator) return;
        this._store.commit("session/setVotingSpeed", params);
        break;
      case "clearVoteHistory":
        if (!this._isSpectator) return;
        this._store.commit("session/clearVoteHistory");
        break;
      case "isVoteInProgress":
        if (!this._isSpectator) return;
        this._store.commit("session/setVoteInProgress", params);
        break;
      case "vote":
        this._handleVote(params);
        break;
      case "lock":
        this._handleLock(params);
        break;
      case "bye":
        this._handleBye(params);
        break;
      case "pronouns":
        this._updatePlayerPronouns(params);
        break;
      case "reset":
        console.log("收到重置消息:", params);
        console.log("当前是否为说书人:", this._isSpectator);
        this._handleReset(params);
        break;
      default:
        console.log("未处理的消息类型:", command);
        break;
    }
  }

  /**
   * Connect to a new live session, either as host or spectator.
   * Set a unique playerId if there isn't one yet.
   * @param channel
   */
  connect(channel) {
    if (!this._store.state.session.playerId) {
      this._store.commit(
        "session/setPlayerId",
        Math.random().toString(36).substr(2),
      );
    }
    this._pings = {};
    this._store.commit("session/setPlayerCount", 0);
    this._store.commit("session/setPing", 0);
    this._isSpectator = this._store.state.session.isSpectator;
    this._open(channel);
  }

  /**
   * Close the current session, if any.
   */
  disconnect() {
    this._pings = {};
    this._store.commit("session/setPlayerCount", 0);
    this._store.commit("session/setPing", 0);
    this._store.commit("session/setReconnecting", false);
    clearTimeout(this._reconnectTimer);
    if (this._socket) {
      if (this._isSpectator) {
        this._sendDirect("host", "bye", this._store.state.session.playerId);
      }
      this._socket.close(1000);
      this._socket = null;
    }
  }

  /**
   * Publish the current gamestate.
   * Optional param to reduce traffic. (send only player data)
   * @param playerId
   * @param isLightweight
   */
  sendGamestate(playerId = "", isLightweight = false, includeRoles = false) {
    if (this._isSpectator) return;

    console.log("=== sendGamestate 被调用 ===");
    console.log("playerId:", playerId);
    console.log("isLightweight:", isLightweight);
    console.log("includeRoles:", includeRoles);

    // 检查目标玩家是否为玩家模式
    let isTargetPlayerMode = false;
    let targetPlayer = null;
    if (playerId) {
      targetPlayer = this._store.state.players.players.find(
        (p) => p.id === playerId,
      );
      // 如果目标玩家有ID但没有角色，说明是玩家模式
      isTargetPlayerMode =
        targetPlayer && targetPlayer.id && !targetPlayer.role.id;
    }

    this._gamestate = this._store.state.players.players.map((player) => {
      // 只向对应玩家发送角色信息
      const isTargetPlayer = playerId && player.id === playerId;
      const hasRole =
        includeRoles &&
        player.role &&
        player.role.id &&
        !isTargetPlayerMode &&
        (isTargetPlayer || !playerId); // 如果是广播或目标玩家才发送角色

      console.log(`玩家 ${player.name}:`, {
        hasRole: hasRole,
        roleId: player.role?.id,
        roleTeam: player.role?.team,
        isTargetPlayerMode: isTargetPlayerMode,
        isTargetPlayer: isTargetPlayer,
        playerId: playerId,
      });

      return {
        name: player.name,
        id: player.id,
        isDead: player.isDead,
        isVoteless: player.isVoteless,
        pronouns: player.pronouns,
        // 只向对应玩家发送角色信息
        ...(hasRole ? { roleId: player.role.id } : {}),
      };
    });

    console.log("生成的gamestate:", this._gamestate);

    if (isLightweight) {
      this._sendDirect(playerId, "gs", {
        gamestate: this._gamestate,
        isLightweight,
      });
    } else {
      const { session, grimoire } = this._store.state;
      const { fabled, bluffs } = this._store.state.players;

      // 检查目标玩家是否为恶魔
      let shouldSendBluffs = false;
      if (playerId && targetPlayer) {
        shouldSendBluffs =
          targetPlayer.role && targetPlayer.role.team === "demon";
      } else {
        // 如果没有指定playerId，说明是广播给所有玩家
        // 在这种情况下，所有玩家都会收到，但只有恶魔玩家会处理
        shouldSendBluffs = true;
      }

      this.sendEdition(playerId);
      this._sendDirect(playerId, "gs", {
        gamestate: this._gamestate,
        isNight: grimoire.isNight,
        isVoteHistoryAllowed: session.isVoteHistoryAllowed,
        nomination: session.nomination,
        votingSpeed: session.votingSpeed,
        lockedVote: session.lockedVote,
        isVoteInProgress: session.isVoteInProgress,
        markedPlayer: session.markedPlayer,
        fabled: fabled.map((f) => (f.isCustom ? f : { id: f.id })),
        ...(session.nomination ? { votes: session.votes } : {}),
        // 只向恶魔玩家发送bluffs信息
        ...(shouldSendBluffs ? { bluffs: bluffs } : {}),
      });
    }
  }

  /**
   * Update the gamestate based on incoming data.
   * @param data
   * @private
   */
  _updateGamestate(data) {
    if (!this._isSpectator) return;
    const {
      gamestate,
      isLightweight,
      isNight,
      isVoteHistoryAllowed,
      nomination,
      votingSpeed,
      votes,
      lockedVote,
      isVoteInProgress,
      markedPlayer,
      fabled,
      bluffs,
    } = data;
    const players = this._store.state.players.players;
    // adjust number of players
    if (players.length < gamestate.length) {
      for (let x = players.length; x < gamestate.length; x++) {
        this._store.commit("players/add", gamestate[x].name);
      }
    } else if (players.length > gamestate.length) {
      for (let x = players.length; x > gamestate.length; x--) {
        this._store.commit("players/remove", x - 1);
      }
    }
    // update status for each player
    gamestate.forEach((state, x) => {
      const player = players[x];
      const { roleId } = state;

      console.log(`处理玩家 ${player.name} 的状态:`, {
        hasRoleId: !!roleId,
        roleId: roleId,
        currentRoleId: player.role?.id,
        isCurrentPlayer: player.id === this._store.state.session.playerId,
      });

      // update relevant properties
      ["name", "id", "isDead", "isVoteless", "pronouns"].forEach((property) => {
        const value = state[property];
        if (player[property] !== value) {
          this._store.commit("players/update", { player, property, value });
        }
      });

      // roles are special, because of travelers
      // 只有在明确接收到roleId时才处理角色信息
      if (roleId && player.role.id !== roleId) {
        console.log(`接收到角色信息: ${roleId} for player ${player.name}`);
        const role =
          this._store.state.roles.get(roleId) ||
          this._store.getters.rolesJSONbyId.get(roleId);
        if (role) {
          this._store.commit("players/update", {
            player,
            property: "role",
            value: role,
          });
        }
      } else if (!roleId && player.role.team === "traveler") {
        this._store.commit("players/update", {
          player,
          property: "role",
          value: {},
        });
      }
    });
    if (!isLightweight) {
      this._store.commit("toggleNight", !!isNight);
      this._store.commit(
        "session/setVoteHistoryAllowed",
        !!isVoteHistoryAllowed,
      );
      this._store.commit("session/nomination", {
        nomination: !!nomination,
        votes: votes || [],
        votingSpeed: votingSpeed || 3000,
        lockedVote: lockedVote || 0,
        isVoteInProgress: !!isVoteInProgress,
      });
      this._store.commit("session/setMarkedPlayer", markedPlayer || -1);
      if (fabled) {
        this._store.commit("players/setFabled", { fabled });
      }
      // 处理bluffs信息 - 只有恶魔玩家才会处理
      if (bluffs) {
        // 检查当前玩家是否为恶魔
        const currentPlayer = this._store.state.players.players.find(
          (p) => p.id === this._store.state.session.playerId,
        );
        const isCurrentPlayerDemon =
          currentPlayer &&
          currentPlayer.role &&
          currentPlayer.role.team === "demon";

        if (isCurrentPlayerDemon) {
          console.log("恶魔玩家收到恶魔伪装信息:", bluffs);
          this._store.commit("players/setBluff", { bluffs });
        } else {
          console.log("非恶魔玩家收到bluffs信息，忽略处理");
        }
      }
    }
  }

  /**
   * Publish an edition update. ST only
   * @param playerId
   */
  sendEdition(playerId = "") {
    if (this._isSpectator) return;
    const { edition } = this._store.state;
    let roles;
    if (!edition.isOfficial) {
      roles = this._store.getters.customRolesStripped;
    }
    this._sendDirect(playerId, "edition", {
      edition: edition.isOfficial ? { id: edition.id } : edition,
      ...(roles ? { roles } : {}),
    });
  }

  /**
   * Update edition and roles for custom editions.
   * @param edition
   * @param roles
   * @private
   */
  _updateEdition({ edition, roles }) {
    if (!this._isSpectator) return;
    this._store.commit("setEdition", edition);
    if (roles) {
      this._store.commit("setCustomRoles", roles);
      if (this._store.state.roles.size !== roles.length) {
        const missing = [];
        roles.forEach(({ id }) => {
          if (!this._store.state.roles.get(id)) {
            missing.push(id);
          }
        });
        alert(
          `This session contains custom characters that can't be found. ` +
            `Please load them before joining! ` +
            `Missing roles: ${missing.join(", ")}`,
        );
        this.disconnect();
        this._store.commit("toggleModal", "edition");
      }
    }
  }

  /**
   * Publish a fabled update. ST only
   */
  sendFabled() {
    if (this._isSpectator) return;
    const { fabled } = this._store.state.players;
    this._send(
      "fabled",
      fabled.map((f) => (f.isCustom ? f : { id: f.id })),
    );
  }

  /**
   * Update fabled roles.
   * @param fabled
   * @private
   */
  _updateFabled(fabled) {
    if (!this._isSpectator) return;
    this._store.commit("players/setFabled", {
      fabled: fabled.map((f) => this._store.state.fabled.get(f.id) || f),
    });
  }

  /**
   * Publish a player update.
   * @param player
   * @param property
   * @param value
   */
  sendPlayer({ player, property, value }) {
    console.log("=== sendPlayer 被调用 ===");
    console.log("player:", player.name);
    console.log("property:", property);
    console.log("value:", value);
    console.log("_isSpectator:", this._isSpectator);

    if (this._isSpectator || property === "reminders") return;

    // 角色信息不通过sendPlayer发送，只在distributeRoles时发送
    if (property === "role") {
      console.log("角色信息不通过sendPlayer发送，跳过");
      return;
    }

    const index = this._store.state.players.players.indexOf(player);
    this._send("player", { index, property, value });
  }

  /**
   * Update a player based on incoming data. Player only.
   * @param index
   * @param property
   * @param value
   * @private
   */
  _updatePlayer({ index, property, value }) {
    if (!this._isSpectator) return;
    const player = this._store.state.players.players[index];
    if (!player) return;

    // special case where a player stops being a traveler
    if (property === "role") {
      if (!value && player.role.team === "traveler") {
        // reset to an unknown role
        this._store.commit("players/update", {
          player,
          property: "role",
          value: {},
        });
      } else {
        // load role, first from session, the global, then fail gracefully
        const role =
          this._store.state.roles.get(value) ||
          this._store.getters.rolesJSONbyId.get(value) ||
          {};
        this._store.commit("players/update", {
          player,
          property: "role",
          value: role,
        });
      }
    } else {
      // just update the player otherwise
      this._store.commit("players/update", { player, property, value });
    }
  }

  /**
   * Publish a player pronouns update
   * @param player
   * @param value
   * @param isFromSockets
   */
  sendPlayerPronouns({ player, value, isFromSockets }) {
    //send pronoun only for the seated player or storyteller
    //Do not re-send pronoun data for an update that was recieved from the sockets layer
    if (
      isFromSockets ||
      (this._isSpectator && this._store.state.session.playerId !== player.id)
    )
      return;
    const index = this._store.state.players.players.indexOf(player);
    this._send("pronouns", [index, value]);
  }

  /**
   * Update a pronouns based on incoming data.
   * @param index
   * @param value
   * @private
   */
  _updatePlayerPronouns([index, value]) {
    const player = this._store.state.players.players[index];

    this._store.commit("players/update", {
      player,
      property: "pronouns",
      value,
      isFromSockets: true,
    });
  }

  /**
   * Handle a ping message by another player / storyteller
   * @param playerIdOrCount
   * @param latency
   * @private
   */
  _handlePing([playerIdOrCount = 0, latency] = []) {
    const now = new Date().getTime();
    if (!this._isSpectator) {
      // remove players that haven't sent a ping in twice the timespan
      for (let player in this._players) {
        if (now - this._players[player] > this._pingInterval * 2) {
          delete this._players[player];
          delete this._pings[player];
        }
      }
      // remove claimed seats from players that are no longer connected
      this._store.state.players.players.forEach((player) => {
        if (player.id && !this._players[player.id]) {
          this._store.commit("players/update", {
            player,
            property: "id",
            value: "",
          });
        }
      });
      // store new player data
      if (playerIdOrCount) {
        this._players[playerIdOrCount] = now;
        const ping = parseInt(latency, 10);
        if (ping && ping > 0 && ping < 30 * 1000) {
          // ping to Players
          this._pings[playerIdOrCount] = ping;
          const pings = Object.values(this._pings);
          this._store.commit(
            "session/setPing",
            Math.round(pings.reduce((a, b) => a + b, 0) / pings.length),
          );
        }
      }
    } else if (latency) {
      // ping to ST
      this._store.commit("session/setPing", parseInt(latency, 10));
    }
    // update player count
    if (!this._isSpectator || playerIdOrCount) {
      this._store.commit(
        "session/setPlayerCount",
        this._isSpectator ? playerIdOrCount : Object.keys(this._players).length,
      );
    }
  }

  /**
   * Handle a player leaving the sessions. ST only
   * @param playerId
   * @private
   */
  _handleBye(playerId) {
    if (this._isSpectator) return;
    delete this._players[playerId];
    this._store.commit(
      "session/setPlayerCount",
      Object.keys(this._players).length,
    );
  }

  /**
   * Claim a seat, needs to be confirmed by the Storyteller.
   * Seats already occupied can't be claimed.
   * @param seat either -1 to vacate or the index of the seat claimed
   */
  claimSeat(seat) {
    if (!this._isSpectator) return;

    console.log("claimSeat called:", {
      seat,
      playerId: this._store.state.session.playerId,
    });

    const players = this._store.state.players.players;
    console.log(
      "Available players:",
      players.map((p, i) => ({ index: i, name: p.name, id: p.id })),
    );

    if (players.length > seat && (seat < 0 || !players[seat].id)) {
      console.log(
        `Claiming seat ${seat} for player ${this._store.state.session.playerId}`,
      );
      this._send("claim", [seat, this._store.state.session.playerId]);
    } else {
      console.warn(`Cannot claim seat ${seat}:`, {
        playersLength: players.length,
        seat,
        seatExists: seat < players.length,
        seatOccupied: seat >= 0 ? players[seat]?.id : false,
      });
    }
  }

  /**
   * Update a player id associated with that seat.
   * @param index seat index or -1
   * @param value playerId to add / remove
   * @private
   */
  _updateSeat([index, value]) {
    if (this._isSpectator) return;

    console.log("_updateSeat called:", { index, value });
    console.log("Current players:", this._store.state.players.players);

    const property = "id";
    const players = this._store.state.players.players;

    // remove previous seat
    const oldIndex = players.findIndex(({ id }) => id === value);
    if (oldIndex >= 0 && oldIndex !== index) {
      console.log(`Removing player from seat ${oldIndex}`);
      this._store.commit("players/update", {
        player: players[oldIndex],
        property,
        value: "",
      });
    }

    // add playerId to new seat
    if (index >= 0) {
      const player = players[index];
      if (!player) {
        console.error(`No player at index ${index}`);
        return;
      }
      console.log(`Adding player ${value} to seat ${index} (${player.name})`);
      this._store.commit("players/update", { player, property, value });
    }

    // update player session list as if this was a ping
    this._handlePing([true, value, 0]);

    console.log("Seat update completed");
  }

  /**
   * Distribute player roles to all seated players in a direct message.
   * This will be split server side so that each player only receives their own (sub)message.
   */
  distributeRoles() {
    if (this._isSpectator) return;

    console.log("distributeRoles called");
    console.log("Current players:", this._store.state.players.players);

    const message = {};
    let validPlayers = 0;
    let totalPlayers = 0;

    this._store.state.players.players.forEach((player, index) => {
      totalPlayers++;
      console.log(`Player ${index}:`, {
        name: player.name,
        id: player.id,
        hasRole: !!player.role,
        roleId: player.role?.id,
        roleTeam: player.role?.team,
      });

      if (player.id && player.role && player.role.id) {
        // 只向对应玩家发送角色信息
        message[player.id] = [
          "player",
          { index, property: "role", value: player.role.id },
        ];
        validPlayers++;
        console.log(
          `Added player ${player.name} (${player.id}) with role ${player.role.id}`,
        );
      } else {
        console.warn(`Player ${player.name} cannot receive role:`, {
          hasId: !!player.id,
          hasRole: !!player.role,
          hasRoleId: !!(player.role && player.role.id),
        });
      }
    });

    console.log(
      `Total players: ${totalPlayers}, Valid players: ${validPlayers}`,
    );
    console.log("Message to send:", message);

    if (Object.keys(message).length) {
      // 向每个玩家发送只包含自己角色的游戏状态
      Object.keys(message).forEach((playerId) => {
        this.sendGamestate(playerId, false, true);
      });
      this._send("direct", message);
      console.log("Roles distributed successfully");
    } else {
      console.error("No valid players to distribute roles to!");
      console.error("Requirements: player.id && player.role && player.role.id");
    }
  }

  /**
   * A player nomination. ST only
   * This also syncs the voting speed to the players.
   * Payload can be an object with {nomination} property or just the nomination itself, or undefined.
   * @param payload [nominator, nominee]|{nomination}
   */
  nomination(payload) {
    if (this._isSpectator) return;
    const nomination = payload ? payload.nomination || payload : payload;
    const players = this._store.state.players.players;
    if (
      !nomination ||
      (players.length > nomination[0] && players.length > nomination[1])
    ) {
      this.setVotingSpeed(this._store.state.session.votingSpeed);
      this._send("nomination", nomination);
    }
  }

  /**
   * Set the isVoteInProgress status. ST only
   */
  setVoteInProgress() {
    if (this._isSpectator) return;
    this._send("isVoteInProgress", this._store.state.session.isVoteInProgress);
  }

  /**
   * Send the isNight status. ST only
   */
  setIsNight() {
    if (this._isSpectator) return;
    this._send("isNight", this._store.state.grimoire.isNight);
  }

  /**
   * Send the isVoteHistoryAllowed state. ST only
   */
  setVoteHistoryAllowed() {
    if (this._isSpectator) return;
    this._send(
      "isVoteHistoryAllowed",
      this._store.state.session.isVoteHistoryAllowed,
    );
  }

  /**
   * Send the voting speed. ST only
   * @param votingSpeed voting speed in seconds, minimum 1
   */
  setVotingSpeed(votingSpeed) {
    if (this._isSpectator) return;
    if (votingSpeed) {
      this._send("votingSpeed", votingSpeed);
    }
  }

  /**
   * Set which player is on the block. ST only
   * @param playerIndex, player id or -1 for empty
   */
  setMarked(playerIndex) {
    if (this._isSpectator) return;
    this._send("marked", playerIndex);
  }

  /**
   * Clear the vote history for everyone. ST only
   */
  clearVoteHistory() {
    if (this._isSpectator) return;
    this._send("clearVoteHistory");
  }

  /**
   * Send a vote. Player or ST
   * @param index Seat of the player
   * @param sync Flag whether to sync this vote with others or not
   */
  vote([index]) {
    const player = this._store.state.players.players[index];
    if (
      this._store.state.session.playerId === player.id ||
      !this._isSpectator
    ) {
      // send vote only if it is your own vote or you are the storyteller
      this._send("vote", [
        index,
        this._store.state.session.votes[index],
        !this._isSpectator,
      ]);
    }
  }

  /**
   * Handle an incoming vote, but only if it is from ST or unlocked.
   * @param index
   * @param vote
   * @param fromST
   */
  _handleVote([index, vote, fromST]) {
    const { session, players } = this._store.state;
    const playerCount = players.players.length;
    const indexAdjusted =
      (index - 1 + playerCount - session.nomination[1]) % playerCount;
    if (fromST || indexAdjusted >= session.lockedVote - 1) {
      this._store.commit("session/vote", [index, vote]);
    }
  }

  /**
   * Lock a vote. ST only
   */
  lockVote() {
    if (this._isSpectator) return;
    const { lockedVote, votes, nomination } = this._store.state.session;
    const { players } = this._store.state.players;
    const index = (nomination[1] + lockedVote - 1) % players.length;
    this._send("lock", [this._store.state.session.lockedVote, votes[index]]);
  }

  /**
   * Update vote lock and the locked vote, if it differs. Player only
   * @param lock
   * @param vote
   * @private
   */
  _handleLock([lock, vote]) {
    if (!this._isSpectator) return;
    this._store.commit("session/lockVote", lock);
    if (lock > 1) {
      const { lockedVote, nomination } = this._store.state.session;
      const { players } = this._store.state.players;
      const index = (nomination[1] + lockedVote - 1) % players.length;
      if (this._store.state.session.votes[index] !== vote) {
        this._store.commit("session/vote", [index, vote]);
      }
    }
  }

  /**
   * Swap two player seats. ST only
   * @param payload
   */
  swapPlayer(payload) {
    if (this._isSpectator) return;
    this._send("swap", payload);
  }

  /**
   * Move a player to another seat. ST only
   * @param payload
   */
  movePlayer(payload) {
    if (this._isSpectator) return;
    this._send("move", payload);
  }

  /**
   * Remove a player. ST only
   * @param payload
   */
  removePlayer(payload) {
    if (this._isSpectator) return;
    this._send("remove", payload);
  }

  /**
   * Send reset message to all players
   * @param resetType "all" for storyteller reset, "player" for player reset
   */
  sendReset(resetType = "all", options = null) {
    console.log("发送重置消息:", resetType, options);
    if (this._socket && this._socket.readyState === 1) {
      const message = JSON.stringify(["reset", { type: resetType, options }]);
      this._socket.send(message);
      console.log("重置消息已发送");
    } else {
      console.log("Socket未连接，无法发送重置消息");
    }
  }

  /**
   * Handle reset message from storyteller
   * @param params reset parameters
   */
  _handleReset(params) {
    console.log("处理重置消息:", params);
    const { type, options = {} } = params;

    if (type === "all") {
      // 说书人重置所有玩家，按options执行
      console.log("执行说书人重置，选项:", options);
      const players = this._store.state.players.players;

      if (options.roles) {
        players.forEach((player) => {
          this._store.commit("players/update", {
            player,
            property: "role",
            value: { id: null, name: null },
          });
        });
      }
      if (options.bluffs) {
        this._store.commit("players/setBluff", {});
      }
      if (options.reminders) {
        players.forEach((player) => {
          this._store.commit("players/update", {
            player,
            property: "reminders",
            value: [],
          });
        });
      }
      if (options.deathStatus) {
        players.forEach((player) => {
          this._store.commit("players/update", {
            player,
            property: "isDead",
            value: false,
          });
        });
      }
      if (options.nominationStatus) {
        players.forEach((player) => {
          this._store.commit("players/update", {
            player,
            property: "isNominated",
            value: false,
          });
        });
      }
      if (options.aliveStatus) {
        players.forEach((player) => {
          this._store.commit("players/update", {
            player,
            property: "isDead",
            value: false,
          });
        });
      }
      if (options.gameHistory) {
        this._store.commit("clearHistory");
      }
      if (options.voteHistory) {
        this._store.commit("session/clearVoteHistory");
      }
      if (options.roundInfo) {
        // 可补充轮次重置逻辑
      }
      if (options.voteSettings) {
        this._store.commit("session/clearVoteHistory");
      }
      if (options.nightSettings) {
        this._store.commit("toggleNight", false);
      }
      if (options.markerSettings) {
        this._store.commit("session/setMarkedPlayer", -1);
      }
      if (options.seatOccupation) {
        // 可补充座位占用重置逻辑
      }
      if (options.playerIds) {
        // 可补充玩家ID重置逻辑
      }
      console.log("说书人重置所有玩家完成");
    } else if (type === "player") {
      // 玩家重置本地所有玩家数据（不发送网络消息）
      console.log("执行玩家本地重置所有玩家数据");

      // 重置所有玩家
      const players = this._store.state.players.players;
      players.forEach((player) => {
        this._store.commit("players/update", {
          player,
          property: "role",
          value: { id: null, name: null },
        });
        this._store.commit("players/update", {
          player,
          property: "reminders",
          value: [],
        });
        this._store.commit("players/update", {
          player,
          property: "isDead",
          value: false,
        });
        this._store.commit("players/update", {
          player,
          property: "isNominated",
          value: false,
        });
      });

      // 重置恶魔伪装
      this._store.commit("players/setBluff", {});

      // 重置游戏历史
      this._store.commit("clearHistory");

      // 重置投票相关状态
      this._store.commit("session/clearVoteHistory");
      this._store.commit("session/nomination", {
        nomination: false,
        votes: [],
        votingSpeed: 3000,
        lockedVote: 0,
        isVoteInProgress: false,
      });
      this._store.commit("session/setMarkedPlayer", -1);

      console.log("玩家本地重置所有玩家数据完成");
    }
  }
}

export default (store) => {
  // setup
  const session = new LiveSession(store);

  // 将socket实例暴露到store的state中
  store.state.socket = session;

  // listen to mutations
  store.subscribe(({ type, payload }, state) => {
    switch (type) {
      case "session/setSessionId":
        if (state.session.sessionId) {
          session.connect(state.session.sessionId);
        } else {
          window.location.hash = "";
          session.disconnect();
        }
        break;
      case "session/claimSeat":
        session.claimSeat(payload);
        break;
      case "session/distributeRoles":
        if (payload) {
          session.distributeRoles();
        }
        break;
      case "session/nomination":
      case "session/setNomination":
        session.nomination(payload);
        break;
      case "session/setVoteInProgress":
        session.setVoteInProgress(payload);
        break;
      case "session/voteSync":
        session.vote(payload);
        break;
      case "session/lockVote":
        session.lockVote();
        break;
      case "session/setVotingSpeed":
        session.setVotingSpeed(payload);
        break;
      case "session/clearVoteHistory":
        session.clearVoteHistory();
        break;
      case "session/setVoteHistoryAllowed":
        session.setVoteHistoryAllowed();
        break;
      case "toggleNight":
        session.setIsNight();
        break;
      case "setEdition":
        session.sendEdition();
        break;
      case "players/setFabled":
        session.sendFabled();
        break;
      case "session/setMarkedPlayer":
        session.setMarked(payload);
        break;
      case "players/swap":
        session.swapPlayer(payload);
        break;
      case "players/move":
        session.movePlayer(payload);
        break;
      case "players/remove":
        session.removePlayer(payload);
        break;
      case "players/set":
      case "players/clear":
      case "players/add":
        // 只有在socket连接建立且不在初始化阶段时才发送游戏状态
        if (
          session._socket &&
          session._socket.readyState === 1 &&
          !session._isInitializing
        ) {
          session.sendGamestate("", true);
        }
        break;
      case "players/update":
        if (payload.property === "pronouns") {
          session.sendPlayerPronouns(payload);
        } else if (payload.property === "role") {
          // 角色更新不自动发送，只在distributeRoles时发送
          console.log("角色更新，但不自动发送:", payload);
        } else {
          session.sendPlayer(payload);
        }
        break;
    }
  });

  // check for session Id in hash
  const sessionId = window.location.hash.substr(1);
  if (sessionId) {
    store.commit("session/setSpectator", true);
    store.commit("session/setSessionId", sessionId);
    store.commit("toggleGrimoire", false);
  }
};
