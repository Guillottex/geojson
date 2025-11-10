import express from "express";
import pkg from "pg";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const { Client } = pkg;
const app = express();

// ⚠️ Render asigna el puerto automáticamente:
const PORT = process.env.PORT || 3000;

// Necesario para __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.static(__dirname)); // Servir archivos estáticos (HTML, JS, CSS)

// 🟢 Configuración de PostgreSQL usando variables de entorno
const client = new Client({
  user: process.env.PGUSER || "postgres",
  host: process.env.PGHOST || "192.168.10.9",
  database: process.env.PGDATABASE || "portalClientes",
  password: process.env.PGPASSWORD || "psm12345*",
  port: process.env.PGPORT || 5432,
});

try {
  await client.connect();
  console.log("✅ Conectado a PostgreSQL");
} catch (err) {
  console.error("❌ Error al conectar a PostgreSQL:", err);
}

// Endpoint para devolver todos los GeoJSONs
app.get("/geojsons", async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM "geoJson";');

    const formatted = result.rows.map((row) => {
      let jsonData = {};
      try {
        jsonData = JSON.parse(row.geoData.toString("utf8"));
      } catch (e) {
        console.error(`⚠️ Error parseando geoData ID ${row.id}:`, e.message);
      }

      return {
        id: row.id,
        nombre: row.nombre,
        data: jsonData,
      };
    });

    console.log("📤 Enviando al frontend:", JSON.stringify(formatted, null, 2));
    res.json(formatted);
  } catch (err) {
    console.error("❌ Error al consultar:", err);
    res.status(500).json({ error: err.message });
  }
});

// Servir index.html en la raíz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 🚀 Iniciar servidor
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
