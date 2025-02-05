import {getDataByURL} from '../utils.js';
import path from "path";    
import fs from "fs";            
import { execSync } from 'child_process';

// Detectar si estamos en Termux
const isTermux = () => {
    return process.platform === 'android' || fs.existsSync('/data/data/com.termux');
};

// Convertir versión del juego a versión Java requerida
export const gameVersionToJava = (version) => {
    const [, sec, ter] = version.split(".").map(Number);
    
    if (sec < 8) return 8;
    if (sec <= 11) return 11;
    if (sec <= 15) return 11;
    if (sec === 16) return ter <= 4 ? 11 : 16;
    if (sec >= 20) return 20;
    return 18;
};

export const installJavaTermux = async (version) => {
    try {
        const arch = {
            'arm': 'arm',
            'arm64': 'aarch64',
            'x64': 'x86_64'
        }[process.arch];
        
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
    } catch (error) {
        console.error('Error instalando Java:', error.message);
        return false;
    }
};

// Verificar si una versión específica de Java está instalada en Termux
export const checkJavaVersionTermux = (version) => {
    try {
        const output = execSync('dpkg -l | grep openjdk').toString();
        return output.includes(`openjdk-${version}`);
    } catch (error) {
        return false;
    }
};

export async function getDownloadableJavaVersions() {
    let availReleases = [];

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
                .sort((a, b) => b - a); // Ordenar de mayor a menor
            return [...new Set(versions)]; // Eliminar duplicados
        } catch (error) {
            console.error('Error obteniendo versiones:', error);
            return []; // Asegurar retorno de array vacío
        }
    }

    try {
        const data = await new Promise((resolve, reject) => {
            getDataByURL("https://api.adoptium.net/v3/info/available_releases", (data) => {
                if (data !== false) {
                    resolve(data);
                } else {
                    reject(new Error('Error al obtener datos de la URL'));
                }
            });
        });

        availReleases = data.available_releases.map(release => release.toString());
    } catch (error) {
        console.error('Error obteniendo versiones:', error);
        return [];
    }

    console.log("availReleases", availReleases);
    return availReleases;
}


    // Para otras plataformas
getDataByURL("https://api.adoptium.net/v3/info/available_releases", (data) => {
    if (data !== false) {
        let availReleases = data.available_releases;
        availReleases.forEach((release, i) => {
            availReleases[i] = release.toString();
        });
        return(availReleases);
    }
    return([]);
});

// Obtener versiones locales de Java
export const getLocalJavaVersions = () => {
    if (isTermux()) {
        try {
            // Try using dpkg instead of pkg list-installed
            const output = execSync('dpkg -l | grep openjdk').toString();
            return output.match(/openjdk-(\d+)/g)
                ?.map(v => v.replace('openjdk-', '')) || [];
        } catch (error) {
            // If the command fails, check if any Java is installed using which
            try {
                execSync('which java');
                // If java exists, try to get its version
                const versionOutput = execSync('java -version 2>&1').toString();
                const version = versionOutput.match(/version "(\d+)/);
                return version ? [version[1]] : [];
            } catch {
                console.log('No Java installation found');
                return [];
            }
        }
    }

    // Rest of the code for non-Termux platforms...
    let startPath = "./binaries/java";
    if (!fs.existsSync(startPath)) {
        return [];
    }
    let rdResult = fs.readdirSync(startPath);
    rdResult = rdResult.filter(entry => fs.lstatSync(startPath + path.sep + entry).isDirectory());
    return rdResult;
};

// Obtener información de Java por versión
export const getJavaInfoByVersion = (javaVersion) => {
    if (isTermux()) {
        return {
            isTermux: true,
            version: javaVersion,
            packageName: `openjdk-${javaVersion}`,
            installCmd: `pkg install openjdk-${javaVersion}`,
            javaPath: `/data/data/com.termux/files/usr/bin/java`,
            installed: checkJavaVersionTermux(javaVersion)
        };
    }

    let platformName = "";
    let fileExtension = "";
    let platformArch = "";

    if (process.platform === "win32") {
        platformName = "windows";
        fileExtension = ".zip";
    } else if (process.platform === "linux") {
        platformName = "linux";
        fileExtension = ".tar.gz";
    } else {
        return false;
    }

    if (process.arch === "x64") {
        platformArch = "x64";
    } else if (process.arch === "x32") {
        platformArch = "x86";
    } else if (process.arch === "arm64") {
        platformArch = "aarch64";
    } else if (process.arch === "arm") {
        platformArch = "arm";
    } else {
        return false;
    }

    let resultURL =
        "https://api.adoptium.net/v3/binary/latest/" +
        javaVersion +
        "/ga/" +
        platformName +
        "/" +
        platformArch +
        "/jdk/hotspot/normal/eclipse?project=jdk";
    let filename = "Java-" + javaVersion + "-" + platformArch + fileExtension;
    return {
        url: resultURL,
        filename: filename,
        version: javaVersion,
        platformArch: platformArch,
        platformName: platformName,
        downloadPath: "." + path.sep + "binaries" + path.sep + "java" + path.sep + filename,
        unpackPath: "." + path.sep + "binaries" + path.sep + "java" + path.sep + javaVersion + path.sep
    }
};

// Obtener ruta de Java
export const getJavaPath = (javaVersion) => {
    if (isTermux()) {
        const termuxJavaPath = '/data/data/com.termux/files/usr/bin/java';
        if (fs.existsSync(termuxJavaPath)) {
            try {
                // Verificar que la versión instalada coincide
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

    let javaDirPath = "." + path.sep + "binaries" + path.sep + "java" + path.sep + javaVersion;
    let javaSearchPath1 = javaDirPath + path.sep + "bin" + path.sep + "java";
    if(process.platform === "win32"){
        javaSearchPath1 += ".exe";
    }
    if (fs.existsSync(javaDirPath) && fs.lstatSync(javaDirPath).isDirectory()) {
        if (fs.existsSync(javaSearchPath1)) {
            return javaSearchPath1;
        } else {
            let javaReaddir = fs.readdirSync(javaDirPath);
            if (fs.readdirSync(javaDirPath).length === 1) {
                let javaChkPath = javaDirPath + path.sep + javaReaddir[0] + path.sep + "bin" + path.sep + "java";
                if(process.platform === "win32"){
                    javaChkPath += ".exe";
                }
                if (fs.existsSync(javaChkPath)) {
                    return javaChkPath;
                }
            }
        }
    }
    return false;
};

// Verificar si Java está instalado y es funcional
export const verifyJavaInstallation = async (version) => {
    if (isTermux()) {
        try {
            const javaPath = getJavaPath(version);
            if (!javaPath) return false;
            
            execSync(`${javaPath} -version`);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    // Para otras plataformas
    const javaPath = getJavaPath(version);
    if (!javaPath) return false;
    
    try {
        execSync(`"${javaPath}" -version`);
        return true;
    } catch (error) {
        return false;
    }
};