/**
 * Web Server Configuration Module
 * 
 * This module handles the setup and configuration of the Express web server,
 * including middleware, routing, authentication, and static file handling.
 * It also manages security checks and server-side utilities.
 */

import LOGGER from './logger.js';
import PREDEFINED from "./predefined.js";
import * as COMMONS from "./commons.js";
import UserAuth from "./security.js";
import { configManager } from "./configuration.js";
import * as FILE_MANAGER from "./fileManager.js";
import MULTILANG from "./multiLanguage.js";
import os from 'os';
import fs from 'fs';
import express from 'express';
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import colors from "colors";
import mime from "mime";
import path from 'path';
import { isInSubnet } from "is-in-subnet";
import { fileURLToPath } from "url";
import { startDiscovery } from './networkDiscovery.js';
// Import routers
import * as permissionsMiddleware from "./permissionsMiddleware.js";
import * as coresRouter from "./../routers/cores.js";
import * as tasksRouter from "./../routers/tasks.js";
import * as fileManagerRouter from "./../routers/fileManager.js";
import * as serversRouter from "./../routers/servers.js";
import * as modsRouter from "./../routers/mods.js";
import * as pluginsRouter from "./../routers/plugins.js";
import * as javaRouter from "./../routers/java.js";
import * as authRouter from "./../routers/auth.js";
import * as accountsRouter from "./../routers/accounts.js";
import * as kubekRouter from "../routers/initialize.js";
import * as updatesRouter from "./../routers/updates.js";
import * as discoveryRouter from "./../routers/discovery.js";
const SECURITY = new UserAuth(configManager.mainConfig, usersConfig);
// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure temporary directory
const tempDir = path.join(os.tmpdir(), 'TEMPDIR');

// Create temporary directory if it doesn't exist
if (!fs.existsSync(tempDir)) {
    console.log("Creating temporary directory:", tempDir);
    fs.mkdirSync(tempDir, { recursive: true });
}

// Initialize Express server
let webServer = express();
globalThis.webPagesPermissions = {};

// Configure server middleware
webServer.use(cookieParser());
webServer.use(express.json());
webServer.use(express.urlencoded({ extended: true }));
webServer.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: tempDir,
    })
);

// Get web server port from configuration
let webPort = configManager.mainConfig.webserverPort;

/**
 * Logs web requests with client information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string|null} username - Authenticated username or null
 */
export const logWebRequest = (req, res, username = null) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    ip = ip.replace("::ffff:", "").replace("::1", "127.0.0.1");
    let additionalInfo2 = "";
    
    if (username !== null) {
        additionalInfo2 = "[" + colors.cyan(username) + "]";
    }
    
    LOGGER.log(
        "[" + colors.yellow(ip) + "]",
        additionalInfo2,
        colors.green(req.method) + " - " + req.originalUrl
    );
};

/**
 * Authentication and logging middleware for all routes
 * Handles request validation, IP filtering, and user authentication
 */
export const authLoggingMiddleware = (req, res, next) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    ip = ip.replace("::ffff:", "").replace("::1", "127.0.0.1");

    // Check for user authentication cookies
    let username = null;
    if (SECURITY.isUserHasCookies(req) && configManager.mainConfig.authorization === true) {
        username = req.cookies["kbk__login"];
    }

    // Log request if not in excluded URLs
    if (!COMMONS.testForRegexArray(req.path, PREDEFINED.NO_LOG_URLS)) {
        logWebRequest(req, res, username);
    }

    // IP whitelist validation
    if (configManager.mainConfig.allowOnlyIPsList === true && !isInSubnet(ip, configManager.mainConfig.IPsAllowed)) {
        return; // Block unauthorized IPs
    }

    // Authentication system check
    if (configManager.mainConfig.authorization === true && !COMMONS.testForRegexArray(req.originalUrl, PREDEFINED.SKIP_AUTH_URLS)) {
        if (SECURITY.isUserHasCookies(req) && SECURITY.authenticateUser(req.cookies["kbk__login"], req.cookies["kbk__hash"])) {
            return next();
        } else {
            return res.redirect("/login.html");
        }
    } else {
        return next();
    }

    // Fallback forbidden response
    return res.sendStatus(403);
};

