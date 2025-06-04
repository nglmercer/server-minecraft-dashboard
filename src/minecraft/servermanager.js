// minecraftServer.js
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import treekill from 'tree-kill';
import si from 'systeminformation';
import { emitter } from '../sockets/Emitter.js';

class MinecraftServer {
  constructor(serverName, serverFolderPath, config = {}) {
    this.serverName = serverName;
    this.serverFolderPath = path.resolve(serverFolderPath);
    this.config = config;
    this.log = "";
    this.process = null;
    this.status = 'stopped';
    this.stopCommand = config.stopCommand || "stop";
    this.restartAttempts = 0;
    this.players = new Set();
    this.tps = 0;
    this.systemMemoryUsage = { rss: 0, heapTotal: 0, heapUsed: 0 };
    this.uptime = 0;
    this._startTime = null;
    this.lastPlayerActivity = {};
    this.worldSize = 0;
    this.cpuUsage = 0;
    this.memoryUsage = 0;
    this.processStats = {};
    this._metricsInterval = null;
  }

  async monitorProcessResources() {
    if (this.process && this.process.pid) {
      try {
        const processes = await si.processes();
        const proc = processes.list.find(p => p.pid === this.process.pid);
        if (proc) {
          this.processStats = proc;
          this.cpuUsage = proc.cpu;
          this.memoryUsage = proc.memRss || proc.memory; // memRss is usually what you want in MB
        }
      } catch (error) {
        console.error(`Error al obtener métricas del proceso para ${this.serverName}: ${error.message}`);
      }
    }
  }

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
    this.log = `Iniciando servidor ${this.serverName}...\n`; // Reiniciar log al iniciar
    console.log(`Iniciando servidor ${this.serverName}...`);
    this._startTime = Date.now();

    let command, args;
    if (process.platform === 'win32') {
      command = startScript;
      args = [];
    } else {
      command = 'sh';
      args = [startScript];
    }

