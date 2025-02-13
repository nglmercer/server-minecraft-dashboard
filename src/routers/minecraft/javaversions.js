import express from 'express';
import {
    gameVersionToJava,
    isTermux,
    getArchitecture,
    installJavaTermux,
    checkJavaVersionTermux,
    getDownloadableJavaVersions,
    getLocalJavaVersions,
    getJavaInfoByVersion,
    getJavaPath,
    verifyJavaInstallation,
    prepareJavaForServer,
    isJavaVersionCompatible,
    generateserverrequirements
} from '../../minecraft/javaManager.js';
const router = express.Router();
async  function mapallJavaInfo() {
    // esta funcion retornara un objeto donde key es installed y value is array 
    // return javadownloadbleversions is avaible
    // 
    return {
        installed: await getLocalJavaVersions(),
        available: await getDownloadableJavaVersions()
    }
}
router.get('/java/all', async (req, res) => {
    const javaVersions =    await mapallJavaInfo();
    console.log("javaVersions", javaVersions);
    res.status(200).json({ success: true, data: javaVersions });
});
export default router;