/**
 * Middleware for serving static files with security checks
 * Handles file translation and content-type detection
 */
export const staticsMiddleware = (req, res, next) => {
    let filePath = path.join(__dirname, "./../web", req.path);
    let ext = path.extname(req.path).replace(".", "").toLowerCase();
    
    // Default to index.html for root path
    if (req.path === "/") {
        filePath = path.join(__dirname, "./../web", "/index.html");
        ext = "html";
    }

    // Security and validity checks
    if (PREDEFINED.ALLOWED_STATIC_EXTS.includes(ext) && 
        FILE_MANAGER.verifyPathForTraversal(filePath) && 
        fs.existsSync(filePath)) {
        
        // Set content type
        res.set("content-type", mime.getType(filePath));
        let fileData = fs.readFileSync(filePath);
        
        // Apply translation if needed
        if (PREDEFINED.TRANSLATION_STATIC_EXTS.includes(ext)) {
            fileData = MULTILANG.translateText(currentLanguage, fileData);
        }
        
        return res.send(fileData);
    }
    
    return next();
};

/**
 * Middleware for server access validation
 * Checks user permissions for specific server operations
 */
export const serversRouterMiddleware = (req, res, next) => {
    if (configManager.mainConfig.authorization === false) {
        return next();
    }

    let chkValue = false;
    if (COMMONS.isObjectsValid(req.params.server)) {
        chkValue = req.params.server;
    } else if (COMMONS.isObjectsValid(req.query.server)) {
        chkValue = req.query.server;
    }

    if (chkValue === false) {
        return next();
    }

    if (SECURITY.isUserHasCookies(req) && SECURITY.isUserHasServerAccess(req.cookies["kbk__login"], chkValue)) {
        return next();
    }
    
    return res.sendStatus(403);
}

/**
 * Initializes all application routers and mounts them to paths
 * Applies core middleware and error handling
 */
export const loadAllDefinedRouters = () => {
    // Initialize all router modules
    permissionsMiddleware.initializeWebServer(webServer);
    coresRouter.initializeWebServer(webServer);
    tasksRouter.initializeWebServer(webServer);
    fileManagerRouter.initializeWebServer(webServer);
    serversRouter.initializeWebServer(webServer);
    modsRouter.initializeWebServer(webServer);
    pluginsRouter.initializeWebServer(webServer);
    javaRouter.initializeWebServer(webServer);
    authRouter.initializeWebServer(webServer);
    accountsRouter.initializeWebServer(webServer);
    kubekRouter.initializeWebServer(webServer);
    updatesRouter.initializeWebServer(webServer);

    // Apply core middleware
    webServer.use(authLoggingMiddleware);
    webServer.use(staticsMiddleware);

    // Mount routers to paths
    webServer.use("/api/cores", coresRouter.router);
    webServer.use("/api/tasks", tasksRouter.router);
    webServer.use("/api/fileManager", fileManagerRouter.router);
    webServer.use("/api/servers", serversRouter.router);
    webServer.use("/api/mods", modsRouter.router);
    webServer.use("/api/plugins", pluginsRouter.router);
    webServer.use("/api/java", javaRouter.router);
    webServer.use("/api/auth", authRouter.router);
    webServer.use("/api/accounts", accountsRouter.router);
    webServer.use("/api/kubek", kubekRouter.router);
    webServer.use("/api/updates", updatesRouter.router);

    // 404 Error handler
    webServer.use((req, res) => {
        if (!res.headersSent) {
            let errFile = fs.readFileSync(path.join(__dirname, "./../web/404.html")).toString();
            return res.status(404).send(errFile);
        }
    });
};

/**
 * Starts the web server on configured port
 */
export const startWebServer = () => {
    webServer.listen(webPort, () => {
        LOGGER.log(MULTILANG.translateText(
            configManager.mainConfig.language,
            "{{console.webserverStarted}}",
            colors.cyan(webPort)
        ));
    });
};
discoveryRouter.initializeWebServer(webServer);
webServer.use("/api/discovery", discoveryRouter.router);

// Después de iniciar el servidor web
startDiscovery();
export { webServer };