import fs from "fs";
import path from "path";
import {StorageManager} from "./utils.js";

class SecurityManager {
    constructor(storageManager, authEnabled = false) {
        this.storage = storageManager;
        this.authEnabled = authEnabled;
    }

    isUserHasCookies(req) {
        return req.cookies && req.cookies["kbk__login"];
    }

    isUserHasServerAccess(userId, serverId) {
        const userPermissions = this.storage.JSONget(userId) || {};
        return userPermissions.servers && userPermissions.servers.includes(serverId);
    }

    setAuthEnabled(enabled) {
        this.authEnabled = enabled;
    }
}

const security = new SecurityManager(new StorageManager('store.json', './data'));

const serversRouterMiddleware = (req, res, next) => {
    if (!security.authEnabled) {
        return next();
    }

    let chkValue = req.params.server || req.query.server || false;
    if (!chkValue) {
        return next();
    }

    if (security.isUserHasCookies(req) && security.isUserHasServerAccess(req.cookies["kbk__login"], chkValue)) {
        return next();
    }

    return res.sendStatus(403);
};

export { security, serversRouterMiddleware };
