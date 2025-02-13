import path from "path";
import fs from "fs";
import { execSync } from 'child_process';
import axios from "axios";
import { TASK_MANAGER, addDownloadTask, unpackArchive } from "../modules/taskmanager.js";
import { logger } from "../utils/utils.js";

//import { createRequire } from 'module';
//const require = createRequire(import.meta.url);
// Helper function to fetch data from a URL using axios
const fetchData = async (url) => {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        return null;
    }
};

// Detectar si estamos en Termux (Android)
const isTermux = () => {
    return process.platform === 'android' || fs.existsSync('/data/data/com.termux');
};

// Convertir versión del juego a versión Java requerida
const gameVersionToJava = (version) => {
    const [, sec, ter] = version.split(".").map(Number);
    if (!version) return 18;
    if (sec <= 8) return 8;
    if (sec <= 11) return 11;
    if (sec <= 15) return 11;
    if (sec === 16) return ter <= 4 ? 11 : 16;
    if (sec >= 21) return 21;
    return 18;
};

// Obtener la arquitectura del sistema
const getArchitecture = () => {
    const archMap = {
        'arm': 'arm',
        'arm64': 'aarch64',
        'x64': 'x86_64'
    };
    return archMap[process.arch] || null;
};

// Instalar Java en Termux
const installJavaTermux = async (version) => {
    const arch = getArchitecture();
    if (!arch) throw new Error('Arquitectura no soportada');

    const packagesUrl = `https://packages.termux.org/apt/termux-main/dists/stable/main/binary-${arch}/Packages`;
    const packagesData = execSync(`curl -sL ${packagesUrl}`).toString();
    const packageBlock = packagesData.split('\n\n').find(block => 
        block.includes(`Package: openjdk-${version}`)
    );

    if (!packageBlock) throw new Error(`OpenJDK ${version} no está disponible`);

    const filename = packageBlock.split('\n')
        .find(line => line.startsWith('Filename: '))
        .split(' ')[1];

    const debUrl = `https://packages.termux.org/apt/termux-main/${filename}`;
    execSync(`curl -LO ${debUrl}`, { stdio: 'inherit' });
    execSync(`dpkg -i ${filename.split('/').pop()}`, { stdio: 'inherit' });
    execSync('apt-get install -f -y', { stdio: 'inherit' });

    return await verifyJavaInstallation(version);
};

// Verificar si una versión específica de Java está instalada en Termux
const checkJavaVersionTermux = (version) => {
    try {
        const output = execSync('dpkg -l | grep openjdk').toString();
        return output.includes(`openjdk-${version}`);
    } catch (error) {
        return false;
    }
};

// Obtener versiones descargables de Java
const getDownloadableJavaVersions = async () => {
    if (isTermux()) {
        try {
            const output = execSync('pkg search "^openjdk-[0-9]+"').toString();
            const matches = output.match(/openjdk-(\d+)/g) || [];
            const versions = matches
                .map(v => v.replace('openjdk-', ''))
                .filter(v => {
                    const num = parseInt(v);
                    return !isNaN(num) && num >= 8 && num <= 21;
                })
                .sort((a, b) => b - a);
            return [...new Set(versions)];
        } catch (error) {
            console.error('Error obteniendo versiones:', error);
            return [];
        }
    }

    const data = await fetchData("https://api.adoptium.net/v3/info/available_releases");
    return data ? data.available_releases.map(release => release.toString()) : [];
};

