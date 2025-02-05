const TASK_ITEM_PLACEHOLDER = "<div class='alert' data-id='$0'><div class='$1'>$2</div><div class='content-2'><span class='caption'>$3</span><span class='description'>$4</span></div></div>";
let alltasks = {
    "tasks": {},
    "completedTasks": {}
}
let isConnectionLost = false;
class KubekAlerts2 {
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
    // Права
    static PERMISSIONS = {
        DEFAULT: "default",
        ACCOUNTS: "accounts",
        FILE_MANAGER: "file_manager",
        MANAGE_SERVERS: "manage_servers",
        MAKING_SERVERS: "making_servers",
        MONITOR_SERVERS: "monitor_servers",
        MANAGE_JAVA: "manage_java",
        MANAGE_PLUGINS: "manage_plugins"
    };
  
    // См. название :)
    static API_ENDPOINT = "/api";
  
    // Переводы статусов серверов
    static SERVER_STATUSES_TRANSLATE = {
        "stopped": "{{serverStatus.stopped}}",
        "starting": "{{serverStatus.starting}}",
        "stopping": "{{serverStatus.stopping}}",
        "running": "{{serverStatus.running}}"
    }
  
    // Статусы серверов
    static SERVER_STATUSES = {
        STOPPED: "stopped",
        RUNNING: "running",
        STARTING: "starting",
        STOPPING: "stopping"
    }
  
    // Базовые типы задач
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
  
    // Шаги создания сервера
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
  
    // REGEX для авторизации
    static PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,64}$/g;
    static LOGIN_REGEX = /^[a-zA-Z0-9_.-]{3,16}$/g;
    static EMAIL_REGEX = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
  
    static MODAL_CANCEL_BTN = '<button class="dark-btn" onclick="KubekNotifyModal.destroyAllModals()">{{commons.close}}</button>';
  }
  class KubekTasksUI {
    static addTask(id, icon, title, description, append = true, iconType = "symbol", iconBgClasses = "icon-bg colored") {
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
        KubekAlerts2.addTask(parsedAlert);
    }

    static removeTaskByID(id) {
        document.querySelectorAll(".alert").forEach(element => {
            if (element.dataset.id === id) element.remove();
        });
    }

    static removeAllTasks() {
        KubekAlerts2.removeAllAlerts();
    }

    static refreshTasksList() {
        fetch(SPredefined.API_ENDPOINT + "/tasks")
            .then(response => response.json())
            .then(tasks => {
                if (this.shouldClearTasks(tasks)) {
                    this.removeAllTasks();
                    return;
                }

                if (isConnectionLost) {
                    // KubekUI.connectionRestored();
                    isConnectionLost = false;
                }

                Object.entries(tasks).forEach(([id, task]) => {
                    const taskConfig = this.getTaskConfiguration(id, task);
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
                            this.addTask(...taskConfig);
                        }
                    }
                    if (task.type === SPredefined.TASKS_TYPES.DELETION && 
                       task.status === SPredefined.SERVER_CREATION_STEPS.COMPLETED) {
                        window.location = "/?act=console";
                    }
                });
            })
            .catch(() => this.handleConnectionError());
    }

    // Helpers
    static shouldClearTasks(tasks) {
        return !tasks || 
              Object.keys(tasks).length === 0 ||
              tasks.currentStep === "{{commons.completed}}" ||
              tasks.currentStep === "completed";
    }

    static getTaskConfiguration(id, task) {
        if (task.type === SPredefined.TASKS_TYPES.CREATING && task.serverName) {
            return this.handleCreationTask(id, task);
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
                description: this.buildProgressBar(task.progress),
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
        return [id, config.icon, config.title, config.description, true, "symbol", config.iconBg];
    }

    static handleCreationTask(id, task) {
        const creationDetails = this.getCreationStepDetails(task, id); // Pasar ID aquí
        if (creationDetails.triggerModal) creationDetails.triggerModal();
        
        return [
            id,
            creationDetails.icon,
            `{{tasksTypes.creating}} ${task.serverName}`,
            creationDetails.description,
            true,
            "symbol",
            creationDetails.iconBg
        ];
    }

    static getCreationStepDetails(task, id) {
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
                    KubekNotifyModal.create(
                        task.serverName,
                        "{{newServerWizard.creationCompleted}}",
                        "{{commons.goto}}",
                        "check",
                        () => {
                            window.localStorage.selectedServer = task.serverName;
                            window.location = "/?act=console";
                        },
                        SPredefined.MODAL_CANCEL_BTN
                    );
                    alltasks.completedTasks[id] = true; // Marcamos como procesado
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

    static buildProgressBar(progress) {
        return `<div style="display: flex; margin: 4px 0; align-items: center">
            <div style="margin: 2px 1px; height: 4px; width: 100%; background: var(--bg-dark-accent-light)">
                <div style="width: ${progress}%; height: 100%; background: var(--bg-primary-500)"></div>
            </div>
            <span style="margin-left: 4px; font-size: 12pt;">${progress}%</span>
        </div>`;
    }

    static handleConnectionError() {
        if (!isConnectionLost) KubekUI.connectionLost();
        isConnectionLost = true;
    }
}
