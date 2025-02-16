
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

const MIN_INTERVAL = 50;   // 50 ms cuando hay tareas
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