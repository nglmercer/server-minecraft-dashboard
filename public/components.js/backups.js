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

  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en la petición POST:', error);
      throw error;
    }
  }

  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en la petición GET:', error);
      throw error;
    }
  }
}

// Ejemplo de uso:
const apiClient = new ApiClient('/api/backups');

// Crear backup
/* apiClient.post('/create', { folderName: window.localStorage.selectedServer, outputFilename: `${window.localStorage.selectedServer}_backup.zip` })
  .then(response => console.log('Backup creado:', response))
  .catch(error => console.error('Error al crear backup:', error)); */

// Obtener backups
apiClient.get('/backupsInfo')
  .then(response => console.log('Lista de backups:', setOptions(generateOptions(response))))
  .catch(error => console.error('Error al obtener backups:', error));
//apiClient.post('/restore', { filename: `${window.localStorage.selectedServer}_backup.zip`, outputFolderName: window.localStorage.selectedServer })
function generateOptions(options) {
    const optionsArray = [];
    const BackupFiles = options.data?.files;
    console.log('options:', options.data?.files);
    BackupFiles.forEach(file => {
        optionsArray.push({
            name: file.name,
            label: file.name,
            id: file.name,
            date: file.modified,
            size: file.size,
            action: 'restore'
        });
    });
    return optionsArray;
}
function setOptions(options) {
    const backupselement = document.getElementById('backupsList');

    backupselement.setOptions(options);
}