// services/CompressionService.js

import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import stream from 'node:stream';
import * as tar from 'tar';
import archiver from 'archiver';
import yauzl from 'yauzl';

// Promisify stream.pipeline para usarlo con async/await de forma segura
const pipeline = promisify(stream.pipeline);

/**
 * Comprime una carpeta a .tar.gz usando streams para bajo consumo de memoria.
 * @param {string} sourcePath La ruta de la carpeta a comprimir.
 * @param {string} outputPath La ruta completa del archivo .tar.gz de salida.
 * @param {string[]} ignorePatterns Patrones de archivos/carpetas a ignorar.
 */
export async function compressTarGzStream(sourcePath, outputPath, ignorePatterns = []) {
  console.log(`[Stream] Comprimiendo a TAR.GZ: ${sourcePath}`);
  await tar.c(
    {
      gzip: true,
      file: outputPath,
      cwd: path.dirname(sourcePath), // Cambia el directorio de trabajo
      filter: (filePath) => {
        const relativePath = path.relative(path.dirname(sourcePath), filePath).replace(/\\/g, '/');
        // El filtro de tar a veces pasa el directorio raíz, lo ignoramos para no compararlo
        const cleanRelativePath = relativePath.replace(new RegExp(`^${path.basename(sourcePath)}/?`), '');
        if (!cleanRelativePath) return true;

        const shouldExclude = ignorePatterns.some(pattern => new RegExp(globToRegex(pattern)).test(cleanRelativePath));
        if (shouldExclude) {
          console.log(`[TAR] Excluyendo: ${cleanRelativePath}`);
        }
        return !shouldExclude;
      },
    },
    [path.basename(sourcePath)]
  );
  console.log(`[Stream] Compresión TAR.GZ finalizada: ${outputPath}`);
}

/**
 * Descomprime un archivo .tar.gz usando streams.
 * @param {string} inputPath La ruta del archivo .tar.gz.
 * @param {string} outputPath La carpeta de destino.
 */
export async function decompressTarGzStream(inputPath, outputPath) {
  console.log(`[Stream] Descomprimiendo TAR.GZ: ${inputPath}`);
  await fs.promises.mkdir(outputPath, { recursive: true });
  await tar.x({
    file: inputPath,
    cwd: outputPath,
    // CORRECCIÓN: La opción 'strip: 1' elimina el primer nivel de directorios
    // de las rutas del archivo tar. Soluciona el problema de la carpeta anidada.
    strip: 1, // <-- CAMBIO CLAVE
  });
  console.log(`[Stream] Descompresión TAR.GZ finalizada en: ${outputPath}`);
}

/**
 * Comprime una carpeta a .zip usando streams.
 * @param {string} sourcePath La ruta de la carpeta a comprimir.
 * @param {string} outputPath La ruta completa del archivo .zip de salida.
 * @param {string[]} ignorePatterns Patrones de archivos/carpetas a ignorar (formato glob).
 */
export function compressZipStream(sourcePath, outputPath, ignorePatterns = []) {
  console.log(`[Stream] Comprimiendo a ZIP: ${sourcePath}`);
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`[Stream] Compresión ZIP finalizada. Total bytes: ${archive.pointer()}`);
      resolve();
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('[Archiver Warning]', err);
      } else {
        reject(err);
      }
    });
    archive.on('error', (err) => reject(err));

    archive.pipe(output);

    archive.glob('**/*', {
      cwd: sourcePath,
      ignore: ignorePatterns,
      dot: true,
    });

    archive.finalize();
  });
}
/**
 * Descomprime un archivo .zip usando yauzl para máxima robustez y control de flujo.
 * Esta implementación evita los problemas de estancamiento comunes con archivos grandes.
 * @param {string} inputPath La ruta del archivo .zip.
 * @param {string} outputPath La carpeta de destino.
 */
export async function decompressZipStream(inputPath, outputPath) {
  console.log(`[Stream] Descomprimiendo ZIP con yauzl: ${inputPath}`);
  await fs.promises.mkdir(outputPath, { recursive: true });

  return new Promise((resolve, reject) => {
    // CORRECCIÓN: Variable para almacenar el nombre de la carpeta raíz dentro del ZIP.
    let zipRootFolder = null;

    yauzl.open(inputPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        if (err.code === 'ENOENT') {
            return reject(new Error(`El archivo de backup no existe: ${inputPath}`));
        }
        return reject(new Error(`Error al abrir el archivo ZIP: ${err.message}`));
      }

      zipfile.on('error', (err) => {
        reject(new Error(`Error durante la descompresión del ZIP: ${err.message}`));
      });

      zipfile.on('close', () => {
        console.log(`[Stream] Descompresión ZIP finalizada en: ${outputPath}`);
        resolve();
      });

      zipfile.on('entry', (entry) => {
        // CORRECCIÓN: Lógica para detectar y eliminar la carpeta raíz del ZIP.
        if (zipRootFolder === null) {
          // La primera entrada nos dice cuál es la carpeta raíz.
          // entry.fileName es ej: "NombreServidor-backup-etc/archivo.txt"
          const firstSlashIndex = entry.fileName.indexOf('/');
          if (firstSlashIndex > -1) {
            zipRootFolder = entry.fileName.substring(0, firstSlashIndex);
            console.log(`[Stream] Detectada carpeta raíz en ZIP: "${zipRootFolder}". Se omitirá en la extracción.`);
          } else {
            // No hay carpeta raíz, es un zip "plano".
            zipRootFolder = ''; 
          }
        }
        
        let finalEntryPath = entry.fileName;
        // Si hay una carpeta raíz detectada y la ruta actual empieza con ella, la quitamos.
        if (zipRootFolder && finalEntryPath.startsWith(`${zipRootFolder}/`)) {
            finalEntryPath = finalEntryPath.substring(zipRootFolder.length + 1);
        }

        // Si después de quitar el prefijo la ruta está vacía, es la propia carpeta raíz. La ignoramos.
        if (!finalEntryPath) {
          zipfile.readEntry();
          return;
        }
        
        const sanitizedEntryPath = path.normalize(finalEntryPath).replace(/^(\.\.[\/\\])+/, '');
        const destPath = path.join(outputPath, sanitizedEntryPath);

        if (/\/$/.test(entry.fileName)) {
          fs.promises.mkdir(destPath, { recursive: true })
            .then(() => zipfile.readEntry())
            .catch(reject);
        } else {
          fs.promises.mkdir(path.dirname(destPath), { recursive: true })
            .then(() => {
              zipfile.openReadStream(entry, (err, readStream) => {
                if (err) return reject(err);

                const writeStream = fs.createWriteStream(destPath);
                
                writeStream.on('error', reject);
                readStream.on('error', reject);

                writeStream.on('finish', () => {
                  zipfile.readEntry();
                });
                
                readStream.pipe(writeStream);
              });
            })
            .catch(reject);
        }
      });

      zipfile.readEntry();
    });
  });
}

// Helper para convertir patrones glob simples a regex
function globToRegex(globPattern) {
  const regexString = globPattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '(.+)')
    .replace(/\*/g, '([^/\\\\]*)');
  return `^${regexString}$`;
}