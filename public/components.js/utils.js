class ApiClient {
  constructor(baseURL) {
      this.baseURL = baseURL;
  }

  async _request(endpoint, method, data = null, responseType = 'json') {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
          method,
          headers: {
              // 'Content-Type': 'application/json'  // Lo quitamos para el download
          },
      };

      if (data && method !== 'GET') { // Incluir datos solo para métodos que no sean GET
          config.headers['Content-Type'] = 'application/json'; // Content-Type solo cuando hay body
          config.body = JSON.stringify(data);
      }


      try {
          const response = await fetch(url, config);

          if (!response.ok) {
              // Intenta obtener un mensaje de error del cuerpo de la respuesta, si existe.
              let errorMessage = `Error: ${response.status} ${response.statusText}`;
              try {
                  const errorData = await response.json();
                  if (errorData && errorData.message) {
                      errorMessage += ` - ${errorData.message}`;
                  }
              } catch (parseError) {
                  // Si no se puede parsear el JSON, usa el statusText.
                  console.error("Error parsing error response:", parseError);
              }
              throw new Error(errorMessage);
          }

          if (responseType === 'json') {
              return await response.json();
          } else if (responseType === 'blob') {
              return await response.blob();
          } else {
              return response; // Devuelve la respuesta completa si no se especifica un tipo.
          }

      } catch (error) {
          // Maneja errores de red (por ejemplo, si el servidor está caído).
          if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
              console.error("Network error.  Is the server running?", error);
              throw new Error("Error de red: No se pudo conectar al servidor.");
          }
          // Re-lanza otros errores.
          throw error;
      }
  }

  async post(endpoint, data) {
      return this._request(endpoint, 'POST', data);
  }

  async get(endpoint) {
      return this._request(endpoint, 'GET');
  }


  async download(endpoint, filename) {
    try {
      const blob = await this._request(endpoint, 'GET', null, 'blob');

      // Crear un URL para el blob
      const url = window.URL.createObjectURL(blob);

      // Crear un elemento <a> para iniciar la descarga
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename; //  el nombre de archivo que sugieres

      document.body.appendChild(a);
      a.click();

      // Limpieza
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Error during download:", error);
      throw error; //  importante re-lanzar el error para manejarlo más arriba
    }
  }
}

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
  function generateDate(date) {
    const dateObject = new Date(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return dateObject.toLocaleDateString('es-ES', options);
}
const apiClient = new ApiClient('/api/backups');
async function createBackup(foldername = window.localStorage.selectedServer) {
  const uniqueBackupName = `${foldername}_${new Date().toISOString()}_backup.zip`;
  try {
      const response = await apiClient.post('/create', { folderName: foldername, outputFilename: uniqueBackupName });
      console.log('Backup creado:', response);
      await updateBackupsList(); // Espera a que la lista se actualice.
      return response;
  } catch (error) {
      console.error('Error al crear backup:', error);
      throw error; // Importante re-lanzar el error para que sea capturado por el .catch() del evento click.
  }
}

async function deleteBackup(filename) {
  try {
      const response = await apiClient.post('/delete', { filename: filename });
      console.log('Backup borrado:', response);
      await updateBackupsList(); // Espera a que la lista se actualice.
      return response;
  } catch (error) {
      console.error('Error al borrar backup:', error);
      throw error;  // Importante re-lanzar el error
  }
}
async function restoreBackup(filename, outputFolderName) {
  try {
      const response = await apiClient.post('/restore', { filename: filename, outputFolderName: outputFolderName });
      console.log('Backup restaurado:', response);
      await updateBackupsList(); // Espera a que la lista se actualice.
      return response;
  } catch (error) {
      console.error('Error al restaurar backup:', error);
      throw error;  // Importante re-lanzar el error
  }
}
async function downloadBackup(filename) {
  try {
    const response = await apiClient.download(`/download/${filename}`, filename);
      console.log(`Descargando ${filename}...`);
      return response;
  } catch (error) {
      console.error(`Error al descargar ${filename}:`, error);
        if (error.message.includes("404")) {
          console.error("El archivo no existe") //Ejemplo de como mostrarlo
      } else {
          console.error("error al hacer la descarga")
      }
  }
}
function openPopup(element, popupId = "custom-popup") {
  const popupElement = document.querySelector(popupId);
  if (!popupElement) return;
  if (typeof element === "string") {
      const buttonElement  = document.querySelector(element);
          popupElement.showAtElement(buttonElement);
  } else {
      const buttonElement = element;
      popupElement.showAtElement(buttonElement);
  }
}

export {
  generateDate,
  ApiClient,
  humanizeSize,
  createBackup,
  deleteBackup,
  restoreBackup,
  downloadBackup,
  openPopup
}