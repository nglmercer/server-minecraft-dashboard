import os from 'os';
import si from 'systeminformation';

// Función para verificar si un objeto es válido
const isValidObject = (obj) => {
  return obj && typeof obj === 'object' && Object.keys(obj).length > 0;
};

// ======================
// Funciones Auxiliares
// ======================

// Obtener datos de CPU y memoria
const fetchCpuAndMemory = async () => {
  //console.log("[DEBUG] Iniciando fetchCpuAndMemory");
  const cpuLoad = await si.currentLoad();
  //console.log("[DEBUG] Datos de carga CPU obtenidos:", cpuLoad);
  const memInfo = await si.mem();
  //console.log("[DEBUG] Datos de memoria obtenidos:", memInfo);
  return { cpuLoad, memInfo };
};

// Obtener datos de hardware (discos, CPU, tiempo, batería, gráficos)
const fetchHardwareData = async () => {
  //console.log("[DEBUG] Iniciando fetchHardwareData");
  const [disks, cpuInfo, timeInfo, batteryInfo, graphicsInfo] = await Promise.all([
    si.fsSize(), si.cpu(), si.time(), si.battery(), si.graphics()
  ]);
  //console.log("[DEBUG] Datos de discos obtenidos:", disks);
  //console.log("[DEBUG] Datos de CPU obtenidos:", cpuInfo);
  //console.log("[DEBUG] Datos de tiempo obtenidos:", timeInfo);
  //console.log("[DEBUG] Datos de batería obtenidos:", batteryInfo);
  //console.log("[DEBUG] Datos de gráficos obtenidos:", graphicsInfo);
  return { disks, cpuInfo, timeInfo, batteryInfo, graphicsInfo };
};

// ======================
// Funciones Principales
// ======================

// Obtener uso de recursos (CPU y RAM)
const getResourcesUsage = async (cb) => {
  //console.log("[DEBUG] Iniciando getResourcesUsage");
  try {
    const { cpuLoad, memInfo } = await fetchCpuAndMemory();

    if (!isValidObject(cpuLoad)) {
      console.error("[ERROR] Datos de CPU inválidos:", cpuLoad);
      throw new Error("Datos incompletos o inválidos");
    }
    if (!isValidObject(memInfo)) {
      console.error("[ERROR] Datos de memoria inválidos:", memInfo);
      throw new Error("Datos incompletos o inválidos");
    }

    const usage = {
      cpu: Math.round(cpuLoad.currentLoad),
      ram: {
        total: memInfo.total,
        free: memInfo.free,
        used: memInfo.used,
        percent: Math.round((memInfo.used / memInfo.total) * 100),
        rawmemInfo: memInfo,
      }
    };

    //console.log("[DEBUG] Resultado de getResourcesUsage:", usage);
    cb(usage);
  } catch (error) {
    console.error("[ERROR] getResourcesUsage encontró un error:", error);
    cb({ error: "Error al obtener uso de recursos" });
  }
};

// Obtener información del hardware y sistema
const getHardwareInfo = async (cb) => {
  //console.log("[DEBUG] Iniciando getHardwareInfo");
  try {
    const { disks, cpuInfo, timeInfo, batteryInfo, graphicsInfo } = await fetchHardwareData();

    // Validaciones para datos obligatorios
    if (!isValidObject(cpuInfo)) {
      console.error("[ERROR] Datos de CPU inválidos:", cpuInfo);
      throw new Error("Datos incompletos o inválidos");
    }
    if (!isValidObject(timeInfo)) {
      console.error("[ERROR] Datos de tiempo inválidos:", timeInfo);
      throw new Error("Datos incompletos o inválidos");
    }
    if (!isValidObject(batteryInfo)) {
      console.error("[ERROR] Datos de batería inválidos:", batteryInfo);
      throw new Error("Datos incompletos o inválidos");
    }

    // Armado del objeto de respuesta
    const info = {
      uptime: Math.round(timeInfo.uptime),
      platform: {
        name: os.type(),
        release: os.release(),
        arch: process.arch,
        version: os.version(),
      },
      totalmem: Math.round(os.totalmem() / 1024 / 1024),
      cpu: {
        model: cpuInfo.brand,
        speed: cpuInfo.speed,
        cores: cpuInfo.physicalCores,
        cache: cpuInfo.cache,
        rawCpuInfo: cpuInfo,
      },
      enviroment: process.env,
      networkInterfaces: os.networkInterfaces()
    };

    // Agregar discos si existen
    if (Array.isArray(disks) && disks.length > 0) {
      info.disks = disks.map(disk => ({
        filesystem: disk.fs,
        total: disk.size,
        used: disk.used,
        available: disk.available,
        use: disk.use,
        mount: disk.mount,
        rawDiskInfo: disk,
      }));
      info.rawdisks = disks;
    } else {
      //console.log("[DEBUG] No se encontraron discos.");
    }

    // Agregar batería (siempre se espera que esté disponible; en caso de no existir, podría omitirse de manera similar)
    if (isValidObject(batteryInfo)) {
      info.battery = {
        hasBattery: batteryInfo.hasBattery,
        cycleCount: batteryInfo.cycleCount,
        isCharging: batteryInfo.isCharging,
        percent: batteryInfo.percent,
        rawBatteryInfo: batteryInfo,
      };
    }

    // Agregar gráficos solo si se encuentran controladores
    if (isValidObject(graphicsInfo) && Array.isArray(graphicsInfo.controllers) && graphicsInfo.controllers.length > 0) {
      info.graphics = {
        controllers: graphicsInfo.controllers.map(ctrl => ({
          model: ctrl.model,
          vendor: ctrl.vendor,
          vram: ctrl.vram,
          rawGraphicsInfo: ctrl,
        }))
      };
    } else {
      //console.log("[DEBUG] No se encontraron controladores gráficos.");
    }

    //console.log("[DEBUG] Resultado de getHardwareInfo:", info);
    cb(info);
  } catch (error) {
    console.error("[ERROR] getHardwareInfo encontró un error:", error);
    cb({ error: "Error al obtener información del hardware" });
  }
};

export {
  getResourcesUsage,
  getHardwareInfo
};