    this.process = spawn(command, args, {
      cwd: this.serverFolderPath,
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
      // Ya habías quitado encoding: 'utf8' de aquí, lo cual es correcto si vamos a usar setEncoding
    });
    emitter.emit('server:start', this.serverName);
    this.status = 'running';
    this.attachProcessListeners(); // Asegúrate de que esta llamada ocurra DESPUÉS de asignar this.process
    this.scheduleMetricsUpdate(10000);
  }

  attachProcessListeners() {
    if (!this.process) return;

    // **ARREGLO DE ENCODING AQUÍ**
    // Establecer la codificación a UTF-8 para que los datos se reciban como strings
    this.process.stdout.setEncoding('utf8');
    this.process.stderr.setEncoding('utf8');

    this.process.stdout.on('data', (data) => {
      // Ahora 'data' debería ser un string UTF-8
      this.handleOutput(data);
    });

    this.process.stderr.on('data', (data) => {
      // Ahora 'data' debería ser un string UTF-8
      this.handleOutput(data);
    });

    this.process.on('close', (code) => {
      this.status = 'stopped';
      this._startTime = null;
      this.uptime = 0;
      this.cpuUsage = 0;
      this.memoryUsage = 0;
      this.processStats = {};
      this.log += `\nProceso cerrado con código ${code}`;
      console.log(`Servidor ${this.serverName} detenido con código ${code}\n`);
      emitter.emit('server:close', this.serverName, code);
      if (this._metricsInterval) {
        clearInterval(this._metricsInterval);
        this._metricsInterval = null;
        console.log(`Intervalo de métricas detenido para ${this.serverName} al cerrarse el proceso.`);
      }
    });

    this.process.on('error', (err) => {
        this.status = 'stopped';
        this.log += `\nError al iniciar el proceso: ${err.message}`;
        console.error(`Error al iniciar el proceso del servidor ${this.serverName}: ${err.message}`);
        emitter.emit('server:error', this.serverName, err.message);
        if (this._metricsInterval) {
          clearInterval(this._metricsInterval);
          this._metricsInterval = null;
        }
    });
  }

  handleOutput(data) {
    // Con setEncoding('utf8') en los streams, data ya debería ser un string.
    // La verificación `typeof data !== 'string'` sigue siendo una buena práctica defensiva,
    // pero la conversión de Buffer a string aquí ya no debería ser necesaria.
    if (typeof data !== 'string') {
      console.warn(`[${this.serverName}] handleOutput recibió data que no es string:`, data);
      // Si por alguna razón setEncoding no funcionó o algo más pasó, intentamos convertir.
      if (Buffer.isBuffer(data)) {
        data = data.toString('utf8');
      } else {
        // Si no es Buffer ni string, no podemos procesarlo de forma segura como texto.
        console.error(`[${this.serverName}] Tipo de dato inesperado en handleOutput: ${typeof data}`);
        return;
      }
    }

    this.log += data;
    console.log(`[${this.serverName}] ${data.trimEnd()}`); // trimEnd() para quitar saltos de línea finales
    emitter.emit('server:output', this.serverName, data);

    if (!data.trim()) return; // Ignorar strings vacíos o solo con espacios

    const joinMatch = data.match(/(\w+) joined the game/);
    if (joinMatch && joinMatch[1]) {
      const player = joinMatch[1];
      this.players.add(player);
      console.log(`Jugador conectado: ${player} en ${this.serverName}`);
      emitter.emit('server:playerJoin', this.serverName, player);
    }

    const leaveMatch = data.match(/(\w+) left the game/);
    if (leaveMatch && leaveMatch[1]) {
      const player = leaveMatch[1];
      this.players.delete(player);
      console.log(`Jugador desconectado: ${player} de ${this.serverName}`);
      emitter.emit('server:playerLeave', this.serverName, player);
    }

    const listMatch = data.match(/There are (\d+) of a max of \d+ players online:(.*)/);
    if (listMatch) {
      const onlineCount = parseInt(listMatch[1], 10);
      this.players.clear();
      if (listMatch[2] && listMatch[2].trim()) {
        const playerNames = listMatch[2].trim().split(/,\s*/).map(name => name.trim());
        playerNames.forEach(player => {
          if (player) this.players.add(player);
        });
      }
      emitter.emit('server:playerListUpdate', this.serverName, Array.from(this.players));
    }

    const tpsPatterns = [
        /TPS from last 1m, 5m, 15m: (\d+\.?\d*)/,
        /Current TPS = (\d+\.?\d*)/,
        /TPS: (\d+\.?\d*)/
    ];

    for (const pattern of tpsPatterns) {
        const tpsMatch = data.match(pattern);
        if (tpsMatch && tpsMatch[1]) {
            const newTps = parseFloat(tpsMatch[1]);
            if (!isNaN(newTps)) {
                this.tps = newTps;
                emitter.emit('server:tpsUpdate', this.serverName, this.tps);
                break;
            }
        }
    }
  }

  sendCommand(command) {
    emitter.emit('server:command', this.serverName, command);
    if (this.process && this.process.stdin.writable) {
      this.process.stdin.write(command + "\n"); // Asegúrate de que el servidor espera un salto de línea
      this.log += `Comando enviado: ${command}\n`;
    } else {
      this.log += `\nNo se puede enviar el comando. El servidor ${this.serverName} no está activo.\n`;
      console.error(`No se puede enviar el comando. El servidor ${this.serverName} no está activo.`);
    }
  }

  getLogs(linesCount = 150) {
    const logLines = this.log.split('\n');
    return logLines.slice(-linesCount).join('\n');
  }

  updatePlayerList() {
    if (this.status === 'running') {
      this.sendCommand('list');
    } else {
      console.error(`No se puede obtener la lista de jugadores. El servidor ${this.serverName} no está activo.`);
    }
  }

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
    if (this._metricsInterval) {
      clearInterval(this._metricsInterval);
      this._metricsInterval = null;
    }

    if (this.status === 'running') {
      this._metricsInterval = setInterval(async () => {
        if (this.status !== 'running') { // Doble verificación
          clearInterval(this._metricsInterval);
          this._metricsInterval = null;
          console.log(`Intervalo de métricas detenido para ${this.serverName} porque el servidor no está en ejecución.`);
          return;
        }
        this.updateUptime();
        await this.monitorProcessResources();
      }, intervalMs);
      console.log(`Intervalo de métricas programado para ${this.serverName} cada ${intervalMs}ms.`);
    } else {
      console.log(`No se programó el intervalo de métricas para ${this.serverName} porque el servidor no está en ejecución.`);
    }
  }

  kill() {
    emitter.emit('server:kill', this.serverName);
    if (this.process && this.process.pid) {
      treekill(this.process.pid, (err) => {
        if (err) {
          console.error(`Error al matar el proceso ${this.process.pid} para ${this.serverName}: ${err}`);
        } else {
          this.log += `\nProceso ${this.process.pid} del servidor ${this.serverName} fue finalizado.\n`;
          console.log(`Proceso ${this.process.pid} del servidor ${this.serverName} fue finalizado.`);
        }
        // Estos estados deben actualizarse incluso si treekill falla,
        // ya que el proceso podría haber muerto de todas formas.
        this.status = 'stopped';
        this._startTime = null;
        this.uptime = 0;
        this.cpuUsage = 0;
        this.memoryUsage = 0;
        this.processStats = {};
        if (this._metricsInterval) {
          clearInterval(this._metricsInterval);
          this._metricsInterval = null;
        }
      });
    } else {
        this.status = 'stopped'; // Asegurar que el estado se actualice
        if (this._metricsInterval) { // Limpiar intervalo si no hay proceso
          clearInterval(this._metricsInterval);
          this._metricsInterval = null;
        }
    }
  }

  getOnlinePlayers() {
    return Array.from(this.players);
  }

  getPlayerHistory(hours = 24) {
    // Esta implementación es simplista y solo devuelve el estado actual.
    // Para un historial real, necesitarías almacenar eventos de conexión/desconexión con timestamps.
    return {
      uniquePlayers: Array.from(this.players),
      peakPlayerCount: this.players.size, // En el estado actual, no histórico
    };
  }

  getPlayerCount() {
    return this.players.size;
  }

  getServerMetrics() {
    return {
      serverName: this.serverName,
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

  getStatus() {
    return this.status;
  }

  getWorldStats() {
    // Deberías implementar la lógica para obtener el tamaño del mundo si es necesario.
    // fs.stat o librerías para calcular tamaño de directorio.
    return {
      worldName: path.basename(this.serverFolderPath), // Asume que la carpeta es el nombre del mundo
      worldSize: this.worldSize, // Debes calcular esto en otro lado
    };
  }
}

class ServerManager {
  constructor() {
    this.servers = new Map();
  }

  addServer(serverName, serverFolderPath, config = {}) {
    if (this.servers.has(serverName)) {
      return this.servers.get(serverName);
    }
    emitter.emit('server:add', serverName);
    const server = new MinecraftServer(serverName, serverFolderPath, config);
    this.servers.set(serverName, server);
    console.log(`Servidor ${serverName} agregado.`);
    return server;
  }

  removeServer(serverName) {
    if (this.servers.has(serverName)) {
      emitter.emit('server:remove', serverName);
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

  startServer(serverName) {
    const server = this.servers.get(serverName);
    if (server) {
      server.start();
    } else {
      console.error(`Servidor ${serverName} no registrado.`);
    }
  }

  stopServer(serverName) {
    const server = this.servers.get(serverName);
    if (server) {
      server.stop();
    } else {
      console.error(`Servidor ${serverName} no registrado.`);
    }
  }

  sendCommand(serverName, command) {
    const server = this.servers.get(serverName);
    if (server) {
      server.sendCommand(command);
    } else {
      console.error(`Servidor ${serverName} no registrado.`);
    }
  }

  getServerLogs(serverName, linesCount = 100) {
    const server = this.servers.get(serverName);
    if (server) {
      return server.getLogs(linesCount);
    }
    console.error(`Servidor ${serverName} no registrado.`);
    return null;
  }

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

  getServerMetrics(serverName) {
    const server = this.servers.get(serverName);
    if (server) {
      return server.getServerMetrics();
    }
    console.error(`Servidor ${serverName} no registrado.`);
    return null;
  }

  getAllServersMetrics() {
    const metrics = {};
    this.servers.forEach((server, name) => {
      metrics[name] = server.getServerMetrics();
    });
    return metrics;
  }
  
  getAllServers() {
    return Array.from(this.servers.values());
  }

  scheduleServerMetricsUpdate(serverName, intervalMs = 30000) {
    const server = this.servers.get(serverName);
    if (server) {
      server.scheduleMetricsUpdate(intervalMs);
      console.log(`Actualizaciones de métricas programadas para ${serverName} cada ${intervalMs}ms`);
    } else {
      console.error(`Servidor ${serverName} no registrado.`);
    }
  }

  killServer(serverName) { // Cambiado killserver a killServer por convención camelCase
    const server = this.servers.get(serverName);
    if (server) {
      server.kill();
    } else {
      console.error(`Servidor ${serverName} no registrado.`);
    }
  }
}
const defaultconfig = {
    serveractions: ["start", "stop", "restart", "kill"],
    fileactions: ["backup", "restore"],
    onerror: "restart",
    periodicallyrestart: false,
    periodicallybackup: false,
    timeout: {
        restart: 1440,
        backup: 1440
    }
}
// timeout = t * 60 *1000
class taskconfig {
   
}
const manager = new ServerManager();

export {
  manager,
  MinecraftServer,
  ServerManager
};