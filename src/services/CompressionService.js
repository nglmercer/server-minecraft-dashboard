// Archivo: services/CompressionService.js (REEMPLAZO TOTAL)

import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip, createGunzip } from 'node:zlib';
import * as tar from 'tar';
import archiver from 'archiver';
import yauzl from 'yauzl';
import { createProgressStream } from '../utils/progress.js';

// --- Funciones de Compresión (Backup) ---
/**
 * Calcula de forma recursiva el número total de archivos y el tamaño total en bytes de un directorio.
 * @param {string} dirPath - Ruta del directorio a escanear.
 * @returns {Promise<{totalFiles: number, totalBytes: number}>}
 */
async function getDirectoryStats(dirPath) {
    let totalFiles = 0;
    let totalBytes = 0;
    
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            const subStats = await getDirectoryStats(fullPath);
            totalFiles += subStats.totalFiles;
            totalBytes += subStats.totalBytes;
        } else if (entry.isFile()) {
            try {
                const stat = await fs.promises.stat(fullPath);
                totalFiles += 1;
                totalBytes += stat.size;
            } catch (error) {
                // Ignorar archivos que no se pueden acceder (e.j. sockets, pipes, etc.)
                console.warn(`[getDirectoryStats] No se pudo obtener el tamaño de ${fullPath}: ${error.message}`);
            }
        }
    }
    return { totalFiles, totalBytes };
}

/**
 * Comprime una carpeta a .tar.gz usando streams y reportando progreso.
 * @param {string} sourcePath - Ruta de la carpeta a comprimir.
 * @param {string} outputPath - Ruta del archivo .tar.gz de salida.
 * @param {object} options - Opciones.
 * @param {(message: string, percentage: number, details?: object) => void} options.progressCallback - Callback para reportar progreso.
 */
export async function compressTarGzStream(sourcePath, outputPath, { progressCallback }) {
  const totalSize = await getDirectorySize(sourcePath);
  
  // Asegúrate de que el directorio de salida exista
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  const tarStream = tar.c({ gzip: false, cwd: sourcePath }, ['.']);
  const gzipStream = createGzip();
  const progressStream = createProgressStream(totalSize, (p) => progressCallback('Comprimiendo...', p.percentage));
  const writeStream = fs.createWriteStream(outputPath);

  await pipeline(tarStream, progressStream, gzipStream, writeStream);
}
/**
 * (VERSIÓN CORREGIDA) Comprime una carpeta a .zip usando un pre-escaneo para reportar progreso preciso.
 * @param {string} sourcePath - Ruta de la carpeta a comprimir.
 * @param {string} outputPath - Ruta del archivo .zip de salida.
 * @param {object} options - Opciones.
 * @param {(message: string, percentage: number, details?: object) => void} options.progressCallback - Callback para reportar progreso.
 */
export async function compressZipStream(sourcePath, outputPath, { progressCallback }) {
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    
    // PASO 1: Pre-escanear el directorio para obtener los totales ANTES de empezar.
    const { totalFiles, totalBytes } = await getDirectoryStats(sourcePath);

    // Es buena práctica enviar un estado inicial.
    progressCallback('Iniciando compresión...', 0, {
        processedFiles: 0,
        totalFiles,
        processedBytes: 0,
        totalBytes
    });

    const archive = archiver('zip', { zlib: { level: 9 } });
    const writeStream = fs.createWriteStream(outputPath);
    const promise = pipeline(archive, writeStream);

    let processedFiles = 0;
    let processedBytes = 0;

    // PASO 2: Escuchar el evento 'entry' que se dispara por cada archivo añadido.
    archive.on('entry', (entryData) => {
        processedFiles++;
        // entryData.stats.size es el tamaño original (sin comprimir) del archivo.
        processedBytes += entryData.stats.size;

        // Calcular el porcentaje basado en bytes, es más granular y preciso.
        const percentage = totalBytes > 0 ? Math.round((processedBytes / totalBytes) * 100) : 0;

        // PASO 3: Enviar el progreso actualizado con los contadores manuales.
        progressCallback('Comprimiendo...', percentage, {
            processedFiles,
            totalFiles,
            processedBytes,
            totalBytes,
            currentFile: entryData.name // Detalle útil para la UI
        });
    });

    archive.on('error', (err) => {
        // Propagar el error al pipeline para que la promesa sea rechazada.
        writeStream.emit('error', err);
    });
    
    // Iniciar el proceso de archivado. 'directory' es síncrono para encolar,
    // pero la compresión es asíncrona y disparará los eventos 'entry'.
    archive.directory(sourcePath, false);
    
    // Finalize indica que no se añadirán más archivos.
    await archive.finalize(); 
  
    // Esperar a que el pipeline (la escritura a disco) termine.
    await promise;
}


