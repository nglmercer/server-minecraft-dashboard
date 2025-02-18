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
            item.innerHTML = `
                <div>Name: ${option.name}</div>
                <div>Label: ${option.label}</div>
                <div>ID: ${option.id}</div>
                <div>Date: ${option.date}</div>
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
const apiClient = new ApiClient('http://localhost:3000/api/backups');

// Crear backup
/* apiClient.post('/create', { folderName: window.localStorage.selectedServer, outputFilename: `${window.localStorage.selectedServer}_backup.zip` })
  .then(response => console.log('Backup creado:', response))
  .catch(error => console.error('Error al crear backup:', error)); */

// Obtener backups
apiClient.get('/backupsInfo')
  .then(response => console.log('Lista de backups:', response))
  .catch(error => console.error('Error al obtener backups:', error));
//apiClient.post('/restore', { filename: `${window.localStorage.selectedServer}_backup.zip`, outputFolderName: window.localStorage.selectedServer })