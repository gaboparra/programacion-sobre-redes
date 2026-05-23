import axios from "axios";

const BASE_URL = "http://localhost:8080";
const TOTAL_INGEST = 500;

// ─── RÁFAGA A /ingest ────────────────────────────────────────────────────────
const ingestPromises = Array.from({ length: TOTAL_INGEST }, (_, i) =>
  axios.get(`${BASE_URL}/ingest`, { params: { id: i + 1 } })
    .then((r) => r.data)
    .catch((err) => ({ error: err.message })),
);

// ─── CONSULTAS A /health en paralelo ─────────────────────────────────────────
const healthTimings = [];
const healthInterval = setInterval(async () => {
  const t0 = Date.now();
  try {
    await axios.get(`${BASE_URL}/health`);
    healthTimings.push(Date.now() - t0);
  } catch {
    // puede fallar si el servidor aún no arrancó
  }
}, 50);

console.log(`Enviando ${TOTAL_INGEST} peticiones concurrentes a /ingest...`);

const results = await Promise.all(ingestPromises);
clearInterval(healthInterval);

// ─── REPORTE ─────────────────────────────────────────────────────────────────
const errores = results.filter((r) => r.error);
const exitosos = results.filter((r) => !r.error);
const contadorFinal = exitosos.length
  ? Math.max(...exitosos.map((r) => r.totalIngeridos || 0))
  : 0;

console.log("\n RESULTADOS:");
console.log(`   Peticiones exitosas : ${exitosos.length}`);
console.log(`   Errores             : ${errores.length}`);
console.log(
  `   Contador compartido : ${contadorFinal} (esperado: ${TOTAL_INGEST})`,
);
console.log(
  contadorFinal === TOTAL_INGEST
    ? "   Sin drift — Atomics funcionó correctamente"
    : `   Drift detectado — diferencia: ${TOTAL_INGEST - contadorFinal}`,
);

if (healthTimings.length > 0) {
  const promedio = (
    healthTimings.reduce((a, b) => a + b, 0) / healthTimings.length
  ).toFixed(1);
  const maximo = Math.max(...healthTimings);
  console.log(`\n /health durante la carga:`);
  console.log(`  Consultas realizadas : ${healthTimings.length}`);
  console.log(`  Latencia promedio    : ${promedio} ms`);
  console.log(`  Latencia máxima      : ${maximo} ms`);
}
