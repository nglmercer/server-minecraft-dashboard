import express from 'express';
import authRouter from './authRouter.js';
import filesRouter from './routers/fileManager.js';
import serverRouter from './routers/servers.js';
import hardwareRouter from './routers/hardware.js';
import dicoverRouter from './routers/discover.js';
import taskRouter from './routers/task.js';
import langRouters from './routers/langRouters.js';
import coresRouter from './routers/minecraft/cores.js';
import javaVersionsRouter from './routers/minecraft/javaversions.js';
import pluginMCRouter from './routers/minecraft/plugins.js';
import backupsRouter from './routers/backup.js'
import path from 'path'; // Importa el módulo path para manejar rutas de archivos
import * as mime from 'mime-types'
import fs from 'fs/promises';
import {
  getLangInstance,
  getLangStore,
  getAllLangs,
  translateText
} from './modules/langs.js';
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'public'
// Asegúrate de que la carpeta 'public' exista en el mismo directorio que este archivo
const publicPath = path.join(process.cwd(), "public");


app.use(async (req, res, next) => {
  /*   console.log("Middleware de traducción iniciado");
    console.log("req.url:", req.url);
    console.log("req.path:", req.path); */
  
    const filePath = path.join(publicPath, req.path);
    const fileExtension = path.extname(req.path);
    const supportedExtensions = [".html", ".js", ".css", ".json"];
  // traducir si req url es /
  if (req.url === "/") {
    const filePath = path.join(publicPath, "index.html");

    try {
      let lang = req.query.lang || "es";
      let fileContent = await fs.readFile(filePath, "utf-8");
      let translatedContent = translateText(lang, fileContent);

      res.setHeader("Content-Type", "text/html");
      return res.send(translatedContent);
    } catch (error) {
      console.error("Error al traducir index.html:", error);
      return res.status(500).send("Error interno del servidor");
    }
  }
  
    try {
      await fs.access(filePath, fs.constants.F_OK);
      if (supportedExtensions.includes(fileExtension.toLowerCase())) {
  
        let lang = req.query.lang || "es";
        let fileContent = await fs.readFile(filePath, "utf-8");
        let translatedContent = translateText(lang, fileContent);
        const filemimetype = mime.lookup(fileExtension) || "text/plain";
        res.setHeader("Content-Type", filemimetype);
        return res.send(translatedContent);
      }
    } catch (error) {
      //console.log("Archivo no encontrado o no soportado:", filePath);
    }
    next();
  });
app.use(express.static(publicPath));

// Rutas de autenticación
app.use('/auth', authRouter);
app.use('/network', dicoverRouter);
app.use('/api', filesRouter);
app.use('/api', serverRouter);
app.use('/api', hardwareRouter);
app.use('/api', taskRouter);
app.use('/api', coresRouter);
app.use('/api', javaVersionsRouter);
app.use('/api', pluginMCRouter);
app.use('/api', langRouters);
app.use('/api', backupsRouter)
// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});