import os from 'os';
import si from 'systeminformation';

// Función para verificar si un objeto es válido
const isValidObject = (obj) => {
    return obj && typeof obj === 'object' && Object.keys(obj).length > 0;
};

// Obtener uso de recursos (CPU y RAM)
export const getResourcesUsage = (cb) => {
    try {
        Promise.all([si.currentLoad(), si.mem()])
            .then(([cpuLoad, memInfo]) => {
                // Verificar que los datos obtenidos son válidos
                if (!isValidObject(cpuLoad) || !isValidObject(memInfo)) {
                    throw new Error("Datos incompletos o inválidos");
                }

                cb({
                    cpu: Math.round(cpuLoad.currentLoad),
                    ram: {
                        total: memInfo.total,
                        free: memInfo.free,
                        used: memInfo.used,
                        percent: Math.round((memInfo.used / memInfo.total) * 100),
                        rawmemInfo: memInfo, // Datos sin procesar
                    }
                });
            })
            .catch(error => {
                console.error(error);
                cb({ error: "Error al obtener uso de recursos" });
            });
    } catch (error) {
        console.error("Error crítico:", error);
        cb({ error: "Error crítico al obtener uso de recursos" });
    }
};

// Obtener información del hardware y sistema
export const getHardwareInfo = (cb) => {
    try {
        Promise.all([si.fsSize(), si.cpu(), si.time(), si.battery(), si.graphics()])
            .then(([disks, cpuInfo, timeInfo, batteryInfo, graphicsInfo]) => {
                // Verificar que los datos obtenidos son válidos
                if (
                    !isValidObject(disks) ||
                    !isValidObject(cpuInfo) ||
                    !isValidObject(timeInfo) ||
                    !isValidObject(batteryInfo) ||
                    !isValidObject(graphicsInfo)
                ) {
                    throw new Error("Datos incompletos o inválidos");
                }

                cb({
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
                        rawCpuInfo: cpuInfo, // Datos sin procesar
                    },
                    enviroment: process.env,
                    disks: disks.map(disk => ({
                        filesystem: disk.fs,
                        total: disk.size,
                        used: disk.used,
                        available: disk.available,
                        use: disk.use,
                        mount: disk.mount,
                        rawDiskInfo: disk, // Datos sin procesar
                    })),
                    rawdisks: disks,
                    battery: {
                        hasBattery: batteryInfo.hasBattery,
                        cycleCount: batteryInfo.cycleCount,
                        isCharging: batteryInfo.isCharging,
                        percent: batteryInfo.percent,
                        rawBatteryInfo: batteryInfo, // Datos sin procesar
                    }, // Añadida información de la batería
                    graphics: {
                        controllers: graphicsInfo.controllers.map(ctrl => ({
                            model: ctrl.model,
                            vendor: ctrl.vendor,
                            vram: ctrl.vram,
                            rawGraphicsInfo: ctrl, // Datos sin procesar
                        }))
                    }, // Añadida información de gráficos
                    networkInterfaces: os.networkInterfaces()
                });
            })
            .catch(error => {
                console.error(error);
                cb({ error: "Error al obtener información del hardware" });
            });
    } catch (error) {
        console.error("Error crítico:", error);
        cb({ error: "Error crítico al obtener información del hardware" });
    }
};