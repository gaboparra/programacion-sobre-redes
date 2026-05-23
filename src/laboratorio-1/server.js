import net from "node:net";
import logger from "../utils/logger.js";
import { handleCommand } from "./commands.js";
import "dotenv/config";

const PORT = process.env.PORT;
const HOST = process.env.HOST;
let clients = [];

const server = net.createServer((socket) => {
  socket.clientId = `${socket.remoteAddress}:${socket.remotePort}`;
  socket.nickname = socket.clientId; // Por defecto el nick es su IP:Puerto

  clients.push(socket);
  logger.info({ event: "CLIENT_CONNECTED", id: socket.clientId });

  socket.write(`Bienvenido al chat. Tu nick actual es: ${socket.nickname}\n`);

  socket.on("data", (data) => {
    const message = data.toString().trim();
    if (!message) return;

    // Es un comando?
    if (message.startsWith("/")) {
      const shouldBroadcast = handleCommand(socket, message, clients);
      if (!shouldBroadcast) return;
    }

    // Broadcast
    clients.forEach((client) => {
      if (client !== socket && !client.destroyed) {
        client.write(`[${socket.nickname}]: ${message}\n`);
      }
    });

    logger.info({
      event: "MESSAGE_SENT",
      from: socket.nickname,
      text: message,
    });
  });

  const removeClient = (reason) => {
    if (clients.includes(socket)) {
      clients = clients.filter((c) => c !== socket);
      logger.info({
        event: "CLIENT_DISCONNECTED",
        id: socket.nickname,
        reason,
      });
    }
  };

  socket.on("end", () => removeClient("Normal closure"));
  socket.on("error", (err) => {
    logger.error({
      event: "SOCKET_ERROR",
      id: socket.nickname,
      message: err.message,
    });
    removeClient("Error closure");
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Servidor TCP activo en ${HOST}:${PORT}`);
});
