// minecraftServer.js
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import treekill from 'tree-kill';
import si from 'systeminformation';

class MinecraftServer {
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
    this.players = new Set(); // Set para almacenar jugadores conectados
    this.tps = 0; // Ticks por segundo (indicador de rendimiento)
    this.systemMemoryUsage = { rss: 0, heapTotal: 0, heapUsed: 0 }; // Uso de memoria del sistema en MB
    this.uptime = 0; // Tiempo de funcionamiento en segundos
    this.lastPlayerActivity = {}; // Registro de actividad de jugadores (último mensaje, etc.)
    this.worldSize = 0; // Tamaño del mundo en MB
    this.cpuUsage = 0;
    this.memoryUsage = 0;
    this.processStats = {}
  }
  async monitorProcessResources() {
    if (this.process && this.process.pid) {
      try {
        const processes = await si.processes();
        const proc = processes.list.find(p => p.pid === this.process.pid);
        const stats = proc
        this.processStats = proc;
        this.cpuUsage = stats.cpu; // CPU en porcentaje
        this.memoryUsage = stats.memory || stats.memRss; // Memoria en MB

      //  console.log(`[${this.serverName}] CPU: ${this.cpuUsage}% | Memoria: ${this.memoryUsage} MB`,stats);
      } catch (error) {
        console.error(`Error al obtener métricas del proceso: ${error.message}`);
      }
    }
  }
  // Método auxiliar para obtener el script de inicio según el sistema operativo
  getStartFilePath() {
    const platform = process.platform;
    const startFile = platform === 'win32' ? 'start.bat' : 'start.sh';
    return path.join(this.serverFolderPath, startFile);
  }
  updateUptime() {
    if (this.status === 'running' && this._startTime) {
      this.uptime = Math.floor((Date.now() - this._startTime) / 1000);
    }
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
    this.log += `\nIniciando servidor ${this.serverName}...\n`;
    console.log(`Iniciando servidor ${this.serverName}...`);
    this._startTime = Date.now();
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
    
    // Iniciar el intervalo de métricas si está configurado
    this.scheduleMetricsUpdate(10000); // Por defecto cada 30 segundos
  }

  // Modificación al método attachProcessListeners para limpiar el intervalo cuando el proceso termina

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
      console.log(`Servidor ${this.serverName} detenido con código ${code}\n`);
      
      // Limpiar el intervalo de métricas al cerrarse el proceso
      if (this._metricsInterval) {
        clearInterval(this._metricsInterval);
        this._metricsInterval = null;
        console.log(`Intervalo de métricas detenido para ${this.serverName} al cerrarse el proceso.`);
      }
      
      // Aquí puedes agregar lógica de reinicio automático en caso de error
    });
  }

  // Maneja la salida (stdout y stderr) del proceso
  handleOutput(data) {
    // Código existente
    this.log += data;
    console.log(`[${this.serverName}] ${data}`);
    
    // Analizar la salida para detectar eventos y actualizar métricas
    
    // Detectar conexión de jugadores
    const joinMatch = data.match(/(\w+) joined the game/);
    if (joinMatch && joinMatch[1]) {
      const player = joinMatch[1];
      this.players.add(player);
      console.log(`Jugador conectado: ${player}`);
    }
    
    // Detectar desconexión de jugadores
    const leaveMatch = data.match(/(\w+) left the game/);
    if (leaveMatch && leaveMatch[1]) {
      const player = leaveMatch[1];
      this.players.delete(player);
      console.log(`Jugador desconectado: ${player}`);
    }
    
    // Analizar respuesta al comando "list"
    const listMatch = data.match(/There are (\d+) of a max of (\d+) players online:(.*)/);
    if (listMatch) {
      const onlineCount = parseInt(listMatch[1]);
      const maxPlayers = parseInt(listMatch[2]);
      
      // Si hay una lista de jugadores, actualizar el conjunto
      if (listMatch[3].trim()) {
        // Limpiar la lista actual
        this.players.clear();
        
        // Añadir jugadores de la lista
        const playerNames = listMatch[3].trim().split(',').map(name => name.trim());
        playerNames.forEach(player => {
          if (player) this.players.add(player);
        });
      }
    }
    
    // Detectar TPS (depende del formato del servidor)
    const tpsMatch = data.match(/TPS: (\d+\.?\d*)/);
    if (tpsMatch && tpsMatch[1]) {
      this.tps = parseFloat(tpsMatch[1]);
    }
  }

  // Envía un comando al proceso a través de su entrada estándar
  sendCommand(command) {
    if (this.process && this.process.stdin.writable) {
      this.process.stdin.write(command + "\n");
      this.log += `Comando enviado: ${command}\n`;
    } else {
      this.log += `\nNo se puede enviar el comando. El servidor ${this.serverName} no está activo.\n`;
      console.error(`No se puede enviar el comando. El servidor ${this.serverName} no está activo.`);
    }
  }

  // Devuelve los últimos N renglones del log
  getLogs(linesCount = 150) {
    const logLines = this.log.split('\n');
    return logLines.slice(-linesCount).join('\n');
  }
  updatePlayerList() {
    if (this.status === 'running') {
      this.sendCommand('list');
      // El procesamiento se hará en handleOutput
    } else {
      console.error(`No se puede obtener la lista de jugadores. El servidor ${this.serverName} no está activo.`);
    }
  }
  // Envía el comando de apagado al servidor
  stop() {
    
    if (this.process && this.status === 'running') {
      console.log(`Deteniendo el servidor ${this.serverName}...`);
      this.sendCommand(this.stopCommand);
      this.status = 'stopping';
      if (this._metricsInterval) {
        clearInterval(this._metricsInterval);
        this._metricsInterval = null;
      }
    } else {
      this.log += `\nEl servidor ${this.serverName} no se encuentra en ejecución.\n`;
      console.log(`El servidor ${this.serverName} no se encuentra en ejecución.`);
    }
  }
  scheduleMetricsUpdate(intervalMs = 5500) {
    // Limpiar cualquier intervalo existente primero
    if (this._metricsInterval) {
      clearInterval(this._metricsInterval);
      this._metricsInterval = null;
    }
    
    // Solo programar actualizaciones si el servidor está en ejecución
    if (this.status === 'running') {
      this._metricsInterval = setInterval(() => {
        // Actualizar métricas
        this.updateUptime();
        this.monitorProcessResources();
        // Verificar si el servidor sigue en ejecución
        if (this.status !== 'running') {
          // Si el servidor ya no está en ejecución, detener el intervalo
          clearInterval(this._metricsInterval);
          this._metricsInterval = null;
          console.log(`Intervalo de métricas detenido para ${this.serverName} porque el servidor no está en ejecución.`);
        }
      }, intervalMs);
      
      console.log(`Intervalo de métricas programado para ${this.serverName} cada ${intervalMs}ms.`);
    } else {
      console.log(`No se programó el intervalo de métricas para ${this.serverName} porque el servidor no está en ejecución.`);
    }
  }
  // Mata el proceso de forma forzosa usando "tree-kill"
  kill() {
    if (this.process && this.process.pid) {
      treekill(this.process.pid, (err) => {
        if (err) {
          console.error(`Error al matar el proceso ${this.process.pid}: ${err}`);
        } else {
          this.log += `\nProceso ${this.process.pid} del servidor ${this.serverName} fue finalizado.\n`;
          console.log(`Proceso ${this.process.pid} del servidor ${this.serverName} fue finalizado.`);
          this.status = 'stopped';
        }
      });
    }
  }
  // Obtener lista de jugadores conectados
  getOnlinePlayers() {
    return Array.from(this.players);
  }
  getPlayerHistory(hours = 24) {
    // Implementar si decides almacenar historial de jugadores
    return {
      uniquePlayers: Array.from(this.players),
      peakPlayerCount: this.players.size, // Esto es solo el actual, necesitarías registrar el pico
      // Añade más métricas históricas aquí
    };
  }
  
  // Obtener recuento de jugadores
  getPlayerCount() {
    return this.players.size;
  }
  getServerMetrics() {
    return {
      players: this.getPlayerCount(),
      tps: this.tps,
      memoryUsage: this.memoryUsage,
      cpuUsage: this.cpuUsage,
      processStats: this.processStats,
      uptime: this.uptime,
      status: this.status,
      worldSize: this.worldSize,
      systemMemoryUsage: this.systemMemoryUsage
    };
  }
  // Función para obtener el estado actual del servidor
  getStatus() {
    return this.status;
  }
  getWorldStats() {
    // Necesitarías implementar lógica para leer archivos del mundo
    return {
      worldName: path.basename(this.serverFolderPath),
      worldSize: this.worldSize,
      // Otras estadísticas del mundo
    };
  }
}

