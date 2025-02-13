import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {UserManager, accessControl} from './UserManager.js'; // Importa la clase UserManager

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_TOKEN_HERE'; // Usa una variable de entorno para la clave secreta

// Instancia de UserManager
const userManager = new UserManager();

// Middleware para verificar el token JWT en rutas protegidas.
export const verifyToken = (req, res, next) => {
  // Si el acceso global está habilitado, saltamos la verificación del token
  if (accessControl.globalAccessEnabled) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No se proporcionó token' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'El token no es válido o ha expirado' });
    }
    req.user = decoded;
    next();
  });
};

// Registrar un nuevo usuario
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'El username, email y la contraseña son obligatorios' });
  }
  try {
    const result = await userManager.createUser(username, email, password);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Iniciar sesión
router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'El login y la contraseña son obligatorios' });
  }
  try {
    const users = userManager.getAllUsers();
    let user = users[login];
    if (!user) {
      user = Object.values(users).find(u => u.email === login);
    }
    if (!user) {
      return res.status(400).json({ error: 'El usuario no existe' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    const token = jwt.sign({ username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ message: 'Login exitoso', token });
  } catch (error) {
    return res.status(500).json({ error: 'Error durante el proceso de autenticación' });
  }
});

// Obtener perfil del usuario (ruta protegida)
router.get('/profile', verifyToken, (req, res) => {
  const { username } = req.user;
  try {
    const user = userManager.getUser(username);
    return res.json({ message: 'Perfil de usuario', user });
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
});

// Eliminar cuenta
router.delete('/delete-account', verifyToken, async (req, res) => {
  const { username } = req.user;
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'La contraseña es obligatoria' });
  }
  try {
    const result = await userManager.deleteUser(username, password);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Obtener todos los usuarios (ruta protegida)
router.get('/users', verifyToken, (req, res) => {
  try {
    const users = userManager.getAllUsers();
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// Replace the global variable with a getter/setter
const setGlobalAccessEnabled = (value) => {
  accessControl.globalAccessEnabled = value;
};

// Enable/disable global access
router.post('/system/access', verifyToken, (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'El valor de "enabled" debe ser un booleano' });
  }
  setGlobalAccessEnabled(enabled);
  return res.json({ message: `Global access ${enabled ? 'enabled' : 'disabled'}` });
});

// Get system access info
router.get('/system/accessInfo', verifyToken, (req, res) => {
  return res.json(accessControl);
});

// Get user access status
router.get('/access/:username', verifyToken, (req, res) => {
  const { username } = req.params;

  const accessStatus = {
    username,
    hasTimedAccess: !!accessControl.timePermissions[username],
    hasTemporaryAccess: !!accessControl.temporaryAccess[username],
    timedAccessExpiry: accessControl.timePermissions[username]?.expiresAt,
    temporaryAccessExpiry: accessControl.temporaryAccess[username]?.expiresAt
  };
  return res.json(accessStatus);
});

export default router;