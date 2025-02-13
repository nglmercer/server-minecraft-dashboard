import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import StorageManager from './utils.js';
const configStorage = new StorageManager('access-config.json', './data');
const saveAccessControl = configStorage.JSONget('accessControl');
let accessControl = isEmptyObject(saveAccessControl) 
    ? {
        "globalAccessEnabled": false,
        "timePermissions": {},
        "temporaryAccess": {}
    } 
    : saveAccessControl;
function isEmptyObject(obj) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

const userpermissions = [
    "accounts",
    "file_manager",
    "manage_servers",
    "making_servers",
    "monitor_servers",
    "manage_java",
    "manage_plugins",
    "system_monitoring",
    "system_settings"
];

const JWT_SECRET = 'tu_secreto_jwt'; // Cambia esto por una clave secreta segura
const TOKEN_EXPIRATION = '1h'; // Tiempo de expiración del token

class UserManager {
  constructor() {
    this.storage = new StorageManager('usuarios.json', './data');
    this.users = this.storage.JSONget('users') || {};
    this.sessions = {}; // Almacenar sesiones activas
  }

  // Guardar los usuarios en el archivo
  saveUsers() {
    this.storage.JSONset('users', this.users);
  }

  // Crear un nuevo usuario
  async createUser(username, email, password, permissions = [], roles = []) {
    if (!username || !email || !password) {
      throw new Error('El username, email y la contraseña son obligatorios');
    }

    if (this.users[username]) {
      throw new Error('El username ya existe');
    }

    const emailExistente = Object.values(this.users).find(user => user.email === email);
    if (emailExistente) {
      throw new Error('El email ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    this.users[username] = {
      username,
      email,
      password: hashedPassword,
      permissions,
      roles,
    };

    this.saveUsers();
    return { message: 'Usuario registrado exitosamente' };
  }

  // Eliminar un usuario
  async deleteUser(username, password) {
    if (!username || !password) {
      throw new Error('El nombre de usuario y la contraseña son obligatorios');
    }

    const user = this.users[username];
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error('Contraseña incorrecta');
    }

    delete this.users[username];
    this.saveUsers();
    return { message: 'Cuenta eliminada exitosamente' };
  }

  // Cambiar la contraseña de un usuario
  async changePassword(username, currentPassword, newPassword) {
    if (!username || !currentPassword || !newPassword) {
      throw new Error('El nombre de usuario, la contraseña actual y la nueva contraseña son obligatorios');
    }

    const user = this.users[username];
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      throw new Error('Contraseña actual incorrecta');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    this.saveUsers();
    return { message: 'Contraseña cambiada exitosamente' };
  }

  // Asignar permisos a un usuario
  assignPermissions(username, permissions) {
    if (!username || !permissions) {
      throw new Error('El nombre de usuario y los permisos son obligatorios');
    }

    const user = this.users[username];
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    user.permissions = permissions;
    this.saveUsers();
    return { message: 'Permisos actualizados exitosamente' };
  }

  // Asignar roles a un usuario
  assignRoles(username, roles) {
    if (!username || !roles) {
      throw new Error('El nombre de usuario y los roles son obligatorios');
    }

    const user = this.users[username];
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    user.roles = roles;
    this.saveUsers();
    return { message: 'Roles actualizados exitosamente' };
  }

  // Obtener información de un usuario
  getUser(username) {
    if (!username) {
      throw new Error('El nombre de usuario es obligatorio');
    }

    const user = this.users[username];
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  // Obtener todos los usuarios
  getAllUsers() {
    return this.users;
  }

  // Iniciar sesión y generar token
  async login(username, password) {
    if (!username || !password) {
      throw new Error('El nombre de usuario y la contraseña son obligatorios');
    }

    const user = this.users[username];
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error('Contraseña incorrecta');
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
    this.sessions[username] = token; // Almacenar el token en la sesión

    return { token };
  }

  // Verificar token y permisos
  verifyToken(token, requiredPermission) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = this.users[decoded.username];

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (requiredPermission && !user.permissions.includes(requiredPermission)) {
        throw new Error('Permiso denegado');
      }

      return user;
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }

  // Cerrar sesión
  logout(username) {
    if (!username) {
      throw new Error('El nombre de usuario es obligatorio');
    }

    if (this.sessions[username]) {
      delete this.sessions[username];
      return { message: 'Sesión cerrada exitosamente' };
    } else {
      throw new Error('No hay una sesión activa para este usuario');
    }
  }
}
const verifyToken = (req, res, next) => {
  if (accessControl.globalAccessEnabled) {
    // Si el acceso global está habilitado, no se verifica el token
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
export {
  UserManager,
  verifyToken,
  userpermissions,
  accessControl
}