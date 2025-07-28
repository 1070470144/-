const http = require("http");
const WebSocket = require("ws");
const client = require("prom-client");

// 强制设置为开发环境
process.env.NODE_ENV = "development";

// Create a Registry which registers the metrics
const register = new client.Registry();
// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "clocktower-online",
});

const PING_INTERVAL = 30000; // 30 seconds

// Development: HTTP without SSL
const server = http.createServer();
const wss = new WebSocket.Server({
  port: 8081,
  verifyClient: (info) =>
    info.origin &&
    !!info.origin.match(
      /^https?:\/\/([^.]+\.github\.io|localhost|clocktower\.online|eddbra1nprivatetownsquare\.xyz)/i,
    ),
});

console.log("开发模式：WebSocket服务器运行在端口8081");
console.log("环境变量 NODE_ENV:", process.env.NODE_ENV);

function noop() {}

// calculate latency on heartbeat
function heartbeat() {
  this.latency = Math.round((new Date().getTime() - this.pingStart) / 2);
  this.counter = 0;
  this.isAlive = true;
}

// map of channels currently in use
const channels = {};

// metrics
const metrics = {
  players_concurrent: new client.Gauge({
    name: "players_concurrent",
    help: "Concurrent Players",
    collect() {
      this.set(wss.clients.size);
    },
  }),
  channels_concurrent: new client.Gauge({
    name: "channels_concurrent",
    help: "Concurrent Channels",
    collect() {
      this.set(Object.keys(channels).length);
    },
  }),
  channels_list: new client.Gauge({
    name: "channel_players",
    help: "Players in each channel",
    labelNames: ["name"],
    collect() {
      for (let channel in channels) {
        this.set(
          { name: channel },
          channels[channel].filter(
            (ws) =>
              ws &&
              (ws.readyState === WebSocket.OPEN ||
                ws.readyState === WebSocket.CONNECTING),
          ).length,
        );
      }
    },
  }),
  messages_incoming: new client.Counter({
    name: "messages_incoming",
    help: "Incoming messages",
  }),
  messages_outgoing: new client.Counter({
    name: "messages_outgoing",
    help: "Outgoing messages",
  }),
  connection_terminated_host: new client.Counter({
    name: "connection_terminated_host",
    help: "Terminated connection due to host already present",
  }),
  connection_terminated_spam: new client.Counter({
    name: "connection_terminated_spam",
    help: "Terminated connection due to message spam",
  }),
  connection_terminated_timeout: new client.Counter({
    name: "connection_terminated_timeout",
    help: "Terminated connection due to timeout",
  }),
};

// register metrics
for (let metric in metrics) {
  register.registerMetric(metrics[metric]);
}

// a new client connects
wss.on("connection", function connection(ws, req) {
  // url pattern: clocktower.online/<channel>/<playerId|host>
  const url = req.url.toLocaleLowerCase().split("/");
  ws.playerId = url.pop();
  ws.channel = url.pop();
  ws.isHost = ws.playerId === "host";
  ws.isSpectator = ws.playerId === "spectator";

  if (!ws.channel) {
    ws.close();
    return;
  }

  // create channel if it doesn't exist
  if (!channels[ws.channel]) {
    channels[ws.channel] = [];
  }

  // check if host already exists
  if (ws.isHost && channels[ws.channel].some((client) => client.isHost)) {
    metrics.connection_terminated_host.inc();
    ws.close();
    return;
  }

  // add client to channel
  channels[ws.channel].push(ws);

  // send current state to new client
  if (ws.isHost) {
    ws.send(JSON.stringify({ type: "state", data: channels[ws.channel] }));
  }

  // notify other clients
  channels[ws.channel].forEach(function each(client) {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "join", data: ws.playerId }));
    }
  });

  // set up heartbeat
  ws.isAlive = true;
  ws.pingStart = new Date().getTime();
  ws.on("pong", heartbeat);

  ws.on("message", function incoming(data) {
    try {
      const message = JSON.parse(data);
      metrics.messages_incoming.inc();

      // relay message to other clients in channel
      channels[ws.channel].forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "message", data: message }));
        }
      });
    } catch (e) {
      console.error("Invalid message format:", data);
    }
  });

  ws.on("close", function close() {
    // remove client from channel
    const index = channels[ws.channel].indexOf(ws);
    if (index > -1) {
      channels[ws.channel].splice(index, 1);
    }

    // notify other clients
    channels[ws.channel].forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "leave", data: ws.playerId }));
      }
    });

    // clean up empty channels
    if (channels[ws.channel].length === 0) {
      delete channels[ws.channel];
    }
  });
});

// ping all clients every 30 seconds
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) {
      metrics.connection_terminated_timeout.inc();
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping(noop);
  });
}, PING_INTERVAL);

wss.on("close", function close() {
  clearInterval(interval);
});

// start server
if (process.env.NODE_ENV === "development") {
  console.log("开发模式服务器启动完成");
} else {
  server.listen(443, () => {
    console.log("HTTPS服务器启动完成");
  });
}
