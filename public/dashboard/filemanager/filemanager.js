
import { awaitfilemanager } from "../../API/fetch.js";
var currentPath = "/";

const editableExtensions = [
    "txt", "log", "yml", "xml", "cfg", "conf", "config",
    "json", "yaml", "properties", "sh", "bat","gz"
];

// Initialize on DOM load
const hoverStyles = `
    <style>
        .dropdown-item {
            background: var(--bg-dark-accent);
            border-radius: 8px;
            padding: 4px 8px;
            display: flex;
            flex-direction: row;
            align-items: center;
            cursor: pointer;
            height: 48px;
            font-size: 12pt;
            width: 100%;
        }
        .dropdown-item:hover {
            background: #2e3e53;
        }
    </style>
    `;

class KubekFileManagerUI {
    static async refreshDir(saveScroll = true) {
        try {
            let response = await awaitfilemanager.readDirectory(currentPath);
                                       // Sort data to put directories on top
            let data = response.data?.files;

                if (data && data.length > 0) {
                data = sortToDirsAndFiles(data);
            }

            const scrollData = saveScroll ? 
                document.querySelector(".fm-container").scrollTop : 0;
            const tableListElement = document.querySelector("#fm-table tbody");

            tableListElement.innerHTML = "";
            console.log("currentPath", currentPath, "data", data);
            const explorer = document.querySelector('file-explorer');
            explorer.data = data;
            
            document.getElementById('path-display').textContent = `Current Path: ${currentPath}`;

            document.getElementById("fm-table").scrollTop = scrollData;
        } catch (error) {
            console.error("Error:", error);
        }
    }
    static selectedServer = window.localStorage.selectedServer || "";
    static initaddeventlisteners() {
        const explorer = document.querySelector('file-explorer');
        explorer.addEventListener('item-dblclick', (e) => {
            explorer.setAttribute('current-path', currentPath);
            console.log('Double click en:', e.detail);
            if (!e.detail.item) { this.upperDir(); return; }
                const { path, name, type } = e.detail.item;
                explorer.setAttribute('current-path', currentPath);
                const verifycurrentpath = currentPath.endsWith("/") ? currentPath : currentPath + "/";
                console.log("verify", editableExtensions.includes(KubekUtils.pathExt(name)),"e",e.detail, currentPath, type, name, verifycurrentpath);
                if (type === 'directory') {
                    currentPath = verifycurrentpath + name;

                    KubekFileManagerUI.refreshDir();
                } else if (type === 'file' && 
                         editableExtensions.includes(KubekUtils.pathExt(name))) {
                            const filetoedit = verifycurrentpath + name
                            console.log("filetoedit", filetoedit);
                            newFileEditor.editFile(e.detail.item, filetoedit);
                }
        });

        explorer.addEventListener('item-contextmenu', (e) => {
            const verifycurrentpath = currentPath.endsWith("/") ? currentPath : currentPath + "/";
            const baseOptions = [
                returnexploreroptions('delete','{{commons.delete}}','delete', () => {
                        const path = verifycurrentpath + e.detail.item.name;
                        const Deletedialog = new globalconfirmdialog("globaldialog","globaldialog_content");
                        Deletedialog.setInfo({tittle: "{{commons.delete}}", description: "{{fileManager.areYouWantToDelete}} " + KubekUtils.pathFilename(path)});
                        Deletedialog.show();
                        const options = [
                            returnDialogOptions("{{commons.delete}}", "delete-btn",async () => {
                                const result = await KubekFileManagerUI.deleteFile(path);
                                if (result){
                                    console.log("result", result);
                                    KubekAlerts.addAlert(
                                        "{{commons.actionFailed}}", 
                                        "warning",
                                        "{{commons.delete}} " + KubekUtils.pathFilename(path),
                                        4000,
                                        "colored"
                                    );
                                    KubekFileManagerUI.refreshDir();
                                }
                            }),
                            returnDialogOptions("{{commons.cancel}}", "cancel-btn", () => {
                                Deletedialog.hide();
                            })
                        ];
                        Deletedialog.setOptions(options);
                    }),
                    returnexploreroptions('rename', '{{commons.rename}}', 'bookmark_manager', () => {
                        const path = verifycurrentpath + e.detail.item.name;
                        console.log("rename", e.detail, path);
                        editNameModal.editFile(e.detail.item.name, path);
                    })
            ];
            const downloadOptions = returnexploreroptions('download', '{{commons.download}}', 'download', () => {
                    const path = verifycurrentpath + e.detail.item.name;
                    console.log("download", e.detail, path);
                //    KubekFileManagerUI.downloadFile(path);
                })
            if (!e.detail.item) return;
            console.log('Posición y datos:', e.detail.x, e.detail.y, e.detail);
            const options = [...baseOptions];
            if (e.detail.item.type === 'file' || !e.detail.item.isDirectory) {
                options.push(downloadOptions);
            }
            const popupOptions = options.map(option => ({
                html: `${hoverStyles}
                    <div class="dropdown-item">
                        <span class="material-symbols-rounded">${option.icon}</span>
                        <span class="default-font">${option.text}</span>
                    </div>
                `,
                callback: () => option.callback(e.target)
            }));
            setPopupOptions(popupOptions);
            openPopup(e.detail.target);
            console.log("dataTarget baseOptions", baseOptions, e.target);
        });
    }

