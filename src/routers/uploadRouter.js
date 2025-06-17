// routers/uploadRouter.js
import { fileURLToPath } from 'url';
import { dirname, join, resolve, isAbsolute, normalize } from 'path';
import fs from 'fs';
import util from 'util';
import { pipeline } from 'stream'; // Aún útil si part.toBuffer() no existiera para algún caso

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const SERVER_PATH = join(process.cwd(), 'servers');
const BACKUP_PATH = join(process.cwd(), 'backups');

const PathsValids = {
  uploads: UPLOAD_DIR,
  servers: SERVER_PATH,
  backups: BACKUP_PATH
};

Object.values(PathsValids).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.info(`[INIT] Created base directory: ${dir}`); // Log de inicialización
  }
});

function getTargetDirectory(request, fastify) {
  const pathType = request.query.pathType || 'uploads';
  const subDirectory = request.query.subDirectory;

  if (!PathsValids[pathType]) {
    const errorMessage = `Invalid path type: ${pathType}. Must be one of: ${Object.keys(PathsValids).join(', ')}`;
    fastify.log.warn({ msg: "getTargetDirectory validation failed", pathType, subDirectory });
    throw new Error(errorMessage);
  }

  let targetDir = PathsValids[pathType];

  if (subDirectory) {
    const normalizedSubDirectory = normalize(subDirectory).replace(/^(\.\.(\/|\\|$))+/, '');
    if (normalizedSubDirectory.includes('..') || isAbsolute(normalizedSubDirectory)) {
      const errorMessage = 'Invalid subDirectory: Path traversal or absolute paths are not allowed.';
      fastify.log.warn({ msg: "getTargetDirectory path traversal attempt", subDirectory, normalizedSubDirectory });
      throw new Error(errorMessage);
    }
    targetDir = join(targetDir, normalizedSubDirectory);
    const resolvedBase = resolve(PathsValids[pathType]);
    const resolvedTarget = resolve(targetDir);
    if (!resolvedTarget.startsWith(resolvedBase)) {
      fastify.log.warn(`Potential path traversal attempt: base='${resolvedBase}', final='${resolvedTarget}', subDirectory='${subDirectory}'`);
      throw new Error('Invalid subDirectory: Path attempts to go outside the allowed base directory.');
    }
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    fastify.log.info(`Created target directory: ${targetDir}`);
  }
  return targetDir;
}

