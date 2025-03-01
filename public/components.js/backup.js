class BackupsManager {
    constructor(containerId, options = {}) {
        // Opciones por defecto
        this.options = {
            apiBaseUrl: '/api/backups',
            tailwind: false, // Para determinar si usar clases de Tailwind o CSS puro
            ...options
        };
        
        // El elemento contenedor donde se renderizará el componente
        this.container = document.querySelector(containerId);
        if (!this.container) {
            throw new Error(`Contenedor con ID "${containerId}" no encontrado`);
        }
        
        // Referencias a elementos principales
        this.gridElement = null;
        
        // Estado
        this.backups = [];
        this.isLoading = false;
        
        // Inicialización
        this._createDOMStructure();
        this._setupEventListeners();
    }
    
    /**
     * Crea la estructura DOM básica del componente
     */
    _createDOMStructure() {
        if (this.options.tailwind) {
            this._createTailwindStructure();
        } else {
            this._createCSSStructure();
        }
    }
    
    /**
     * Crea la estructura DOM usando clases de Tailwind
     */
    _createTailwindStructure() {
        this.container.innerHTML = `
            <div id="backups-container" class="w-full">
                <!-- Contenedor de la cuadrícula de backups -->
                <div id="backups-grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                    <!-- Estado vacío -->
                    <div id="empty-state" class="col-span-full text-center py-8 text-gray-500">
                        No hay backups disponibles
                    </div>
                </div>
                
                <!-- Contenedor para mensajes de estado -->
                <div id="status-message" class="hidden fixed top-4 right-4 p-4 rounded shadow-lg"></div>
            </div>
        `;
        
        this.gridElement = this.container.querySelector('#backups-grid');
        this.emptyStateElement = this.container.querySelector('#empty-state');
        this.statusMessageElement = this.container.querySelector('#status-message');
    }
    
    /**
     * Crea la estructura DOM usando CSS puro
     */
    _createCSSStructure() {
        // Inyectar CSS en el head
        if (!document.getElementById('backups-manager-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'backups-manager-styles';
            styleElement.textContent = `
                .backups-container {
                    width: 100%;
                    font-family: Arial, sans-serif;
                }
                .backups-grid {
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
                    overflow: auto;
                }
                .btn {
                    flex: 1;
                    padding: 8px 12px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: background-color 0.2s;
                }
                .btn-restore {
                    background-color: #4caf50;
                    color: white;
                }
                .btn-restore:hover {
                    background-color: #45a049;
                }
                .btn-download {
                    background-color: #2196f3;
                    color: white;
                }
                .btn-download:hover {
                    background-color: #0b7dda;
                }
                .btn-delete {
                    background-color: #f44336;
                    color: white;
                }
                .btn-delete:hover {
                    background-color: #d32f2f;
                }
                .status-message {
                    display: none;
                    position: fixed;
                    top: 16px;
                    right: 16px;
                    padding: 16px;
                    border-radius: 4px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    z-index: 1000;
                    animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
                }
                .status-error {
                    background-color: #f44336;
                    color: white;
                }
                .status-success {
                    background-color: #4caf50;
                    color: white;
                }
                .status-loading {
                    background-color: #2196f3;
                    color: white;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(styleElement);
        }
        
        this.container.innerHTML = `
            <div id="backups-container" class="backups-container">
                <div id="backups-grid" class="backups-grid">
                    <div id="empty-state" class="empty-state">
                        No hay backups disponibles
                    </div>
                </div>
                <div id="status-message" class="status-message"></div>
            </div>
        `;
        
        this.gridElement = this.container.querySelector('#backups-grid');
        this.emptyStateElement = this.container.querySelector('#empty-state');
        this.statusMessageElement = this.container.querySelector('#status-message');
    }
    
    /**
     * Crea el template de la card para un backup
     * @param {Object} backup - Datos del backup
     * @returns {HTMLElement} Elemento card con los datos del backup
     */
    _createBackupCard(backup) {
        if (this.options.tailwind) {
            return this._createTailwindBackupCard(backup);
        } else {
            return this._createCSSBackupCard(backup);
        }
    }
    
    /**
     * Crea una card de backup con Tailwind CSS
     * @param {Object} backup - Datos del backup
     * @returns {HTMLElement} Elemento card con los datos del backup
     */
    _createTailwindBackupCard(backup) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1';
        card.id = backup.id;
        
        card.innerHTML = `
            <div class="bg-gray-100 p-3 border-b border-gray-200">
                <div class="font-bold text-lg truncate" title="${backup.name}">${backup.name}</div>
            </div>
            <div class="p-4">
                <div class="flex items-center mb-2">
                    <span class="font-semibold text-gray-600 w-14">Fecha:</span>
                    <span>${this._formatDate(backup.date)}</span>
                </div>
                <div class="flex items-center">
                    <span class="font-semibold text-gray-600 w-14">Tamaño:</span>
                    <span>${this._humanizeSize(backup.size)}</span>
                </div>
            </div>
            <div class="flex p-3 bg-gray-50 border-t border-gray-200 gap-2">
                <button class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded transition-colors" data-action="restore">Restaurar</button>
                <button class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded transition-colors" data-action="download">Descargar</button>
                <button class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded transition-colors" data-action="delete">Eliminar</button>
            </div>
        `;
        
        // Configurar eventos para los botones
        card.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                this._handleAction(action, backup);
            });
        });
        
        return card;
    }
    
    /**
     * Crea una card de backup con CSS puro
     * @param {Object} backup - Datos del backup
     * @returns {HTMLElement} Elemento card con los datos del backup
     */
    _createCSSBackupCard(backup) {
        const card = document.createElement('div');
        card.className = 'backup-card';
        card.id = backup.id;
        
        card.innerHTML = `
            <div class="backup-header">
                <div class="backup-name" title="${backup.name}">${backup.name}</div>
            </div>
            <div class="backup-content">
                <div class="backup-info">
                    <span class="info-label">Fecha:</span>
                    <span class="backup-date">${this._formatDate(backup.date)}</span>
                </div>
                <div class="backup-info">
                    <span class="info-label">Tamaño:</span>
                    <span class="backup-size">${this._humanizeSize(backup.size)}</span>
                </div>
            </div>
            <div class="backup-actions">
                <button class="btn btn-restore" data-action="restore">Restaurar</button>
                <button class="btn btn-download" data-action="download">Descargar</button>
                <button class="btn btn-delete" data-action="delete">Eliminar</button>
            </div>
        `;
        
        // Configurar eventos para los botones
        card.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                this._handleAction(action, backup);
            });
        });
        
        return card;
    }
    
    /**
     * Configura los listeners de eventos
     */
    _setupEventListeners() {
        // Listener para acciones en los backups

    }
    
    /**
     * Maneja las acciones de los botones
     * @param {string} action - Acción a realizar (restore, download, delete)
     * @param {Object} backup - Datos del backup
     */
    _handleAction(action, backup) {
        // Crear y disparar un evento personalizado
        const event = new CustomEvent('backup-action', {
            detail: { 
                action, 
                id: backup.id,
                name: backup.name
            }
        });
        this.container.dispatchEvent(event);
    }
    
    /**
     * Formatea la fecha
     * @param {string} date - Fecha en formato ISO
     * @returns {string} Fecha formateada
     */
    _formatDate(date) {
        const dateObject = new Date(date);
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return dateObject.toLocaleDateString('es-ES', options);
    }
    
    /**
     * Convierte bytes en formato legible
     * @param {number} size - Tamaño en bytes
     * @returns {string} Tamaño en formato legible
     */
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
    
    /**
     * Muestra mensaje de estado
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de mensaje (error, success, loading)
     * @param {number} duration - Duración en ms (0 para no ocultar automáticamente)
     */
    showMessage(message, type = 'success', duration = 3000) {
        if (this.options.tailwind) {
            this.statusMessageElement.className = `fixed top-4 right-4 p-4 rounded shadow-lg ${
                type === 'error' ? 'bg-red-500 text-white' : 
                type === 'success' ? 'bg-green-500 text-white' : 
                'bg-blue-500 text-white'
            }`;
        } else {
            this.statusMessageElement.className = `status-message status-${type}`;
            this.statusMessageElement.style.display = 'block';
        }
        
        this.statusMessageElement.textContent = message;
        
        if (duration > 0) {
            setTimeout(() => {
                if (this.options.tailwind) {
                    this.statusMessageElement.className = 'hidden';
                } else {
                    this.statusMessageElement.style.display = 'none';
                }
            }, duration);
        }
    }
    
    /**
     * Oculta el mensaje de estado
     */
    hideMessage() {
        if (this.options.tailwind) {
            this.statusMessageElement.className = 'hidden';
        } else {
            this.statusMessageElement.style.display = 'none';
        }
    }
    
    /**
     * Establece los backups a mostrar
     * @param {Array} backups - Array de objetos backup
     */
    setBackups(backups) {
        this.backups = backups || [];
        this._renderBackups();
    }
    
    /**
     * Renderiza los backups en el DOM
     */
    _renderBackups() {
        // Limpiar el grid
        this.gridElement.innerHTML = '';
        
        if (!this.backups || this.backups.length === 0) {
            // Mostrar estado vacío
            if (this.options.tailwind) {
                this.emptyStateElement = document.createElement('div');
                this.emptyStateElement.className = 'col-span-full text-center py-8 text-gray-500';
                this.emptyStateElement.textContent = 'No hay backups disponibles';
                this.gridElement.appendChild(this.emptyStateElement);
            } else {
                this.emptyStateElement = document.createElement('div');
                this.emptyStateElement.className = 'empty-state';
                this.emptyStateElement.textContent = 'No hay backups disponibles';
                this.gridElement.appendChild(this.emptyStateElement);
            }
            return;
        }
        
        // Crear y añadir las cards de backup
        this.backups.forEach(backup => {
            const backupCard = this._createBackupCard(backup);
            this.gridElement.appendChild(backupCard);
        });
    }
}
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
class BackupsApiManager {
    constructor(containerId, options = {}) {
        this.apiClient = new ApiClient(options.apiBaseUrl || '/api/backups');
        this.backupsManager = new BackupsManager(containerId, options);
        
        // Inicializar eventos
        this._initEventListeners();
        
        // Cargar backups al iniciar
        this.updateBackupsList();
    }
    
    _initEventListeners() {
        // cambiarlo por la clase y usamos querySelector
        console.log(this.backupsManager.container.className);
        const container = document.querySelector("."+this.backupsManager.container.className);
        container.addEventListener('backup-action', (event) => {
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
        this.backupsManager.showMessage('Cargando backups...', 'loading');
        
        try {
            const response = await this.apiClient.get('/backupsInfo');
            const options = this._generateOptions(response);
            this.backupsManager.setBackups(options);
            this.backupsManager.hideMessage();
            return response;
        } catch (error) {
            console.error('Error al obtener backups:', error);
            this.backupsManager.showMessage('No se pudieron cargar los backups', 'error');
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
            this.backupsManager.showMessage('Creando backup...', 'loading', 0);
            
            const response = await this.apiClient.post('/create', {
                folderName: serverName,
                outputFilename: backupName
            });
            
            this.backupsManager.showMessage('Backup creado correctamente', 'success');
            await this.updateBackupsList();
            return response;
        } catch (error) {
            console.error('Error al crear backup:', error);
            this.backupsManager.showMessage('Error al crear el backup', 'error');
            throw error;
        }
    }
    
    // Elimina un backup
    async deleteBackup(filename) {
        if (!confirm(`¿Estás seguro de que deseas eliminar el backup "${filename}"?`)) {
            return;
        }
        
        try {
            this.backupsManager.showMessage('Eliminando backup...', 'loading', 0);
            
            const response = await this.apiClient.post('/delete', { filename });
            
            this.backupsManager.showMessage('Backup eliminado correctamente', 'success');
            await this.updateBackupsList();
            return response;
        } catch (error) {
            console.error('Error al eliminar backup:', error);
            this.backupsManager.showMessage('Error al eliminar el backup', 'error');
            throw error;
        }
    }
    
    // Restaura un backup
    async restoreBackup(filename, outputFolderName) {
        if (!confirm(`¿Estás seguro de que deseas restaurar el backup "${filename}"? Esta acción sobrescribirá los datos existentes.`)) {
            return;
        }
        
        try {
            this.backupsManager.showMessage('Restaurando backup...', 'loading', 0);
            
            const response = await this.apiClient.post('/restore', {
                filename,
                outputFolderName
            });
            
            this.backupsManager.showMessage('Backup restaurado correctamente', 'success');
            await this.updateBackupsList();
            return response;
        } catch (error) {
            console.error('Error al restaurar backup:', error);
            this.backupsManager.showMessage('Error al restaurar el backup', 'error');
            throw error;
        }
    }
    
    // Descarga un backup
    async downloadBackup(filename) {
        try {
            this.backupsManager.showMessage('Preparando descarga...', 'loading', 0);
            
            await this.apiClient.download(`/download/${filename}`, filename);
            
            this.backupsManager.showMessage('Descarga iniciada', 'success');
            return true;
        } catch (error) {
            console.error('Error al descargar backup:', error);
            
            if (error.message.includes("404")) {
                this.backupsManager.showMessage('El archivo de backup no existe', 'error');
            } else {
                this.backupsManager.showMessage('Error al descargar el backup', 'error');
            }
            
            throw error;
        }
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const backupsApi = new BackupsApiManager('.backuplist');
});