    static newDirectory() {
        console.log(currentPath)
        globaldialog.show();
        const inputElement = document.getElementById("InputEdit");
        inputElement.addEventListener("input", () => {
            const regex = /^[^<>:"/\\|?*\x00-\x1F]+$/;
            if (!regex.test(inputElement.value)) {
                inputElement.value = inputElement.value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');
            }
            console.log("this.value", inputElement.value);
        });
        const parsedcurrentPath = currentPath.endsWith("/") ? currentPath : currentPath + "/";
        inputElement.style.display = "block";
        globaldialog.setInfo({tittle: "{{commons.create}}", description: "{{fileManager.newDirectory}} \nen: " + parsedcurrentPath});
        globaldialog.setOptions([
            {
                label: "{{commons.create}}",
                class: "save-btn",
                callback: () => {
                    //                    globaldialog.hide();
                    KubekFileManagerUI.createFile(currentPath, inputElement.value, () => {
                        KubekFileManagerUI.refreshDir();
                        globaldialog.hide();
                        inputElement.style.display = "none";
                    });
                    console.log("inputElement", parsedcurrentPath + inputElement.value);
                }
            },
            {
                label: "{{commons.cancel}}",
                class: "cancel-btn",
                callback: () => {
                    globaldialog.hide();
                    inputElement.style.display = "none";
                }
            }
        ]);
    }

    static upperDir() {
        const pathParts = currentPath.split("/");
        pathParts.pop();
        pathParts.pop();
        currentPath = pathParts.join("/") + "/";
        KubekFileManagerUI.refreshDir(false);
        console.log("currentPath", currentPath);
    }

    static uploadFile() {
        const inputElement = document.getElementById("g-file-input");
        inputElement.click();
        
        // Remove old listener and add new one
        const oldListener = inputElement.onchange;
        if (oldListener) {
            inputElement.removeEventListener('change', oldListener);
        }
        inputElement.addEventListener("change", () => {
            const formData = new FormData(document.getElementById("g-file-form"));

            console.log("Archivo a enviar:", formData.get("file")); // Asegúrate de que se captura correctamente

        
            const server = window.localStorage.selectedServer; // Define el nombre del servidor
        
            fetch(`/api/filemanager/upload?server=${server}&path=${currentPath}`, {
                method: "POST",
                body: formData,
            })
            .then((response) => response.json())
            .then((data) => console.log("Archivo subido:", data))
            .catch((error) => console.error("Error al subir archivo:", error));
        });
        
    }
    static renameFile(path, newName) {
        console.log("rename", path, newName);
        return awaitRequests.get("/fileManager/rename?server=" + window.localStorage.selectedServer + "&path=" + path + "&newName=" + newName);
    }
    static deleteFile(path) {
        return awaitRequests.get("/fileManager/delete?server=" + window.localStorage.selectedServer + "&path=" + path);
    }
    static editFile(path) {
        const fileExt = KubekUtils.pathExt(path);
        const languageMap = {
            'xml': 'xml',
            'yml': 'yaml',
            'yaml': 'yaml',
            'css': 'css',
            'js': 'javascript',
            'json': 'json',
            'properties': 'ini'
        };
        
        currentEditorLang = languageMap[fileExt] || "plaintext";

        KubekFileManagerUI.readFile(path, (data) => {
        });
    }

    static async readFile(path, cb) {
        const response = await awaitfilemanager.readFile(path);
        console.log("readFile", path, response);
        cb(response.data);
    }
    static async createFile(path,name, cb) {
        const response = await awaitfilemanager.createFile(path, name);
        if (cb) cb(response);
        return response;
    }
}

class newFileEditor {
    static lasteditfile;
    static lastfilenameTOEDIT;
    static async editFile(file, path) {
        const generateoptions = newFileEditor.generateoptions();
        newFileEditor.setOptions(generateoptions);
        newFileEditor.setTittle(file.name);
        newFileEditor.setFileContent(path);
        newFileEditor.show();
        this.show();
    }
    static generateoptions() {
        const options = [
            returnDialogOptions('Guardar', 'save-btn', async () => {
                    newFileEditor.hide();
                    if (newFileEditor.lasteditfile){
                        const contentTOSAVE =  newFileEditor.lasteditfile.getContent();
                        console.log("contentTOSAVE", contentTOSAVE);
                        const savefetch = await awaitfilemanager.writeFilebyName(window.localStorage.selectedServer, newFileEditor.lastfilenameTOEDIT, contentTOSAVE);
                        console.log("savefetch", savefetch);
                    }
                }),
            returnDialogOptions('borrar', 'delete-btn', () => {
                newFileEditor.hide();
            }),
            returnDialogOptions('Cancelar', 'cancel-btn', () => {
                newFileEditor.hide();
            })
        ];
        return options;
    }
    static show(){
        const dialogElement = document.querySelector('#File_editor_dialog');
        dialogElement.show();
    }
    static hide(){
        const dialogElement = document.querySelector('#File_editor_dialog');
        dialogElement.hide();
    }
    static async setOptions(options) {
        const dialogElement = document.querySelector('#File_editor_content');
        dialogElement.options = options;
    }
    static setTittle(tittle) {
        const dialogElement = document.querySelector('#File_editor_content');
        dialogElement.setAttribute('tittle', tittle);
        dialogElement.setAttribute('description', tittle);
    }
    static setFileContent(path){
        let filepath = typeof path !== 'string' ? path.path : path;
            if (!path || !path.includes('/')){
                filepath = '/'+path;
            }
            newFileEditor.readFile(filepath, (data) => {
                const fileditor = new CodeEditor('File_Editor', '# Initial code here', 'yaml');
                newFileEditor.lasteditfile = fileditor;
                newFileEditor.lastfilenameTOEDIT = filepath;
                fileditor.setContent(data);
            });
    }

