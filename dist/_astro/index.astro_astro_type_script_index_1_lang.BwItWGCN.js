import"./circle-progress.CgyJpk_m.js";import"./barstatus.CzxN21Ca.js";import"./serveritem.D8ldE6GI.js";import"./Console.BrNn8IuR.js";import"./files.DHw2uSH-.js";import"./PluginsUI.4LLudKbu.js";import{i as y,r as g}from"./lit-element.CdPzzhzS.js";import{x as n}from"./lit-html.Cs9YtZST.js";import{t as v}from"./custom-element.BhZVzxrc.js";import{n as w}from"./property.a2FlD-39.js";import{r as f}from"./state.Dj2gG79p.js";import{f as k}from"./fetchapi.C4ZU2hwl.js";import"./map.DiiNQ3pp.js";const _=typeof window<"u"?window.location.origin:"",x=_;var S=Object.defineProperty,T=Object.getOwnPropertyDescriptor,u=(e,r,o,s)=>{for(var i=s>1?void 0:s?T(r,o):r,a=e.length-1,t;a>=0;a--)(t=e[a])&&(i=(s?t(r,o,i):t(i))||i);return s&&i&&S(r,o,i),i};let c=class extends g{constructor(){super(...arguments),this.serverId=window.selectedServer||"",this._properties=[],this._isLoading=!1,this._error=null}connectedCallback(){super.connectedCallback(),this._loadProperties()}updated(e){e.has("serverId")&&this.serverId&&this._loadProperties()}_getValueType(e){if(e===null)return"null";const r=typeof e;return r==="boolean"||r==="number"?r:"string"}_parseValueByType(e,r){switch(r){case"null":return e===""?null:String(e);case"boolean":return e==="true"||e===!0;case"number":const o=Number(e);return isNaN(o)?0:o;default:return String(e)}}async _loadProperties(){const e=this.serverId||window.localStorage.getItem("selectedServer");if(!e){this._error="Server ID not provided.",this._properties=[];return}this._isLoading=!0,this._error=null;try{const r=x+`/api/servers/${e}/server.properties`;console.log("url",r);const o=await fetch(r);if(!o.ok)throw new Error(`HTTP error! status: ${o.status}`);const s=await o.json();let i=s.data;typeof s.data=="string"&&(i=s.data.split(`
`).reduce((t,d)=>{if(!d.startsWith("#")&&d.includes("=")){const[p,h]=d.split("=");t[p.trim()]=h.trim()}return t},{}));const a=[];for(const[t,d]of Object.entries(i)){let p=this._getValueType(d),h=d;p==="null"&&(h=""),t==="server-ip"&&p!=="string"&&(p="string"),a.push({key:t,value:d,originalType:p,displayValue:h})}this._properties=a}catch(r){console.error("Error loading properties:",r),this._error=`Error loading properties: ${r instanceof Error?r.message:String(r)}`,this._properties=[]}finally{this._isLoading=!1}}_renderInput(e){switch(e.originalType){case"boolean":return n`
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
                    >`}}_getPropertiesToSave(){const e={};return this.shadowRoot?.querySelectorAll("input[data-key]")?.forEach(o=>{const s=o,i=s.dataset.key,a=s.dataset.type;let t;s.type==="checkbox"?t=s.checked:t=s.value,e[i]=this._parseValueByType(t,a)}),e}async _emitPropertiesChange(){const e=this._getPropertiesToSave(),r=this.serverId||window.localStorage.getItem("selectedServer");if(Object.keys(e).length===0&&!this._properties.length){console.log("No properties to save or loaded.");return}this.dispatchEvent(new CustomEvent("save-success",{bubbles:!0,composed:!0,detail:{server:r,result:e}})),console.log("save-success emitted with:",{server:r,result:e});try{const o=Object.entries(e).map(([i,a])=>`${i}=${a}`).join(`
`),s=await k.writeFile({directoryname:r,filename:"server.properties",content:o});console.log("result",s)}catch(o){console.error("Error saving properties:",o)}}render(){return this._isLoading?n`<div class="loading-message">Loading properties...</div>`:this._error?n`<div class="error-message">${this._error}</div>`:!this._properties.length&&!this.serverId&&!window.localStorage.getItem("selectedServer")?n`<p>Please provide a 'server-id' attribute or set 'selectedServer' in localStorage.</p>`:this._properties.length?n`
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
        `:n`<p>No properties found or loaded for server: ${this.serverId||window.localStorage.getItem("selectedServer")}.</p>`}};c.styles=y`
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
    `;u([w({type:String,attribute:"server-id"})],c.prototype,"serverId",2);u([f()],c.prototype,"_properties",2);u([f()],c.prototype,"_isLoading",2);u([f()],c.prototype,"_error",2);c=u([v("server-properties")],c);var P=Object.defineProperty,I=Object.getOwnPropertyDescriptor,$=(e,r,o,s)=>{for(var i=s>1?void 0:s?I(r,o):r,a=e.length-1,t;a>=0;a--)(t=e[a])&&(i=(s?t(r,o,i):t(i))||i);return s&&i&&P(r,o,i),i};function m(e,r=!1,o=1){if(e==null)return"N/A";if(e===0)return"0 Bytes";const s=r?1e3:1024;if(Math.abs(e)<s)return e+" B";const i=r?["kB","MB","GB","TB","PB","EB","ZB","YB"]:["KiB","MiB","GiB","TiB","PiB","EiB","ZiB","YiB"];let a=-1;const t=10**o;let d=e;do d/=s,++a;while(Math.round(Math.abs(d)*t)/t>=s&&a<i.length-1);return d.toFixed(o)+" "+i[a]}function B(e){if(e==null)return"N/A";if(e===0)return"0 seconds";const r=Math.floor(e/(3600*24)),o=Math.floor(e%(3600*24)/3600),s=Math.floor(e%3600/60),i=Math.floor(e%60),a=[];return r>0&&a.push(r+(r===1?" day":" days")),o>0&&a.push(o+(o===1?" hour":" hours")),s>0&&a.push(s+(s===1?" minute":" minutes")),(i>0||a.length===0)&&a.push(i+(i===1?" second":" seconds")),a.join(", ")}const l={osSectionTitle:"System Information",osName:"Operating System",osBuild:"OS Build",totalRam:"Total RAM",Uptime:"System Uptime",cpuModel:"CPU Model",cpuCores:"CPU Cores",cpuSpeed:"CPU Speed",environmentSectionTitle:"Environment Variables",networkInterfacesSectionTitle:"Network Interfaces",disksSectionTitle:"Disk Usage",diskUnit:"Unit",diskUsed:"Used",diskFree:"Free",diskTotal:"Total",diskPercent:"Usage %",noData:"No system data available.",loadingData:"Loading system data...",errorData:"Error loading system data."};let b=class extends g{constructor(){super(...arguments),this.systemInfo=null}render(){if(!this.systemInfo)return n`<div class="status-message">${l.loadingData}</div>`;if(!this.systemInfo.success||!this.systemInfo.data)return n`<div class="status-message">${this.systemInfo.success===!1?l.errorData:l.noData}</div>`;const e=this.systemInfo.data,r=e.platform||{},o=e.cpu||{},s=e.enviroment||{},i=e.networkInterfaces||{},a=e.rawdisks?e.rawdisks.map(t=>({...t,mountPoint:t.mount||t.fs})):(e.disks||[]).map(t=>({...t,mountPoint:t.filesystem}));return n`
            <div class="system-monitor">
                <div class="system-info">
                    <h3>${l.osSectionTitle}</h3>
                    <p>${l.osName}: ${r.name??"N/A"} ${r.version??""} <sup>${r.arch??""}</sup></p>
                    <p>${l.osBuild}: ${r.release??"N/A"}</p>
                    <p>${l.totalRam}: ${e.totalmem?m(e.totalmem*1024*1024):"N/A"}</p>
                    <p>${l.Uptime}: ${B(e.uptime)}</p>
                    <p>${l.cpuModel}: ${o.model??"N/A"}</p>
                    <p>${l.cpuCores}: ${o.cores??"N/A"} cores</p>
                    <p>${l.cpuSpeed}: ${o.speed?`${o.speed} GHz`:"N/A"}</p>
                </div>

                ${Object.keys(s).length>0?n`
                    <h3>${l.environmentSectionTitle}</h3>
                    <table id="enviroment-table">
                        <colgroup>
                            <col style="width: 30%">
                            <col style="width: 70%">
                        </colgroup>
                        <tbody>
                            ${Object.entries(s).map(([t,d])=>n`
                                <tr>
                                    <th>${t}</th>
                                    <td>${d??"N/A"}</td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                `:""}

                ${Object.keys(i).length>0?n`
                    <h3>${l.networkInterfacesSectionTitle}</h3>
                    <table id="networks-table">
                        <colgroup>
                            <col style="width: 30%">
                            <col style="width: 70%">
                        </colgroup>
                        <tbody>
                            ${Object.entries(i).map(([t,d])=>n`
                                <tr class="network-ips">
                                    <th>${t}</th>
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
                            ${a.map(t=>n`
                                <tr>
                                    <th>${t.mountPoint??t.fs??t.filesystem??"N/A"}</th>
                                    <td>${m(t.used)}</td>
                                    <td>${m(t.available)}</td>
                                    <td>${m(t.total??t.size)}</td>
                                    <td>${typeof t.use=="number"?`${t.use.toFixed(1)}%`:t.use??"N/A"}</td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                `:""}
            </div>
        `}};b.styles=y`
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
    `;$([w({type:Object})],b.prototype,"systemInfo",2);b=$([v("system-monitor-lit")],b);
