import cluster from "cluster";
import { Worker } from "worker_threads";
import express from "express";

const PORT = 8080;

// ─── MASTER ──────────────────────────────────────────────────────────────────
if (cluster.isPrimary) {
  console.log(`[Master] PID: ${process.pid}`);
  console.log(`[Master] Levantando 1 worker...`);

  cluster.fork();

  // Self-Healing: si el worker muere, se relanza automáticamente
  cluster.on("exit", (worker, code) => {
    console.log(
      `[Master] Worker ${worker.process.pid} murió (código: ${code}). Relanzando...`,
    );
    cluster.fork();
  });

  // ─── WORKER DEL CLUSTER ──────────────────────────────────────────────────────
} else {
  // Memoria compartida de 4 bytes entre este worker y su worker thread
  const sharedBuffer = new SharedArrayBuffer(4);

  const workerThread = new Worker(
    new URL("./worker-thread.js", import.meta.url),
    {
      workerData: { sharedBuffer },
    },
  );

  // Subimos el límite de listeners porque pueden llegar muchas peticiones simultáneas
  workerThread.setMaxListeners(600);

  workerThread.on("error", (err) => {
    console.error(
      `[Worker ${process.pid}] Error en worker thread:`,
      err.message,
    );
  });

  const app = express();

  // GET /health — respuesta inmediata, nunca toca el worker thread
  app.get("/health", (req, res) => {
    res.json({ status: "ok", pid: process.pid });
  });

  // GET /ingest?id=<número> — delega el cálculo al worker thread
  app.get("/ingest", (req, res) => {
    const id = parseInt(req.query.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: "El parámetro id debe ser un número" });
    }

    // ID único por petición para identificar la respuesta correcta del thread
    const requestId = crypto.randomUUID();
    workerThread.postMessage({ id, requestId });

    // Filtramos por requestId para no acumular listeners
    const handler = (result) => {
      if (result.requestId !== requestId) return;
      workerThread.off("message", handler);
      res.json(result);
    };

    workerThread.on("message", handler);
  });

  app.listen(PORT, () => {
    console.log(`[Worker ${process.pid}] Escuchando en puerto ${PORT}`);
  });
}
