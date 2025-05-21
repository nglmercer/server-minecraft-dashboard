import{s as m}from"./fetchapi.C57HnsAb.js";import{s as w}from"./request.Dio9yAJ0.js";import{t as y,s as x}from"./globalSignals.xjL0ZJXr.js";import"./CInput.C3Lt-7In.js";import{i as b,r as N,t as _}from"./custom-element.rv7pTUKK.js";import{x as c}from"./lit-html.Cs9YtZST.js";import{r as E}from"./state.V2Q47cpK.js";import{w as I}from"./socketManager.Dp7svpr6.js";import"./property.Bn3N06vY.js";import"./map.DiiNQ3pp.js";const $=["-XX:+UseG1GC","-XX:MaxGCPauseMillis=200","-XX:G1HeapRegionSize=4M","-XX:InitiatingHeapOccupancyPercent=35","-XX:+ParallelRefProcEnabled","-XX:+PerfDisableSharedMem","-XX:+UseStringDeduplication"].join(` \\
`),T=32,S=document.querySelector("#add-optiflags")?.checked;function P(e=T,t=S){let i=`-Xmx${e*1024}M `;return t&&(i+=`${$}`),i}var O=Object.defineProperty,X=Object.getOwnPropertyDescriptor,g=(e,t,i,o)=>{for(var n=o>1?void 0:o?X(t,i):t,s=e.length-1,r;s>=0;s--)(r=e[s])&&(n=(o?r(t,i,n):r(n))||n);return o&&n&&O(t,i,n),n};let l=class extends N{constructor(){super(),this._activeNotifications=[],this._removalTimeouts=new Map}updateTasks(e){let t=[...this._activeNotifications],i=!1;for(const o in e)if(e.hasOwnProperty(o)){const n=e[o],s=t.findIndex(d=>d.id===o),r={...n,id:o};if(s!==-1?JSON.stringify(t[s])!==JSON.stringify(r)&&(t[s]=r,i=!0):(t.push(r),i=!0),r.status==="completed"||r.progress!==void 0&&r.progress>=100||r.status==="error"){this._removalTimeouts.has(o)&&clearTimeout(this._removalTimeouts.get(o));const d=window.setTimeout(()=>{this._removeNotification(o)},r.status==="error"?5e3:3e3);this._removalTimeouts.set(o,d)}}i&&(this._activeNotifications=t)}_removeNotification(e){const t=this.shadowRoot?.querySelector(`.notification[data-id="${e}"]`);t?(t.classList.add("fade-out"),t.addEventListener("transitionend",()=>{this._activeNotifications=this._activeNotifications.filter(i=>i.id!==e),this._removalTimeouts.delete(e)},{once:!0})):(this._activeNotifications=this._activeNotifications.filter(i=>i.id!==e),this._removalTimeouts.delete(e))}_getIconForTask(e){return e.icon?e.icon:e.status==="completed"?"check_circle":e.status==="error"?"error":e.type==="downloading"?"download":e.type==="uploading"?"upload":e.status==="processing"||e.progress!==void 0&&e.progress<100?"sync":"deployed_code_update"}render(){return c`
      <div id="notifications-container">
        ${this._activeNotifications.map(e=>c`
          <div
            class="notification ${e.status==="completed"?"status-completed":""} ${e.status==="error"?"status-error":""}"
            data-id=${e.id}
          >
            <span class="material-symbols-outlined icon">${this._getIconForTask(e)}</span>
            <div class="content">
              <strong>${e.filename}</strong>
              ${e.progress!==void 0&&e.status!=="completed"&&e.status!=="error"?c`
                <div class="progress-bar">
                  <div class="progress" style="width: ${e.progress}%"></div>
                </div>
                <small>${e.progress}% ${e.status?`(${e.status})`:""}</small>
              `:e.status?c`<small>${e.status}</small>`:""}
            </div>
          </div>
        `)}
      </div>
    `}disconnectedCallback(){super.disconnectedCallback(),this._removalTimeouts.forEach(e=>clearTimeout(e)),this._removalTimeouts.clear()}};l.styles=b`
    :host {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: block;
    }

    .material-symbols-outlined {
      font-family: 'Material Symbols Outlined';
      font-weight: normal;
      font-style: normal;
      font-size: 24px;
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      display: inline-block;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      -moz-font-feature-settings: 'liga';
      -moz-osx-font-smoothing: grayscale;
    }
    #notifications-container {
      display: flex;
      flex-direction: column;
      gap: 10px; /* Usar gap para espaciado es más moderno */
    }
    .notification {
      border: 1px solid #193455;
      padding: 10px 15px;
      border-radius: 5px;
      background: #1a1a1a;
      color: #e0e0e0;
      display: flex;
      align-items: center;
      min-width: 250px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      transition: opacity 0.5s ease-out, transform 0.5s ease-out;
    }
    .notification.fade-out {
        opacity: 0;
        transform: translateX(100%);
    }
    .icon {
      margin-right: 10px;
      flex-shrink: 0; /* Evita que el ícono se encoja */
    }
    .content {
      flex: 1;
      overflow: hidden; /* Para manejar filenames largos */
    }
    .content strong {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis; /* Puntos suspensivos para texto largo */
    }
    .progress-bar {
      background: #444; /* Color de fondo más oscuro para contraste */
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 5px;
    }
    .progress {
      background: #3f83f8;
      height: 100%;
      width: 0%;
      transition: width 0.3s ease-in-out;
    }
    .status-completed .icon {
        color: #4caf50; /* Verde para completado */
    }
    .status-error .icon {
        color: #f44336; /* Rojo para error */
    }
  `;g([E()],l.prototype,"_activeNotifications",2);l=g([_("task-notifications")],l);I.connect({onOpen:e=>{console.log("Conexión WS establecida desde el componente.",e)},onMessage:(e,t)=>{console.log("Mensaje recibido desde el componente:",e),!(!e||!e.event)&&e.event.startsWith("task")&&w(async()=>{try{await L()}catch(i){console.error("Error al actualizar notificaciones:",i)}})},onClose:e=>{console.log("Conexión WS cerrada desde el componente:",e)}});const D=document.querySelector("task-notifications"),v=["serverName","selecttab","coreName","coreVersion","fileName","javaVersion","Ramsize","serverPort","optiflags"],h=[],a={};function u(e,t){a[e]=t}function C(e,t){e.addEventListener("change",i=>{const o=i.detail;console.log(o),!(!o||!o.value)&&u(t,o.value)})}function M(e){return document.getElementById(e).shadowRoot?.querySelector("input")?.files?.[0]||null}function j(e){return typeof e=="object"&&e!==null&&Object.values(e).every(t=>typeof t<"u")}async function L(){const e=await m.getTasks();j(e.data)?(console.log("result.data",e.data),D.updateTasks(e.data)):console.error("Datos inesperados recibidos en result.data",e.data)}v.forEach(e=>{const t=document.getElementById(e);if(!t){console.warn(`Elemento con ID '${e}' no encontrado`);return}h.push(t),"value"in t&&u(e,t.value),C(t,e)});document.addEventListener("formSubmit",async function(e){v.forEach(o=>{const n=document.getElementById(o);n&&"value"in n&&u(o,n.value)}),a.startParameters=P(a.Ramsize,a.optiflags),console.log(a),console.log(h);const t=new FormData;t.append("jsonData",JSON.stringify(a));const i=M("fileName");i&&y.value.index===1&&t.append("file",i);try{const o=await m.postNewserver(t);console.log(o),o||o?.success?p(n=>{n.setType("success",o.message?o.message:"La operación fue un éxito rotundo.","¡Completado!"),n.addButton({text:`Go ${a.serverName}`,class:"primary",onClick:()=>{window.location.href="/console/?server="+(a.serverName||window.selectedServer||"")}})}):p(n=>{n.setType("error","Error al enviar el formulario: "+o?.error,"Error")})}catch(o){console.error("Error al enviar el formulario:",o)}});x.subscribe("tabs",(e,t)=>{const{index:i}=e;if(i===1){const o=document.getElementById("coreVersion");console.log("tabs cambió",{value:e,oldValue:t},a,o),o&&"Values"in o&&(o.Values=null,a.coreVersion=null)}});const f=document.getElementById("notificationDialog");function V(e){return new Promise((t,i)=>{let o=0;const n=50,s=setInterval(()=>{window.astroAppNotifications&&window.astroAppNotifications[e]?(clearInterval(s),t(window.astroAppNotifications[e])):o++>n&&(clearInterval(s),i(new Error(`API para el notificador con ID '${e}' no encontrada tras ${n} intentos.`)))},100)})}async function p(e){const t="notificationContent",i=await V(t);if(!i){console.error(`La API de notificación (window. ${t}) no está disponible`);return}await e(i),f&&typeof f.show=="function"&&f.show()}document.addEventListener("DOMContentLoaded",()=>{});
