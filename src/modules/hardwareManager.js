import os from 'os';
import si from 'systeminformation';

const isValidObject = (obj) =>
  obj && typeof obj === 'object' && Object.keys(obj).length > 0;

class Logger {
  constructor(enableLogs = true) {
    this.enableLogs = enableLogs;
  }

  log(...args) {
    if (this.enableLogs) {
      console.log('[LOG]', ...args);
    }
  }

  error(...args) {
    if (this.enableLogs) {
      console.error('[ERROR]', ...args);
    }
  }

  debug(...args) {
    if (this.enableLogs) {
      console.debug('[DEBUG]', ...args);
    }
  }
}

const logger = new Logger(false); // Cambia a true para ver logs de debug

// Detección de entorno Android/Termux
const isAndroid = process.platform === 'android' || process.env.TERMUX_VERSION !== undefined;

/**
 * Obtiene la información de carga de CPU y memoria, con manejo de errores.
 */
const fetchCpuAndMemory = async () => {
  logger.log('Iniciando fetchCpuAndMemory');
  let cpuLoad = {};
  let memInfo = {};

  try {
    cpuLoad = await si.currentLoad();
    logger.debug('Datos de carga CPU obtenidos:', cpuLoad);
  } catch (e) {
    logger.error('Error obteniendo currentLoad:', e);
  }

  try {
    memInfo = await si.mem();
    logger.debug('Datos de memoria obtenidos:', memInfo);
  } catch (e) {
    logger.error('Error obteniendo memoria:', e);
  }

  return { cpuLoad, memInfo };
};

/**
 * Obtiene datos de hardware (discos, CPU, tiempo, batería, gráficos) con
 * manejo individual de errores y alternativas para entornos Android.
 */
const fetchHardwareData = async () => {
  logger.log('Iniciando fetchHardwareData');

  let disks = [];
  let cpuInfo = {};
  let timeInfo = {};
  let batteryInfo = {};
  let graphicsInfo = {};

  // Intentar obtener información de discos
  try {
    disks = await si.fsSize();
    logger.debug('Datos de discos (fsSize) obtenidos:', disks);

    // En Android/Termux fsSize() puede no devolver datos; usar blockDevices como alternativa
    if ((!Array.isArray(disks) || disks.length === 0) && isAndroid) {
      disks = await si.blockDevices();
      logger.debug('Datos de discos (blockDevices) obtenidos en Android:', disks);
    }
  } catch (e) {
    logger.error('Error obteniendo discos:', e);
  }

  try {
    cpuInfo = await si.cpu();
    logger.debug('Datos de CPU obtenidos:', cpuInfo);
  } catch (e) {
    logger.error('Error obteniendo CPU:', e);
  }

  try {
    timeInfo = await si.time();
    logger.debug('Datos de tiempo obtenidos:', timeInfo);
  } catch (e) {
    logger.error('Error obteniendo tiempo:', e);
  }

  try {
    batteryInfo = await si.battery();
    logger.debug('Datos de batería obtenidos:', batteryInfo);
  } catch (e) {
    logger.error('Error obteniendo batería:', e);
  }

  try {
    graphicsInfo = await si.graphics();
    logger.debug('Datos de gráficos obtenidos:', graphicsInfo);
  } catch (e) {
    logger.error('Error obteniendo gráficos:', e);
  }

  return { disks, cpuInfo, timeInfo, batteryInfo, graphicsInfo };
};

const getResourcesUsage = async () => {
  logger.log('Iniciando getResourcesUsage');

  try {
    const { cpuLoad, memInfo } = await fetchCpuAndMemory();

    if (!isValidObject(cpuLoad)) {
      logger.error('Datos de CPU inválidos:', cpuLoad);
      throw new Error('Datos incompletos o inválidos de CPU');
    }
    if (!isValidObject(memInfo)) {
      logger.error('Datos de memoria inválidos:', memInfo);
      throw new Error('Datos incompletos o inválidos de memoria');
    }

    const usage = {
      cpu: Math.round(cpuLoad.currentLoad),
      ram: {
        total: memInfo.total,
        free: memInfo.free,
        used: memInfo.used,
        percent: memInfo.total
          ? Math.round((memInfo.used / memInfo.total) * 100)
          : 0,
        rawmemInfo: memInfo,
      },
    };

    logger.debug('Resultado de getResourcesUsage:', usage);
    return usage;
  } catch (error) {
    logger.error('getResourcesUsage encontró un error:', error);
    throw error;
  }
};


