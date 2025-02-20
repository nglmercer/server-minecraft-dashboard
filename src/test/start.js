import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';


/**
 * Ejecuta el script start.bat o start.sh en la carpeta especificada.
 * @param {string} folderPath - Ruta de la carpeta que contiene el script.
 * @param {function} callback - Función de retorno para manejar el resultado o errores.
 */
function runStartScript(folderPath, callback) {
    if (!folderPath) {
        return callback(new Error('Por favor, proporciona el path de la carpeta.'));
    }

    // Determina si estamos en Windows o en un sistema Unix-like (Linux/macOS)
    const isWindows = process.platform === 'win32';
    const scriptName = isWindows ? 'start.bat' : 'start.sh';

    // Resuelve la ruta relativa a una ruta absoluta
    const absoluteFolderPath = path.resolve(folderPath);
    console.log(`Ruta absoluta de la carpeta: ${absoluteFolderPath}`);

    // Construye la ruta completa al script
    const scriptPath = path.join(absoluteFolderPath, scriptName);
    console.log(`Ruta completa del script: ${scriptPath}`);

    // Verifica si el archivo existe
    if (!fs.existsSync(scriptPath)) {
        return callback(new Error(`El archivo ${scriptPath} no existe.`));
    }

    // Ejecuta el script
    exec(scriptPath, { cwd: absoluteFolderPath }, (error, stdout, stderr) => {
        if (error) {
            return callback(new Error(`Error ejecutando el script: ${error.message}`));
        }

        if (stderr) {
            return callback(new Error(`stderr: ${stderr}`));
        }

        // Si todo va bien, devuelve la salida estándar
        callback(null, stdout);
    });
}

// Ejemplo de uso
const folderPath = "./servers/melserver/"; // Ruta relativa

runStartScript(folderPath, (error, output) => {
    if (error) {
        console.error(error.message);
        process.exit(1);
    }
    console.log(`Salida del script: ${output}`);
});