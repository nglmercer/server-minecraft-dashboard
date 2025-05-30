import os from 'os';
import si from 'systeminformation';

// --- Logger Class (sin cambios) ---
class Logger {
  constructor(enableLogs = true) {
    this.enableLogs = enableLogs;
  }
  log(...args) { if (this.enableLogs) console.log('[LOG]', ...args); }
  error(...args) { if (this.enableLogs) console.error('[ERROR]', ...args); }
  debug(...args) { if (this.enableLogs) console.debug('[DEBUG]', ...args); }
}
const logger = new Logger(process.env.NODE_ENV === 'development'); // Habilitar logs en desarrollo

// --- Helper Functions ---
const isValidObject = (obj) =>
  obj && typeof obj === 'object' && Object.keys(obj).length > 0;

const isAndroid = process.platform === 'android' || process.env.TERMUX_VERSION !== undefined;

// --- Cache para Hardware Info ---
let cachedHardwareInfo = null;
let hardwareInfoPromise = null;


// --- Funciones de obtención de datos ---

/**
 * Obtiene la información de carga de CPU y memoria actual.
 * Esta función NO usa caché ya que los datos son dinámicos.
 */
const fetchCpuAndMemoryLoad = async () => {
  logger.log('Fetching CPU and Memory load');
  let cpuLoad = {};
  let memInfo = {};

  try {
    cpuLoad = await si.currentLoad();
    logger.debug('CPU load data:', cpuLoad);
  } catch (e) {
    logger.error('Error fetching currentLoad:', e.message);
  }

  try {
    memInfo = await si.mem();
    logger.debug('Memory data:', memInfo);
  } catch (e) {
    logger.error('Error fetching memory info:', e.message);
  }

  return { cpuLoad, memInfo };
};
/**
 * Obtiene datos dinámicos que siempre deben actualizarse (uptime y networkInterfaces)
 */
const fetchDynamicData = async () => {
  logger.log('Fetching dynamic data (uptime and network interfaces)');
  
  let timeInfo = {};
  
  try {
    timeInfo = await si.time();
    logger.debug('Time data:', timeInfo);
  } catch (e) {
    logger.error('Error fetching time info:', e.message);
  }

  const networkInterfaces = os.networkInterfaces();
  
  return {
    uptime: timeInfo.uptime ? Math.round(timeInfo.uptime) : 0,
    networkInterfaces
  };
};

/**
 * Obtiene datos estáticos de hardware (discos, CPU, batería, gráficos).
 * Estos datos son más propensos a ser cacheados.
 */
const fetchStaticHardwareData = async () => {
  logger.log('Fetching static hardware data');

  let disks = [];
  let cpuInfo = {};
  let timeInfo = {};
  let batteryInfo = {};
  let graphicsInfo = {};

  const results = await Promise.allSettled([
    si.fsSize(),
    si.cpu(),
    si.time(),
    si.battery(),
    si.graphics(),
  ]);

  // Procesar resultados de fsSize y alternativa para Android
  if (results[0].status === 'fulfilled') {
    disks = results[0].value;
    logger.debug('Disk data (fsSize):', disks);
    if ((!Array.isArray(disks) || disks.length === 0) && isAndroid) {
      try {
        disks = await si.blockDevices();
        logger.debug('Disk data (blockDevices) for Android:', disks);
      } catch (e) {
        logger.error('Error fetching blockDevices for Android:', e.message);
      }
    }
  } else {
    logger.error('Error fetching fsSize:', results[0].reason?.message);
  }

  // Procesar CPU info
  if (results[1].status === 'fulfilled') {
    cpuInfo = results[1].value;
    logger.debug('CPU data:', cpuInfo);
  } else {
    logger.error('Error fetching CPU info:', results[1].reason?.message);
  }

  // Procesar Time info
  if (results[2].status === 'fulfilled') {
    timeInfo = results[2].value;
    logger.debug('Time data:', timeInfo);
  } else {
    logger.error('Error fetching Time info:', results[2].reason?.message);
  }

  // Procesar Battery info
  if (results[3].status === 'fulfilled') {
    batteryInfo = results[3].value;
    logger.debug('Battery data:', batteryInfo);
  } else {
    logger.error('Error fetching Battery info:', results[3].reason?.message);
  }

  // Procesar Graphics info
  if (results[4].status === 'fulfilled') {
    graphicsInfo = results[4].value;
    logger.debug('Graphics data:', graphicsInfo);
  } else {
    logger.error('Error fetching Graphics info:', results[4].reason?.message);
  }

  return { disks, cpuInfo, timeInfo, batteryInfo, graphicsInfo };
};
// --- Funciones exportadas ---