class ServerManager {
  constructor() {
    // Usamos un Map para almacenar los servidores por nombre
    this.servers = new Map();
  }

  // Agrega un nuevo servidor al manager
  addServer(serverName, serverFolderPath, config = {}) {
    if (this.servers.has(serverName)) {
      //console.error(`El servidor ${serverName} ya existe.`);
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

  // Obtiene el estado actual de un servidor
  getServerStatus(serverName) {
    const server = this.servers.get(serverName);
    if (server) {
      return server.getStatus();
    }
    console.error(`Servidor ${serverName} no registrado.`);
    return null;
  }
  getServerPlayers(serverName) {
    const server = this.servers.get(serverName);
    if (server) {
      return server.getOnlinePlayers();
    }
    console.error(`Servidor ${serverName} no registrado.`);
    return [];
  }
  
  // Obtener métricas de un servidor específico
  getServerMetrics(serverName) {
    const server = this.servers.get(serverName);
    if (server) {
      return server.getServerMetrics();
    }
    console.error(`Servidor ${serverName} no registrado.`);
    return null;
  }
  
  // Obtener métricas de todos los servidores
  getAllServersMetrics() {
    const metrics = {};
    this.servers.forEach((server, name) => {
      metrics[name] = server.getServerMetrics();
    });
    return metrics;
  }
  
  // Programar actualizaciones de métricas para un servidor
  scheduleServerMetricsUpdate(serverName, intervalMs = 30000) {
    const server = this.servers.get(serverName);
    if (server) {
      server.scheduleMetricsUpdate(intervalMs);
      console.log(`Actualizaciones de métricas programadas para ${serverName} cada ${intervalMs}ms`);
    } else {
      console.error(`Servidor ${serverName} no registrado.`);
    }
  }
  killserver(serverName) {
    const server = this.servers.get(serverName);
    if (server) {
      server.kill();
      console.log(`Servidor ${serverName} detenido.`);
    } else {
      console.error(`Servidor ${serverName} no registrado.`);
    }
  }
}

const manager = new ServerManager();

// Agrega un servidor llamado "melserver" cuya carpeta se encuentra en "./servers/melserver"
/* manager.addServer("melserver", "./servers/serverone", { stopCommand: "stop" });

// Inicia el servidor
manager.startServer("melserver");
setInterval(() => {
    manager.sendCommand("melserver", "say Hola mundo!");
  }, 10000); */
export {
  manager,
  MinecraftServer,
  ServerManager
};