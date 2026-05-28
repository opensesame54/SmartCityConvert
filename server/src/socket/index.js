const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const Redis = require("ioredis");

let io;

const initSocket = async (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
      credentials: true,
    },
  });

  if (process.env.REDIS_URL) {
    const pubClient = new Redis(process.env.REDIS_URL);
    const subClient = pubClient.duplicate();
    pubClient.on("error", (err) => console.error("Redis pub error:", err));
    subClient.on("error", (err) => console.error("Redis sub error:", err));
    io.adapter(createAdapter(pubClient, subClient));
  }

  io.on("connection", (socket) => {
    socket.join("incidents_live");
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized");
  }
  return io;
};

module.exports = { initSocket, getIo };
