import path from "path";
import fs from "fs";
import { execSync } from 'child_process';
import axios from "axios";
import { TASK_MANAGER, addDownloadTask, unpackArchive } from "../modules/taskmanager.js";
import { logger } from "../utils/utils.js";
import { PathUtils } from "../fileutils.js";
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
    if (!version) return 18;
    const [, sec, ter] = version.split(".").map(Number);
    if (sec <= 8) return 8;
    if (sec <= 11) return 11;
    if (sec <= 15) return 11;
    if (sec === 16) return ter <= 4 ? 11 : 16;
    if (sec >= 21) return 21;
    return 21;
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
    if (!arch) {
        throw new Error('Arquitectura no soportada para Termux');
    }
    logger.info(`Attempting to install openjdk-${version} on Termux (arch: ${arch})`);

    // Check if package is available via pkg search first, as it's simpler
    try {
        execSync(`pkg install -y openjdk-${version}`, { stdio: 'inherit' });
        logger.info(`Successfully ran 'pkg install openjdk-${version}'.`);
        // Verification will be done by prepareJavaForServer after this call
        return true; // Indicates the command was attempted
    } catch (error) {
        logger.error(`'pkg install openjdk-${version}' failed: ${error.message}. Falling back to manual dpkg method if necessary (or just failing).`);
        // You could implement the more complex curl/dpkg method here as a fallback if desired
        // For now, we'll assume 'pkg install' is the primary method.
        // If 'pkg install' fails, it often means the package doesn't exist for that version in the repos.
        throw new Error(`Failed to install openjdk-${version} using 'pkg install'. Error: ${error.message}`);
    }
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
            javaPath: '/data/data/com.termux/files/usr/bin/',
            installed: checkJavaVersionTermux(javaVersion),
            absoluteJavaPath: '/data/data/com.termux/files/usr/bin/'
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

    const javabinPath = path.join(PathUtils.binariesPath, "java");
    console.log("javabinPath", javabinPath);
    const javaDirPath = path.join(javabinPath, String(javaVersion));
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
const verifyJavaInstallation = async (version, javaExecutablePathToVerify) => {
    // If javaExecutablePathToVerify is not provided, use getJavaPath
    const javaPath = javaExecutablePathToVerify || getJavaPath(version);
    if (!javaPath) {
        // logger.debug(`verifyJavaInstallation: Java path for version ${version} not found.`);
        return false;
    }

    if (!fs.existsSync(javaPath)) {
        logger.warn(`verifyJavaInstallation: Java executable path ${javaPath} does not exist.`);
        return false;
    }

    try {
        // logger.debug(`Verifying Java at: "${javaPath}" for version ${version}`);
        const output = execSync(`"${javaPath}" -version 2>&1`).toString();
        // More robust version checking:
        // For Oracle/OpenJDK: version "17.0.1" 2021-10-19 or openjdk version "11.0.12"
        const versionRegex = /(?:java|openjdk)\sversion\s"(\d+)(?:\.\d+)?(?:\.\d+)?(?:_\d+)?/;
        const match = output.match(versionRegex);
        
        if (match && match[1]) {
            const installedMajorVersion = parseInt(match[1]);
            const requiredMajorVersion = parseInt(String(version).split('.')[0]); // Get major from '17' or '11.0.2'
            if (installedMajorVersion === requiredMajorVersion) {
                // logger.debug(`Java version ${installedMajorVersion} matches required ${requiredMajorVersion} at ${javaPath}.`);
                return true;
            } else {
                logger.warn(`Java version mismatch at ${javaPath}. Expected major ${requiredMajorVersion}, found ${installedMajorVersion}. Full output: ${output}`);
                return false;
            }
        } else {
            logger.warn(`Could not parse Java version from output at ${javaPath}. Output: ${output}`);
            return false;
        }
    } catch (error) {
        logger.error(`Error verifying Java installation at ${javaPath}: ${error.message}`);
        return false;
    }
};

