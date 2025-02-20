import {
    getLangInstance,
    getLangStore,
    getAllLangs,
    translateText
  } from '../modules/langs.js';
  import express from 'express';
  const router = express.Router();
  router.get('/languages', (req, res) => {
    const langStore = getLangStore();
    res.status(200).json({ success: true, data: langStore });
  });
  router.get('/rawlanguages', (req, res) => {
    const langStore = getAllLangs();
    res.status(200).json({ success: true, data: langStore });
  });
  router.get('/language/:lang', (req, res) => {
    const lang = req.params.lang;
    const langStore = getLangStore(lang);
    res.status(200).json({ success: true, data: langStore });
  });
  router.get('/translate/:lang/:text', (req, res) => {
    const lang = req.params.lang;
    const text = req.params.text;
    const langStore = getLangStore(lang);
    const translatedText = translateText(lang, text);
    res.status(200).json({ success: true, data: translatedText });
  });
  export default router;