async function saveFile(part, baseTargetDir, fastifyInstance) {
  let relativePathFromPart = normalize(part.filename);
  relativePathFromPart = relativePathFromPart.replace(/^[\/\\]+/, '');

  if (relativePathFromPart.includes('..') || isAbsolute(relativePathFromPart)) {
    throw new Error(`Invalid filename structure: Path traversal or absolute paths are not allowed in filename "${part.filename}".`);
  }
  if (relativePathFromPart === '' || relativePathFromPart === '.' || relativePathFromPart === '..') {
    throw new Error(`Invalid filename: Filename cannot be empty or just dots after normalization: "${part.filename}"`);
  }

  const filepath = join(baseTargetDir, relativePathFromPart);
  const fileDir = dirname(filepath);

  const resolvedBase = resolve(baseTargetDir);
  const resolvedFilepath = resolve(filepath);

  if (!resolvedFilepath.startsWith(resolvedBase)) {
    fastifyInstance.log.warn(`Potential path traversal attempt via part.filename: base='${resolvedBase}', final='${resolvedFilepath}', part.filename='${part.filename}'`);
    throw new Error('Invalid filename: Path attempts to go outside the allowed base directory.');
  }

  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
    fastifyInstance.log.info(`Created directory for file: ${fileDir}`);
  }
  
  fastifyInstance.log.info(`Attempting to save file to: ${filepath}. Original client filename: ${part.originalBusboyFilename}, Mimetype: ${part.mimetype}. Part has 'toBuffer': ${typeof part.toBuffer === 'function'}`);

  let bytesWritten = 0;
  try {
    if (typeof part.toBuffer === 'function') {
      const fileBuffer = await part.toBuffer();
      fs.writeFileSync(filepath, fileBuffer);
      bytesWritten = fileBuffer.length;
      fastifyInstance.log.info(`Successfully wrote buffer (from part.toBuffer()) to ${filepath}. Bytes written: ${bytesWritten}`);
    } else {
      fastifyInstance.log.warn({ msg: `part.toBuffer is not a function for file part "${part.originalBusboyFilename}". Attempting to use part.file stream. This may result in a 0-byte file if the stream was already consumed.`});
      const writeStream = fs.createWriteStream(filepath);
      await util.promisify(pipeline)(part.file, writeStream);
      bytesWritten = writeStream.bytesWritten; // Esto probablemente seguirá siendo 0
       if (bytesWritten === 0 && part.file && part.file.bytesRead > 0) {
         fastifyInstance.log.warn(`Fallback stream pump wrote 0 bytes, but part.file.bytesRead (from parser) was ${part.file.bytesRead}.`);
      }
    }

    if (bytesWritten === 0 ) {
        const fileStatSize = fs.existsSync(filepath) ? fs.statSync(filepath).size : 0;
        if (fileStatSize === 0) { // Doble check, fs.writeFileSync podría haber creado archivo vacío
             fastifyInstance.log.warn(`WARNING: Final file size is 0 bytes for ${filepath}. Client filename: ${part.originalBusboyFilename}. Was the uploaded file empty?`);
        } else if (bytesWritten === 0 && fileStatSize > 0) { // Raro, bytesWritten era 0 pero el archivo tiene tamaño
            bytesWritten = fileStatSize; // Corregir bytesWritten
            fastifyInstance.log.info(`Corrected bytesWritten to ${bytesWritten} based on file stat for ${filepath}.`);
        }
    }
    
    return {
      originalName: part.originalBusboyFilename,
      filename: relativePathFromPart,
      mimetype: part.mimetype,
      filepath: resolvedFilepath,
      directory: resolve(fileDir),
      size: bytesWritten
    };
  } catch (error) {
    fastifyInstance.log.error({ msg: `Error saving file "${part.originalBusboyFilename}" to "${filepath}"`, err: error.message, stack: error.stack });
    if (fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
        fastifyInstance.log.info(`Cleaned up file due to error: ${filepath}`);
      } catch (cleanupError) {
        fastifyInstance.log.error({ msg: `Error cleaning up file: ${filepath}`, err: cleanupError });
      }
    }
    throw error;
  }
}

