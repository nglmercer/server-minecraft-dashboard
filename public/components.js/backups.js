class BackupsList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Crear el template para la estructura principal
        this._createMainTemplate();
        
        // Crear el template para las cards de backup
        this._createCardTemplate();
        
        // Renderizar la estructura principal
        this._renderMainStructure();
        
        // Obtener referencia al contenedor de backups
        this.gridElement = this.shadowRoot.getElementById('backupsGrid');
    }
    
    // Crea el template para la estructura principal
    _createMainTemplate() {
        this.mainTemplate = document.createElement('template');
        this.mainTemplate.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: Arial, sans-serif;
                }
                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 16px;
                    padding: 16px;
                }
                .empty-state {
                    text-align: center;
                    padding: 2rem;
                    color: #666;
                    grid-column: 1 / -1;
                }
            </style>
            <div class="grid" id="backupsGrid">
                <div class="empty-state">No hay backups disponibles</div>
            </div>
        `;
    }
    
    // Crea el template para las cards de backup
    _createCardTemplate() {
        this.cardTemplate = document.createElement('template');
        this.cardTemplate.innerHTML = `
            <style>
                .backup-card {
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    background-color: #fff;
                    overflow: hidden;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .backup-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                }
                .backup-header {
                    padding: 12px 16px;
                    background-color: #f5f5f5;
                    border-bottom: 1px solid #e0e0e0;
                }
                .backup-name {
                    font-weight: bold;
                    font-size: 1.1em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .backup-content {
                    padding: 16px;
                }
                .backup-info {
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                }
                .info-label {
                    font-weight: bold;
                    margin-right: 8px;
                    color: #555;
                    width: 50px;
                }
                .backup-actions {
                    display: flex;
                    gap: 8px;
                    padding: 12px 16px;
                    border-top: 1px solid #e0e0e0;
                    background-color: #f9f9f9;
                }
                button {
                    flex: 1;
                    padding: 8px 12px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: background-color 0.2s;
                }
                button.restore {
                    background-color: #4caf50;
                    color: white;
                }
                button.restore:hover {
                    background-color: #45a049;
                }
                button.download {
                    background-color: #2196f3;
                    color: white;
                }
                button.download:hover {
                    background-color: #0b7dda;
                }
                button.delete {
                    background-color: #f44336;
                    color: white;
                }
                button.delete:hover {
                    background-color: #d32f2f;
                }
            </style>
            <div class="backup-card">
                <div class="backup-header">
                    <div class="backup-name" title=""></div>
                </div>
                <div class="backup-content">
                    <div class="backup-info">
                        <span class="info-label">Fecha:</span>
                        <span class="backup-date"></span>
                    </div>
                    <div class="backup-info">
                        <span class="info-label">Tamaño:</span>
                        <span class="backup-size"></span>
                    </div>
                </div>
                <div class="backup-actions">
                    <button class="restore" data-action="restore">Restaurar</button>
                    <button class="download" data-action="download">Descargar</button>
                    <button class="delete" data-action="delete">Eliminar</button>
                </div>
            </div>
        `;
    }
    
    // Renderiza la estructura principal en el shadow DOM
    _renderMainStructure() {
        const mainFragment = this.mainTemplate.content.cloneNode(true);
        this.shadowRoot.appendChild(mainFragment);
    }
    
    // Crea una card para un backup específico
    _createBackupCard(backup) {
        // Clonar el template de la card
        const cardFragment = this.cardTemplate.content.cloneNode(true);
        const card = cardFragment.querySelector('.backup-card');
        
        // Configurar ID y datos del backup
        card.id = backup.id;
        
        // Establecer nombre y title para mostrar en hover
        const nameElement = card.querySelector('.backup-name');
        nameElement.textContent = backup.name;
        nameElement.setAttribute('title', backup.name);
        
        // Establecer fecha formateada
        card.querySelector('.backup-date').textContent = this._formatDate(backup.date);
        
        // Establecer tamaño humanizado
        card.querySelector('.backup-size').textContent = this._humanizeSize(backup.size);
        
        // Configurar los eventos de los botones
        card.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                this._emitDetail(button.getAttribute('data-action'), backup);
            });
        });
        
        return card;
    }
    
    // Emite un evento cuando se realiza una acción en un backup
    _emitDetail(action, backup) {
        const detail = { ...backup, action };
        this.dispatchEvent(new CustomEvent('backup-action', { detail }));
    }
    
    // Formatea la fecha
    _formatDate(date) {
        const dateObject = new Date(date);
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return dateObject.toLocaleDateString('es-ES', options);
    }
    
    // Convierte bytes en formato legible
    _humanizeSize(size) {
        if (size === 0) {
            return '0 B';
        }
        if (size < 0 || isNaN(size)) {
            return "Valor inválido";
        }
        const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        let i = 0;
        let formattedSize = size;
        
        while (formattedSize >= 1024 && i < units.length - 1) {
            formattedSize /= 1024;
            i++;
        }
        
        return `${formattedSize.toFixed(2)} ${units[i]}`;
    }
    
    // Método público para establecer las opciones (backups)
    setOptions(options) {
        this.gridElement.innerHTML = '';
        
        if (!options || options.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No hay backups disponibles';
            this.gridElement.appendChild(emptyState);
            return;
        }
        
        // Crear y añadir las cards de backup
        options.forEach(option => {
            const backupCard = this._createBackupCard(option);
            this.gridElement.appendChild(backupCard);
        });
    }
}

// Registrar el componente
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
  
// Clase para manejar la comunicación con la API
class BackupsApi {
    constructor(baseURL) {
        this.apiClient = new ApiClient(baseURL);
        this.backupsList = document.getElementById('backupsList');
        this.isUpdating = false;
        
        this._initEventListeners();
        this.updateBackupsList();
    }
    
    _initEventListeners() {
        // Listener para acciones en los backups
        this.backupsList.addEventListener('backup-action', (event) => {
            const { action, id } = event.detail;
            
            switch (action) {
                case 'delete':
                    this.deleteBackup(id);
                    break;
                case 'restore':
                    this.restoreBackup(id, window.localStorage.selectedServer);
                    break;
                case 'download':
                    this.downloadBackup(id);
                    break;
                default:
                    console.log('Acción no reconocida:', action);
            }
        });
        
        // Listener para crear nuevo backup
        const createButton = document.getElementById('create_backup');
        if (createButton) {
            createButton.addEventListener('click', () => this.createBackup());
        }
    }
    
    // Actualiza la lista de backups
    async updateBackupsList() {
        if (this.isUpdating) {
            return;
        }
        
        this.isUpdating = true;
        
        try {
            const response = await this.apiClient.get('/backupsInfo');
            const options = this._generateOptions(response);
            this.backupsList.setOptions(options);
            return response;
        } catch (error) {
            console.error('Error al obtener backups:', error);
            this._showError('No se pudieron cargar los backups');
            throw error;
        } finally {
            this.isUpdating = false;
        }
    }
    
    // Genera las opciones para la lista de backups
    _generateOptions(apiResponse) {
        const backupFiles = apiResponse.data?.files;
        
        if (!backupFiles || !Array.isArray(backupFiles)) {
            return [];
        }
        
        return backupFiles.map(file => ({
            name: file.name,
            label: file.name,
            id: file.name,
            date: file.modified,
            size: file.size,
        }));
    }
    
    // Crea un nuevo backup
    async createBackup() {
        const serverName = window.localStorage.selectedServer;
        const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
        const backupName = `${serverName}_${timestamp}_backup.tar.gz`;
        
        try {
            this._showLoading('Creando backup...');
            
            const response = await this.apiClient.post('/create', {
                folderName: serverName,
                outputFilename: backupName
            });
            
            this._showSuccess('Backup creado correctamente');
            await this.updateBackupsList();
            return response;
        } catch (error) {
            console.error('Error al crear backup:', error);
            this._showError('Error al crear el backup');
            throw error;
        } finally {
            this._hideLoading();
        }
    }
    
    // Elimina un backup
    async deleteBackup(filename) {
        if (!confirm(`¿Estás seguro de que deseas eliminar el backup "${filename}"?`)) {
            return;
        }
        
        try {
            this._showLoading('Eliminando backup...');
            
            const response = await this.apiClient.post('/delete', { filename });
            
            this._showSuccess('Backup eliminado correctamente');
            await this.updateBackupsList();
            return response;
        } catch (error) {
            console.error('Error al eliminar backup:', error);
            this._showError('Error al eliminar el backup');
            throw error;
        } finally {
            this._hideLoading();
        }
    }
    
    // Restaura un backup
    async restoreBackup(filename, outputFolderName) {
        if (!confirm(`¿Estás seguro de que deseas restaurar el backup "${filename}"? Esta acción sobrescribirá los datos existentes.`)) {
            return;
        }
        
        try {
            this._showLoading('Restaurando backup...');
            
            const response = await this.apiClient.post('/restore', {
                filename,
                outputFolderName
            });
            
            this._showSuccess('Backup restaurado correctamente');
            await this.updateBackupsList();
            return response;
        } catch (error) {
            console.error('Error al restaurar backup:', error);
            this._showError('Error al restaurar el backup');
            throw error;
        } finally {
            this._hideLoading();
        }
    }
    
    // Descarga un backup
    async downloadBackup(filename) {
        try {
            this._showLoading('Preparando descarga...');
            
            await this.apiClient.download(`/download/${filename}`, filename);
            
            this._showSuccess('Descarga iniciada');
            return true;
        } catch (error) {
            console.error('Error al descargar backup:', error);
            
            if (error.message.includes("404")) {
                this._showError('El archivo de backup no existe');
            } else {
                this._showError('Error al descargar el backup');
            }
            
            throw error;
        } finally {
            this._hideLoading();
        }
    }
    
    // Métodos para mostrar feedback al usuario
    _showLoading(message) {
        // Implementar según la UI
        console.log(message);
    }
    
    _hideLoading() {
        // Implementar según la UI
    }
    
    _showSuccess(message) {
        // Implementar según la UI
        console.log(message);
    }
    
    _showError(message) {
        // Implementar según la UI
        console.error(message);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    const backupsApi = new BackupsApi('/api/backups');
});