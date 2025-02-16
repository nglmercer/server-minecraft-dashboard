
let isConnectionLost = false;
class globalconfirmdialog2 {
    constructor(dialogID,contentID){
        this.dialog = document.getElementById(dialogID);
        this.content = document.getElementById(contentID);
    }
    show(){
        this.dialog.show();
    }
    hide(){
        this.dialog.hide();
    }
    setOptions(options){
        this.content.options = options;
    }
    setInfo(config){
        const {tittle, description} = config;
        this.content.setAttribute('title', tittle);
        this.content.setAttribute('description', description);
    }
}   
const globaldialog2 = new globalconfirmdialog2("globaldialog","globalmodal_content");
function returnDialogOptions(labelName, className, callback) {
    return  {
      label: labelName,
      class: className,
      callback: () => {
        callback();
      }
    }
  }
  const TASK_ITEM_PLACEHOLDER = "<div class='alert' data-id='$0'><div class='$1'>$2</div><div class='content-2'><span class='caption'>$3</span><span class='description'>$4</span></div></div>";
  let alltasks = {
      "tasks": {},
      "completedTasks": {}
  }
class AlertsUI {
    static stylesInjected = false;

    static injectStyles() {
        if (this.stylesInjected) return;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes fadeOut {
                from {
                    opacity: 1;
                    transform: translateY(0) translateX(-50%);
                }
                to {
                    opacity: 0;
                    transform: translateY(20px) translateX(-50%);
                }
            }

            .animate__animated {
                animation-duration: 0.5s;
                animation-fill-mode: both;
            }

            .animate__faster {
                animation-duration: 0.3s !important;
            }

            .animate__fadeIn {
                animation-name: fadeIn;
            }

            .animate__fadeOut {
                animation-name: fadeOut;
            }

            .alert {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                align-items: center;
                gap: 12px;
                background: #1a1a1a;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                max-width: max(300px, 90%);
                width: auto;
                z-index: 1000;
                cursor: pointer;
                transition: 0.2s all ease;
            }

            .alert:hover {
            }

            .icon-bg {
                background: rgba(255, 255, 255, 0.1);
                padding: 8px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .icon-bg span {
                font-size: 20px;
                display: block;
                width: 24px;
                height: 24px;
            }

            .content-2 {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .caption {
                font-weight: 500;
                font-size: 14px;
                line-height: 1.4;
            }

            .description {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
                line-height: 1.4;
            }
        `;

        document.head.appendChild(style);
        this.stylesInjected = true;
    }

    static addAlert(
        text,
        icon = "info",
        description = "",
        duration = 5000,
        iconClasses = "",
        callback = () => {}
    ) {
        console.log("addAlert", text, icon, description, duration, iconClasses, callback);
        this.injectStyles();
        const newID = this.generateAlertID();
        
        const alertHTML = `
            <div id="alert-${newID}" class="alert animate__animated animate__fadeIn animate__faster">
                ${this.buildIconSection(icon, iconClasses)}
                ${this.buildContentSection(text, description)}
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', alertHTML);
        const alertElement = document.getElementById(`alert-${newID}`);
        
        alertElement.addEventListener('click', () => this.handleAlertClick(alertElement, callback));
        
        if (duration > 0) {
            this.setAutoDismiss(alertElement, duration);
        }
    }

    static addTask(task) {
        console.log("addTask", task);
        this.injectStyles();
        
        const alertHTML = `
            <div id="alert-${task.id}" class="alert animate__animated animate__fadeIn animate__faster">
                ${task.taskHTML || this.buildTaskHTML(task)}
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', alertHTML);
        const alertElement = document.getElementById(`alert-${task.id}`);
        
        alertElement.addEventListener('click', () => this.handleAlertClick(alertElement, task.callback || (() => {})));
        
        if (task.duration > 0) {
            this.setAutoDismiss(alertElement, task.duration);
        }
    }

    static buildTaskHTML(task) {
        return `
            <div class="${task.iconBgClasses}">
                <span class="material-symbols-rounded">${task.icon}</span>
            </div>
            <div class="content-2">
                <span class="caption">${task.title}</span>
                <span class="description">${task.description}</span>
            </div>
        `;
    }

    static buildIconSection(icon, iconClasses) {
        const classes = iconClasses ? `icon-bg ${iconClasses}` : 'icon-bg';
        return `
            <div class="${classes}">
                <span class="material-symbols-rounded">${icon}</span>
            </div>
        `;
    }

    static buildContentSection(text, description) {
        return description 
            ? `<div class="content-2">
                <div class="caption">${text}</div>
                <div class="description">${description}</div>
               </div>`
            : `<div class="caption">${text}</div>`;
    }

    static handleAlertClick(alertElement, callback) {
        alertElement.remove();
        callback();
    }

    static setAutoDismiss(alertElement, duration) {
        if (!duration || duration == 0 ) duration = 5000;
        setTimeout(() => {
            alertElement.classList.add('animate__fadeOut');
            alertElement.addEventListener('animationend', () => alertElement.remove());
        }, duration);
    }

    static generateAlertID() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static removeAllAlerts() {
        document.querySelectorAll('.alert').forEach(alert => alert.remove());
    }
}
class SPredefined {
    static TASKS_TYPES = {
        DOWNLOADING: "downloading",
        INSTALLING: "installing",
        ZIPPING: "zipping",
        UNPACKING: "unpacking",
        UPDATING: "updating",
        RESTARTING: "restarting",
        CREATING: "creating",
        DELETION: "deletion",
        COMMON: "common",
        UNKNOWN: "unknown"
    }
  
    static SERVER_CREATION_STEPS = {
        SEARCHING_CORE: "searchingCore",
        CHECKING_JAVA: "checkingJava",
        DOWNLOADING_JAVA: "downloadingJava",
        UNPACKING_JAVA: "unpackingJava",
        DOWNLOADING_CORE: "downloadingCore",
        CREATING_BAT: "creatingBat",
        COMPLETION: "completion",
        COMPLETED: "completed",
        FAILED: "failed",
    }
  
  }
function   addTask(config) {
        const { id, icon, title, description, append = true, iconType = "symbol", iconBgClasses = "icon-bg colored" } = config;
        let iconPrepared = "";
        if (iconType === "symbol") {
            iconPrepared = `<span class='material-symbols-rounded'>${icon}</span>`;
        } else if (iconType === "image") {
            iconPrepared = `<img src='${icon}' style='width: 24px; height: 24px;'/>`;
        }
        
        const taskHTML = TASK_ITEM_PLACEHOLDER
            .replace(/\$0/g, id)
            .replace(/\$1/g, iconBgClasses)
            .replace(/\$2/g, iconPrepared)
            .replace(/\$3/g, title)
            .replace(/\$4/g, description);

        const parsedAlert = {
            id: id,
            icon: icon,
            title: title,
            description: description,
            iconBgClasses: iconBgClasses,
            iconType: iconType,
            taskHTML: taskHTML
        };
        console.log("alltasks.completedTasks[id]", alltasks.completedTasks);
        AlertsUI.addTask(parsedAlert);
    }


function getTaskConfiguration(id, task) {
    if (task.type === SPredefined.TASKS_TYPES.CREATING && task.serverName) {
        return handleCreationTask(id, task);
    }
    
    const baseConfig = {
        icon: "help",
        title: "{{tasksTypes.unknown}}",
        description: task.description || "",
        iconBg: "icon-bg"
    };

    const taskHandlers = {
        [SPredefined.TASKS_TYPES.DOWNLOADING]: () => ({
            icon: "deployed_code_update",
            title: `{{tasksTypes.downloading}} ${task.filename}`,
            description: buildProgressBar(task.progress),
            iconBg: "bg-warning icon-bg"
        }),
        [SPredefined.TASKS_TYPES.INSTALLING]: () => ({
            icon: "install_desktop",
            title: "{{tasksTypes.installing}}",
            description: task.description
        }),
        [SPredefined.TASKS_TYPES.UPDATING]: () => ({
            icon: "update",
            title: "{{tasksTypes.updating}}",
            description: task.description
        }),
        [SPredefined.TASKS_TYPES.RESTARTING]: () => ({
            icon: "restart_alt",
            title: "{{tasksTypes.restarting}}",
            description: task.description
        }),
        [SPredefined.TASKS_TYPES.UNPACKING]: () => ({
            icon: "archive",
            title: "{{tasksTypes.unpacking}}",
            description: task.description
        }),
        [SPredefined.TASKS_TYPES.ZIPPING]: () => ({
            icon: "archive",
            title: "{{tasksTypes.zipping}}",
            description: task.description
        }),
        [SPredefined.TASKS_TYPES.DELETION]: () => ({
            icon: "delete",
            title: "{{tasksTypes.deletion}}",
            description: task.server
        })
    };

    const config = taskHandlers[task.type]?.() || baseConfig;
    const dataconfig = { id, icon:config.icon, title:config.title, description:config.description, append: true, iconType: "symbol", iconBgClasses:baseConfig.iconBg } 
    return dataconfig;
}
function handleCreationTask(id, task) {
    const creationDetails = getCreationStepDetails(task, id); // Pasar ID aquí
    if (creationDetails.triggerModal) creationDetails.triggerModal();
    const dataconfig = { id, icon:creationDetails.icon, title:`{{tasksTypes.creating}} ${task.serverName}`, description:creationDetails.description, append: true,
     iconType: "symbol", iconBgClasses:creationDetails.iconBg } 
    return dataconfig;
}
function getCreationStepDetails(task, id) {
    const stepHandlers = {
        [SPredefined.SERVER_CREATION_STEPS.CHECKING_JAVA]: {
            description: "{{serverCreationSteps.checkingJava}}"
        },
        [SPredefined.SERVER_CREATION_STEPS.CREATING_BAT]: {
            description: "{{serverCreationSteps.creatingBat}}"
        },
        [SPredefined.SERVER_CREATION_STEPS.COMPLETED]: {
            description: "{{serverCreationSteps.completed}}",
            icon: "check_circle",
            iconBg: "bg-success icon-bg",
            triggerModal: () => {
                if (alltasks.completedTasks[id]) return;
                globaldialog2.show();
                globaldialog2.setInfo({tittle: "{{newServerWizard.creationCompleted}}", description: "{{commons.goto}}"});
                globaldialog2.setOptions([
                    returnDialogOptions("{{commons.goto}}", "check", () => {    
                        window.localStorage.selectedServer = task.serverName;
                        window.location = "/";
                    }),
                    returnDialogOptions("{{commons.cancel}}", "cancel-btn", () => {
                        globaldialog.hide();
                    })
                ]);
            }
        },
        [SPredefined.SERVER_CREATION_STEPS.COMPLETION]: {
            description: "{{serverCreationSteps.completion}}"
        },
        [SPredefined.SERVER_CREATION_STEPS.FAILED]: {
            description: "{{serverCreationSteps.failed}}",
            icon: "deployed_code_alert",
            iconBg: "bg-error icon-bg"
        },
        [SPredefined.SERVER_CREATION_STEPS.DOWNLOADING_CORE]: {
            description: "{{serverCreationSteps.downloadingCore}}"
        },
        [SPredefined.SERVER_CREATION_STEPS.DOWNLOADING_JAVA]: {
            description: "{{serverCreationSteps.downloadingJava}}"
        },
        [SPredefined.SERVER_CREATION_STEPS.SEARCHING_CORE]: {
            description: "{{serverCreationSteps.searchingCore}}"
        },
        [SPredefined.SERVER_CREATION_STEPS.UNPACKING_JAVA]: {
            description: "{{serverCreationSteps.unpackingJava}}"
        }
    };

    return {
        icon: "deployed_code_history",
        iconBg: "icon-bg",
        ...(stepHandlers[task.currentStep] || {})
    };
}
function     buildProgressBar(progress) {
    return `<div style="display: flex; margin: 4px 0; align-items: center">
        <div style="margin: 2px 1px; height: 4px; width: 100%; background: var(--bg-dark-accent-light)">
            <div style="width: ${progress}%; height: 100%; background: var(--bg-primary-500)"></div>
        </div>
        <span style="margin-left: 4px; font-size: 12pt;">${progress}%</span>
    </div>`;
}
function proccesOBJTASKS(tasks) {
    Object.entries(tasks).forEach(([id, task]) => {
        const taskConfig = getTaskConfiguration(id, task);
        if (taskConfig[3] === SPredefined.SERVER_CREATION_STEPS.COMPLETED) {
            if (!alltasks.completedTasks[id]) {
                alltasks.completedTasks[id] = task;
                // Eliminar después de 5 segundos
                setTimeout(() => {
                    delete alltasks.completedTasks[id];
                }, 5000);
            }
            delete alltasks.tasks[id];
        } else {
            if (!alltasks.completedTasks[id]) { // Solo agregar si no está completada
                alltasks.tasks[id] = task;
                addTask(taskConfig);
            }
        }
        if (task.type === SPredefined.TASKS_TYPES.DELETION && 
           task.status === SPredefined.SERVER_CREATION_STEPS.COMPLETED) {
            window.location = "/";
        }
    });
}
// Valores mínimos y máximos para el intervalo
const MIN_INTERVAL = 50;   // 100 ms cuando hay tareas
const MAX_INTERVAL = 2000;  // 2000 ms cuando no hay tareas

// Empezamos con el intervalo máximo
let currentInterval = MAX_INTERVAL;

function refreshTasksList() {
  fetch("api/tasks")
    .then(response => response.json())
    .then(data => {
      let tasks = data.data;
      console.log("tasks refreshTasksList", tasks);
      
      // Si se recuperó la conexión perdida
      if (isConnectionLost) {
        isConnectionLost = false;
      }
      
      // Verificamos si 'tasks' NO es un objeto vacío
      if (tasks && Object.keys(tasks).length > 0) {
        notificationsElement(tasks);
        // Si hay tareas, se refresca muy frecuentemente (100 ms)
        currentInterval = MIN_INTERVAL;
      } else {
        // Si no hay tareas, incrementamos progresivamente el intervalo hasta 2000 ms
        currentInterval = Math.min(currentInterval + 100, MAX_INTERVAL);
      }
    })
    .catch((e) => {
      console.error("Error refreshing tasks:", e);
      isConnectionLost = true;
      // En caso de error, podemos aumentar el intervalo también
      currentInterval = Math.min(currentInterval + 100, MAX_INTERVAL);
    })
    .finally(() => {
      // Reprogramamos la función usando el intervalo actual
      setTimeout(refreshTasksList, currentInterval);
    });
}

function notificationsElement(data) {
  const notificationsEl = document.getElementById('notificaciones');
  notificationsEl.updateTasks(data);
}

// Iniciamos el ciclo
refreshTasksList();

//refreshTasksList();