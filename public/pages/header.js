// Definición de componentes UI
class UIComponents {
    constructor(parentSelector = 'body') {
      this.parent = document.querySelector(parentSelector);
      this.eventHandlers = {};
    }
  
    // Registrar manejadores de eventos globales
    registerEventHandler(eventName, handler) {
      this.eventHandlers[eventName] = handler;
    }
  
    // Crear elementos de UI basados en configuración
    createElements(elementConfigs, container = this.parent) {
      elementConfigs.forEach(config => {
        const element = this.createElement(config);
        if (element) {
          container.appendChild(element);
        }
      });
      return container;
    }
  
    // Crear un solo elemento basado en su configuración
    createElement(config) {
      if (!config || !config.type) return null;
  
      let element;
  
      switch (config.type) {
        case 'iconButton':
          element = this.createIconButton(config);
          break;
        case 'outlineButton':
          element = this.createOutlineButton(config);
          break;
        case 'statusIndicator':
          element = this.createStatusIndicator(config);
          break;
        case 'userProfile':
          element = this.createUserProfile(config);
          break;
        case 'logo':
          element = this.createLogo(config);
          break;
        case 'menu':
          element = this.createMenu(config);
          break;
        default:
          console.warn(`Tipo de elemento no soportado: ${config.type}`);
          return null;
      }
  
      // Añadir clases adicionales si existen
      if (config.additionalClasses) {
        config.additionalClasses.forEach(cls => {
          element.classList.add(cls);
        });
      }
  
      // Añadir ID si existe
      if (config.id) {
        element.id = config.id;
      }
  
      // Añadir eventos si existen
      if (config.events) {
        Object.entries(config.events).forEach(([eventName, eventHandler]) => {
          element.addEventListener(eventName, (e) => {
            // Si hay un manejador global registrado para este evento, lo llamamos
            if (this.eventHandlers[eventName]) {
              this.eventHandlers[eventName](e, config);
            }
            
            // Llamamos al manejador específico del elemento
            eventHandler(e, config);
          });
        });
      }
  
      return element;
    }
  
    // Crear botón con icono
    createIconButton(config) {
      const button = document.createElement('button');
      button.className = 'icon-btn';
      if (config.title) button.title = config.title;
      
      const icon = document.createElement('i');
      icon.className = config.icon || 'fas fa-cog';
      
      button.appendChild(icon);
      
      // Añadir el evento por defecto si existe
      button.dataset.action = config.action || '';
      
      return button;
    }
  
    // Crear botón con contorno
    createOutlineButton(config) {
      const button = document.createElement('button');
      button.className = 'btn btn-outline';
      
      if (config.icon) {
        const icon = document.createElement('i');
        icon.className = config.icon;
        button.appendChild(icon);
      }
      
      if (config.text) {
        const span = document.createElement('span');
        span.textContent = config.text;
        button.appendChild(span);
      }
      
      button.dataset.action = config.action || '';
      
      return button;
    }
  
    // Crear indicador de estado
    createStatusIndicator(config) {
      const statusIndicator = document.createElement('div');
      statusIndicator.className = 'status-indicator';
      
      const statusDot = document.createElement('div');
      statusDot.className = 'status-dot';
      if (config.status === 'offline') {
        statusDot.style.backgroundColor = '#ff5252';
      }
      
      const statusText = document.createElement('span');
      statusText.textContent = config.text || 'Online';
      
      statusIndicator.appendChild(statusDot);
      statusIndicator.appendChild(statusText);
      
      return statusIndicator;
    }
  
    // Crear perfil de usuario
    createUserProfile(config) {
      const userProfile = document.createElement('div');
      userProfile.className = 'user-profile';
      
      const userInfo = document.createElement('div');
      userInfo.className = 'user-info';
      
      if (config.username) {
        const usernameDiv = document.createElement('div');
        usernameDiv.textContent = config.username;
        userInfo.appendChild(usernameDiv);
      }
      
      if (config.logoutText) {
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.className = 'logout-btn';
        
        const logoutIcon = document.createElement('i');
        logoutIcon.className = 'fas fa-sign-out-alt';
        
        logoutLink.appendChild(logoutIcon);
        logoutLink.appendChild(document.createTextNode(' ' + config.logoutText));
        
        logoutLink.dataset.action = 'logout';
        userInfo.appendChild(logoutLink);
      }
      
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      
      const avatarIcon = document.createElement('i');
      avatarIcon.className = config.avatarIcon || 'fas fa-user';
      
      avatar.appendChild(avatarIcon);
      
      userProfile.appendChild(userInfo);
      userProfile.appendChild(avatar);
      
      return userProfile;
    }
  
    // Crear logo
    createLogo(config) {
      const logo = document.createElement('div');
      logo.className = 'logo';
      
      const logoIcon = document.createElement('i');
      logoIcon.className = config.icon || 'fas fa-server logo-icon';
      
      logo.appendChild(logoIcon);
      logo.appendChild(document.createTextNode(' ' + (config.text || 'SERVERMANAGER')));
      
      return logo;
    }
  
