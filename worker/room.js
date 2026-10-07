import { DurableObject } from "cloudflare:workers";

const COLORS = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "white"];
const CODE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;

function emptyRoom() {
  return {
    hostToken: "",
    teams: [],
    taken: {},
    armed: false,
    locked: false,
    winner: null,
    out: []
  };
}

function colorList(value) {
  const list = [];
  if (!Array.isArray(value)) {
    return list;
  }
  value.forEach(function (color) {
    if (COLORS.indexOf(color) !== -1 && list.indexOf(color) === -1) {
      list.push(color);
    }
  });
  return list;
}

export class BuzzRoom extends DurableObject {
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    const url = new URL(request.url);
    const role = url.searchParams.get("role");
    const token = url.searchParams.get("token") || "";
    if (role !== "host" && role !== "player") {
      return new Response("Unknown role", { status: 400 });
    }
    const room = await this.load();
    if (role === "host") {
      if (token.length < 16 || token.length > 80) {
        return new Response("Bad host token", { status: 400 });
      }
      if (room.hostToken && room.hostToken !== token) {
        return new Response("Room code is in use", { status: 403 });
      }
      if (!room.hostToken) {
        room.hostToken = token;
        await this.save(room);
      }
    } else if (!room.hostToken) {
      return new Response("Room is not open", { status: 404 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({
      id: crypto.randomUUID(),
      role: role,
      token: token,
      color: null
    });
    server.send(JSON.stringify(this.view(room, null)));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    if (typeof message !== "string") {
      return;
    }
    let data;
    try {
      data = JSON.parse(message);
    } catch (error) {
      return;
    }
    if (!data || typeof data.type !== "string") {
      return;
    }
    const attachment = ws.deserializeAttachment() || {};
    const room = await this.load();
    if (attachment.role === "host") {
      if (attachment.token !== room.hostToken) {
        ws.close(1008, "Host rejected");
        return;
      }
      if (!this.applyHost(room, data)) {
        return;
      }
      await this.save(room);
      this.broadcast(room);
      return;
    }
    if (data.type === "claim") {
      if (!this.claimColor(room, ws, attachment, data.color)) {
        ws.send(JSON.stringify({ type: "error", message: "That color is taken." }));
        return;
      }
      await this.save(room);
      this.broadcast(room);
      return;
    }
    if (data.type === "buzz" && attachment.color && room.armed && !room.locked && room.teams.indexOf(attachment.color) !== -1 && room.out.indexOf(attachment.color) === -1) {
      room.locked = true;
      room.winner = attachment.color;
      await this.save(room);
      this.broadcast(room);
    }
  }

  async webSocketClose(ws) {
    const attachment = ws.deserializeAttachment() || {};
    if (!attachment.color) {
      return;
    }
    const room = await this.load();
    if (room.taken[attachment.color] !== attachment.id) {
      return;
    }
    delete room.taken[attachment.color];
    await this.save(room);
    this.broadcast(room);
  }

  applyHost(room, data) {
    if (data.type === "teams" && Array.isArray(data.colors)) {
      const teams = [];
      data.colors.forEach(function (color) {
        if (COLORS.indexOf(color) !== -1 && teams.indexOf(color) === -1) {
          teams.push(color);
        }
      });
      room.teams = teams;
      room.out = room.out.filter(function (color) {
        return room.teams.indexOf(color) !== -1;
      });
      this.releaseMissing(room);
      if (room.winner && room.teams.indexOf(room.winner) === -1) {
        room.winner = null;
        room.locked = false;
      }
      return true;
    }
    if (data.type === "arm") {
      room.armed = true;
      if (data.fresh) {
        room.locked = false;
        room.winner = null;
        room.out = [];
      }
      return true;
    }
    if (data.type === "disarm") {
      room.armed = false;
      room.locked = false;
      room.winner = null;
      room.out = [];
      return true;
    }
    if (data.type === "miss") {
      if (COLORS.indexOf(data.color) === -1 || room.teams.indexOf(data.color) === -1) {
        return false;
      }
      if (room.out.indexOf(data.color) === -1) {
        room.out.push(data.color);
      }
      if (room.winner === data.color) {
        room.winner = null;
        room.locked = false;
      }
      return true;
    }
    if (data.type === "reset") {
      room.locked = false;
      room.winner = null;
      room.out = [];
      return true;
    }
    return false;
  }

  claimColor(room, ws, attachment, color) {
    if (COLORS.indexOf(color) === -1 || room.teams.indexOf(color) === -1) {
      return false;
    }
    const owner = room.taken[color];
    if (owner && owner !== attachment.id) {
      const stillHere = this.ctx.getWebSockets().some(function (open) {
        const current = open.deserializeAttachment();
        return current && current.id === owner;
      });
      if (stillHere) {
        return false;
      }
    }
    if (attachment.color && attachment.color !== color && room.taken[attachment.color] === attachment.id) {
      delete room.taken[attachment.color];
    }
    room.taken[color] = attachment.id;
    attachment.color = color;
    ws.serializeAttachment(attachment);
    return true;
  }

  releaseMissing(room) {
    const sockets = this.ctx.getWebSockets();
    Object.keys(room.taken).forEach(function (color) {
      if (room.teams.indexOf(color) !== -1) {
        return;
      }
      const owner = room.taken[color];
      delete room.taken[color];
      sockets.forEach(function (ws) {
        const attachment = ws.deserializeAttachment();
        if (!attachment || attachment.id !== owner) {
          return;
        }
        attachment.color = null;
        ws.serializeAttachment(attachment);
      });
    });
  }

  broadcast(room) {
    this.ctx.getWebSockets().forEach((ws) => {
      const attachment = ws.deserializeAttachment() || {};
      try {
        ws.send(JSON.stringify(this.view(room, attachment.color || null)));
      } catch (error) {
        // A closing socket can reject the send. The next snapshot covers the rest.
      }
    });
  }

  view(room, you) {
    return {
      type: "state",
      teams: room.teams,
      taken: Object.keys(room.taken),
      armed: !!room.armed,
      locked: !!room.locked,
      winner: room.winner || null,
      out: room.out,
      you: you
    };
  }

  async load() {
    const saved = await this.ctx.storage.get("room");
    if (!saved || typeof saved !== "object") {
      return emptyRoom();
    }
    return {
      hostToken: typeof saved.hostToken === "string" ? saved.hostToken : "",
      teams: Array.isArray(saved.teams) ? saved.teams : [],
      taken: saved.taken && typeof saved.taken === "object" ? saved.taken : {},
      armed: !!saved.armed,
      locked: !!saved.locked,
      winner: typeof saved.winner === "string" ? saved.winner : null,
      out: colorList(saved.out)
    };
  }

  async save(room) {
    await this.ctx.storage.put("room", room);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/room") {
      return env.ASSETS.fetch(request);
    }
    const code = (url.searchParams.get("code") || "").toUpperCase();
    if (!CODE.test(code)) {
      return new Response("Bad room code", { status: 400 });
    }
    const id = env.BUZZ_ROOM.idFromName(code);
    return env.BUZZ_ROOM.get(id).fetch(request);
  }
};