// Obtener versiones locales de Java
const getLocalJavaVersions = () => {
    if (isTermux()) {
        try {
            const output = execSync('dpkg -l | grep openjdk').toString();
            return output.match(/openjdk-(\d+)/g)
                ?.map(v => v.replace('openjdk-', '')) || [];
        } catch (error) {
            try {
                execSync('which java');
                const versionOutput = execSync('java -version 2>&1').toString();
                const version = versionOutput.match(/version "(\d+)/);
                return version ? [version[1]] : [];
            } catch {
                console.log('No Java installation found');
                return [];
            }
        }
    }

    const startPath = "./binaries/java";
    if (!fs.existsSync(startPath)) return [];
    return fs.readdirSync(startPath)
        .filter(entry => fs.lstatSync(path.join(startPath, entry)).isDirectory());
};

const getJavaInfoByVersion = (javaVersion) => {
    if (typeof javaVersion !== 'string') javaVersion = String(javaVersion ?? '');
    console.log(javaVersion);

    if (isTermux()) {
        return {
            isTermux: true,
            version: javaVersion,
            packageName: `openjdk-${javaVersion}`,
            installCmd: `pkg install openjdk-${javaVersion}`,
            javaPath: '/data/data/com.termux/files/usr/bin/java',
            installed: checkJavaVersionTermux(javaVersion),
            absoluteJavaPath: '/data/data/com.termux/files/usr/bin/java'
        };
    }

    const platformMap = {
        'win32': { name: 'windows', ext: '.zip' },
        'linux': { name: 'linux', ext: '.tar.gz' }
    };

    const archMap = {
        'x64': 'x64',
        'x32': 'x86',
        'arm64': 'aarch64',
        'arm': 'arm'
    };

    const platform = platformMap[process.platform];
    const arch = archMap[process.arch];

    if (!platform || !arch) return false;

    const resultURL = `https://api.adoptium.net/v3/binary/latest/${javaVersion}/ga/${platform.name}/${arch}/jdk/hotspot/normal/eclipse?project=jdk`;
    const filename = `Java-${javaVersion}-${arch}${platform.ext}`;
    
    const relativeDownloadPath = path.join('./binaries/java', filename);
    const relativeUnpackPath = path.join('./binaries/java', javaVersion);

    const absoluteDownloadPath = path.resolve(relativeDownloadPath);
    const absoluteUnpackPath = path.resolve(relativeUnpackPath);

    // Asegurar que los directorios existan antes de leerlos
    const javaDir = path.resolve('./binaries/java');
    if (!fs.existsSync(javaDir)) {
        fs.mkdirSync(javaDir, { recursive: true });
    }

    // Verificar la estructura de carpetas después de la descompresión
    let javaBinPath = path.join(absoluteUnpackPath, 'bin');
    if (!fs.existsSync(javaBinPath) && fs.existsSync(absoluteUnpackPath)) {
        const files = fs.readdirSync(absoluteUnpackPath);
        const jdkFolder = files.find(file => file.startsWith('jdk-'));
        if (jdkFolder) {
            javaBinPath = path.join(absoluteUnpackPath, jdkFolder, 'bin');
        }
        console.log("javaBinPath", javaBinPath);
    }

    return {
        url: resultURL,
        filename,
        version: javaVersion,
        platformArch: arch,
        platformName: platform.name,
        downloadPath: relativeDownloadPath,
        unpackPath: relativeUnpackPath,
        absoluteDownloadPath,
        absoluteUnpackPath,
        javaBinPath
    };
};


// Obtener ruta de Java
const getJavaPath = (javaVersion) => {
    if (isTermux()) {
        const termuxJavaPath = '/data/data/com.termux/files/usr/bin/java';
        if (fs.existsSync(termuxJavaPath)) {
            try {
                const output = execSync(`${termuxJavaPath} -version 2>&1`).toString();
                const installedVersion = output.match(/version "(\d+)/)[1];
                if (installedVersion === javaVersion.toString()) {
                    return termuxJavaPath;
                }
            } catch (error) {
                console.error('Error verificando versión de Java:', error);
            }
        }
        return false;
    }

    const javaDirPath = path.join('./binaries/java', javaVersion);
    const javaSearchPath = path.join(javaDirPath, 'bin', 'java') + (process.platform === 'win32' ? '.exe' : '');

    if (fs.existsSync(javaDirPath) && fs.lstatSync(javaDirPath).isDirectory()) {
        if (fs.existsSync(javaSearchPath)) {
            return javaSearchPath;
        } else {
            const javaReaddir = fs.readdirSync(javaDirPath);
            if (javaReaddir.length === 1) {
                const javaChkPath = path.join(javaDirPath, javaReaddir[0], 'bin', 'java') + (process.platform === 'win32' ? '.exe' : '');
                if (fs.existsSync(javaChkPath)) {
                    return javaChkPath;
                }
            }
        }
    }
    return false;
};

// Verificar si Java está instalado y es funcional
const verifyJavaInstallation = async (version) => {
    const javaPath = getJavaPath(version);
    if (!javaPath) return false;

    try {
        execSync(`"${javaPath}" -version`);
        return true;
    } catch (error) {
        return false;
    }
};
async function prepareJavaForServer(javaVersion) {
    if (typeof javaVersion !== 'string') javaVersion = String(javaVersion ?? '');
    try {
        let javaExecutablePath = "";
        let javaDownloadURL = "";
        let isJavaNaN = isNaN(parseInt(javaVersion));

        if (isJavaNaN && fs.existsSync(javaVersion)) {
            return javaVersion;
        }

        if (!isJavaNaN) {
            javaExecutablePath = getJavaPath(javaVersion);
            if (!javaExecutablePath) {
                let javaVerInfo = getJavaInfoByVersion(javaVersion);
                javaDownloadURL = javaVerInfo.url;
                console.log(javaDownloadURL, javaVerInfo);

                const javaDlResult = await addDownloadTask(javaDownloadURL, javaVerInfo.downloadPath);
                if (!javaDlResult) {
                    logger.warning( "{{console.javaDownloadFailed}");
                    return false;
                }

                const javaUnpackResult = await unpackArchive(javaVerInfo.downloadPath, javaVerInfo.unpackPath, true);
                if (!javaUnpackResult) {
                    logger.warning( "{{console.javaUnpackFailed}}");
                    return false;
                }

                javaExecutablePath = getJavaPath(javaVersion);
            }
            return javaExecutablePath;
        }
        return javaExecutablePath;
    } catch (error) {
        console.error("Error in prepareJavaForServer:", error);
        return false;
    }
}
const isJavaVersionCompatible = (requiredVersion, installedVersions) => {
    return installedVersions
        .map(Number)  // Convertimos a número
        .filter(v => !isNaN(v))  // Filtramos valores no numéricos
        .some(v => v >= requiredVersion);
    };
const getClosestJavaVersion = (requiredVersion, installedVersions) => {
    const validVersions = installedVersions
        .map(Number)  // Convertimos a número
        .filter(v => !isNaN(v) && v >= requiredVersion);  // Filtramos no numéricos y menores a requiredVersion

    if (validVersions.length === 0) return null;  // Si no hay versiones válidas, retornamos null

    return Math.min(...validVersions);  // Retornamos la versión más cercana (mínima entre las mayores)
};
async function generateserverrequirements(params){
    let {serverName,core,coreVersion,startParameters,javaExecutablePath,serverPort } = params;
    if (!getLocalJavaVersions()) {
        console.log("No se encontraron versiones de Java en este sistema.");
        //manejar instalacion de java
        return;
    }

    const javaVersionRequired = gameVersionToJava(coreVersion);
    const localJavaVersions = getLocalJavaVersions();
    const closestVersion = getClosestJavaVersion(javaVersionRequired, localJavaVersions);

    console.log(`Versión de Java compatible encontrada:`, closestVersion);
    return {
        java: getJavaInfoByVersion(closestVersion),
        version: closestVersion,
        installed: closestVersion ? true : false,
        localJavaVersions,
        javaVersionRequired
    }
}   
export {
    gameVersionToJava,
    isTermux,
    getArchitecture,
    installJavaTermux,
    checkJavaVersionTermux,
    getDownloadableJavaVersions,
    getLocalJavaVersions,
    getJavaInfoByVersion,
    getJavaPath,
    verifyJavaInstallation,
    prepareJavaForServer,
    isJavaVersionCompatible,
    generateserverrequirements
}
const configserver = {
    serverName: "MyMinecraftServer",  // Nombre del servidor
    core: "paper",              // Core (tipo de servidor)
    coreVersion: "1.5",             // Versión del core
    startParameters: "-Xms2G -Xmx4G",      // Parámetros de inicio
    javaExecutablePath: getJavaInfoByVersion(getLocalJavaVersions()[1]).javaBinPath,  // Ruta de ejecución de Java
    serverPort: 25565,                // Puerto del servidor
  };




/* async function generateserverrequirements(params, Callback){
    let {serverName,core,coreVersion,startParameters,javaExecutablePath,serverPort } = params;
    if (!getLocalJavaVersions()) {
        console.log("No se encontraron versiones de Java en este sistema.");
        //manejar instalacion de java
        return;
    }

    const javaVersionRequired = gameVersionToJava(coreVersion);
    const localJavaVersions = getLocalJavaVersions();
    const closestVersion = getClosestJavaVersion(javaVersionRequired, localJavaVersions);

    if (!closestVersion) {
        console.log("No hay ninguna versión de Java compatible instalada.", javaVersionRequired, localJavaVersions);
        await    prepareJavaForServer(javaVersionRequired);
        return;
    }

    console.log(`Versión de Java compatible encontrada:`, closestVersion);
    if (Callback){
        Callback({
            java: getJavaInfoByVersion(closestVersion),
            version: closestVersion
        })
    }
    return {
        java: getJavaInfoByVersion(closestVersion),
        version: closestVersion
    }
} */

console.log("generateserverrequirements",generateserverrequirements(configserver,(data)=>{console.log("Callback executed", data)}));
/* const assert = require('assert');

// Pruebas para la función gameVersionToJava
console.log('Testing gameVersionToJava...');
assert.strictEqual(gameVersionToJava('1.7.0'), 8, 'Java 7 debería requerir Java 8');
assert.strictEqual(gameVersionToJava('1.8.0'), 8, 'Java 8 debería requerir Java 8');
assert.strictEqual(gameVersionToJava('1.11.0'), 11, 'Java 11 debería requerir Java 11');
assert.strictEqual(gameVersionToJava('1.16.3'), 11, 'Java 16.3 debería requerir Java 11');
assert.strictEqual(gameVersionToJava('1.16.5'), 16, 'Java 16.5 debería requerir Java 16');
assert.strictEqual(gameVersionToJava('1.20.0'), 20, 'Java 20 debería requerir Java 20');
console.log('gameVersionToJava tests passed!');

// Pruebas para la función isTermux
console.log('Testing isTermux...');
// Nota: Estas pruebas dependen del entorno en el que se ejecuten.
// Si estás en Termux, isTermux() debería devolver true.
// Si no, debería devolver false.
assert.strictEqual(typeof isTermux(), 'boolean', 'isTermux debería devolver un booleano');
console.log('isTermux tests passed!');

// Pruebas para la función getArchitecture
console.log('Testing getArchitecture...');
const arch = getArchitecture();
assert.ok(['arm', 'aarch64', 'x86_64'].includes(arch) || arch === null, 'getArchitecture debería devolver una arquitectura válida o null');
console.log('getArchitecture tests passed!');

*/