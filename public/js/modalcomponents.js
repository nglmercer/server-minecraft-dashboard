async function loadGlobalStyles(element = 0) {
    // 1. Buscar el tag <link> con los estilos
    const styleLinks = document.querySelectorAll('link[rel="stylesheet"]');
    const styleLink = styleLinks[element]; // Selecciona el segundo enlace
    if (!styleLink) {
      console.error('No se encontró enlace a hoja de estilos');
      return '';
    }
  
    try {
      // 2. Hacer fetch al archivo CSS
      const response = await fetch(styleLink.href);
      return await response.text();
    } catch (error) {
      console.error('Error cargando estilos:', error);
      return '';
    }
  }
  
  const API_BASE = "https://api.modrinth.com/v2";
  const SEARCH_API = `${API_BASE}/search`;
  const PROJECT_API = `${API_BASE}/project`;
  const connect_plugin = [
    {
      title: "minekube-connect",
      description: " Minecraft Plugin for Connect, allows tunneled player connections from Connect Network to join Spigot/Paper server and Velocity/BungeeCord proxy, even in online mode! ",
      icon_url: "https://avatars.githubusercontent.com/u/51905918?s=48&v=4",
      versions: [
        {
          version_number: "1.0.0",
          files:[ "https://github.com/minekube/connect-java/releases/download/latest/connect-bungee.jar"],
          filename: "connect-bungee.jar",
          loaders: ["BungeeCord"],
          game_versions: ["1.8-1.20.6"],
        },
        {
          files:[ "https://github.com/minekube/connect-java/releases/download/latest/connect-spigot.jar"],
          filename: "connect-spigot.jar",
          version_number: "1.0.0",
          loaders: ["Spigot"],
          game_versions: ["1.8-1.20.6"],
        }
        ,{
          files:[ "https://github.com/minekube/connect-java/releases/download/latest/connect-velocity.jar"],
          filename: "connect-velocity.jar",
          version_number: "1.0.0",
          loaders: ["Velocity"],
          game_versions: ["1.8-1.20.6"],
        }
      ],
      author: "Tú",
      customField: "Support up to Minecraft 1.20.6 (robinbraemer)",
    }
  ]
  class ModSearch extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open', delegatesFocus: true });
      this.shadowRoot.innerHTML = `
        <div class="container mx-auto px-4 py-8">
          <div class="max-w-2xl mx-auto mb-8">
            <input type="text" 
                   class="w-full bg-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                   placeholder="Search mods or plugins...">
          </div>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-h-70dvh overflow-y-auto" id="results"></div>
        </div>
      `;
    }
  
    async connectedCallback() {
      const css = await loadGlobalStyles();
      const style = document.createElement('style');
      style.textContent = css;
      this.shadowRoot.prepend(style);
      this.input = this.shadowRoot.querySelector('input');
      this.resultsContainer = this.shadowRoot.getElementById('results');
      this.input.addEventListener('input', this.handleSearch.bind(this));
      this.loadResults(); // Cargar resultados iniciales
    }
    addCustomMods(customMods) {
      if (!customMods) return;
      const processed = customMods.map(mod => ({
        ...mod,
        isCustom: true, // Flag para identificar mods personalizados
        slug: mod.id || Math.random().toString(36).substr(2, 9) // ID único si no existe
      }));
      
      this.displayResults(processed, true);
    }
  
    // Función para cargar resultados iniciales
    async loadResults() {
      try {
        const response = await fetch(`${SEARCH_API}?query=minecraft`);
        const data = await response.json();
        this.displayResults(data.hits);
        this.addCustomMods(connect_plugin);
      } catch (error) {
        console.error('Error loading initial results:', error);
      }
    }
  
    async handleSearch(e) {
      const query = e.target.value;
      if (query.length < 2) {
        this.loadResults(); // Volver a cargar resultados iniciales si la búsqueda es muy corta
        return;
      }
      
      try {
        const response = await fetch(`${SEARCH_API}?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        this.displayResults(data.hits);
      } catch (error) {
        console.error('Search error:', error);
      }
    }
  
  
    displayResults(results, isCustom = false) {
      this.resultsContainer.innerHTML = '';
      const template = document.getElementById('mod-card-template');
      
      results.forEach(project => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('div');
        card.querySelector('h3').textContent = project.title || project.name;
        card.querySelector('p').textContent = project.description;
        
        const img = card.querySelector('img');
        img.src = project.icon_url || project.image || 'https://via.placeholder.com/100';
        
        card.addEventListener('click', () => {
          if(project.isCustom) {
            const details = document.createElement('mod-details');
            details.project = project; // Pasamos el objeto completo
            this.shadowRoot.appendChild(details);
            this.shadowRoot.querySelector('.container').hidden = true;
          } else {
            this.showModDetails(project.slug);
          }
        });
        
        this.resultsContainer.appendChild(clone);
      });
    }
  
    async showModDetails(slug) {
      try {
        const [projectRes, versionsRes] = await Promise.all([
          fetch(`${PROJECT_API}/${slug}`),
          fetch(`${PROJECT_API}/${slug}/version`)
        ]);
        
        const project = await projectRes.json();
        const versions = await versionsRes.json();
        
        const details = document.createElement('mod-details');
        details.project = { ...project, versions };
        this.shadowRoot.appendChild(details);
        this.shadowRoot.querySelector('.container').hidden = true;
      } catch (error) {
        console.error('Error fetching details:', error);
      }
    }
  }
  
  class ModDetails extends HTMLElement {
    set project(value) {
      this._project = value;
      this.render();
    }
  
    constructor() {
      super();
      this.attachShadow({ mode: 'open', delegatesFocus: true });
      this.shadowRoot.innerHTML = document.getElementById('mod-details-template').innerHTML;
    }
  
    async connectedCallback() {
      const css = await loadGlobalStyles();
      const style = document.createElement('style');
      style.textContent = css;
      this.shadowRoot.prepend(style);
      this.shadowRoot.getElementById('back-button').addEventListener('click', () => {
        this.remove();
        document.querySelector('mod-search').shadowRoot.querySelector('.container').hidden = false;
      });
    }
  
    render() {
      const { title, description, project_type, versions, icon_url } = this._project;
      
      this.shadowRoot.querySelector('h1').textContent = title;
      this.shadowRoot.querySelector('p').textContent = description;
      this.shadowRoot.querySelector('img').src = icon_url || 'https://via.placeholder.com/128';
      this.shadowRoot.querySelector('span:first-child').textContent = project_type;
      const uniqueVersions = [...new Set(versions.flatMap(v => v.game_versions))];
      const versionSelect = this.shadowRoot.getElementById('version-filter');
      versionSelect.innerHTML = '<option value="">All Versions</option>';
      uniqueVersions.forEach(v => {
        versionSelect.innerHTML += `<option value="${v}">${v}</option>`;
      });
  
      const uniqueLoaders = [...new Set(versions.flatMap(v => v.loaders))];
      const loaderSelect = this.shadowRoot.getElementById('loader-filter');
      loaderSelect.innerHTML = '<option value="">All Loaders</option>';
      uniqueLoaders.forEach(loader => {
        loaderSelect.innerHTML += `<option value="${loader}">${loader}</option>`;
      });
  
      versionSelect.addEventListener('change', this.filterVersions.bind(this));
      loaderSelect.addEventListener('change', this.filterVersions.bind(this));
      
      this.filterVersions();
    }
  
    filterVersions() {
      const versionFilter = this.shadowRoot.getElementById('version-filter').value;
      const loaderFilter = this.shadowRoot.getElementById('loader-filter').value;
      
      const filtered = this._project.versions.filter(v => {
        return (!versionFilter || v.game_versions.includes(versionFilter)) &&
               (!loaderFilter || v.loaders.includes(loaderFilter));
      });
  
      const versionsList = this.shadowRoot.getElementById('versions-list');
      versionsList.innerHTML = '';
  
      filtered.forEach(version => {
      // 1. Obtener game_versions de la versión o del proyecto
      const gameVersions = version.game_versions 
        ? version.game_versions 
        : this._project.game_versions || []; // Si no hay en versión, usar los del proyecto
  
      // 2. Sanitizar y formatear
      const parsedGameVersions = gameVersions.map(v => v.replaceAll('.', '.')) || [];
  
      const div = document.createElement('div');
      div.className = 'bg-gray-700 p-4 rounded-lg';
      div.innerHTML = `
        <div class="flex justify-between items-center scheme-dark-light">
          <div>
            <span class="font-bold">${version.version_number}</span>
            <span class="text-gray-400 ml-2">${parsedGameVersions.join(', ')}</span>
          </div>
          <button class="download-button px-4 py-2 rounded hover:bg-blue-600">
            Download
          </button>
        </div>
        <div class="mt-2 text-sm text-gray-400">
          ${version.loaders ? `Loaders: ${version.loaders.join(', ')}` : ''} 
        </div>
      `;
      // Añade el event listener para el custom event
      const button = div.querySelector('button');
      button.addEventListener('click', () => {
        const downloadEvent = new CustomEvent('download-request', {
          detail: version,
          bubbles: true,
          composed: true
        });
        this.dispatchEvent(downloadEvent);
      });
      /* get {
            url: version.files[0].url,
            filename: version.files[0].filename,
            version: version.version_number,
            modName: this._project.title,
            versionraw: version
          },
      */
      versionsList.appendChild(div);
    });
    }
  }
  
  customElements.define('mod-search', ModSearch);
  customElements.define('mod-details', ModDetails);

if (!customElements.get('custom-modal')) {
setTimeout(() => {
    class CustomModal extends HTMLElement {
        constructor() {
            super();
            this.isOpen = false;
            this.currentMode = 'dark'; // Default to dark mode
            this.onOpenCallback = null;
            this.onCloseCallback = null;
            
            // Create shadow DOM
            this.attachShadow({ mode: 'open' });
            
            // Create base modal structure
            const htmlelement = /*html*/`
                <style>
                  ${this.getStyles()}
                </style>
                <div class="modal-overlay">
                    <div class="modal-content">
                        <button class="close-button">&times;</button>
                        <div class="modal-body">
                            <slot></slot>
                        </div>
                    </div>
                </div>
            `;
    
            // Add modal structure to shadow DOM
            this.shadowRoot.innerHTML = htmlelement;
            
            // Get references within shadow DOM
            this.overlay = this.shadowRoot.querySelector('.modal-overlay');
            this.closeButton = this.shadowRoot.querySelector('.close-button');
            this.modalBody = this.shadowRoot.querySelector('.modal-body');
            
            this.setupEventListeners();
            
            // Set default to dark mode
            this.setMode('dark');
        }
        getStyles(){
          return /*css*/`
                    :host {
                        display: none;
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 1000;
                        opacity: 0;
                        transition: opacity 0.5s ease;
                    }
                    :host([visible]) {
                        opacity: 1;
                    }
                    .modal-content {
                        padding: 1rem;
                        border-radius: 8px;
                        position: relative;
                        min-width: 360px;
                        min-height: 360px;
                        max-height: 95dvh;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        opacity: 0;
                        transition: all 0.3s ease;
                        transform: scale(0.9);
                    }
                    :host([visible]) .modal-content {
                        transform: scale(1);
                        opacity: 1;
                    }
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        transition: background-color 0.3s ease;
                    }
                    
                    /* Dark Mode Styles */
                    :host(.dark-mode) .modal-overlay {
                        background: rgba(0, 0, 0, 0.5);
                    }
                    :host(.dark-mode) .modal-content {
                        background: #1c1c1c;
                        color: #f4f4f4;
                    }
                    
                    /* Light Mode Styles */
                    :host(.light-mode) .modal-overlay {
                        background: rgba(0, 0, 0, 0.3);
                    }
                    :host(.light-mode) .modal-content {
                        background: #ffffff;
                        color: #333;
                        border: 1px solid #e0e0e0;
                    }
                    
                    .close-button {
                        position: absolute;
                        top: 1px;
                        right: 1px;
                        border: none;
                        cursor: pointer;
                        width: 36px;
                        height: 36px;
                        border-radius: 10%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                    }
                    
                    /* Dark Mode Button */
                    :host(.dark-mode) .close-button {
                        background-color: #dc3545;
                        color: white;
                    }
                    :host(.dark-mode) .close-button:hover {
                        background-color: #c82333;
                    }
                    
                    /* Light Mode Button */
                    :host(.light-mode) .close-button {
                        background-color: #f0f0f0;
                        color: #333;
                    }
                    :host(.light-mode) .close-button:hover {
                        background-color: #e0e0e0;
                    }
                    
                    .modal-body {
                        margin-top: 20px;
                    }
                    
                    ::slotted(*) {
                        max-width: 100%;
                    }
          `;
        }
        connectedCallback() {
            // No additional setup needed in connectedCallback
        }
    
        setupEventListeners() {
            this.closeButton.addEventListener('click', () => this.close());
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }
    
        // New method to set mode
        setMode(mode = 'dark') {
            // Validate mode
            if (!['dark', 'light'].includes(mode)) {
                console.warn('Invalid mode. Using default dark mode.');
                mode = 'dark';
            }
    
            // Remove existing mode classes
            this.classList.remove('dark-mode', 'light-mode');
            
            // Add new mode class
            this.classList.add(`${mode}-mode`);
            this.currentMode = mode;
        }
    
        // Toggle between dark and light modes
        toggleMode() {
            const newMode = this.currentMode === 'dark' ? 'light' : 'dark';
            this.setMode(newMode);
        }
    
        open(onOpenCallback = null) {
            this.onOpenCallback = onOpenCallback;
            this.style.display = 'block';
            // Force reflow
            this.offsetHeight;
            this.setAttribute('visible', '');
            this.isOpen = true;
            
            if (this.onOpenCallback) {
                this.onOpenCallback();
            }
        }
    
        close(onCloseCallback = null) {
            this.onCloseCallback = onCloseCallback;
            this.removeAttribute('visible');
            this.isOpen = false;
            
            // Wait for transition to complete
            setTimeout(() => {
                this.style.display = 'none';
                this.isOpen = false;
                if (this.onCloseCallback) {
                    this.onCloseCallback();
                }
            }, 300); // Same as transition time
        }
    
        appendChild(element) {
            // Ensure element is added to light DOM
            super.appendChild(element);
        }
    
        setContent(content) {
            // Clear current content
            while (this.firstChild) {
                this.removeChild(this.firstChild);
            }
    
            // Add new content
            if (typeof content === 'string') {
                const div = document.createElement('div');
                div.innerHTML = content;
                this.appendChild(div);
            } else if (content instanceof Node) {
                this.appendChild(content);
            }
        }
    
        getContentContainer() {
            return this;
        }
    }
    
    customElements.define('custom-modal', CustomModal);
}, 100);
    
}