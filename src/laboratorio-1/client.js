import net from "node:net";
import readline from "node:readline";
import "dotenv/config";

const PORT = process.env.PORT;
const HOST = process.env.HOST;

// Interfaz de lectura de la terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "Mensaje: ",
});

// Establecer conexión con el servidor TCP
const client = net.createConnection({ port: PORT, host: HOST }, () => {
  // console.log("Conectado exitosamente al servidor.");
});

client.on("data", (data) => {
  console.log(`\n[SERVIDOR]: ${data.toString().trim()}`);
  rl.prompt();
});

rl.on("line", (line) => {
  const message = line.trim();

  // Comando para desconexión limpia
  if (message === "/salir") {
    console.log("Desconectando de forma segura...");
    client.end();
    return;
  }

  if (message) {
    client.write(message);
  }
  rl.prompt();
});

client.on("end", () => {
  console.log("\nEl servidor ha cerrado la conexión.");
  process.exit(0);
});

client.on("error", (err) => {
  console.error(`\nError en el cliente: ${err.message}`);
  process.exit(1);
});
