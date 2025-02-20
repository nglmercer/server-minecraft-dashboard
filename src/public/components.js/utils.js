function humanizeSize(size) {
    if (size === 0) {
      return '0 B'; // o '0.00 B', como prefieras
    }
    if (size < 0) {
      return "Valor invalido"; // o  manejo de error que corresponda
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(2)} ${units[i]}`;
  }