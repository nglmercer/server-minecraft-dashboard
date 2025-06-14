import{i as f,r as u}from"./lit-element.CdPzzhzS.js";import{x as n}from"./lit-html.Cs9YtZST.js";import{t as m}from"./custom-element.BhZVzxrc.js";import{r as g}from"./state.Dj2gG79p.js";import{s as h}from"./fetchapi.C4ZU2hwl.js";import{s as v}from"./request.Dio9yAJ0.js";import{g as x}from"./RecentBackups.astro_astro_type_script_index_0_lang.wtDPoRbH.js";import{w as y}from"./socketManager.CWZJZG80.js";import"./property.a2FlD-39.js";import"./directive.CGE4aKEl.js";import"./directive-helpers.CY_bUdrT.js";var w=Object.defineProperty,_=Object.getOwnPropertyDescriptor,p=(t,e,o,i)=>{for(var r=i>1?void 0:i?_(e,o):e,a=t.length-1,s;a>=0;a--)(s=t[a])&&(r=(i?s(e,o,r):s(r))||r);return i&&r&&w(e,o,r),r};let c=class extends u{constructor(){super(),this._activeNotifications=[],this._removalTimeouts=new Map}updateTasks(t){let e=[...this._activeNotifications],o=!1;for(const i in t)if(t.hasOwnProperty(i)){const r=t[i],a=e.findIndex(l=>l.id===i),s={...r,id:i};if(a!==-1?JSON.stringify(e[a])!==JSON.stringify(s)&&(e[a]=s,o=!0):(e.push(s),o=!0),s.status==="completed"||s.progress!==void 0&&s.progress>=100||s.status==="error"){this._removalTimeouts.has(i)&&clearTimeout(this._removalTimeouts.get(i));const l=window.setTimeout(()=>{this._removeNotification(i)},s.status==="error"?5e3:3e3);this._removalTimeouts.set(i,l)}}o&&(this._activeNotifications=e)}_removeNotification(t){const e=this.shadowRoot?.querySelector(`.notification[data-id="${t}"]`);e?(e.classList.add("fade-out"),e.addEventListener("transitionend",()=>{this._activeNotifications=this._activeNotifications.filter(o=>o.id!==t),this._removalTimeouts.delete(t)},{once:!0})):(this._activeNotifications=this._activeNotifications.filter(o=>o.id!==t),this._removalTimeouts.delete(t))}_getIconForTask(t){return t.icon?t.icon:t.status==="completed"?"check_circle":t.status==="error"?"error":t.type==="downloading"?"download":t.type==="uploading"?"upload":t.status==="processing"||t.progress!==void 0&&t.progress<100?"sync":"deployed_code_update"}render(){return n`
      <div id="notifications-container">
        ${this._activeNotifications.map(t=>n`
          <div
            class="notification ${t.status==="completed"?"status-completed":""} ${t.status==="error"?"status-error":""}"
            data-id=${t.id}
          >
            <span class="material-symbols-outlined icon">${this._getIconForTask(t)}</span>
            <div class="content">
              <strong>${t.filename}</strong>
              ${t.progress!==void 0&&t.status!=="completed"&&t.status!=="error"?n`
                <div class="progress-bar">
                  <div class="progress" style="width: ${t.progress}%"></div>
                </div>
                <small>${t.progress}% ${t.status?`(${t.status})`:""}</small>
              `:t.status?n`<small>${t.status}</small>`:""}
            </div>
          </div>
        `)}
      </div>
    `}disconnectedCallback(){super.disconnectedCallback(),this._removalTimeouts.forEach(t=>clearTimeout(t)),this._removalTimeouts.clear()}};c.styles=f`
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
  `;p([g()],c.prototype,"_activeNotifications",2);c=p([m("task-notifications")],c);y.connect({onOpen:t=>{console.log("Conexión WS establecida desde el componente.",t)},onMessage:(t,e)=>{console.log("Mensaje recibido desde el componente:",t),!(!t||!t.event)&&t.event.startsWith("task")&&v(async()=>{try{await T()}catch(o){console.error("Error al actualizar notificaciones:",o)}})},onClose:t=>{console.log("Conexión WS cerrada desde el componente:",t)}});const d=document.querySelector("task-notifications");document.addEventListener("DOMContentLoaded",()=>{console.log(d)});function b(t){return typeof t=="object"&&t!==null&&Object.values(t).every(e=>typeof e<"u")}async function T(){const t=await h.getTasks();d&&(b(t.data)?(console.log("result.data",t.data),d.updateTasks(t.data),Object.keys(t.data).length===0&&t.data.constructor===Object&&x()):console.error("Datos inesperados recibidos en result.data",t.data))}
