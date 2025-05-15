// routers/uploadRouter.js
import { fileURLToPath } from 'url';
import { dirname, join, resolve, isAbsolute, normalize } from 'path';
import fs from 'fs';
import util from 'util';
import { pipeline } from 'stream';

const pump = util.promisify(pipeline);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UPLOAD_DIR = join(__dirname, '..', 'uploads');
const serverPath = join(process.cwd(), 'servers');
const backupPath = join(process.cwd(), 'backups');

const PathsValids = {
  uploads: UPLOAD_DIR,
  servers: serverPath,
  backups: backupPath
};

Object.values(PathsValids).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * File upload router with routes for single and multiple file uploads
 * @param {import('fastify').FastifyInstance} fastify Fastify instance
 * @param {Object} options Router options
 */
async function uploadRouter(fastify, options) {
  function getTargetDirectory(request) {
    const pathType = request.query.pathType || 'uploads';
    const subDirectory = request.query.subDirectory;

    if (!PathsValids[pathType]) {
      throw new Error(`Invalid path type: ${pathType}. Must be one of: ${Object.keys(PathsValids).join(', ')}`);
    }

    let targetDir = PathsValids[pathType];

    if (subDirectory) {
      const normalizedSubDirectory = normalize(subDirectory).replace(/^(\.\.(\/|\\|$))+/, '');

      if (normalizedSubDirectory.includes('..') || isAbsolute(normalizedSubDirectory)) {
        throw new Error('Invalid subDirectory: Path traversal or absolute paths are not allowed.');
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
      console.info(`Created directory: ${targetDir}`);
    }

    return targetDir;
  }

  async function saveFile(part, baseTargetDir, fastifyInstance) {
    try {
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
      }

      const writeStream = fs.createWriteStream(filepath);
      await pump(part.file, writeStream);

      return {
        originalName: part.filename,
        filename: relativePathFromPart,
        mimetype: part.mimetype,
        filepath: resolvedFilepath,
        directory: resolve(fileDir),
        size: writeStream.bytesWritten
      };
    } catch (error) {
      fastifyInstance.log.error(`Error saving file "${part.filename}": ${error.message}`);
      throw error;
    }
  }

  fastify.post('/files', async (request, reply) => {
    try {
      let targetDir; // This is the base directory like /path/to/servers/subDirectoryName
      try {
        targetDir = getTargetDirectory(request);
      } catch (error) {
        fastify.log.warn({ msg: "getTargetDirectory failed", err: error.message, query: request.query });
        return reply.code(400).send({ error: 'Bad Request', message: error.message });
      }
  
      const reqBody = request.body;
      const uploadedFiles = [];
      const otherFields = {};
  
      fastify.log.info({ msg: "Request body received", bodyKeys: Object.keys(reqBody), requestId: request.id });
  
      if (!reqBody || typeof reqBody !== 'object') {
        fastify.log.warn({ msg: "Request body is empty or not an object", requestId: request.id });
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'No data received in request body.'
        });
      }
  
      for (const intendedPathAsFieldname in reqBody) { // The key from FormData, which is your desired path
        if (Object.prototype.hasOwnProperty.call(reqBody, intendedPathAsFieldname)) {
          const partOrPartsArray = reqBody[intendedPathAsFieldname];
  
          const processPart = async (currentPart) => {
            // IMPORTANT: currentPart.filename from busboy is just the basename (e.g., "logoraw.jpeg")
            // We want to use 'intendedPathAsFieldname' for saving.
            // We create a new object or modify a copy to avoid mutating the original busboy part too much,
            // and ensure saveFile receives the full intended path in its 'filename' property.
            const partForSaving = {
              ...currentPart, // Spread the original part properties
              filename: intendedPathAsFieldname, // Override filename with the full path from the fieldname
              originalBusboyFilename: currentPart.filename // Optionally keep track of busboy's filename
            };
  
            fastify.log.info({
              msg: "Processing file part",
              intendedPath: intendedPathAsFieldname,
              busboyOriginalFilename: currentPart.filename, // This would be "logoraw.jpeg"
              mimetype: currentPart.mimetype,
              requestId: request.id
            });
  
            const fileData = await saveFile(partForSaving, targetDir, fastify);
            uploadedFiles.push(fileData);
          };
  
          if (Array.isArray(partOrPartsArray)) { // Should not happen if client sends unique fieldnames
            for (const p of partOrPartsArray) {
              if (p && typeof p === 'object' && p.type === 'file' && p.file) {
                await processPart(p);
              } else if (p && typeof p === 'object' && p.type !== 'file') {
                if (!otherFields[intendedPathAsFieldname]) otherFields[intendedPathAsFieldname] = [];
                otherFields[intendedPathAsFieldname].push(p.value !== undefined ? p.value : p);
              }
            }
          } else if (partOrPartsArray && typeof partOrPartsArray === 'object' && partOrPartsArray.type === 'file' && partOrPartsArray.file) {
            await processPart(partOrPartsArray);
          } else {
            // This is a non-file field (shouldn't happen if fieldname is a path like "gg/file.txt")
            otherFields[intendedPathAsFieldname] = partOrPartsArray.value !== undefined ? partOrPartsArray.value : partOrPartsArray;
          }
        }
      }
  
      fastify.log.info({ msg: "Finished processing request body parts", uploadedCount: uploadedFiles.length, otherFieldsCount: Object.keys(otherFields).length, requestId: request.id });
  
      if (uploadedFiles.length === 0) {
        // Check if there were file parts in reqBody but processing failed for some reason
        const hasFilePartsInBody = Object.values(reqBody).some(val =>
          (Array.isArray(val) && val.some(p => p && p.type === 'file')) || (val && val.type === 'file')
        );
        if (hasFilePartsInBody) {
            fastify.log.warn({ msg: "File parts were present in body but none were successfully processed.", requestId: request.id });
             return reply.code(400).send({
              error: 'Bad Request',
              message: 'Files received but could not be processed. Check server logs for details.'
            });
        } else {
            fastify.log.warn({ msg: "No files were processed from request.body, sending 400.", requestId: request.id });
            return reply.code(400).send({
              error: 'Bad Request',
              message: 'No files were uploaded or identified in the request.'
            });
        }
      }
  
      return reply.code(200).send({
        success: true,
        message: `${uploadedFiles.length} file(s) uploaded successfully from request.body`,
        files: uploadedFiles,
        fields: otherFields,
        pathType: request.query.pathType || 'uploads',
        subDirectory: request.query.subDirectory || null
      });
  
    } catch (error) {
      fastify.log.error({ msg: "Error in POST /files handler (processing request.body)", requestId: request.id, err: error.message, stack: error.stack });
      // It's good practice to check if headers have already been sent before trying to send a response
      if (!reply.sent) {
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Error uploading files'
        });
      } else {
        // If headers sent, just log. The connection might already be closed or in a weird state.
        fastify.log.error("Error occurred after headers were sent in POST /files.");
      }
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
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error listing path types'
      });
    }
  });
}

export default uploadRouter;