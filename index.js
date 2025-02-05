// app.js
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from "cors";
import StorageManager from './utils/store.js';
import authRouter from './src/authRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const port = 3000;

// Middleware para parsear JSON
app.use(express.json());
app.use(cors())
// Servir archivos estáticos (si los tienes)
app.use(express.static(path.join(__dirname, 'public')));
console.log(path.join(__dirname, 'public'))

// Rutas
app.use('/auth', authRouter); // Los endpoints serán: /auth/register, /auth/login, etc.

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor web iniciado en http://localhost:${port}`);
});
