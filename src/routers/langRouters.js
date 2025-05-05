import {
    getLangInstance,
    getLangStore,
    getAllLangs,
    translateText
} from '../modules/langs.js';

export default async function (fastify, options) {
    fastify.get('/languages', async (request, reply) => {
        const langStore = getLangStore();
        return { success: true, data: langStore };
    });

    fastify.get('/rawlanguages', async (request, reply) => {
        const langStore = getAllLangs();
        return { success: true, data: langStore };
    });

    fastify.get('/language/:lang', async (request, reply) => {
        const lang = request.params.lang;
        const langStore = getLangStore(lang);
        return { success: true, data: langStore };
    });

    fastify.get('/translate/:lang/:text', async (request, reply) => {
        const lang = request.params.lang;
        const text = request.params.text;
        const translatedText = translateText(lang, text);
        return { success: true, data: translatedText };
    });
}
