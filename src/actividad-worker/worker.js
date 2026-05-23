import cluster from "cluster";
import http from "http";

// Solo los workers crean el servidor.
// El master no debe escuchar peticiones.
if (!cluster.isPrimary) {
  const server = http.createServer((req, res) => {
    if (req.url === "/") {
      res.end(`Hola desde worker ${process.pid}`);
    } else if (req.url === "/escribir-evidencia") {
      console.log(`Worker ${process.pid}: iniciando escritura...`);

      setTimeout(() => {
        console.log(`Worker ${process.pid}: escritura finalizada`);

        const hayCrash = Math.random() < 0.5;

        if (hayCrash) {
          console.log(`Worker ${process.pid}: CRASH`);

          process.exit(1);
        }

        res.end(`Evidencia guardada por ${process.pid}`);
      }, 3000);
    } else {
      res.statusCode = 404;
      res.end("Ruta no encontrada");
    }
  });

  server.listen(3000, () => {
    console.log(`Worker ${process.pid} escuchando en puerto 3000`);
  });
}