    static async readFile(path, cb) {
        const response = await awaitfilemanager.readFile(path);
        console.log("readFile", path, response);
        cb(response.data);
    }
}
class editNameModal {
    static editFile(file, path) {
        const fileElement = document.querySelector('#EditName_Input');
        fileElement.value = file;
        // el simbolo de salto de linea es el caracter \n
        editNameModal.setTittle("archivo : \n"+ file + "\nubicacion : \n" + path);
        editNameModal.setFileContent(path);
        editNameModal.setOptions(editNameModal.generateoptions(path));
        console.log("fileElement", fileElement);
        editNameModal.show();
    }
    static show(){
        const dialogcontent = document.querySelector('#EditName_dialog');
        dialogcontent.show();
    }
    static hide(){
        const dialogcontent = document.querySelector('#EditName_dialog');
        dialogcontent.hide();
    }
    static async setOptions(options) {
        const dialogcontent = document.querySelector('#EditName_content');
        dialogcontent.options = options;
    }
    static setTittle(tittle) {
        const dialogcontent = document.querySelector('#EditName_content');
        dialogcontent.setAttribute('tittle', tittle);
        dialogcontent.setAttribute('description', tittle);
    }
    static setFileContent(path){
        let filepath = typeof path !== 'string' ? path.path : path;
            if (!path || !path.includes('/')){
                filepath = '/'+path;
            }
    }
    static generateoptions(path) {
        const options = [
            returnDialogOptions("{{commons.save}}", "save-btn", () => {
                const filenewname = document.querySelector('#EditName_Input').value;
                console.log("filenewname", filenewname, path);
                KubekFileManagerUI.renameFile(path, filenewname, () => {
                    KubekFileManagerUI.refreshDir()
                });
                editNameModal.hide();
                KubekFileManagerUI.refreshDir()
            }),
            returnDialogOptions("{{commons.cancel}}", "cancel-btn", () => {
                editNameModal.hide();
            })
        ];
        return options;
    }
}
class CodeEditor {
    constructor(editorId, initialLanguage = 'plaintext') {
        this.editorElement = document.getElementById(editorId);
        this.initialContent = "";
        this.initialLanguage = initialLanguage;
        this.currentContent = this.initialContent;
        this.currentLanguage = initialLanguage;

        if (this.editorElement) {
            this.initializeEditor();
        }
    }