async function prepareJavaForServer(javaVersion) {
    if (typeof javaVersion !== 'string') javaVersion = String(javaVersion ?? '');
    logger.info(`Preparing Java version: ${javaVersion}`);

    try {
        // Handle Termux separately for installation
        if (isTermux()) {
            let javaPath = getJavaPath(javaVersion); // Checks if already installed and correct version
            if (javaPath && await verifyJavaInstallation(javaVersion, javaPath)) { // verifyJavaInstallation needs to accept path
                logger.info(`Java ${javaVersion} (Termux) already installed and verified at ${javaPath}`);
                return { success: true, path: javaPath };
            } else {
                logger.info(`Java ${javaVersion} (Termux) not found or not correct version. Attempting installation...`);
                try {
                    const installSuccess = await installJavaTermux(javaVersion); // installJavaTermux should return true on success
                    if (installSuccess) {
                        javaPath = getJavaPath(javaVersion); // Re-check path after install
                        if (javaPath && await verifyJavaInstallation(javaVersion, javaPath)) {
                             logger.info(`Java ${javaVersion} (Termux) installed successfully at ${javaPath}`);
                            return { success: true, path: javaPath };
                        } else {
                            throw new Error("Java installed for Termux, but verification failed or path not found post-install.");
                        }
                    } else {
                         throw new Error(`Failed to install OpenJDK ${javaVersion} on Termux.`);
                    }
                } catch (error) {
                    logger.error(`Error installing Java ${javaVersion} on Termux: ${error.message}`);
                    return { success: false, error: `Termux Java ${javaVersion} installation failed: ${error.message}` };
                }
            }
        }

        // Non-Termux (Adoptium download logic)
        let javaInfo = getJavaInfoByVersion(javaVersion);
        if (!javaInfo || !javaInfo.url) { // Check if javaInfo is valid for download
            return { success: false, error: `Could not get download info for Java ${javaVersion}. Platform/arch unsupported?` };
        }

        // Check if already downloaded and unpacked correctly
        let existingExecutablePath = getJavaPath(javaVersion); // This uses your existing getJavaPath
        if (existingExecutablePath && await verifyJavaInstallation(javaVersion, existingExecutablePath)) {
             logger.info(`Java ${javaVersion} already prepared and verified at ${existingExecutablePath}`);
            return { success: true, path: existingExecutablePath };
        }
        
        logger.info(`Java ${javaVersion} not found locally or not verified. Proceeding with download from ${javaInfo.url}`);

        // Ensure download and unpack directories exist
        const downloadDir = path.dirname(javaInfo.absoluteDownloadPath);
        const unpackDir = javaInfo.absoluteUnpackPath;
        if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
        if (!fs.existsSync(unpackDir)) fs.mkdirSync(unpackDir, { recursive: true });


        logger.info(`Downloading Java ${javaVersion} to ${javaInfo.absoluteDownloadPath}...`);
        const javaDlResult = await addDownloadTask(javaInfo.url, javaInfo.absoluteDownloadPath, `Downloading Java ${javaVersion}`);
        // Assuming addDownloadTask throws on error or returns an object with a success flag
        if (javaDlResult && typeof javaDlResult.success === 'boolean' && !javaDlResult.success) {
            const errorMsg = `Java ${javaVersion} download failed: ${javaDlResult.error || 'Unknown error'}`;
            logger.warning(errorMsg);
            return { success: false, error: errorMsg };
        }
        if (!fs.existsSync(javaInfo.absoluteDownloadPath)){ // Fallback check if addDownloadTask doesn't throw/return status
             const errorMsg = `Java ${javaVersion} download failed (file not found after download attempt).`;
            logger.warning(errorMsg);
            return { success: false, error: errorMsg };
        }
        logger.info(`Java ${javaVersion} downloaded. Unpacking to ${javaInfo.absoluteUnpackPath}...`);


        const javaUnpackResult = await unpackArchive(javaInfo.absoluteDownloadPath, javaInfo.absoluteUnpackPath, true); // true to remove archive after
         // Assuming unpackArchive throws on error or returns an object with a success flag
        if (javaUnpackResult && typeof javaUnpackResult.success === 'boolean' && !javaUnpackResult.success) {
            const errorMsg = `Java ${javaVersion} unpack failed: ${javaUnpackResult.error || 'Unknown error'}`;
            logger.warning(errorMsg);
            return { success: false, error: errorMsg };
        }
        logger.info(`Java ${javaVersion} unpacked.`);

        // Attempt to find the executable path again using getJavaPath, which is more robust
        let finalJavaExecutablePath = getJavaPath(javaVersion);

        if (!finalJavaExecutablePath) {
            // Fallback: try constructing from javaInfo.javaBinPath if getJavaPath fails
            // This is because getJavaInfoByVersion already tries to find the 'bin' dir
            if (javaInfo.javaBinPath && fs.existsSync(javaInfo.javaBinPath)) {
                const exeName = process.platform === 'win32' ? 'java.exe' : 'java';
                const potentialPath = path.join(javaInfo.javaBinPath, exeName);
                if (fs.existsSync(potentialPath)) {
                    finalJavaExecutablePath = potentialPath;
                }
            }
        }
        
        if (finalJavaExecutablePath && await verifyJavaInstallation(javaVersion, finalJavaExecutablePath)) {
            logger.info(`Java ${javaVersion} prepared and verified successfully at ${finalJavaExecutablePath}`);
            return { success: true, path: finalJavaExecutablePath };
        } else {
            const errorMsg = `Java ${javaVersion} prepared, but verification failed or executable not found post-unpack. Checked path: ${finalJavaExecutablePath || 'not found'}. Bin dir: ${javaInfo.javaBinPath}`;
            logger.warning(errorMsg);
            // Clean up potentially corrupted unpack directory? Maybe too aggressive.
            // fs.rmSync(javaInfo.absoluteUnpackPath, { recursive: true, force: true });
            return { success: false, error: errorMsg };
        }

    } catch (error) {
        logger.error(`Critical error in prepareJavaForServer for version ${javaVersion}: ${error.message}`, error.stack);
        return { success: false, error: error.message };
    }
}
const isJavaVersionCompatible = (requiredVersion, installedVersions) => {
    if (!installedVersions || !Array.isArray(installedVersions)) return [];
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
async function generateserverrequirements(coreVersion){
    if (!getLocalJavaVersions()) {
        console.log("No se encontraron versiones de Java en este sistema.");
        return{
            installed: false,
            javaVersionRequired: gameVersionToJava(coreVersion),
        }
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