async function uploadRouter(fastify, options) {
  fastify.post('/files', async (request, reply) => {
    let targetDir;
    try {
      targetDir = getTargetDirectory(request, fastify);
    } catch (error) {
      fastify.log.warn({ msg: "getTargetDirectory failed in POST /files", err: error.message, query: request.query, requestId: request.id });
      return reply.code(400).send({ error: 'Bad Request', message: error.message });
    }
  
    const uploadedFiles = [];
    const otherFields = {};
  
    try {
      const parts = request.parts();
      
      for await (const part of parts) {
        if (part.type === 'file') {
          fastify.log.info({
            msg: "Processing file part",
            fieldname: part.fieldname,
            filename: part.filename,
            mimetype: part.mimetype,
            requestId: request.id
          });
  
          try {
            const fileData = await saveFileFromStream(part, targetDir, fastify);
            uploadedFiles.push(fileData);
          } catch (error) {
            fastify.log.error({ 
              msg: `Failed to save file`, 
              fieldname: part.fieldname,
              filename: part.filename,
              err: error.message, 
              requestId: request.id 
            });
            // Continúa con el siguiente archivo en lugar de fallar todo
          }
        } else {
          // Procesar campos no-archivo
          if (!otherFields[part.fieldname]) otherFields[part.fieldname] = [];
          otherFields[part.fieldname].push(part.value);
          
          fastify.log.info({ 
            msg: "Processing non-file field", 
            fieldname: part.fieldname, 
            value: part.value, 
            requestId: request.id 
          });
        }
      }
  
      if (uploadedFiles.length === 0) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'No files were successfully uploaded.'
        });
      }
  
      return reply.code(200).send({
        success: true,
        message: `${uploadedFiles.length} file(s) processed successfully.`,
        files: uploadedFiles,
        fields: otherFields,
        pathType: request.query.pathType || 'uploads',
        subDirectory: request.query.subDirectory || null
      });
  
    } catch (error) {
      fastify.log.error({ msg: "Error processing multipart data", err: error.message, stack: error.stack, requestId: request.id });
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error processing uploaded files'
      });
    }
  });
  
  fastify.addHook('onError', async (request, reply, error) => {
    if (!reply.sent) {
        request.log.error({ msg: "Unhandled error in uploadRouter caught by onError hook", err: error.message, stack: error.stack, requestId: request.id });
    }
  });

  fastify.get('/allowedpaths', async (request, reply) => {
    try {
      return reply.code(200).send({
        success: true,
        paths: Object.keys(PathsValids),
        details: Object.entries(PathsValids).map(([key, path]) => ({
          name: key,
          path: path, 
          exists: fs.existsSync(path)
        }))
      });
    } catch (error) {
      fastify.log.error({ msg: "Error in GET /allowedpaths", err: error.message, requestId: request.id });
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error listing path types'
      });
    }
  });
}
async function saveFileFromStream(part, baseTargetDir, fastifyInstance) {
  // Usar el fieldname como el path relativo (tu lógica actual)
  let relativePathFromPart = normalize(part.fieldname);
  relativePathFromPart = relativePathFromPart.replace(/^[\/\\]+/, '');

  if (relativePathFromPart.includes('..') || isAbsolute(relativePathFromPart)) {
    throw new Error(`Invalid fieldname structure: Path traversal or absolute paths are not allowed in fieldname "${part.fieldname}".`);
  }
  if (relativePathFromPart === '' || relativePathFromPart === '.' || relativePathFromPart === '..') {
    throw new Error(`Invalid fieldname: Fieldname cannot be empty or just dots after normalization: "${part.fieldname}"`);
  }

  const filepath = join(baseTargetDir, relativePathFromPart);
  const fileDir = dirname(filepath);

  const resolvedBase = resolve(baseTargetDir);
  const resolvedFilepath = resolve(filepath);

  if (!resolvedFilepath.startsWith(resolvedBase)) {
    fastifyInstance.log.warn(`Potential path traversal attempt via part.fieldname: base='${resolvedBase}', final='${resolvedFilepath}', part.fieldname='${part.fieldname}'`);
    throw new Error('Invalid fieldname: Path attempts to go outside the allowed base directory.');
  }

  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
    fastifyInstance.log.info(`Created directory for file: ${fileDir}`);
  }
  
  fastifyInstance.log.info(`Streaming file to: ${filepath}. Original filename: ${part.filename}, Mimetype: ${part.mimetype}`);

  try {
    const writeStream = fs.createWriteStream(filepath);
    await util.promisify(pipeline)(part.file, writeStream);
    
    const stats = fs.statSync(filepath);
    const bytesWritten = stats.size;
    
    fastifyInstance.log.info(`Successfully streamed file to ${filepath}. Bytes written: ${bytesWritten}`);
    
    return {
      originalName: part.filename,
      filename: relativePathFromPart,
      mimetype: part.mimetype,
      filepath: resolvedFilepath,
      directory: resolve(fileDir),
      size: bytesWritten
    };
  } catch (error) {
    fastifyInstance.log.error({ msg: `Error streaming file "${part.filename}" to "${filepath}"`, err: error.message, stack: error.stack });
    if (fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
        fastifyInstance.log.info(`Cleaned up file due to error: ${filepath}`);
      } catch (cleanupError) {
        fastifyInstance.log.error({ msg: `Error cleaning up file: ${filepath}`, err: cleanupError });
      }
    }
    throw error;
  }
}
export default uploadRouter;