/**
 * Obtiene el uso actual de recursos (CPU y RAM).
 * Devuelve datos frescos en cada llamada.
 */
export const getResourcesUsage = async () => {
  logger.log('Initiating getResourcesUsage');

  try {
    const { cpuLoad, memInfo } = await fetchCpuAndMemoryLoad();

    if (!isValidObject(cpuLoad) || typeof cpuLoad.currentLoad === 'undefined') {
      logger.error('Invalid CPU load data:', cpuLoad);
      // Podríamos devolver un valor por defecto o lanzar un error más específico
      // Por ahora, si currentLoad no está, asumimos 0 para evitar NaN.
    }
    if (!isValidObject(memInfo)) {
      logger.error('Invalid memory data:', memInfo);
      throw new Error('Incomplete or invalid memory data');
    }

    const usage = {
      cpu: Math.round(cpuLoad.currentLoad ?? 0), // Usar 0 si currentLoad es undefined
      ram: {
        total: memInfo.total ?? 0,
        free: memInfo.free ?? 0,
        used: memInfo.used ?? 0,
        percent: (memInfo.total && memInfo.used)
          ? Math.round((memInfo.used / memInfo.total) * 100)
          : 0,
        rawmemInfo: memInfo,
      },
    };

    logger.debug('Result of getResourcesUsage:', usage);
    return usage;
  } catch (error) {
    logger.error('getResourcesUsage encountered an error:', error.message);
    // Considerar devolver un objeto de error estandarizado o valores por defecto
    // en lugar de solo re-lanzar para que el consumidor pueda manejarlo mejor.
    // Por ahora, mantenemos el re-lanzamiento.
    throw error;
  }
};

/**
 * Obtiene información detallada del hardware.
 * Utiliza un sistema de caché para devolver datos previamente obtenidos si están disponibles,
 * pero siempre actualiza uptime y networkInterfaces ya que son datos dinámicos.
 */
