import { fileManager} from '../API/fetch.js';
const uploadServerIconBtn = document.getElementById('uploadServerIconBtn');
uploadServerIconBtn.addEventListener('click', () => {
    uploadServerIcon();
});
const Eula_dialog = document.querySelector("#Eula_dialog");
Eula_dialog.options = [
    {
        label: "{{commons.iAccept}}",
        class: "save-btn",
        callback: () => {
            console.log("accept");
            KubekRequests.get("/kubek/eula/accept", () => {
                window.location.reload();
            });
        }
    }
    ];	
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let act = urlParams.get("act");

function uploadServerIcon() {
    const inputElement = document.getElementById("g-file-input");
    
    // Limitar a solo archivos de imagen
    inputElement.accept = "image/*";
    
    inputElement.click();
    
    // Remove old listener and add new one
    const oldListener = inputElement.onchange;
    if (oldListener) {
      inputElement.removeEventListener('change', oldListener);
    }
    
    const iconPath = "./";
    inputElement.addEventListener("change", (event) => {
      const file = inputElement.files[0];
      
      // Verificar si es una imagen
      if (!file.type.startsWith('image/')) {
        alert("Por favor, selecciona solo archivos de imagen.");
        return;
      }
      
      // Determinar la extensión correcta basada en el tipo de archivo
      let fileExtension = "png"; // Por defecto
      if (file.type === "image/jpeg" || file.type === "image/jpg") {
        fileExtension = "jpg";
      } else if (file.type === "image/png") {
        fileExtension = "png";
      } else if (file.type === "image/gif") {
        fileExtension = "gif";
      } else if (file.type === "image/webp") {
        fileExtension = "webp";
      }
      
      // Crear un nuevo nombre de archivo
      const newFileName = `icon.${fileExtension}`;
      
      // Crear un nuevo objeto File con el nuevo nombre
      const renamedFile = new File([file], newFileName, {
        type: file.type,
        lastModified: file.lastModified
      });
      
      const formData = new FormData();
      formData.append("file", renamedFile);
      
      console.log("Archivo a enviar:", formData.get("file")); // Debería mostrar el archivo renombrado
      
      const server = window.localStorage.selectedServer;
      fileManager.uploadFile({
        server,
        path: iconPath,
        data: formData
      }, (success) => {
        console.log("uploadFile", success);
      });
    });
  }
function getSeverIcon() {
    const server = window.localStorage.selectedServer;
    const iconPath = "/icon.png";
    //const serverName = req.params.serverName;
    //static serveFile(serverName, cb) {
    //return api.get(`/filemanager/serve-file/${serverName}`, cb);}

    const iconFile = fileManager.serveFile(server, iconPath,{ responseType: 'blob' })  .then(blob => {
        // blob es el objeto obtenido
        const iconElement = document.querySelector('#server-icon');
        iconElement.src = URL.createObjectURL(blob);
      })
      .catch(error => console.error("Error al cargar el icono:", error));
}
getSeverIcon();