import os from 'os';
import si from 'systeminformation';

// Obtener uso de recursos (CPU y RAM)
export const getResourcesUsage = (cb) => {
    Promise.all([si.currentLoad(), si.mem()])
        .then(([cpuLoad, memInfo]) => {
            cb({
                cpu: Math.round(cpuLoad.currentLoad),
                ram: {
                    total: memInfo.total,
                    free: memInfo.free,
                    used: memInfo.used,
                    percent: Math.round((memInfo.used / memInfo.total) * 100)
                }
            });
        })
        .catch(error => {
            console.error(error);
            cb({ error: "Error al obtener uso de recursos" });
        });
};

// Obtener información del hardware y sistema
export const getHardwareInfo = (cb) => {
    Promise.all([si.fsSize(), si.cpu(), si.time()])
        .then(([disks, cpuInfo, timeInfo]) => {
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
                    cores: cpuInfo.physicalCores
                },
                enviroment: process.env,
                disks: disks.map(disk => ({
                    filesystem: disk.fs,
                    total: disk.size,
                    used: disk.used,
                    available: disk.available,
                    use: disk.use,
                    mount: disk.mount
                })),
                rawdisks: disks,
                networkInterfaces: os.networkInterfaces()
            });
        })
        .catch(error => {
            console.error(error);
            cb({ error: "Error al obtener información del hardware" });
        });
};
