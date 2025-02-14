import express from 'express';
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createserverfolder,
  createserverfile,
  createsubfolder,
  getfolderinfo,
  updatefolderinfo,
  readfilebyname,
  readfilebypath,
  writeFilebyName
}from '../modules/servers.js';
const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = express.Router();

// Ruta para crear una carpeta
router.post('/filemanager/create-folder', (req, res) => {
  const { directoryname } = req.body;

  if (!directoryname) {
    return res.status(400).json({ success: false, error: "El nombre de la carpeta es requerido." });
  }

  try {
    const result = createserverfolder(directoryname);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});

// Ruta para crear un archivo
router.post('/filemanager/create-file', (req, res) => {
  const { directoryname, filename, content } = req.body;

  if (!directoryname || !filename || !content) {
    return res.status(400).json({ success: false, error: "Todos los campos son requeridos: directoryname, filename, content." });
  }

  try {
    const result = createserverfile(directoryname, filename, content);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});

// Ruta para crear una subcarpeta
router.post('/filemanager/create-subfolder', (req, res) => {
  const { directoryname, subfoldername } = req.body;

  if (!directoryname || !subfoldername) {
    return res.status(400).json({ success: false, error: "Todos los campos son requeridos: directoryname, subfoldername." });
  }

  try {
    const result = createsubfolder(directoryname, subfoldername);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});

// Ruta para obtener información de una carpeta
router.get('/filemanager/folder-info/:folderName', (req, res) => {
  const { folderName } = req.params;

  if (!folderName) {
    return res.status(400).json({ success: false, error: "El nombre de la carpeta es requerido." });
  }

  try {
    const result = getfolderinfo(folderName);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});

// Ruta para actualizar la información de una carpeta
router.post('/filemanager/update-folder-info', (req, res) => {
  const { folderName } = req.body;

  if (!folderName) {
    return res.status(400).json({ success: false, error: "El nombre de la carpeta es requerido." });
  }

  try {
    updatefolderinfo(folderName);
    res.status(200).json({ success: true, message: "Información de la carpeta actualizada correctamente." });
  } catch (error) {
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});
router.get('/filemanager/read-file/:folderName/:fileName', (req, res) => {
  const { folderName, fileName } = req.params;

  if (!folderName || !fileName) {
    return res.status(400).json({ success: false, error: "Todos los campos son requeridos: folderName, fileName." });
  }

  try {
    const result = readfilebyname(folderName, fileName);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});
router.get('/filemanager/read-file-by-path/*', (req, res) => {
  // 'req.params[0]' contendrá toda la ruta que venga después de '/filemanager/read-file-by-path/'
  const filePath = req.params[0];
  try {
    const result = readfilebypath(filePath);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});
// return this.get("/fileManager/writeFilebyName?folderName=" + folderName + "&fileName=" + fileName + "&content=" + content);
router.post('/filemanager/writeFilebyName', (req, res) => {
  let { folderName, fileName, content } = req.body; // Ahora usa req.body en lugar de req.query
  try {
    if (!folderName || !fileName || !content) {
      return res.status(400).json({ success: false, error: "Todos los campos son requeridos: folderName, fileName, content." });
    }
    if (fileName.includes("/")) {
      fileName = fileName.replace("/", "");
    }
    console.log("writeFilebyName", folderName, fileName, content);
    const result = writeFilebyName(folderName, fileName, content);
    console.log("result", result, folderName, fileName, content);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});
// add upload file 
router.post("/filemanager/upload", upload.single("g-file-input"), (req, res) => {
  try {
      const { server, path: serverPath } = req.query;

      if (!server || !serverPath || !req.file) {
          return res.status(400).json({ success: false, message: "Faltan parámetros" });
      }

      const fileName = req.file.originalname;
      const fileContent = req.file.buffer; // Es un buffer porque es una imagen u otro archivo binario
      console.log(server,serverPath)
      // Guardar el archivo en la ruta especificada
/*       const filePath = path.join("./servers", server, serverPath, fileName);
      fs.writeFileSync(filePath, fileContent); // Guardar archivo binario */
      const filename =  serverPath + "/" + fileName
      createserverfile(server,filename, fileContent);
      console.log(server,filename, fileContent)
      return res.status(200).json({ success: true, filename });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;