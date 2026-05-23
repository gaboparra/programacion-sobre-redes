import cluster from "cluster";
import "./worker.js";

if (cluster.isPrimary) {
  console.log("MASTER iniciado");

  const cantidadWorkers = 2;

  for (let i = 0; i < cantidadWorkers; i++) {
    // crea un nuevo proceso hijo
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} murió. Creando otro...`);

    cluster.fork();
  });
}