/**
 * Descomprime un archivo .tar.gz usando streams y reportando progreso.
 * @param {string} inputPath - Ruta del archivo .tar.gz.
 * @param {string} outputPath - Carpeta de destino.
 * @param {object} options - Opciones.
 * @param {(message: string, percentage: number, details?: object) => void} options.progressCallback - Callback para reportar progreso.
 */
export async function decompressTarGzStream(inputPath, outputPath, { progressCallback }) {
  await fs.promises.mkdir(outputPath, { recursive: true });
  const stats = await fs.promises.stat(inputPath);
  const totalSize = stats.size;

  const readStream = fs.createReadStream(inputPath);
  const progressStream = createProgressStream(totalSize, (p) => progressCallback('Extrayendo...', p.percentage));
  const gunzipStream = createGunzip();
  // strip: 1 es importante para no crear una carpeta raíz extra.
  const extractStream = tar.x({ cwd: outputPath });

  await pipeline(readStream, progressStream, gunzipStream, extractStream);
}


/**
 * Descomprime un archivo .zip usando streams y reportando progreso.
 * @param {string} inputPath - Ruta del archivo .zip.
 * @param {string} outputPath - Carpeta de destino.
 * @param {object} options - Opciones.
 * @param {(message: string, percentage: number, details?: object) => void} options.progressCallback - Callback para reportar progreso.
 */
export async function decompressZipStream(inputPath, outputPath, { progressCallback }) {
  await fs.promises.mkdir(outputPath, { recursive: true });

  return new Promise((resolve, reject) => {
    yauzl.open(inputPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);

      const totalEntries = zipfile.entryCount;
      if (totalEntries === 0) {
        zipfile.close();
        return resolve();
      }

      let processedEntries = 0;
      let zipRootFolder = null; // Para intentar quitar la carpeta raíz del ZIP

      zipfile.on('error', reject);
      zipfile.on('close', resolve);
      
      zipfile.on('entry', (entry) => {
        processedEntries++;
        const percentage = Math.round((processedEntries / totalEntries) * 100);
        progressCallback('Extrayendo...', percentage, { currentFile: entry.fileName });

        // Lógica para omitir la carpeta raíz del ZIP (stripping)
        if (zipRootFolder === null) {
          const firstSlash = entry.fileName.indexOf('/');
          zipRootFolder = (firstSlash > -1 && entry.fileName.endsWith('/')) ? entry.fileName.substring(0, firstSlash) : '';
        }

        let finalPath = entry.fileName;
        if (zipRootFolder && finalPath.startsWith(`${zipRootFolder}/`)) {
          finalPath = finalPath.substring(zipRootFolder.length + 1);
        }

        // Si después de quitar la raíz no queda nada (es la propia carpeta raíz), saltar
        if (!finalPath) {
          zipfile.readEntry();
          return;
        }

        const destPath = path.join(outputPath, finalPath);

        if (/\/$/.test(entry.fileName)) { // Es un directorio
          fs.promises.mkdir(destPath, { recursive: true }).then(() => zipfile.readEntry()).catch(reject);
        } else { // Es un archivo
          fs.promises.mkdir(path.dirname(destPath), { recursive: true }).then(() => {
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) return reject(err);
              const writeStream = fs.createWriteStream(destPath);
              pipeline(readStream, writeStream).then(() => zipfile.readEntry()).catch(reject);
            });
          }).catch(reject);
        }
      });
      
      zipfile.readEntry();
    });
  });
}

// --- Helper para calcular tamaño de directorio ---
async function getDirectorySize(dirPath) {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const sizes = await Promise.all(
        entries.map(async entry => {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                return getDirectorySize(fullPath);
            }
            try {
                const stat = await fs.promises.stat(fullPath);
                return stat.size;
            } catch (error) {
                // Ignorar archivos que no se pueden acceder (e.j. sockets, etc.)
                console.warn(`No se pudo obtener el tamaño de ${fullPath}: ${error.message}`);
                return 0;
            }
        })
    );
    return sizes.reduce((acc, size) => acc + size, 0);
}