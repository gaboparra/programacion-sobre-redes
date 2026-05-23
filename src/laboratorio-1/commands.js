import logger from "../utils/logger.js";

export const handleCommand = (socket, input, clients) => {
  const [command, ...args] = input.split(" ");

  switch (command) {
    case "/nick":
      const newNick = args.join("_");
      if (!newNick) {
        socket.write(`Error: Debes especificar un nombre. Uso: /nick nombre\n`,);
        return false;
      }
      const oldNick = socket.nickname;
      socket.nickname = newNick;
      socket.write(`Tu nick ahora es: ${socket.nickname}\n`);

      logger.info({ event: "NICK_CHANGE", from: oldNick, to: newNick });
      return false;

    case "/lista":
      const userList = clients.map((c) => c.nickname).join(", ");
      socket.write(`Usuarios conectados (${clients.length}): ${userList}\n`);
      return false;

    default:
      // Si no reconoce el comando, dejar que se envíe como texto normal
      return true;
  }
};
