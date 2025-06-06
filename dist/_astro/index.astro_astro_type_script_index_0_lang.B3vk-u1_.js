import"./barstatus.CLr0Fo_F.js";import"./serveritem.DCN3syWx.js";import"./Console.D9uhudQV.js";import"./files.C6dDSqY-.js";import"./PluginsUI.C1TnRTCn.js";import{i as v,r as $,t as w}from"./custom-element.rv7pTUKK.js";import{x as n}from"./lit-html.Cs9YtZST.js";import{n as u}from"./property.Bn3N06vY.js";import{r as k}from"./state.V2Q47cpK.js";import{f as _}from"./fetchapi.BZM0Kgff.js";import"./map.DiiNQ3pp.js";const S=typeof window<"u"?window.location.origin:"",P=S;var C=Object.defineProperty,T=Object.getOwnPropertyDescriptor,y=(e,t,r,i)=>{for(var o=i>1?void 0:i?T(t,r):t,a=e.length-1,s;a>=0;a--)(s=e[a])&&(o=(i?s(t,r,o):s(o))||o);return i&&o&&C(t,r,o),o};let m=class extends ${constructor(){super(...arguments),this.serverId=window.selectedServer||"",this._properties=[],this._isLoading=!1,this._error=null}connectedCallback(){super.connectedCallback(),this._loadProperties()}updated(e){e.has("serverId")&&this.serverId&&this._loadProperties()}_getValueType(e){if(e===null)return"null";const t=typeof e;return t==="boolean"||t==="number"?t:"string"}_parseValueByType(e,t){switch(t){case"null":return e===""?null:String(e);case"boolean":return e==="true"||e===!0;case"number":const r=Number(e);return isNaN(r)?0:r;default:return String(e)}}async _loadProperties(){const e=this.serverId||window.localStorage.getItem("selectedServer");if(!e){this._error="Server ID not provided.",this._properties=[];return}this._isLoading=!0,this._error=null;try{const t=P+`/api/servers/${e}/server.properties`;console.log("url",t);const r=await fetch(t);if(!r.ok)throw new Error(`HTTP error! status: ${r.status}`);const i=await r.json();let o=i.data;typeof i.data=="string"&&(o=i.data.split(`
`).reduce((s,d)=>{if(!d.startsWith("#")&&d.includes("=")){const[p,f]=d.split("=");s[p.trim()]=f.trim()}return s},{}));const a=[];for(const[s,d]of Object.entries(o)){let p=this._getValueType(d),f=d;p==="null"&&(f=""),s==="server-ip"&&p!=="string"&&(p="string"),a.push({key:s,value:d,originalType:p,displayValue:f})}this._properties=a}catch(t){console.error("Error loading properties:",t),this._error=`Error loading properties: ${t instanceof Error?t.message:String(t)}`,this._properties=[]}finally{this._isLoading=!1}}_renderInput(e){switch(e.originalType){case"boolean":return n`
                    <label class="switch">
                        <input 
                            type="checkbox" 
                            .checked=${e.displayValue===!0||String(e.displayValue).toLowerCase()==="true"}
                            data-key=${e.key}
                            data-type=${e.originalType}
                        >
                        <span class="slider round"></span>
                    </label>`;case"number":return n`
                    <input 
                        type="number" 
                        .value=${String(e.displayValue)} 
                        data-key=${e.key}
                        data-type=${e.originalType}
                    >`;case"null":return n`
                    <input 
                        type="text" 
                        .value=${e.displayValue} 
                        placeholder="(null)"
                        data-key=${e.key}
                        data-type=${e.originalType}
                    >`;default:return n`
                    <input 
                        type="text" 
                        .value=${String(e.displayValue)} 
                        data-key=${e.key}
                        data-type=${e.originalType}
                    >`}}_getPropertiesToSave(){const e={};return this.shadowRoot?.querySelectorAll("input[data-key]")?.forEach(r=>{const i=r,o=i.dataset.key,a=i.dataset.type;let s;i.type==="checkbox"?s=i.checked:s=i.value,e[o]=this._parseValueByType(s,a)}),e}async _emitPropertiesChange(){const e=this._getPropertiesToSave(),t=this.serverId||window.localStorage.getItem("selectedServer");if(Object.keys(e).length===0&&!this._properties.length){console.log("No properties to save or loaded.");return}this.dispatchEvent(new CustomEvent("save-success",{bubbles:!0,composed:!0,detail:{server:t,result:e}})),console.log("save-success emitted with:",{server:t,result:e});try{const r=Object.entries(e).map(([o,a])=>`${o}=${a}`).join(`
`),i=await _.writeFile({directoryname:t,filename:"server.properties",content:r});console.log("result",i)}catch(r){console.error("Error saving properties:",r)}}render(){return this._isLoading?n`<div class="loading-message">Loading properties...</div>`:this._error?n`<div class="error-message">${this._error}</div>`:!this._properties.length&&!this.serverId&&!window.localStorage.getItem("selectedServer")?n`<p>Please provide a 'server-id' attribute or set 'selectedServer' in localStorage.</p>`:this._properties.length?n`
            <table>
                <thead>
                    <tr>
                        <th>Property</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${this._properties.map(e=>n`
                        <tr>
                            <td>${e.key}</td>
                            <td>${this._renderInput(e)}</td>
                        </tr>
                    `)}
                </tbody>
            </table>
            <button 
                id="save-btn" 
                class="primary-btn" 
                @click=${this._emitPropertiesChange}
                ?hidden=${this._properties.length===0}
            >
                Save Properties
            </button>
        `:n`<p>No properties found or loaded for server: ${this.serverId||window.localStorage.getItem("selectedServer")}.</p>`}};m.styles=v`
        :host {
            width: 100%;
            border-radius: 8px;
            box-sizing: border-box;
            color-scheme: light dark; /* Adapts to system theme */
            display: block; /* Good default for custom elements */
        }
        .hidden {
            display: none;
        }
        .primary-btn {
            padding: 8px 16px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        }
        .primary-btn:hover {
            background: #0056b3;
        }
        .switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 34px;
        }
        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
        }
        .slider:before {
            position: absolute;
            content: "";
            height: 26px;
            width: 26px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
        }
        input:checked + .slider {
            background-color: #2196F3;
        }
        input:checked + .slider:before {
            transform: translateX(26px);
        }
        .slider.round {
            border-radius: 34px;
        }
        .slider.round:before {
            border-radius: 50%;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 1px solid var(--table-border-color, rgba(46, 62, 83, 0.5)); /* CSS Var for theming */
        }
        td {
            padding: 8px;
            border: 1px solid var(--table-border-color, rgba(46, 62, 83, 0.5));
        }
        input[type="text"], input[type="number"] {
            width: calc(100% - 12px); /* Take padding into account */
            padding: 6px;
            box-sizing: border-box;
            border: 1px solid var(--input-border-color, #ccc);
            border-radius: 4px;
        }
        .error-message {
            color: red;
            margin-bottom: 10px;
        }
        .loading-message {
            padding: 10px;
            text-align: center;
        }
    `;y([u({type:String,attribute:"server-id"})],m.prototype,"serverId",2);y([k()],m.prototype,"_properties",2);y([k()],m.prototype,"_isLoading",2);y([k()],m.prototype,"_error",2);m=y([w("server-properties")],m);var I=Object.defineProperty,B=Object.getOwnPropertyDescriptor,h=(e,t,r,i)=>{for(var o=i>1?void 0:i?B(t,r):t,a=e.length-1,s;a>=0;a--)(s=e[a])&&(o=(i?s(t,r,o):s(o))||o);return i&&o&&I(t,r,o),o};let c=class extends ${constructor(){super(...arguments),this.value=0,this.centerColor="transparent",this.bgColor="#e0e0e0",this.activeColor="#007bff",this.radius=100,this.strokeWidth=10,this.text=""}firstUpdated(){this.setAttribute("role","progressbar"),this.style.width=`${this.radius}px`,this.style.height=`${this.radius}px`}updated(e){e.has("radius")&&(this.style.width=`${this.radius}px`,this.style.height=`${this.radius}px`)}getCircumference(){return(this.radius/2-this.strokeWidth/2)*2*Math.PI}calculateStrokeDashArray(e){const t=this.getCircumference(),r=t*e/100;return`${r} ${t-r}`}getValue(){return this.value}setValue(e,t=!0){this.value=e,t&&(this.text=e+"%")}setText(e){this.text=e}getText(){return this.text}setActiveColor(e){this.activeColor=e}setCenterColor(e){this.centerColor=e}setBgColor(e){this.bgColor=e}setStrokeWidth(e){this.strokeWidth=e}render(){const e=this.radius/2-this.strokeWidth/2;this.getCircumference();const t=this.calculateStrokeDashArray(this.value),r=this.radius/2;return n`
      <div class="container">
        <svg width="100%" height="100%" viewBox="0 0 ${this.radius} ${this.radius}">
          <!-- Center circle (can be transparent) -->
          <circle 
            cx="${r}" 
            cy="${r}" 
            r="${e-this.strokeWidth/2}" 
            fill="${this.centerColor}" 
          />
          
          <!-- Background circle -->
          <circle 
            cx="${r}" 
            cy="${r}" 
            r="${e}" 
            fill="none"
            stroke="${this.bgColor}" 
            stroke-width="${this.strokeWidth}" 
          />
          
          <!-- Progress circle -->
          <circle 
            cx="${r}" 
            cy="${r}" 
            r="${e}" 
            fill="none" 
            stroke="${this.activeColor}" 
            stroke-width="${this.strokeWidth}" 
            stroke-dasharray="${t}"
            stroke-dashoffset="0"
            transform="rotate(-90 ${r} ${r})"
          />
        </svg>
        <span class="text">${this.text||this.value+"%"}</span>
      </div>
    `}};c.styles=v`
    :host {
      display: inline-block;
      position: relative;
    }
    .container {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: sans-serif;
      font-size: 1.2rem;
      font-weight: bold;
      pointer-events: none;
    }
  `;h([u({type:Number})],c.prototype,"value",2);h([u({type:String,attribute:"center-color"})],c.prototype,"centerColor",2);h([u({type:String,attribute:"bg-color"})],c.prototype,"bgColor",2);h([u({type:String,attribute:"active-color"})],c.prototype,"activeColor",2);h([u({type:Number})],c.prototype,"radius",2);h([u({type:Number})],c.prototype,"strokeWidth",2);h([u({type:String})],c.prototype,"text",2);c=h([w("circle-progress")],c);var N=Object.defineProperty,O=Object.getOwnPropertyDescriptor,x=(e,t,r,i)=>{for(var o=i>1?void 0:i?O(t,r):t,a=e.length-1,s;a>=0;a--)(s=e[a])&&(o=(i?s(t,r,o):s(o))||o);return i&&o&&N(t,r,o),o};function g(e,t=!1,r=1){if(e==null)return"N/A";if(e===0)return"0 Bytes";const i=t?1e3:1024;if(Math.abs(e)<i)return e+" B";const o=t?["kB","MB","GB","TB","PB","EB","ZB","YB"]:["KiB","MiB","GiB","TiB","PiB","EiB","ZiB","YiB"];let a=-1;const s=10**r;let d=e;do d/=i,++a;while(Math.round(Math.abs(d)*s)/s>=i&&a<o.length-1);return d.toFixed(r)+" "+o[a]}function A(e){if(e==null)return"N/A";if(e===0)return"0 seconds";const t=Math.floor(e/(3600*24)),r=Math.floor(e%(3600*24)/3600),i=Math.floor(e%3600/60),o=Math.floor(e%60),a=[];return t>0&&a.push(t+(t===1?" day":" days")),r>0&&a.push(r+(r===1?" hour":" hours")),i>0&&a.push(i+(i===1?" minute":" minutes")),(o>0||a.length===0)&&a.push(o+(o===1?" second":" seconds")),a.join(", ")}const l={osSectionTitle:"System Information",osName:"Operating System",osBuild:"OS Build",totalRam:"Total RAM",Uptime:"System Uptime",cpuModel:"CPU Model",cpuCores:"CPU Cores",cpuSpeed:"CPU Speed",environmentSectionTitle:"Environment Variables",networkInterfacesSectionTitle:"Network Interfaces",disksSectionTitle:"Disk Usage",diskUnit:"Unit",diskUsed:"Used",diskFree:"Free",diskTotal:"Total",diskPercent:"Usage %",noData:"No system data available.",loadingData:"Loading system data...",errorData:"Error loading system data."};let b=class extends ${constructor(){super(...arguments),this.systemInfo=null}render(){if(!this.systemInfo)return n`<div class="status-message">${l.loadingData}</div>`;if(!this.systemInfo.success||!this.systemInfo.data)return n`<div class="status-message">${this.systemInfo.success===!1?l.errorData:l.noData}</div>`;const e=this.systemInfo.data,t=e.platform||{},r=e.cpu||{},i=e.enviroment||{},o=e.networkInterfaces||{},a=e.rawdisks?e.rawdisks.map(s=>({...s,mountPoint:s.mount||s.fs})):(e.disks||[]).map(s=>({...s,mountPoint:s.filesystem}));return n`
            <div class="system-monitor">
                <div class="system-info">
                    <h3>${l.osSectionTitle}</h3>
                    <p>${l.osName}: ${t.name??"N/A"} ${t.version??""} <sup>${t.arch??""}</sup></p>
                    <p>${l.osBuild}: ${t.release??"N/A"}</p>
                    <p>${l.totalRam}: ${e.totalmem?g(e.totalmem*1024*1024):"N/A"}</p>
                    <p>${l.Uptime}: ${A(e.uptime)}</p>
                    <p>${l.cpuModel}: ${r.model??"N/A"}</p>
                    <p>${l.cpuCores}: ${r.cores??"N/A"} cores</p>
                    <p>${l.cpuSpeed}: ${r.speed?`${r.speed} GHz`:"N/A"}</p>
                </div>

                ${Object.keys(i).length>0?n`
                    <h3>${l.environmentSectionTitle}</h3>
                    <table id="enviroment-table">
                        <colgroup>
                            <col style="width: 30%">
                            <col style="width: 70%">
                        </colgroup>
                        <tbody>
                            ${Object.entries(i).map(([s,d])=>n`
                                <tr>
                                    <th>${s}</th>
                                    <td>${d??"N/A"}</td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                `:""}

                ${Object.keys(o).length>0?n`
                    <h3>${l.networkInterfacesSectionTitle}</h3>
                    <table id="networks-table">
                        <colgroup>
                            <col style="width: 30%">
                            <col style="width: 70%">
                        </colgroup>
                        <tbody>
                            ${Object.entries(o).map(([s,d])=>n`
                                <tr class="network-ips">
                                    <th>${s}</th>
                                    <td>
                                        ${(d||[]).map(p=>n`
                                            <span>${p.address??"N/A"} <sup>${p.family??""}</sup></span><br>
                                        `)}
                                    </td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                `:""}

                ${a.length>0?n`
                    <h3>${l.disksSectionTitle}</h3>
                    <table id="disks-table">
                        <colgroup>
                            <col style="width: 20%">
                            <col style="width: 20%">
                            <col style="width: 20%">
                            <col style="width: 20%">
                            <col style="width: 20%">
                        </colgroup>
                        <thead>
                            <tr>
                                <th>${l.diskUnit}</th>
                                <th>${l.diskUsed}</th>
                                <th>${l.diskFree}</th>
                                <th>${l.diskTotal}</th>
                                <th>${l.diskPercent}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${a.map(s=>n`
                                <tr>
                                    <th>${s.mountPoint??s.fs??s.filesystem??"N/A"}</th>
                                    <td>${g(s.used)}</td>
                                    <td>${g(s.available)}</td>
                                    <td>${g(s.total??s.size)}</td>
                                    <td>${typeof s.use=="number"?`${s.use.toFixed(1)}%`:s.use??"N/A"}</td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                `:""}
            </div>
        `}};b.styles=v`
        :host {
            display: block;
            font-family: Arial, sans-serif;
            word-wrap: break-word;
        }
        /* ... (resto de tus estilos, parecen estar bien) ... */
        @media (prefers-color-scheme: dark) {
            :host {
                color: #e0e0e0;
                background-color: #1a1a1a;
            }
            table {
                border-color: #404040;
            }
            th, td {
                border-color: #404040;
            }
            th {
                background-color: #2a2a2a;
            }
        }
        @media (prefers-color-scheme: light) {
            :host {
                color: #1a1a1a;
                background-color: #ffffff;
            }
            table {
                border-color: #ddd;
            }
            th, td {
                border-color: #ddd;
            }
            th {
                background-color: #f5f5f5;
            }
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            table-layout: fixed;
        }
        th, td {
            padding: 8px;
            border: 1px solid; /* relies on media query for color */
            text-align: left;
            vertical-align: top;
        }
        td {
            word-break: break-all;
            overflow-wrap: break-word;
            hyphens: auto;
        }
        #enviroment-table td, .network-ips td {
            word-wrap: break-word;
        }
        .system-info p {
            margin: 8px 0;
        }
        sup {
            font-size: 0.75em;
            vertical-align: super;
        }
        .status-message {
            padding: 20px;
            text-align: center;
            font-style: italic;
        }
    `;x([u({type:Object})],b.prototype,"systemInfo",2);b=x([w("system-monitor-lit")],b);
