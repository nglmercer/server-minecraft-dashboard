// app.js
import express from 'express';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import cors from "cors";
import { StorageManager, LanguageManager, storage } from './src/utils.js';
import authRouter from './src/authRouter.js';
import apirouter from './src/routers/hardware.js';
import corerouter from './src/routers/cores.js';
import javarouter from './src/routers/java.js';
import serversrouter from './src/routers/servers.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
LanguageManager.loadAvailableLanguages();
console.log("LanguageManager", LanguageManager.loadAvailableLanguages());
const app = express();
const port = 3000;
app.use((req, res, next) => {
  const fileExtension = path.extname(req.url);
  const supportedExtensions = [".html", ".js", ".css", ".json"];

  if (supportedExtensions.includes(fileExtension)) {
    // Obtener el idioma a partir de un parámetro de consulta (ej. ?lang=es)
    let lang = storage.get("lang") || req.query.lang || "es";
    // Ruta completa del archivo estático en la carpeta 'public'
    const filePath = path.join(__dirname, "public", req.url);

    if (fs.existsSync(filePath)) {
      try {
        // Leer el contenido del archivo
        let fileContent = fs.readFileSync(filePath, "utf-8");
        // Aplicar la traducción usando LanguageManager
        let translatedContent = LanguageManager.translateText(lang, fileContent);
        // Establecer el header correspondiente
        res.setHeader("Content-Type", mimeTypeForExtension(fileExtension));
        // Enviar el contenido traducido
        return res.send(translatedContent);
      } catch (error) {
        console.error("Error al traducir el archivo:", error);
        return res.status(500).send("Error interno del servidor");
      }
    }
  }
  // Si no es un archivo a traducir o no se encuentra, continúa con el siguiente middleware
  next();
});

// Middleware para parsear JSON
app.use(express.json());
app.use(cors())
// Servir archivos estáticos (si los tienes)
app.use(express.static(path.join(__dirname, 'public')));
console.log(path.join(__dirname, 'public'))

function mimeTypeForExtension(ext) {
  switch (ext) {
    case ".html":
      return "text/html";
    case ".js":
      return "application/javascript";
    case ".css":
      return "text/css";
    case ".json":
      return "application/json";
    default:
      return "text/plain";
  }
}
// Rutas
app.use('/auth', authRouter); // Los endpoints serán: /auth/register, /auth/login, etc.
app.use('/api', apirouter);
app.use('/api/cores', corerouter);
app.use('/api/java', javarouter);
app.use('/api/servers', serversrouter);
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor web iniciado en http://localhost:${port}`);
});
