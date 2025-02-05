// authRouter.js
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import StorageManager from '../utils/utils.js'; // Asegúrate de que la ruta sea correcta

const router = express.Router();

// Configuración: archivo para almacenar los usuarios y clave secreta para JWT.
const storage = new StorageManager('usuarios.json', './data');
const JWT_SECRET = 'tu_clave_secreta'; // Cambia esta cadena por una clave segura en producción

// Middleware para verificar el token JWT en rutas protegidas.
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No se proporcionó token' });
  }
  // Se espera el formato "Bearer <token>"
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'El token no es válido o ha expirado' });
    }
    req.user = decoded;
    next();
  });
};

/**
 * Endpoint de registro de usuario.
 * Método: POST
 * URL: /register
 * Recibe en el body: { username, email, password }
 */
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  console.log(username, email, password);

  // Validación básica de campos
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'El username, email y la contraseña son obligatorios' });
  }

  // Recuperamos la lista de usuarios almacenados, o creamos un objeto vacío si no existe
  const users = storage.JSONget('users') || {};

  // Verificamos si el username ya existe
  if (users[username]) {
    return res.status(400).json({ error: 'El username ya existe' });
  }

  // Verificamos si el email ya está en uso (buscando entre los usuarios existentes)
  const emailExistente = Object.values(users).find(user => user.email === email);
  if (emailExistente) {
    return res.status(400).json({ error: 'El email ya está en uso' });
  }

  try {
    // Encriptamos la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    // Guardamos el usuario
    users[username] = { username, email, password: hashedPassword };
    storage.JSONset('users', users);
    return res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});

/**
 * Endpoint de login de usuario.
 * Método: POST
 * URL: /login
 * Recibe en el body: { login, password }
 * Donde el campo "login" puede ser tanto el username como el email.
 */
router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  console.log(login, password);
  if (!login || !password) {
    return res.status(400).json({ error: 'El login y la contraseña son obligatorios' });
  }

  // Obtenemos la lista de usuarios y buscamos el usuario.
  // Primero se intenta encontrarlo por username; si no se encuentra, se busca por email.
  const users = storage.JSONget('users') || {};
  let user = users[login];
  if (!user) {
    user = Object.values(users).find(u => u.email === login);
  }

  if (!user) {
    return res.status(400).json({ error: 'El usuario no existe' });
  }

  try {
    // Verificamos que la contraseña proporcionada coincida con la almacenada.
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generamos el token JWT con una expiración (por ejemplo, 1 hora)
    const token = jwt.sign({ username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ message: 'Login exitoso', token });
  } catch (error) {
    return res.status(500).json({ error: 'Error durante el proceso de autenticación' });
  }
});

/**
 * Ruta de ejemplo protegida por el middleware JWT.
 * Método: GET
 * URL: /profile
 */
router.get('/profile', verifyToken, (req, res) => {
  // El objeto req.user fue asignado en el middleware tras verificar el token.
  res.json({ message: 'Ruta protegida: Perfil de usuario', user: req.user });
});

export default router;
