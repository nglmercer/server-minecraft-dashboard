import {
        humanizeSize,
        createBackup,
        deleteBackup,
        restoreBackup,
        downloadBackup,
        generateDate
      }
from './utils.js';

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
customElements.define('backups-list', BackupsList);

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
      console.log('Lista de backups:', setOptions(generateOptions(response)));
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
