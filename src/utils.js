import fs from 'fs';
import path from 'path';

export default class StorageManager {
  constructor(fileName, basePath = '.') {
    this.storePath = path.isAbsolute(basePath) ? basePath : path.join(process.cwd(), basePath);

    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }

    this.fileName = fileName;
    this.filePath = path.join(this.storePath, this.fileName);

    if (fs.existsSync(this.filePath)) {
      try {
        const data = fs.readFileSync(this.filePath, { encoding: 'utf8' });
        this.store = JSON.parse(data);
      } catch (error) {
        this.store = {};
        this._saveStore();
      }
    } else {
      this.store = {};
      this._saveStore();
    }
  }

  _saveStore() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.store, null, 2), { encoding: 'utf8' });
  }

  set(key, value) {
    const keyStr = String(key);
    const valueStr = value === undefined ? "undefined" : (typeof value === "string" ? value : JSON.stringify(value));
    this.store[keyStr] = valueStr;
    this._saveStore();
  }

  get(key) {
    const keyStr = String(key);
    return this.store[keyStr];
  }

  JSONget(key) {
    const keyStr = String(key);
    if (this.store[keyStr] && typeof this.store[keyStr] === "string") {
      return JSON.parse(this.store[keyStr]);
    }
    return this.store[keyStr];
  }

  JSONset(key, value) {
    this.store[key] = value;
    this._saveStore();
  }

  remove(key) {
    const keyStr = String(key);
    if (Object.prototype.hasOwnProperty.call(this.store, keyStr)) {
      delete this.store[keyStr];
      this._saveStore();
    }
  }

  clear() {
    this.store = {};
    this._saveStore();
  }

  keys() {
    return Object.keys(this.store);
  }

  getAll() {
    return this.store;
  }

  setAll(store) {
    this.store = store;
    this._saveStore();
  }
}
