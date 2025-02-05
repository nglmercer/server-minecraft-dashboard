// app.js
import express from 'express';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import cors from "cors";
import {  LanguageManager, storage, makeBaseDirs } from './src/utils.js';
import PREDEFINED from './src/predefined.js';
import authRouter from './src/routers/authRouter.js';
import apirouter from './src/routers/hardware.js';
import corerouter from './src/routers/cores.js';
import javarouter from './src/routers/java.js';
import serversrouter from './src/routers/servers.js';
import tasksrouter from './src/routers/tasks.js';
import pluginsrouter from './src/routers/plugins.js';
import modsrouter from './src/routers/mods.js';
import filemanagerrouter from './src/routers/fileManager.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
LanguageManager.loadAvailableLanguages();
const app = express();
const port = 3000;
app.use((req, res, next) => {
  const fileExtension = path.extname(req.url);
  const supportedExtensions = [".html", ".js", ".css", ".json"];

  // Manejar explícitamente el caso donde req.url es "/"
  if (req.url === "/") {
    const filePath = path.join(__dirname, "public", "index.html"); // Ruta al archivo index.html
    if (fs.existsSync(filePath)) {
      try {
        let lang = storage.get("lang") || req.query.lang || "es"; // Obtener el idioma
        let fileContent = fs.readFileSync(filePath, "utf-8"); // Leer el contenido del archivo
        let translatedContent = LanguageManager.translateText(lang, fileContent); // Traducir el contenido
        res.setHeader("Content-Type", "text/html"); // Establecer el tipo de contenido
        return res.send(translatedContent); // Enviar el contenido traducido
      } catch (error) {
        console.error("Error al traducir el archivo:", error);
        return res.status(500).send("Error interno del servidor");
      }
    } else {
      return res.status(404).send("Archivo no encontrado");
    }
  }

  // Lógica para archivos con extensiones soportadas
  if (supportedExtensions.includes(fileExtension)) {
    const filePath = path.join(__dirname, "public", req.url);
    if (fs.existsSync(filePath)) {
      try {
        let lang = storage.get("lang") || req.query.lang || "es"; // Obtener el idioma
        let fileContent = fs.readFileSync(filePath, "utf-8"); // Leer el contenido del archivo
        let translatedContent = LanguageManager.translateText(lang, fileContent); // Traducir el contenido
        res.setHeader("Content-Type", mimeTypeForExtension(fileExtension)); // Establecer el tipo de contenido
        return res.send(translatedContent); // Enviar el contenido traducido
      } catch (error) {
        console.error("Error al traducir el archivo:", error);
        return res.status(500).send("Error interno del servidor");
      }
    }
  }

  // Si no es un archivo a traducir o no se encuentra, continúa con el siguiente middleware
  next();
});
makeBaseDirs(PREDEFINED.BASE_DIRS);
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
app.use('/api/tasks', tasksrouter);
app.use('/api/plugins', pluginsrouter);
app.use('/api/mods', modsrouter);
app.use('/api/fileManager', filemanagerrouter);
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor web iniciado en http://localhost:${port}`);
});
