// minecraftServer.js
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import treekill from 'tree-kill';

export class MinecraftServer {
  constructor(serverName, serverFolderPath, config = {}) {
    this.serverName = serverName;
    // Convertimos la ruta a absoluta para evitar problemas
    this.serverFolderPath = path.resolve(serverFolderPath);
    // Configuración opcional (por ejemplo, comando de apagado, máximo de reinicios, etc.)
    this.config = config;
    // Log acumulado de la salida del servidor
    this.log = "";
    // Proceso que se crea al iniciar el servidor
    this.process = null;
    // Estados: 'stopped', 'starting', 'running', 'stopping'
    this.status = 'stopped';
    // Comando para detener el servidor (por defecto "stop")
    this.stopCommand = config.stopCommand || "stop";
    // Número de reinicios (útil si implementas reinicio automático)
    this.restartAttempts = 0;
  }

  // Método auxiliar para obtener el script de inicio según el sistema operativo
  getStartFilePath() {
    const platform = process.platform;
    const startFile = platform === 'win32' ? 'start.bat' : 'start.sh';
    return path.join(this.serverFolderPath, startFile);
  }

  // Inicia el servidor
  start() {
    if (this.status !== 'stopped') {
      console.log(`El servidor ${this.serverName} ya está en ejecución o en proceso de iniciarse.`);
      return;
    }

    const startScript = this.getStartFilePath();
    if (!fs.existsSync(startScript)) {
      console.error(`No se encontró el script de inicio en: ${startScript}`);
      return;
    }

    this.status = 'starting';
    console.log(`Iniciando servidor ${this.serverName}...`);

    // Configuración de la ejecución según el sistema operativo
    let command, args;
    if (process.platform === 'win32') {
      command = startScript;
      args = [];
    } else {
      command = 'sh';
      args = [startScript];
    }

    // Se inicia el proceso
    this.process = spawn(command, args, {
      cwd: this.serverFolderPath,
      shell: true
    });

    // Una vez iniciado, se asume que pasará a 'running' al recibir la salida adecuada
    this.status = 'running';
    this.attachProcessListeners();
  }

  // Asocia los eventos al proceso para capturar la salida y detectar cuando se cierra
  attachProcessListeners() {
    if (!this.process) return;

    this.process.stdout.on('data', (data) => {
      this.handleOutput(data.toString());
    });

    this.process.stderr.on('data', (data) => {
      this.handleOutput(data.toString());
    });

    this.process.on('close', (code) => {
      this.status = 'stopped';
      this.log += `\nProceso cerrado con código ${code}`;
      console.log(`Servidor ${this.serverName} detenido con código ${code}`);
      // Aquí puedes agregar lógica de reinicio automático en caso de error
    });
  }

  // Maneja la salida (stdout y stderr) del proceso
  handleOutput(data) {
    // Agrega la salida al log interno
    this.log += data;
    // Se puede implementar lógica para analizar mensajes y cambiar el estado (por ejemplo, detectar "Server started")
    console.log(`[${this.serverName}] ${data}`);
  }

  // Envía un comando al proceso a través de su entrada estándar
  sendCommand(command) {
    if (this.process && this.process.stdin.writable) {
      this.process.stdin.write(command + "\n");
      this.log += `\nComando enviado: ${command}`;
    } else {
      console.error(`No se puede enviar el comando. El servidor ${this.serverName} no está activo.`);
    }
  }

  // Devuelve los últimos N renglones del log
  getLogs(linesCount = 100) {
    const logLines = this.log.split('\n');
    return logLines.slice(-linesCount).join('\n');
  }

  // Envía el comando de apagado al servidor
  stop() {
    if (this.process && this.status === 'running') {
      console.log(`Deteniendo el servidor ${this.serverName}...`);
      this.sendCommand(this.stopCommand);
      this.status = 'stopping';
    } else {
      console.log(`El servidor ${this.serverName} no se encuentra en ejecución.`);
    }
  }

  // Mata el proceso de forma forzosa usando "tree-kill"
  kill() {
    if (this.process && this.process.pid) {
      treekill(this.process.pid, (err) => {
        if (err) {
          console.error(`Error al matar el proceso ${this.process.pid}: ${err}`);
        } else {
          console.log(`Proceso ${this.process.pid} del servidor ${this.serverName} fue finalizado.`);
          this.status = 'stopped';
        }
      });
    }
  }
}

export class ServerManager {
  constructor() {
    // Usamos un Map para almacenar los servidores por nombre
    this.servers = new Map();
  }

  // Agrega un nuevo servidor al manager
  addServer(serverName, serverFolderPath, config = {}) {
    if (this.servers.has(serverName)) {
      console.error(`El servidor ${serverName} ya existe.`);
      return;
    }
    const server = new MinecraftServer(serverName, serverFolderPath, config);
    this.servers.set(serverName, server);
    console.log(`Servidor ${serverName} agregado.`);
  }

  // Remueve un servidor (y opcionalmente lo mata si está en ejecución)
  removeServer(serverName) {
    if (this.servers.has(serverName)) {
      const server = this.servers.get(serverName);
      if (server.status !== 'stopped') {
        server.kill();
      }
      this.servers.delete(serverName);
      console.log(`Servidor ${serverName} removido.`);
    } else {
      console.error(`No se encontró el servidor ${serverName}.`);
    }
  }

  // Inicia un servidor
  startServer(serverName) {
    const server = this.servers.get(serverName);
    if (server) {
      server.start();
    } else {
      console.error(`Servidor ${serverName} no registrado.`);
    }
  }

  // Detiene un servidor
  stopServer(serverName) {
    const server = this.servers.get(serverName);
    if (server) {
      server.stop();
    } else {
      console.error(`Servidor ${serverName} no registrado.`);
    }
  }

  // Envía un comando a un servidor
  sendCommand(serverName, command) {
    const server = this.servers.get(serverName);
    if (server) {
      server.sendCommand(command);
    } else {
      console.error(`Servidor ${serverName} no registrado.`);
    }
  }

  // Obtiene los últimos N renglones de log de un servidor
  getServerLogs(serverName, linesCount = 100) {
    const server = this.servers.get(serverName);
    if (server) {
      return server.getLogs(linesCount);
    }
    console.error(`Servidor ${serverName} no registrado.`);
    return null;
  }
}
const manager = new ServerManager();

// Agrega un servidor llamado "melserver" cuya carpeta se encuentra en "./servers/melserver"
manager.addServer("melserver", "./servers/serverone", { stopCommand: "stop" });

// Inicia el servidor
manager.startServer("melserver");
setInterval(() => {
    manager.sendCommand("melserver", "say Hola mundo!");
  }, 10000);