export const getHardwareInfo = async () => {
  // Siempre obtener datos dinámicos (uptime y networkInterfaces)
  const dynamicData = await fetchDynamicData();
  
  if (cachedHardwareInfo) {
    logger.log('Returning cached hardware info with updated dynamic data');
    // Actualizar solo los campos dinámicos en la info cacheada
    return {
      ...cachedHardwareInfo,
      uptime: dynamicData.uptime,
      networkInterfaces: dynamicData.networkInterfaces
    };
  }

  if (hardwareInfoPromise) {
    logger.log('Waiting for ongoing hardware info fetch');
    const hardwareInfo = await hardwareInfoPromise;
    // Actualizar los datos dinámicos después de obtener la info
    return {
      ...hardwareInfo,
      uptime: dynamicData.uptime,
      networkInterfaces: dynamicData.networkInterfaces
    };
  }

  logger.log('Fetching hardware info (first time or after reset)');
  
  // Creamos la promesa y la asignamos para que llamadas concurrentes la esperen
  hardwareInfoPromise = (async () => {
    try {
      const { disks, cpuInfo, timeInfo, batteryInfo, graphicsInfo } =
        await fetchStaticHardwareData();

      if (!isValidObject(cpuInfo)) throw new Error('Incomplete or invalid CPU data');
      if (!isValidObject(timeInfo)) throw new Error('Incomplete or invalid Time data');

      const info = {
        uptime: timeInfo.uptime ? Math.round(timeInfo.uptime) : 0,
        platform: {
          name: os.type(),
          release: os.release(),
          arch: process.arch,
          version: typeof os.version === 'function' ? os.version() : 'N/A',
        },
        totalmem: os.totalmem() ? Math.round(os.totalmem() / 1024 / 1024) : 0, // en MB
        cpu: {
          model: cpuInfo.brand || cpuInfo.manufacturer || 'N/A', // 'model' en cpuInfo suele ser un identificador, 'brand' es más descriptivo
          speed: cpuInfo.speed || 'N/A', // en GHz
          cores: cpuInfo.physicalCores || cpuInfo.cores || 'N/A',
          cache: cpuInfo.cache || {}, // Devolver objeto vacío si no hay caché
          rawCpuInfo: cpuInfo,
        },
        enviroment: process.env,
        networkInterfaces: os.networkInterfaces(),
        disks: [], // Inicializar para evitar errores si no hay discos
        rawdisks: [],
        battery: null,
        graphics: null,
      };

      if (Array.isArray(disks) && disks.length > 0) {
        info.disks = disks.map((disk) => ({
          filesystem: disk.fs || disk.name || 'N/A',
          total: disk.size || 0, // 'size' es el campo más común para el total en fsSize y blockDevices
          used: disk.used || 0,
          available: disk.available || (disk.size && disk.used ? disk.size - disk.used : 0), // Calcular si no está disponible
          use: disk.use || (disk.size && disk.used ? parseFloat(((disk.used / disk.size) * 100).toFixed(2)) : 0),
          mount: disk.mount || disk.path || 'N/A',
          rawDiskInfo: disk,
        }));
        info.rawdisks = disks;
      } else {
        logger.log('No disk information found or disks array is empty.');
      }

      if (isValidObject(batteryInfo) && typeof batteryInfo.hasBattery !== 'undefined') {
        info.battery = {
          hasBattery: batteryInfo.hasBattery,
          cycleCount: batteryInfo.cycleCount ?? 'N/A',
          isCharging: batteryInfo.isCharging ?? 'N/A',
          percent: batteryInfo.percent ?? 'N/A',
          rawBatteryInfo: batteryInfo,
        };
      } else {
        logger.log('No valid battery information found.');
      }

      if (
        isValidObject(graphicsInfo) &&
        Array.isArray(graphicsInfo.controllers) &&
        graphicsInfo.controllers.length > 0
      ) {
        info.graphics = {
          controllers: graphicsInfo.controllers.map((ctrl) => ({
            model: ctrl.model || 'N/A',
            vendor: ctrl.vendor || 'N/A',
            vram: ctrl.vram || 0, // en MB
            rawGraphicsInfo: ctrl,
          })),
        };
      } else {
        logger.log('No graphics controllers found.');
      }

      cachedHardwareInfo = info; // Guardar en caché
      logger.debug('Hardware info fetched and cached:', info);
      return info;
    } catch (error) {
      logger.error('getHardwareInfo encountered an error during fetch:', error.message);
      hardwareInfoPromise = null; // Importante: resetear la promesa en caso de error para permitir reintentos
      throw error; // Re-lanzar para que el llamador sepa del error
    }
    // No necesitamos un 'finally' para nullificar hardwareInfoPromise si tuvo éxito,
    // porque la próxima llamada encontrará cachedHardwareInfo primero.
  })();

  const hardwareInfo = await hardwareInfoPromise;
  
  // Actualizar con los datos dinámicos más recientes
  return {
    ...hardwareInfo,
    uptime: dynamicData.uptime,
    networkInterfaces: dynamicData.networkInterfaces
  };
};

/**
 * Reinicia la caché de información de hardware.
 * Útil si se sabe que algo cambió o para propósitos de prueba.
 */
export const resetHardwareInfoCache = () => {
  logger.log('Resetting hardware info cache');
  cachedHardwareInfo = null;
  hardwareInfoPromise = null; // También resetea la promesa en curso
};