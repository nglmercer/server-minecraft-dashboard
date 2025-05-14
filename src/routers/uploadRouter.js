// routers/uploadRouter.js
import { fileURLToPath } from 'url';
import { dirname, join, resolve, isAbsolute, normalize } from 'path'; // Added resolve, isAbsolute, normalize
import fs from 'fs';
import util from 'util';
import { pipeline } from 'stream';
import { randomUUID } from 'crypto';

// Convert pipeline to promise-based function
const pump = util.promisify(pipeline);

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define valid upload directories
const UPLOAD_DIR = join(__dirname, '..', 'uploads');
const serverPath = join(process.cwd(), 'servers');
const backupPath = join(process.cwd(), 'backups');

// Object with valid paths that can be referenced by name
const PathsValids = {
  uploads: UPLOAD_DIR,
  servers: serverPath,
  backups: backupPath
};

// Create all base directories if they don't exist
Object.values(PathsValids).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * File upload router with routes for single and multiple file uploads
 * @param {FastifyInstance} fastify Fastify instance
 * @param {Object} options Router options
 */
async function uploadRouter(fastify, options) {
  // Utility function to determine target directory based on query params
  function getTargetDirectory(request) {
    // Default to uploads if no path is specified
    const pathType = request.query.pathType || 'uploads';
    const subDirectory = request.query.subDirectory; // New parameter for sub-folder

    // Check if the requested path is valid
    if (!PathsValids[pathType]) {
      throw new Error(`Invalid path type: ${pathType}. Must be one of: ${Object.keys(PathsValids).join(', ')}`);
    }

    let targetDir = PathsValids[pathType]; // Base path

    if (subDirectory) {
      // Sanitize subDirectory to prevent path traversal and other issues
      // 1. Normalize (e.g., 'foo/bar/../baz' becomes 'foo/baz')
      // 2. Disallow '..' components that could lead outside the base.
      // 3. Disallow absolute paths.
      const normalizedSubDirectory = normalize(subDirectory).replace(/^(\.\.(\/|\\|$))+/, ''); // Remove leading ..

      if (normalizedSubDirectory.includes('..') || isAbsolute(normalizedSubDirectory)) {
        throw new Error('Invalid subDirectory: Path traversal or absolute paths are not allowed.');
      }
      
      // Further ensure it's a simple name (optional, but safer for single-level subdirectories)
      // This regex allows alphanumeric, underscores, and hyphens.
      if (!/^[a-zA-Z0-9_-]+$/.test(normalizedSubDirectory.replace(/[/\\]/g, ''))) { // Check after removing any internal slashes if you allow them
          // If you strictly want to disallow internal slashes for subDirectory (e.g., subDirectory=foo/bar)
          // you would use: if (!/^[a-zA-Z0-9_-]+$/.test(normalizedSubDirectory))
          // For now, let's assume subDirectory can be like "folder1" or "archive/today"
          // The important part is that `join` and the `startsWith` check below will handle nesting.
      }


      targetDir = join(targetDir, normalizedSubDirectory);

      // Security check: Ensure the final targetDir is still within the intended base directory
      const resolvedBase = resolve(PathsValids[pathType]);
      const resolvedTarget = resolve(targetDir);

      if (!resolvedTarget.startsWith(resolvedBase)) {
        fastify.log.warn(`Potential path traversal attempt: base='${resolvedBase}', final='${resolvedTarget}', subDirectory='${subDirectory}'`);
        throw new Error('Invalid subDirectory: Path attempts to go outside the allowed base directory.');
      }
    }

    // Create the directory (including subDirectory) if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      fastify.log.info(`Created directory: ${targetDir}`);
    }

    return targetDir;
  }

  // Utility function to save a file from a multipart part
  async function saveFile(part, targetDir) { // targetDir now includes subDirectory if provided
    try {
      // Generate unique filename to prevent collisions
      const filename = `${randomUUID()}-${part.filename}`;
      const filepath = join(targetDir, filename);

      // Create write stream for the file
      const writeStream = fs.createWriteStream(filepath);

      // Pipe the file data to the write stream
      await pump(part.file, writeStream);

      return {
        originalName: part.filename,
        filename: filename,
        mimetype: part.mimetype,
        filepath: filepath,
        directory: targetDir,
        size: writeStream.bytesWritten
      };
    } catch (error) {
      fastify.log.error(`Error saving file: ${error.message}`);
      throw error;
    }
  }

  // Route for single file upload
  fastify.post('/file', async (request, reply) => {
    try {
      let targetDir;

      try {
        targetDir = getTargetDirectory(request); // Passes request to get query params
      } catch (error) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: error.message
        });
      }

      const parts = request.parts();
      let fileData = null;
      let fileFields = {};

      for await (const part of parts) {
        if (part.type === 'file') {
          if (fileData) {
            await part.file.resume();
            continue;
          }
          fileData = await saveFile(part, targetDir);
        } else {
          fileFields[part.fieldname] = part.value;
        }
      }

      if (!fileData) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'No file was uploaded'
        });
      }

      return reply.code(200).send({
        success: true,
        message: 'File uploaded successfully',
        file: fileData,
        fields: fileFields,
        pathType: request.query.pathType || 'uploads',
        subDirectory: request.query.subDirectory || null // Include subDirectory in response
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error uploading file'
      });
    }
  });

  // Route for multiple files upload
  fastify.post('/files', async (request, reply) => {
    try {
      let targetDir;

      try {
        targetDir = getTargetDirectory(request); // Passes request
      } catch (error) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: error.message
        });
      }

      const parts = request.parts();
      const uploadedFiles = [];
      const fileFields = {};

      for await (const part of parts) {
        if (part.type === 'file') {
          const fileData = await saveFile(part, targetDir);
          uploadedFiles.push(fileData);
        } else {
          fileFields[part.fieldname] = part.value;
        }
      }

      if (uploadedFiles.length === 0) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'No files were uploaded'
        });
      }

      return reply.code(200).send({
        success: true,
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        files: uploadedFiles,
        fields: fileFields,
        pathType: request.query.pathType || 'uploads',
        subDirectory: request.query.subDirectory || null // Include subDirectory in response
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error uploading files'
      });
    }
  });

  // Utility route to get a list of uploaded files
  fastify.get('/files', async (request, reply) => {
    try {
      let targetDir;

      try {
        targetDir = getTargetDirectory(request); // Passes request
      } catch (error) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: error.message
        });
      }

      const files = fs.readdirSync(targetDir);
      return reply.code(200).send({
        success: true,
        files: files,
        directory: targetDir,
        pathType: request.query.pathType || 'uploads',
        subDirectory: request.query.subDirectory || null // Include subDirectory in response
      });
    } catch (error) {
      fastify.log.error(error);
      // If directory doesn't exist (e.g. invalid subDirectory for listing)
      if (error.code === 'ENOENT') {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Directory not found: ${error.path}`
        });
      }
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error listing files'
      });
    }
  });

  // Utility route to get a specific file
  fastify.get('/file/:filename', async (request, reply) => {
    try {
      let targetDir;

      try {
        targetDir = getTargetDirectory(request); // Passes request
      } catch (error) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: error.message
        });
      }

      const filename = request.params.filename;
      // Sanitize filename parameter to prevent path traversal from filename itself
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return reply.code(400).send({ error: 'Bad Request', message: 'Invalid filename.' });
      }
      const filepath = join(targetDir, filename);

      if (!fs.existsSync(filepath)) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'File not found'
        });
      }
      // Ensure we are not serving a file outside the intended directory due to filename manipulation
      const resolvedBase = resolve(targetDir);
      const resolvedFile = resolve(filepath);
      if (!resolvedFile.startsWith(resolvedBase)) {
          fastify.log.warn(`Potential path traversal attempt via filename: base='${resolvedBase}', file='${resolvedFile}', filename='${filename}'`);
          return reply.code(400).send({ error: 'Bad Request', message: 'Invalid filename.' });
      }

      return reply.sendFile(filename, targetDir);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error retrieving file'
      });
    }
  });

  // Utility route to delete a file
  fastify.delete('/file/:filename', async (request, reply) => {
    try {
      let targetDir;

      try {
        targetDir = getTargetDirectory(request); // Passes request
      } catch (error) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: error.message
        });
      }

      const filename = request.params.filename;
      // Sanitize filename parameter
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return reply.code(400).send({ error: 'Bad Request', message: 'Invalid filename.' });
      }
      const filepath = join(targetDir, filename);

      if (!fs.existsSync(filepath)) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'File not found'
        });
      }
      // Ensure we are not deleting a file outside the intended directory
      const resolvedBase = resolve(targetDir);
      const resolvedFile = resolve(filepath);
      if (!resolvedFile.startsWith(resolvedBase)) {
          fastify.log.warn(`Potential path traversal attempt for delete: base='${resolvedBase}', file='${resolvedFile}', filename='${filename}'`);
          return reply.code(400).send({ error: 'Bad Request', message: 'Invalid filename.' });
      }

      fs.unlinkSync(filepath);

      return reply.code(200).send({
        success: true,
        message: 'File deleted successfully',
        pathType: request.query.pathType || 'uploads',
        subDirectory: request.query.subDirectory || null // Include subDirectory in response
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error deleting file'
      });
    }
  });

  // Route to get a list of valid path types
  fastify.get('/paths', async (request, reply) => {
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