class unitUtils {
    // Convertir tamaño de archivo a un formato legible por humanos
    static humanizeFileSize(size) {
        if (size < 1024) {
            size = size + " B";
        } else if (size < 1024 * 1024) {
            size = Math.round((size / 1024) * 10) / 10 + " Kb";
        } else if (size < 1024 * 1024 * 1024) {
            size = Math.round((size / 1024 / 1024) * 10) / 10 + " Mb";
        } else if (size >= 1024 * 1024 * 1024) {
            size = Math.round((size / 1024 / 1024 / 1024) * 10) / 10 + " Gb";
        } else {
            size = size + " ?";
        }
        return size;
    }
  
    // Convertir segundos a un formato legible por humanos
    static humanizeSeconds(seconds) {
        let hours = Math.floor(seconds / (60 * 60));
        let minutes = Math.floor((seconds % (60 * 60)) / 60);
        seconds = Math.floor(seconds % 60);
  
        return (
            this.padZero(hours) + "{{commons.h}} " +
            this.padZero(minutes) + "{{commons.m}} " +
            this.padZero(seconds) + "{{commons.s}}"
        );
    }
  
    // Añadir un cero delante de un número (para fechas)
    static padZero(number) {
        return (number < 10 ? "0" : "") + number;
    }
  
    // Seleccionar un color de degradado según una fracción
    static pickGradientFadeColor(fraction, color1, color2, color3) {
        let fade = fraction * 2;
  
        if (fade >= 1) {
            fade -= 1;
            color1 = color2;
            color2 = color3;
        }
  
        let diffRed = color2.red - color1.red;
        let diffGreen = color2.green - color1.green;
        let diffBlue = color2.blue - color1.blue;
  
        let gradient = {
            red: parseInt(Math.floor(color1.red + diffRed * fade), 10),
            green: parseInt(Math.floor(color1.green + diffGreen * fade), 10),
            blue: parseInt(Math.floor(color1.blue + diffBlue * fade), 10),
        };
  
        return `rgb(${gradient.red}, ${gradient.green}, ${gradient.blue})`;
    }
  
    // Obtener un color de degradado basado en el progreso
    static getProgressGradientColor(progress) {
        let color1 = { red: 46, green: 204, blue: 113 };
        let color2 = { red: 241, green: 196, blue: 15 };
        let color3 = { red: 231, green: 76, blue: 60 };
  
        return this.pickGradientFadeColor(progress / 100, color1, color2, color3);
    }
  
    // Generar un UUID v4
    static uuidv4() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
            let r = Math.random() * 16 | 0; // Generar un número aleatorio entre 0 y 15
            let v = c === "x" ? r : (r & 0x3 | 0x8); // Usar 4 para la posición fija de versión y ajustar los bits de "y"
            return v.toString(16); // Convertir a hexadecimal
        });
    }
  
  
    // Obtener el nombre del archivo desde una ruta
    static pathFilename(path) {
        let rgx = /\\|\//gm;
        let spl = path.split(rgx);
        return spl[spl.length - 1];
    }
  
    // Obtener la extensión de un archivo desde una ruta
    static pathExt(path) {
        let spl = path.split(".");
        return spl[spl.length - 1];
    }
  
    // Hacer que los enlaces en un texto sean clicables
    static linkify(inputText) {
        let replacedText;
        let replacePattern1, replacePattern2, replacePattern3;
  
        // URLs que comienzan con http://, https:// o ftp://
        replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        replacedText = inputText.replace(
            replacePattern1,
            '<a href="$1" target="_blank">$1</a>'
        );
  
        // URLs que comienzan con "www." (sin // delante)
        replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        replacedText = replacedText.replace(
            replacePattern2,
            '$1<a href="http://$2" target="_blank">$2</a>'
        );
  
        // Convertir direcciones de correo electrónico en enlaces mailto
        replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
        replacedText = replacedText.replace(
            replacePattern3,
            '<a href="mailto:$1">$1</a>'
        );
  
        return replacedText;
    }
  }
export {unitUtils};