    // Crear menú
    createMenu(config) {
      const menu = document.createElement('div');
      menu.className = 'header-menu';
      
      if (config.items && Array.isArray(config.items)) {
        config.items.forEach(item => {
          const menuItem = this.createElement(item);
          if (menuItem) {
            menu.appendChild(menuItem);
          }
        });
      }
      
      return menu;
    }
  }
  
  // Clase principal para manejar la UI
  class UIManager {
    constructor() {
      this.components = new UIComponents();
      
      // Registrar manejadores globales de eventos
      this.registerGlobalEvents();
    }
  
    // Inicializar la UI
    initialize() {
      this.setupHeader();
      console.log('UI inicializada correctamente');
    }
  
    // Configurar la cabecera
    setupHeader() {
      const header = document.querySelector('header') || document.createElement('header');
      header.innerHTML = ''; // Limpiar el header existente
      
      // Crear contenedores izquierdo y derecho
      const headerLeft = document.createElement('div');
      headerLeft.className = 'header-left';
      
      const headerRight = document.createElement('div');
      headerRight.className = 'header-right';
      
      // Elementos del lado izquierdo
      this.components.createElements([
        {
          type: 'logo',
          text: 'SERVERMANAGER',
          icon: 'fas fa-server logo-icon',
          events: {
            click: (e) => this.handleAction('showDashboard', e)
          }
        },
        {
          type: 'iconButton',
          title: 'Configuración',
          icon: 'fas fa-cog',
          action: 'showSettings',
          events: {
            click: (e) => this.handleAction('showSettings', e)
          }
        },
        {
          type: 'iconButton',
          title: 'Menú Principal',
          icon: 'fas fa-bars',
          action: 'toggleMainMenu',
          events: {
            click: (e) => this.handleAction('toggleMainMenu', e)
          }
        }
      ], headerLeft);
      
      // Elementos del lado derecho
      this.components.createElements([
        {
          type: 'outlineButton',
          icon: 'fas fa-question-circle',
          text: 'Ayuda',
          action: 'showHelp',
          events: {
            click: (e) => this.handleAction('showHelp', e)
          }
        },
        {
          type: 'statusIndicator',
          text: 'Online',
          status: 'online'
        },
        {
          type: 'userProfile',
          username: 'usuario',
          logoutText: 'Logout',
          avatarIcon: 'fas fa-user',
          events: {
            click: (e) => {
              if (e.target.closest('.logout-btn')) {
                this.handleAction('logout', e);
              } else {
                this.handleAction('showUserProfile', e);
              }
            }
          }
        }
      ], headerRight);
      
      // Añadir los contenedores al header
      header.appendChild(headerLeft);
      header.appendChild(headerRight);
      
      // Si el header no estaba en el DOM, lo añadimos
      if (!document.querySelector('header')) {
        document.body.prepend(header);
      }
    }
  
    // Registrar manejadores globales de eventos
    registerGlobalEvents() {
      this.components.registerEventHandler('click', (e, config) => {
        console.log(`Elemento clickeado: ${config.type}, Acción: ${config.action || 'No definida'}`);
      });
    }
  
    // Manejar acciones
    handleAction(action, event) {
      console.log(`Ejecutando acción: ${action}`);
      
      switch (action) {
        case 'showDashboard':
          this.showDashboard();
          break;
        case 'showSettings':
          this.showSettings();
          break;
        case 'toggleMainMenu':
          this.toggleMainMenu();
          break;
        case 'showHelp':
          this.showHelp();
          break;
        case 'logout':
          this.logout();
          break;
        case 'showUserProfile':
          this.showUserProfile();
          break;
        default:
          console.warn(`Acción no manejada: ${action}`);
      }
    }
  
    // Métodos para manejar acciones específicas
    showDashboard() {
      console.log('Mostrando dashboard');
      // Implementar lógica para mostrar el dashboard
      window.location.href = `/index.html`;
    }
  
    showSettings() {
      console.log('Mostrando configuraciones');
      // Implementar lógica para mostrar configuraciones
    }
  
    toggleMainMenu() {
      console.log('Alternando menú principal');
      // Implementar lógica para mostrar/ocultar el menú principal
      
      // Ejemplo de creación dinámica de un menú
      const existingMenu = document.querySelector('.main-menu');
      
      if (existingMenu) {
        existingMenu.remove();
        return;
      }
      
      const menu = document.createElement('div');
      menu.className = 'main-menu';
      menu.style.position = 'absolute';
      menu.style.top = '60px';
      menu.style.left = '0';
      menu.style.backgroundColor = 'var(--header-bg)';
      menu.style.zIndex = '1000';
      menu.style.padding = '1rem';
      menu.style.boxShadow = '2px 2px 10px rgba(0, 0, 0, 0.2)';
      
      const menuItems = [
        {
          type: 'outlineButton',
          icon: 'fas fa-home',
          text: 'Inicio',
          action: 'showHome',
          events: {
            click: () => this.handleAction('showHome')
          }
        },
        {
          type: 'outlineButton',
          icon: 'fas fa-server',
          text: 'Servidores',
          action: 'showServers',
          events: {
            click: () => this.handleAction('showServers')
          }
        },
        {
          type: 'outlineButton',
          icon: 'fas fa-chart-line',
          text: 'Estadísticas',
          action: 'showStats',
          events: {
            click: () => this.handleAction('showStats')
          }
        }
      ];
      
      this.components.createElements(menuItems, menu);
      document.body.appendChild(menu);
    }
  
    showHelp() {
      console.log('Mostrando ayuda');
      // Implementar lógica para mostrar ayuda
    }
  
    logout() {
      console.log('Cerrando sesión');
      // Implementar lógica para cerrar sesión
    }
  
    showUserProfile() {
      console.log('Mostrando perfil de usuario');
      // Implementar lógica para mostrar el perfil de usuario
    }
  }
  
  // Inicializar la UI cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    const uiManager = new UIManager();
    uiManager.initialize();
    
    // Exponer para uso en consola o integración con otros scripts
    window.uiManager = uiManager;
  });
  
  // Método para crear elementos dinámicamente desde un array de configuraciones
  function createUIFromConfig(configArray, containerId = 'dynamic-container') {
    const container = document.getElementById(containerId) || document.createElement('div');
    container.id = containerId;
    
    if (!document.getElementById(containerId)) {
      document.body.appendChild(container);
    }
    
    const components = new UIComponents(container);
    components.createElements(configArray);
    
    return { container, components };
  }