const getHardwareInfo = async () => {
  logger.log('Iniciando getHardwareInfo');

  try {
    const { disks, cpuInfo, timeInfo, batteryInfo, graphicsInfo } =
      await fetchHardwareData();

    // Validar datos obligatorios
    if (!isValidObject(cpuInfo)) {
      logger.error('Datos de CPU inválidos:', cpuInfo);
      throw new Error('Datos incompletos o inválidos de CPU');
    }
    if (!isValidObject(timeInfo)) {
      logger.error('Datos de tiempo inválidos:', timeInfo);
      throw new Error('Datos incompletos o inválidos de tiempo');
    }

    const info = {
      uptime: timeInfo.uptime ? Math.round(timeInfo.uptime) : 0,
      platform: {
        name: os.type(),
        release: os.release(),
        arch: process.arch,
        version: typeof os.version === 'function' ? os.version() : 'N/A',
      },
      totalmem: os.totalmem() ? Math.round(os.totalmem() / 1024 / 1024) : 0,
      cpu: {
        model: cpuInfo.brand || cpuInfo.model || 'N/A',
        speed: cpuInfo.speed || 'N/A',
        cores: cpuInfo.physicalCores || cpuInfo.cores || 'N/A',
        cache: cpuInfo.cache || 'N/A',
        rawCpuInfo: cpuInfo,
      },
      enviroment: process.env,
      networkInterfaces: os.networkInterfaces(),
    };

    // Agregar información de discos, con alternativas en caso de ausencia de datos
    if (Array.isArray(disks) && disks.length > 0) {
      info.disks = disks.map((disk) => ({
        filesystem: disk.fs || disk.name || 'N/A',
        total: disk.size || disk.total || 0,
        used: disk.used || 0,
        available: disk.available || 0,
        use: disk.use || disk.usePercent || 0,
        mount: disk.mount || disk.path || 'N/A',
        rawDiskInfo: disk,
      }));
      info.rawdisks = disks;
    } else {
      logger.log('No se encontraron discos.');
      info.disks = [];
    }

    // Batería: en Android es posible que no esté disponible, por lo que se omite si no es válida
    if (isValidObject(batteryInfo) && typeof batteryInfo.hasBattery !== 'undefined') {
      info.battery = {
        hasBattery: batteryInfo.hasBattery,
        cycleCount: batteryInfo.cycleCount,
        isCharging: batteryInfo.isCharging,
        percent: batteryInfo.percent,
        rawBatteryInfo: batteryInfo,
      };
    } else {
      logger.log('No se encontró información de batería.');
      info.battery = null;
    }

    // Gráficos: solo se incluyen si hay controladores detectados
    if (
      isValidObject(graphicsInfo) &&
      Array.isArray(graphicsInfo.controllers) &&
      graphicsInfo.controllers.length > 0
    ) {
      info.graphics = {
        controllers: graphicsInfo.controllers.map((ctrl) => ({
          model: ctrl.model || 'N/A',
          vendor: ctrl.vendor || 'N/A',
          vram: ctrl.vram || 0,
          rawGraphicsInfo: ctrl,
        })),
      };
    } else {
      logger.log('No se encontraron controladores gráficos.');
      info.graphics = null;
    }

    logger.debug('Resultado de getHardwareInfo:', info);
    return info;
  } catch (error) {
    logger.error('getHardwareInfo encontró un error:', error);
    throw error;
  }
};

export { getResourcesUsage, getHardwareInfo };