    initializeEditor() {
        this.editorElement.contentEditable = true;
        this.editorElement.innerHTML = this.initialContent;
        this.editorElement.style.whiteSpace = 'pre-wrap';

        hljs.highlightElement(this.editorElement);

        this.debouncedUpdateHighlight = this.debounce(this.updateHighlight.bind(this), 1000);
        this.editorElement.addEventListener('input', this.debouncedUpdateHighlight);
        this.editorElement.addEventListener('paste', this.handlePaste.bind(this));
    }

    debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    saveCursorPosition(element) {
        const selection = window.getSelection();
        let cursorPosition = 0;
        if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            cursorPosition = preCaretRange.toString().length;
        }
        return cursorPosition;
    }

    restoreCursorPosition(element, cursorPosition) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        let currentPosition = 0;
        let targetNode = null;
        let targetOffset = 0;

        while (walker.nextNode()) {
            const node = walker.currentNode;
            const nodeLength = node.length;

            if (currentPosition + nodeLength >= cursorPosition) {
                targetNode = node;
                targetOffset = cursorPosition - currentPosition;
                break;
            }
            currentPosition += nodeLength;
        }

        if (targetNode) {
            const range = document.createRange();
            range.setStart(targetNode, targetOffset);
            range.collapse(true);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    updateHighlight() {
        const cursorPosition = this.saveCursorPosition(this.editorElement);
        this.currentContent = this.editorElement.innerText;

        const result = hljs.highlightAuto(this.currentContent);
        this.editorElement.innerHTML = result.value;
        this.currentLanguage = result.language;

        this.restoreCursorPosition(this.editorElement, cursorPosition);
    }

    handlePaste(event) {
        event.preventDefault();
        const text = (event.clipboardData || window.clipboardData).getData('text');

        const selection = window.getSelection();
        if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
        }

        const inputEvent = new Event('input', { bubbles: true });
        this.editorElement.dispatchEvent(inputEvent);
    }

    getContent() {
        return this.currentContent;
    }

    getLanguage() {
        return this.currentLanguage;
    }

    resetToInitial(initialContent = this.initialContent, initialLanguage = this.initialLanguage) {
        this.currentContent = initialContent;
        this.currentLanguage = initialLanguage;
        this.editorElement.innerHTML = this.initialContent;
        hljs.highlightElement(this.editorElement);
    }

    setContent(content) {
        this.currentContent = content;
        const cursorPosition = this.saveCursorPosition(this.editorElement);
        this.editorElement.innerText = content;

        const result = hljs.highlightAuto(content);
        this.editorElement.innerHTML = result.value;
        this.restoreCursorPosition(this.editorElement, cursorPosition);
    }
}
function sortToDirsAndFiles(data) {
    let dirs = [];
    let files = [];
    data.forEach(function (item) {
        if (item.type === "directory" || item.isDirectory) {
            dirs.push(item);
        } else {
            files.push(item);
        }
    });
    let datanew = [];
    dirs.forEach(function (item) {
        datanew.push(item);
    });
    files.forEach(function (item) {
        datanew.push(item);
    });
    return datanew;
}
function openPopup(element, popupId = "#fm-popup") {
    const popupElement = document.querySelector(popupId);
    if (!popupElement) return;
    if (typeof element === "string") {
        const buttonElement  = document.querySelector(element);
            popupElement.showAtElement(buttonElement);
    } else {
        const buttonElement = element;
        popupElement.showAtElement(buttonElement);
    }
}


function setPopupOptions(popupOptions){
    const popupElement = document.querySelector('#fm-popup');
    popupElement.options = popupOptions;
}
KubekFileManagerUI.refreshDir();
