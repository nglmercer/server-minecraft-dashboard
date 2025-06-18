// minecraftServer.js
import { emitter } from '../sockets/Emitter.js';
import { MinecraftServer } from './servermanager/MinecraftServer.js'

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