class BackupsList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 16px;
                }
                .grid-item {
                    border: 1px solid #ccc;
                    padding: 16px;
                    box-sizing: border-box;
                }
                .buttons {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 8px;
                }
                button {
                    padding: 8px;
                    cursor: pointer;
                }
            </style>
            <div class="grid" id="backupsGrid"></div>
        `;
        this.gridElement = this.shadowRoot.getElementById('backupsGrid');
    }

    _emitDetail(action, backup) {
        const detail = { ...backup, action };
        this.dispatchEvent(new CustomEvent('backup-action', { detail }));
    }

    setOptions(options) {
        this.gridElement.innerHTML = '';
        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'grid-item';
            item.id = option.id;
            item.innerHTML = `
                <div>Name: ${option.name}</div>
                <div>Label: ${option.label}</div>
                <div>Date: ${generateDate(option.date)}</div>
                <div>size: ${humanizeSize(option.size)}</div>
                <div class="buttons">
                    <button data-action="delete">Delete</button>
                    <button data-action="restore">Restore</button>
                    <button data-action="download">Download</button>
                </div>
            `;
            item.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', () => {
                    this._emitDetail(button.getAttribute('data-action'), option);
                });
            });
            this.gridElement.appendChild(item);
        });
    }
}
function humanizeSize(size) {
    if (size === 0) {
      return '0 B'; // o '0.00 B', como prefieras
    }
    if (size < 0 || isNaN(size)) {
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
customElements.define('backups-list', BackupsList);
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


const apiClient = new ApiClient('/api/backups');
let isUpdating = false; // Controla si ya hay una actualización en curso.
// Crear backup
/* apiClient.post('/create', { folderName: window.localStorage.selectedServer, outputFilename: `${window.localStorage.selectedServer}_backup.zip` })
  .then(response => console.log('Backup creado:', response))
  .catch(error => console.error('Error al crear backup:', error)); */

// Obtener backups
//apiClient.post('/restore', { filename: `${window.localStorage.selectedServer}_backup.zip`, outputFolderName: window.localStorage.selectedServer })
async function updateBackupsList() {
  if (isUpdating) {
      return; // Sale si ya hay una actualización en curso.
  }
  isUpdating = true;

  try {
      const response = await apiClient.get('/backupsInfo');
      console.log('Lista de backups:',response, setOptions(generateOptions(response)));
      return response; // Retorna la respuesta
  } catch (error) {
      console.error('Error al obtener backups:', error);
      throw error; // Re-lanza el error
  } finally {
      isUpdating = false; //  Indica que la actualización ha terminado.
  }
}
updateBackupsList().catch(error => {
  console.error("Error during initial backup list update:", error);
});
function generateOptions(options) {
  const optionsArray = [];
  const BackupFiles = options.data?.files;  // Usar optional chaining (?.)
  if (!BackupFiles) { //verifica si BackupFiles es null o undefined
      return []; // or handle it appropriately, perhaps throw an error, log a message, etc.
  }
  console.log('options:', BackupFiles);
  BackupFiles.forEach(file => {
      optionsArray.push({
          name: file.name,
          label: file.name,
          id: file.name,
          date: file.modified,
          size: file.size,
      });
  });
  return optionsArray;
}

const backupselement = document.getElementById('backupsList');
function setOptions(options) {
  if (backupselement) {
      backupselement.setOptions(options);

  }
}
backupselement.addEventListener('backup-action', (event) => {
  console.log('Backup details:', event.detail);
  switch (event.detail.action) {
      case 'delete':
          deleteBackup(event.detail.id).catch(error => {
             console.error("Error during delete:", error);
          });
      case 'restore':
          restoreBackup(event.detail.id, window.localStorage.selectedServer).catch(error => {
             console.error("Error during restore:", error);
          });
      case 'download':
          downloadBackup(event.detail.id).catch(error => {
             console.error("Error during download:", error);
          });
          break;
      default:
          console.log('No se encontró una acción para el evento:', event.detail);
  }
});
document.getElementById('create_backup').addEventListener('click', () => {
  createBackup().catch(error => {
     console.error("Error during create backup:", error);
  });
});
async function createBackup() {
  const uniqueBackupName = `${window.localStorage.selectedServer}_${new Date().toISOString()}_backup.tar.gz`;
  try {
      const response = await apiClient.post('/create', { folderName: window.localStorage.selectedServer, outputFilename: uniqueBackupName });
      console.log('Backup creado:', response);
      await updateBackupsList(); // Espera a que la lista se actualice.
      return response;
  } catch (error) {
      console.error('Error al crear backup:', error);
      throw error; // Importante re-lanzar el error para que sea capturado por el .catch() del evento click.
  }
}


// Eliminar backup (ahora es async)
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
      //  ... mostrar mensaje de error en la UI
       if (error.message.includes("404")) {
          console.error("El archivo no existe") //Ejemplo de como mostrarlo
      } else {
         //Otro error
         console.error("error al hacer la descarga")
      }

  }
}