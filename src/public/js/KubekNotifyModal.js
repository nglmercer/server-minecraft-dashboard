function getNotify_modal_template(parseddata) {
    const { id, icon, caption, description, buttonText, additionalElements } = parseddata;

    // Crear el contenedor principal del modal
    const modal = document.createElement('div');
    modal.className = "notify-modal modal-bg";
    modal.id = id;

    // Crear la ventana de notificación
    const notify_window = document.createElement('div');
    notify_window.className = "notify-window";

    // Crear el ícono
    const notify_icon = document.createElement('div');
    notify_icon.className = "notify-icon";
    notify_icon.innerHTML = icon;

    // Crear el título
    const notify_caption = document.createElement('div');
    notify_caption.className = "notify-caption";
    notify_caption.innerHTML = caption;

    // Crear la descripción
    const notify_description = document.createElement('div');
    notify_description.className = "notify-description";
    notify_description.innerHTML = description;

    // Crear el botón
    const cmbtn = document.createElement('button');
    cmbtn.id = `cmbtn-${id}`;
    cmbtn.className = "primary-btn";
    cmbtn.innerHTML = buttonText;

    // Añadir elementos a la ventana de notificación
    notify_window.appendChild(notify_icon);
    notify_window.appendChild(notify_caption);
    notify_window.appendChild(notify_description);
    notify_window.appendChild(cmbtn);

    // Añadir elementos adicionales si existen
    if (additionalElements) {
        if (Array.isArray(additionalElements)) {
            // Si es un array, agregar cada elemento
            additionalElements.forEach(el => {
                if (el instanceof Node) {
                    notify_window.appendChild(el);
                }
            });
        } else if (additionalElements instanceof Node) {
            // Si es un nodo, agregarlo directamente
            notify_window.appendChild(additionalElements);
        } else if (typeof additionalElements === 'string') {
            // Si es un string HTML, convertirlo a elementos
            const temp = document.createElement('div');
            temp.innerHTML = additionalElements;
            while (temp.firstChild) {
                notify_window.appendChild(temp.firstChild);
            }
        } else {
            console.error('additionalElements no es válido:', additionalElements);
        }
    }

    // Añadir la ventana de notificación al modal
    modal.appendChild(notify_window);

    return modal;
}

class KubekNotifyModal {
    static getmodal(){
        const dialogcontent = document.getElementById("globaldialog");
        return dialogcontent;
    }
    static createModal(caption, text, buttonText, icon, cb = () => {}, additionalElements = "") {
        const element = this.getmodal();
        console.log("caption", caption,element);
        document.querySelector("#globalmodal_content")._title = caption;
        document.querySelector("#globalmodal_content")._description = text;
        document.querySelector("#globalmodal_content").options = [
            {
                label: buttonText,
                class: "save-btn",
                callback: () => {
                    cb();
                }
            },
            {
                label: "{{commons.cancel}}",
                class: "cancel-btn",
                callback: () => {
                    cb();
                }
            }
        ];
        element.show();
        console.log("element", element);
    }
    static create(caption, text, buttonText, icon, cb = () => {}, additionalElements = "") {

        // Mostrar pantalla difuminada
        const blurScreen = document.querySelector(".blurScreen");
        if (blurScreen) blurScreen.style.display = "block";

        // Generar un ID único para el modal
        const randomID = `notify-${Math.floor(Math.random() * 991) + 10}`;
        const iconElement = `<span class='material-symbols-rounded'>${icon}</span>`;
            
        // Crear el objeto con los datos parseados
        const parseddata = {
            id: randomID,
            icon: iconElement,
            caption: caption,
            description: text,
            buttonText: buttonText,
            additionalElements: additionalElements,
        };
        //console.log(parseddata,"parseddata, modalHTML");

        // Generar el HTML del modal
        const modalHTML = getNotify_modal_template(parseddata);
        document.body.appendChild(modalHTML);

        // Añadir animación de entrada
        this.animateCSS(`#${randomID}`, 'fadeIn', 100);

        // Añadir evento al botón
        const button = document.getElementById(`cmbtn-${randomID}`);
        if (button) {
            button.addEventListener("click", () => {
                this.animateCSS(`#${randomID}`, 'fadeOut', 100, () => {
                    const modal = document.getElementById(randomID);
                    if (modal) modal.remove();
                    if (blurScreen) blurScreen.style.display = "none";
                    cb(); // Llamar al callback después de cerrar el modal
                });
            });
        }
    }

    static destroyAllModals() {
        const modals = document.querySelectorAll(".notify-modal");
        modals.forEach((modal) => modal.remove());

        const blurScreen = document.querySelector(".blurScreen");
        if (blurScreen) blurScreen.style.display = "none";
    }

    static askForInput(caption, icon, cb = () => {}, description = "", placeholder = "{{commons.input}}", value = "", iType = "text") {
        const inputRandID = `input-${Math.floor(Math.random() * 10000)}`;
        const inputField = `
            <p>${description}</p>
            <input 
                style="width: 300px;" 
                id="${inputRandID}" 
                type="${iType}" 
                placeholder="${placeholder}" 
                value="${value}"
            >
        `;
        this.create(
            caption,
            inputField,
            "{{commons.save}}",
            icon,
            () => {
                const inputElement = document.getElementById(inputRandID);
                if (inputElement) cb(inputElement.value);
            },
            KubekPredefined.MODAL_CANCEL_BTN
        );
    }

    static animateCSS(selector, animationType, duration = 300, callback) {
        const element = document.querySelector(selector);
        if (!element) return;

        // Configurar la transición
        element.style.transition = `opacity ${duration}ms ease-out`;

        // Aplicar la animación
        if (animationType === 'fadeIn') {
            element.style.opacity = 0;
            setTimeout(() => {
                element.style.opacity = 1;
            }, 10);
        } else if (animationType === 'fadeOut') {
            element.style.opacity = 0;
        }

        // Ejecutar el callback después de la duración
        if (typeof callback === 'function') {
            setTimeout(callback, duration);
        }
    }
}
/* setTimeout(() => {
    KubekNotifyModal.createModal("{{commons.updateAvailable}}", "{{commons.updateAvailable}}", "{{commons.goto}}", "update", () => {});
}, 3222); */