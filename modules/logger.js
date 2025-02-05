import fs from "fs";
import path from "path";
import colors from "colors";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJSON = require("./../package.json");

class Logger {
    constructor() {
        this.LOGS_DIR = path.join(process.cwd(), "logs");
        this.ensureLogsDirExists();
    }

    // Crear directorio de logs si no existe
    ensureLogsDirExists() {
        if (!fs.existsSync(this.LOGS_DIR)) {
            fs.mkdirSync(this.LOGS_DIR, { recursive: true });
        }
    }

    // Formatear la hora actual
    getTimeFormatted() {
        const dateTime = new Date();
        return `[${dateTime.getHours().toString().padStart(2, "0")}:${dateTime.getMinutes().toString().padStart(2, "0")}:${dateTime.getSeconds().toString().padStart(2, "0")}.${dateTime.getMilliseconds().toString().padStart(3, "0")}]`;
    }

    // Obtener el nombre del archivo de log
    getLastLogFileName() {
        const dateTime = new Date();
        return `${dateTime.getDate().toString().padStart(2, "0")}-${(dateTime.getMonth() + 1).toString().padStart(2, "0")}-${dateTime.getFullYear()}.log`;
    }

    // Escribir una línea en el archivo de log
    async writeLineToLog(line) {
        const fileName = this.getLastLogFileName();
        const filePath = path.join(this.LOGS_DIR, fileName);

        try {
            await fs.promises.appendFile(filePath, `${line}\n`);
        } catch (err) {
            console.error(colors.red(`Error writing to log file: ${err.message}`));
        }
    }

    // Función auxiliar para formatear y registrar mensajes
    async logMessage(level, colorFn, ...text) {
        const preparedText = `${this.getTimeFormatted()} ${level ? `[${level}] ` : ""}${text.join(" ")}`;
        console.log(colorFn ? colorFn(preparedText) : preparedText);
        await this.writeLineToLog(preparedText);
    }

    // Registrar mensajes de log
    log(...text) {
        return this.logMessage("", null, ...text);
    }

    // Registrar mensajes de advertencia
    warning(...text) {
        return this.logMessage("WARN", colors.yellow, ...text);
    }

    // Registrar mensajes de error
    error(...text) {
        return this.logMessage("ERR", colors.red, ...text);
    }

    // Mostrar mensaje de bienvenida de Kubek
    kubekWelcomeMessage() {
        console.log("");
        console.log(colors.cyan("your logo ASCII art here"));
        console.log("");
        console.log(colors.inverse(`Kubek ${packageJSON.version}`));
        console.log(colors.inverse(packageJSON.repository.url.split("+")[1]));
        console.log("");
    }
}

// Exportar una instancia de la clase Logger
export default new Logger();