class WebDebugger {
    static isEnabled = true;
    static callSites = new Map();
    
    static toggleLogs(enable = !this.isEnabled) {
      this.isEnabled = enable;
    }
  
    static registerCallSite(file, line) {
      const error = new Error();
      // Agregar marca única para identificación más fácil
      error.isDebugMarker = true;
      this.callSites.set(error, { file, line });
      return error;
    }
  
    static log(...args) {
      if (!this.isEnabled) return;
  
      const error = new Error();
      const stackLines = error.stack?.split('\n') || [];
      let callerInfo = { file: 'Unknown', line: '0' };
  
      // Regex mejorado para múltiples formatos de stack trace
      const stackRegex = /(\S+):(\d+):(\d+)/;
      
      // Buscar primera línea relevante en el stack
      for (const line of stackLines.slice(2)) {
        const match = line.match(stackRegex);
        if (match) {
          callerInfo = { file: match[1], line: match[2] };
          break;
        }
      }
  
      // Buscar ubicación registrada usando marca
      const registeredSite = Array.from(this.callSites.entries()).find(([key]) => {
        return stackLines.some(line => line.includes(key.stack.split('\n')[0]));
      });
  
      if (registeredSite) {
        callerInfo = registeredSite[1];
        this.callSites.delete(registeredSite[0]);
      }
  
      const label = `${callerInfo.file}:${callerInfo.line}`;
      
      console.groupCollapsed(
        `%cDebug [${label}]`, 
        'color: #4CAF50; font-weight: bold; cursor: pointer;'
      );
      
      console.log(`%cCaller: ${label}`, 'color: #9E9E9E; font-size: 0.8em;');
      
      args.forEach(arg => {
        if (arg instanceof Error) {
          console.error('%cError:', 'color: #ff4444;', arg);
        } else if (typeof arg === 'object') {
          console.dir(arg);
        } else {
          console.log(arg);
        }
      });
      
      console.groupEnd();
    }
  
    static getcallSites() {
      return this.callSites;
    }
  }
  class DebuggerGroup {
    constructor(name) {
      this.name = name;
      this.isEnabled = true;
      this.callSites = new Map();
    }
  
    registerCallSite(file, line) {
      const error = new Error();
      this.callSites.set(error, { file, line });
      return error;
    }
  
    toggle(enable = !this.isEnabled) {
      this.isEnabled = enable;
    }
  
    log(...args) {
      if (!this.isEnabled) return;
  
      const error = new Error();
      const stackLines = error.stack?.split('\n') || [];
      let callerInfo = { file: 'Unknown', line: '0' };
  
      // Extracción de ubicación
      const stackRegex = /(\S+):(\d+):(\d+)/;
      for (const line of stackLines.slice(2)) {
        const match = line.match(stackRegex);
        if (match) {
          callerInfo = { file: match[1], line: match[2] };
          break;
        }
      }
  
      // Buscar ubicación registrada
      const registeredSite = Array.from(this.callSites.entries()).find(([key]) => {
        return stackLines.some(line => line.includes(key.stack.split('\n')[0]));
      });
  
      if (registeredSite) {
        callerInfo = registeredSite[1];
        this.callSites.delete(registeredSite[0]);
      }
  
      const label = `${callerInfo.file}:${callerInfo.line}`;
      
      console.groupCollapsed(
        `%c${this.name} [${label}]`, 
        'color: #4CAF50; font-weight: bold; cursor: pointer;'
      );
      
      console.log(`%cCaller: ${label}`, 'color: #9E9E9E; font-size: 0.8em;');
      
      args.forEach(arg => {
        if (arg instanceof Error) {
          console.error('%cError:', 'color: #ff4444;', arg);
        } else if (typeof arg === 'object') {
          console.dir(arg);
        } else {
          console.log(arg);
        }
      });
      
      console.groupEnd();
    }
  }
  
  class DebuggerGroupManager {
    static groups = new Map();
  
    static create(name) {
      if (!this.groups.has(name)) {
        this.groups.set(name, new DebuggerGroup(name));
      }
      return this.groups.get(name);
    }
  
    static get(name) {
      return this.groups.get(name);
    }
  
    static toggleGroup(name, enable) {
      const group = this.groups.get(name);
      if (group) group.toggle(enable);
    }
  
    static toggleAll(enable) {
      this.groups.forEach(group => group.toggle(enable));
    }
  }
  var uiDebugger = DebuggerGroupManager.create('UI');   
