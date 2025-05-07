// fileValidatorUtils.js
import fs from 'node:fs';
import path from 'node:path';
const serverPath = path.resolve(process.cwd(), 'servers');
const backupPath = path.resolve(process.cwd(), 'backups');
const binariesPath = path.resolve(process.cwd(), 'binaries');
// --- Funciones de Validación Individuales ---

/**
 * Verifica si el nombre de archivo (sin la ruta) coincide con un patrón regex.
 * @param {string} filename El nombre del archivo.
 * @param {string | RegExp} patternRegex Expresión regular.
 * @returns {boolean}
 */
export function isValidFilenamePattern(filename, patternRegex = /^[a-zA-Z0-9_.-]+$/) {
    if (!filename) {
        return false;
    }
    const regex = (typeof patternRegex === 'string') ? new RegExp(patternRegex) : patternRegex;
    return regex.test(filename);
}
export function isValidDirectoryName(directoryName, patternRegex = /^[a-zA-Z0-9_.\-\/]+$/) {
    if (!directoryName) {
        return false;
    }
    const regex = (typeof patternRegex === 'string') ? new RegExp(patternRegex) : patternRegex;
    return regex.test(directoryName);
}
/**
 * Verifica si una ruta (archivo o directorio) existe.
 * @param {string} filePath La ruta a verificar.
 * @returns {boolean}
 */
export function pathExists(filePath) {
    if (!filePath) return false;
    return fs.existsSync(filePath);
}

/**
 * Verifica si una ruta corresponde a un archivo existente.
 * @param {string} filePath La ruta a verificar.
 * @returns {boolean}
 */
export function isFile(filePath) {
    if (!filePath || !pathExists(filePath)) {
        return false;
    }
    try {
        return fs.statSync(filePath).isFile();
    } catch (error) {
        return false;
    }
}

/**
 * Obtiene la extensión de un archivo.
 * @param {string} filePath La ruta completa o nombre del archivo.
 * @returns {string | null}
 */
export function getFileExtension(filePath) {
    if (!filePath) {
        return null;
    }
    const ext = path.extname(filePath);
    return ext ? ext.toLowerCase() : null;
}

/**
 * Verifica si la extensión de un archivo está en una lista de extensiones permitidas.
 * @param {string} filePath La ruta completa o nombre del archivo.
 * @param {string[]} allowedExtensions Lista de extensiones permitidas.
 * @returns {boolean}
 */
export function isAllowedFileType(filePath, allowedExtensions) {
    if (!Array.isArray(allowedExtensions) || allowedExtensions.length === 0) {
        return false;
    }
    const fileExt = getFileExtension(filePath);
    if (fileExt === null) {
        return false;
    }

    const normalizedAllowedExtensions = allowedExtensions.map(ext =>
        ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`
    );

    return normalizedAllowedExtensions.includes(fileExt);
}

// --- Función Combinada de Validación ---

/**
 * @typedef {Object} ValidationResult
 * @property {string} filePath
 * @property {string} filename
 * @property {string|null} extension
 * @property {boolean} isValid
 * @property {string[]} errors
 * @property {Object} checks
 * @property {boolean|null} checks.pathExists
 * @property {boolean|null} checks.isFile
 * @property {boolean} checks.validFilenamePattern
 * @property {boolean} checks.allowedFileType
 */

/**
 * Valida un archivo según múltiples criterios.
 * @param {string} filePath
 * @param {string[]} allowedExtensions
 * @param {Object} [options={}]
 * @param {string | RegExp} [options.filenamePatternRegex=/^[a-zA-Z0-9_.-]+$/]
 * @param {boolean} [options.checkPathExists=true]
 * @param {boolean} [options.checkIsFile=true]
 * @returns {ValidationResult}
 */
export function validateFileAttributes(filePath, allowedExtensions, options = {}) {
    const defaults = {
        filenamePatternRegex: /^[a-zA-Z0-9_.-]+$/,
        checkPathExists: true,
        checkIsFile: true,
    };
    const config = { ...defaults, ...options };

    const results = {
        filePath: filePath,
        filename: path.basename(filePath),
        extension: getFileExtension(filePath),
        isValid: true,
        errors: [],
        checks: {
            pathExists: null,
            isFile: null,
            validFilenamePattern: false,
            allowedFileType: false,
        }
    };

    if (!filePath) {
        results.isValid = false;
        results.errors.push("La ruta del archivo está vacía.");
        results.checks.validFilenamePattern = false;
        results.checks.allowedFileType = false;
        if (config.checkPathExists) results.checks.pathExists = false;
        if (config.checkIsFile) results.checks.isFile = false;
        return results;
    }

    if (config.checkPathExists) {
        if (pathExists(filePath)) {
            results.checks.pathExists = true;
            if (config.checkIsFile) {
                if (isFile(filePath)) {
                    results.checks.isFile = true;
                } else {
                    results.isValid = false;
                    results.errors.push(`La ruta '${filePath}' existe pero no es un archivo.`);
                    results.checks.isFile = false;
                }
            }
        } else {
            results.isValid = false;
            results.errors.push(`La ruta del archivo '${filePath}' no existe.`);
            results.checks.pathExists = false;
            if (config.checkIsFile) results.checks.isFile = false;
        }
    }

    const filename = results.filename;
    if (filename) {
        if (isValidFilenamePattern(filename, config.filenamePatternRegex)) {
            results.checks.validFilenamePattern = true;
        } else {
            results.isValid = false;
            const patternString = config.filenamePatternRegex.toString();
            results.errors.push(`El nombre de archivo '${filename}' no cumple con el patrón '${patternString}'.`);
            results.checks.validFilenamePattern = false;
        }
    } else if (filePath) {
        results.isValid = false;
        results.errors.push(`La ruta '${filePath}' parece ser un directorio, no un archivo con nombre.`);
        results.checks.validFilenamePattern = false;
    }

    if (isAllowedFileType(filePath, allowedExtensions)) {
        results.checks.allowedFileType = true;
    } else {
        results.isValid = false;
        const ext = results.extension;
        if (ext) {
            results.errors.push(`El tipo de archivo '${ext}' no está permitido. Permitidos: ${allowedExtensions.join(', ')}.`);
        } else {
            results.errors.push(`El archivo '${filename || filePath}' no tiene extensión o no es un tipo permitido. Permitidos: ${allowedExtensions.join(', ')}.`);
        }
        results.checks.allowedFileType = false;
    }

    return results;
}
export const PathUtils = {
    isValidFilenamePattern,
    isValidDirectoryName,
    pathExists,
    isFile,
    getFileExtension,
    isAllowedFileType,
    validateFileAttributes,
    serverPath,
    backupPath,
    binariesPath
};
