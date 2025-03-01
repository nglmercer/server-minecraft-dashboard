class BackupsList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    --card-bg: #2a2a2a;
                    --card-border: #444;
                    --card-text: #e0e0e0;
                    --card-highlight: #3a3a3a;
                    --button-primary: #4a6da7;
                    --button-danger: #a74a4a;
                    --button-secondary: #4a8f6d;
                    --button-text: #ffffff;
                    --date-color: #a19fd8;
                    --size-color: #8fbcbb;
                    --hover-brightness: 1.2;
                }
                
                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 20px;
                    padding: 16px;
                }
                
                .grid-item {
                    background-color: var(--card-bg);
                    border: 1px solid var(--card-border);
                    border-radius: 8px;
                    padding: 20px;
                    box-sizing: border-box;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                    transition: transform 0.2s, box-shadow 0.2s;
                    color: var(--card-text);
                }
                
                .grid-item:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
                    border-color: #666;
                }
                
                .backup-name {
                    font-size: 1.2rem;
                    font-weight: bold;
                    margin-bottom: 12px;
                    border-bottom: 1px solid var(--card-border);
                    padding-bottom: 8px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .backup-info {
                    display: grid;
                    grid-template-columns: auto 1fr;
                    gap: 6px 10px;
                    margin-bottom: 16px;
            white-space: normal;     
            word-wrap: break-word;   
            overflow: hidden;
                }
                
                .info-label {
                    color: #999;
                    font-size: 0.9rem;
                }
                
                .info-value {
                    font-size: 0.9rem;

                }
                
                .date-value {
                    color: var(--date-color);
                }
                
                .size-value {
                    color: var(--size-color);
                    font-weight: bold;
                }
                
                .buttons {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }
                
                .download-btn {
                    grid-column: 1 / -1;
                }
                
                button {
                    padding: 10px 12px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    color: var(--button-text);
                    transition: filter 0.2s, transform 0.1s;
                }
                
                button:hover {
                    filter: brightness(var(--hover-brightness));
                }
                
                button:active {
                    transform: scale(0.98);
                }
                
                button[data-action="delete"] {
                    background-color: var(--button-danger);
                }
                
                button[data-action="restore"] {
                    background-color: var(--button-secondary);
                }
                
                button[data-action="download"] {
                    background-color: var(--button-primary);
                }
                
                .no-backups {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 40px;
                    color: #999;
                    font-style: italic;
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
        
        if (!options || options.length === 0) {
            const noBackups = document.createElement('div');
            noBackups.className = 'no-backups';
            noBackups.textContent = 'No hay copias de seguridad disponibles';
            this.gridElement.appendChild(noBackups);
            return;
        }
        
        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'grid-item';
            item.id = option.id;
            
            item.innerHTML = `
                <div class="backup-name">${option.name}</div>
                <div class="backup-info">
                    <span class="info-label">Nombre:</span>
                    <span class="info-value">${option.name}</span>
                    
                    <span class="info-label">Fecha:</span>
                    <span class="info-value date-value">${this._formatDate(option.date)}</span>
                    
                    <span class="info-label">Tamaño:</span>
                    <span class="info-value size-value">${this._humanizeSize(option.size)}</span>
                </div>
                <div class="buttons">
                    <button data-action="delete">Eliminar</button>
                    <button data-action="restore">Restaurar</button>
                    <button data-action="download" class="download-btn">Descargar</button>
                </div>
            `;
            
            item.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._emitDetail(button.getAttribute('data-action'), option);
                });
            });
            
            this.gridElement.appendChild(item);
        });
    }
    
    _formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const options = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            return date.toLocaleDateString('es-ES', options);
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateString || 'Fecha desconocida';
        }
    }
    
    _humanizeSize(size) {
        if (size === 0) {
            return '0 B';
        }
        if (size === undefined || size === null || isNaN(size)) {
            return "Tamaño desconocido";
        }
        const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        let i = 0;
        let convertedSize = parseFloat(size);
        
        while (convertedSize >= 1024 && i < units.length - 1) {
            convertedSize /= 1024;
            i++;
        }
        
        return `${convertedSize.toFixed(2)} ${units[i]}`;
    }
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
            headers: {},
        };

        if (data && method !== 'GET') {
            config.headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                let errorMessage = `Error: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.message) {
                        errorMessage += ` - ${errorData.message}`;
                    }
                } catch (parseError) {
                    console.error("Error parsing error response:", parseError);
                }
                throw new Error(errorMessage);
            }

            if (responseType === 'json') {
                return await response.json();
            } else if (responseType === 'blob') {
                return await response.blob();
            } else {
                return response;
            }

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                console.error("Network error. Is the server running?", error);
                throw new Error("Error de red: No se pudo conectar al servidor.");
            }
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
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;

            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            return { success: true, filename };
        } catch (error) {
            console.error("Error during download:", error);
            throw error;
        }
    }
}

// Main application logic
(function() {
    const apiClient = new ApiClient('/api/backups');
    let isUpdating = false;
    const backupsElement = document.getElementById('backupsList');
    
    if (!backupsElement) {
        console.error('Error: Element with id "backupsList" not found');
        return;
    }
    
    // Loading state UI
    function showLoading(show = true) {
        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
        }
    }
    
    // Toast notification system
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 3000);
        }, 10);
    }
    
    async function updateBackupsList() {
        if (isUpdating) {
            return;
        }
        
        isUpdating = true;
        showLoading(true);
        
        try {
            const response = await apiClient.get('/backupsInfo');
            console.log('Lista de backups:', response);
            
            if (response && response.data && response.data.files) {
                const options = generateOptions(response);
                backupsElement.setOptions(options);
            } else {
                backupsElement.setOptions([]);
                console.warn('No backup files found or unexpected response format');
            }
            
            return response;
        } catch (error) {
            console.error('Error al obtener backups:', error);
            showToast('Error al cargar las copias de seguridad', 'error');
            backupsElement.setOptions([]);
            throw error;
        } finally {
            isUpdating = false;
            showLoading(false);
        }
    }
    
    function generateOptions(response) {
        const optionsArray = [];
        const backupFiles = response.data?.files;
        
        if (!backupFiles || !Array.isArray(backupFiles)) {
            return [];
        }
        
        backupFiles.forEach(file => {
            optionsArray.push({
                name: file.name,
                label: file.name,
                id: file.name,
                date: file.modified || new Date().toISOString(),
                size: file.size || 0,
            });
        });
        
        // Sort by date, newest first
        return optionsArray.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    async function createBackup() {
        const serverName = window.localStorage.selectedServer;
        if (!serverName) {
            showToast('No se ha seleccionado un servidor', 'error');
            return;
        }
        
        showLoading(true);
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
        const uniqueBackupName = `${serverName}_${timestamp}_backup.tar.gz`;
        
        try {
            const response = await apiClient.post('/create', { 
                folderName: serverName, 
                outputFilename: uniqueBackupName 
            });
            
            console.log('Backup creado:', response);
            showToast('Copia de seguridad creada correctamente', 'success');
            await updateBackupsList();
            return response;
        } catch (error) {
            console.error('Error al crear backup:', error);
            showToast('Error al crear la copia de seguridad', 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }
    
    async function deleteBackup(filename) {
        showLoading(true);
        try {
            const response = await apiClient.post('/delete', { filename });
            console.log('Backup borrado:', response);
            showToast('Copia de seguridad eliminada correctamente', 'success');
            await updateBackupsList();
            return response;
        } catch (error) {
            console.error('Error al borrar backup:', error);
            showToast('Error al eliminar la copia de seguridad', 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }
    
    async function restoreBackup(filename, outputFolderName) {
        if (!outputFolderName) {
            showToast('No se ha seleccionado un servidor de destino', 'error');
            return;
        }
        
        // Confirmation dialog
        if (!confirm(`¿Está seguro de restaurar la copia de seguridad "${filename}" en el servidor "${outputFolderName}"?`)) {
            return;
        }
        
        showLoading(true);
        try {
            const response = await apiClient.post('/restore', { 
                filename, 
                outputFolderName 
            });
            
            console.log('Backup restaurado:', response);
            showToast('Copia de seguridad restaurada correctamente', 'success');
            await updateBackupsList();
            return response;
        } catch (error) {
            console.error('Error al restaurar backup:', error);
            showToast('Error al restaurar la copia de seguridad', 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }
    
    async function downloadBackup(filename) {
        showLoading(true);
        try {
            await apiClient.download(`/download/${filename}`, filename);
            console.log(`Descargando ${filename}...`);
            showToast(`Descargando ${filename}...`, 'info');
        } catch (error) {
            console.error(`Error al descargar ${filename}:`, error);
            
            if (error.message.includes("404")) {
                showToast("El archivo no existe o ha sido eliminado", 'error');
            } else {
                showToast("Error al descargar el archivo", 'error');
            }
            
            throw error;
        } finally {
            showLoading(false);
        }
    }
    
    // Event listeners
    backupsElement.addEventListener('backup-action', (event) => {
        console.log('Backup action:', event.detail);
        const { action, id } = event.detail;
        
        switch (action) {
            case 'delete':
                deleteBackup(id).catch(error => {
                    console.error("Error during delete:", error);
                });
                break;
            case 'restore':
                restoreBackup(id, window.localStorage.selectedServer).catch(error => {
                    console.error("Error during restore:", error);
                });
                break;
            case 'download':
                downloadBackup(id).catch(error => {
                    console.error("Error during download:", error);
                });
                break;
            default:
                console.log('No se encontró una acción para el evento:', event.detail);
        }
    });
    
    const createBackupBtn = document.getElementById('create_backup');
    if (createBackupBtn) {
        createBackupBtn.addEventListener('click', () => {
            createBackup().catch(error => {
                console.error("Error during create backup:", error);
            });
        });
    }
    
    // Add CSS for toast notifications
    const style = document.createElement('style');
    style.textContent = `
        /* Toast notifications */
        .toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background-color: #333;
            color: white;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s, transform 0.3s;
        }
        
        .toast.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .toast-success {
            background-color: #4a8f6d;
        }
        
        .toast-error {
            background-color: #a74a4a;
        }
        
        .toast-info {
            background-color: #4a6da7;
        }
        
        /* Loading indicator */
        #loading-indicator {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1001;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    // Create loading indicator element
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.style.display = 'none';
    loadingIndicator.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loadingIndicator);
    
    // Initial load
    updateBackupsList().catch(error => {
        console.error("Error during initial backup list update:", error);
    });
})();