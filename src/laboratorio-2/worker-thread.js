import { parentPort, workerData } from "worker_threads";

// Memoria compartida que viene del Master — todos los workers apuntan al mismo bloque
const counter = new Int32Array(workerData.sharedBuffer);

// Simula un cálculo pesado proporcional al id recibido
function procesarLog(id) {
  let resultado = 0;
  for (let i = 0; i < id; i++) {
    resultado += Math.sqrt(i);
  }
  return resultado;
}

parentPort.on("message", ({ id, requestId }) => {
  const resultado = procesarLog(id);

  // Incremento atómico — evita condiciones de carrera entre threads simultáneos
  const nuevoContador = Atomics.add(counter, 0, 1) + 1;

  // Devolvemos el requestId para que el worker del cluster identifique a quién responder
  parentPort.postMessage({
    requestId,
    id,
    resultado: resultado.toFixed(4),
    totalIngeridos: nuevoContador,
  });
});
