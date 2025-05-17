import{i as c,r as p}from"./lit-element.CdPzzhzS.js";import{x as h}from"./lit-html.Cs9YtZST.js";import{t as u}from"./custom-element.BhZVzxrc.js";import{n as d}from"./property.a2FlD-39.js";import{r as f}from"./state.Dj2gG79p.js";var y=Object.defineProperty,m=Object.getOwnPropertyDescriptor,s=(t,e,a,r)=>{for(var o=r>1?void 0:r?m(e,a):e,n=t.length-1,l;n>=0;n--)(l=t[n])&&(o=(r?l(e,a,o):l(o))||o);return r&&o&&y(e,a,o),o};let i=class extends p{constructor(){super(...arguments),this._rawCurrentPath="/",this.data=[],this.sortColumn="name",this.sortDirection="asc",this._headerIcons={name:"↕️",path:"↕️",size:"↕️",lastModified:"↕️"}}get currentPath(){return this.normalizePath(this._rawCurrentPath)}set currentPath(t){const e=this._rawCurrentPath;this._rawCurrentPath=t,this.requestUpdate("currentPath",e)}get processedData(){return(this.data||[]).map(t=>({...t,name:t.name||"Unnamed",path:this.normalizePath(t.path),type:t.type||(t.isDirectory?"directory":"file"),lastModified:t.lastModified||t.modified||new Date().toISOString(),size:t.size===void 0&&(t.type==="file"||!t.isDirectory&&!t.type)?0:t.size}))}updated(t){if(t.has("_rawCurrentPath")){const e=this.currentPath;this._emitEvent("updated",{data:e,path:e})}}normalizePath(t){if(!t)return"/";let e=t.replace(/\/+/g,"/");return e!=="/"&&e.endsWith("/")&&(e=e.slice(0,-1)),!e.startsWith("/")&&!e.startsWith("./")&&(e="/"+e),e===""?"/":e}formatFileSize(t){if(t==null||isNaN(t))return"-";if(t===0)return"0 Bytes";const e=1024,a=["Bytes","KB","MB","GB","TB"],r=Math.floor(Math.log(t)/Math.log(e));return parseFloat((t/Math.pow(e,r)).toFixed(2))+" "+a[r]}formatDate(t){if(!t)return"-";try{const e=new Date(t);if(isNaN(e.getTime()))return"-";const a=e.getFullYear(),r=String(e.getMonth()+1).padStart(2,"0"),o=String(e.getDate()).padStart(2,"0"),n=String(e.getHours()).padStart(2,"0"),l=String(e.getMinutes()).padStart(2,"0");return`${a}-${r}-${o} ${n}:${l}`}catch{return"-"}}_handleDblClick(t){this._emitEvent("selected",{data:t})}_handleContextMenu(t,e){t.preventDefault(),this._emitEvent("menu",{event:t,data:e})}_emitEvent(t,e){this.dispatchEvent(new CustomEvent(t,{detail:e,bubbles:!0,composed:!0}))}get sortedData(){return[...this.processedData].sort((e,a)=>{let r,o;switch(this.sortColumn){case"name":r=e.name.toLowerCase(),o=a.name.toLowerCase();break;case"path":r=e.path.toLowerCase(),o=a.path.toLowerCase();break;case"size":if(e.type==="directory"&&a.type!=="directory")return-1;if(e.type!=="directory"&&a.type==="directory")return 1;r=e.size||0,o=a.size||0;break;case"lastModified":r=new Date(e.lastModified).getTime(),o=new Date(a.lastModified).getTime();break;default:r=e.name.toLowerCase(),o=a.name.toLowerCase()}return this.sortDirection==="asc"?r>o?1:r<o?-1:0:r<o?1:r>o?-1:0})}_handleSort(t){this.sortColumn===t?this.sortDirection=this.sortDirection==="asc"?"desc":"asc":(this.sortColumn=t,this.sortDirection="asc"),this._updateHeaderIcons(),this.requestUpdate(),this._emitEvent("sort",{column:this.sortColumn,direction:this.sortDirection})}_updateHeaderIcons(){const t={name:"↕️",path:"↕️",size:"↕️",lastModified:"↕️"};t[this.sortColumn]=this.sortDirection==="asc"?"⬆️":"⬇️",this._headerIcons=t}render(){return h`
      <table>
        <thead>
          <tr>
            <th @click="${()=>this._handleSort("name")}">
              Name ${this._headerIcons.name}
            </th>
            <th @click="${()=>this._handleSort("path")}">
              Path ${this._headerIcons.path}
            </th>
            <th @click="${()=>this._handleSort("size")}">
              Size ${this._headerIcons.size}
            </th>
            <th @click="${()=>this._handleSort("lastModified")}">
              Modified ${this._headerIcons.lastModified}
            </th>
          </tr>
        </thead>
        <tbody>
          ${this.sortedData.map(t=>h`
            <tr
              class="${t.type}"
              tabindex="0" 
              aria-label="File ${t.name}, type ${t.type}"
              @dblclick="${()=>this._handleDblClick(t)}"
              @contextmenu="${e=>this._handleContextMenu(e,t)}"
              @keydown="${e=>{(e.key==="Enter"||e.key===" ")&&this._handleDblClick(t)}}"
            >
              <td>
                <span class="icon">${t.type==="directory"?"📁":"📄"}</span>
                ${t.name}
              </td>
              <td>${t.path}</td>
              <td>${t.type==="directory"?"-":this.formatFileSize(t.size)}</td>
              <td>${this.formatDate(t.lastModified)}</td>
            </tr>
          `)}

        </tbody>
      </table>
    `}};i.styles=c`
    :host {
      display: block;
      font-family: var(--file-explorer-font-family, Arial, sans-serif);
      color: var(--file-explorer-text-color, #ccc);
      background-color: var(--file-explorer-background-color, #1e1e1e);
      border: 1px solid var(--file-explorer-border-color, rgb(46, 62, 83, 0.5));
      overflow-y: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background-color: var(--file-explorer-header-bg, #2a2d2e);
      color: var(--file-explorer-header-color, #e0e0e0);
      position: sticky;
      top: 0;
      z-index: 1;
    }
    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--file-explorer-row-border-color, rgb(46, 62, 83, 0.5));
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    tr:hover {
      background-color: var(--file-explorer-row-hover-bg, #2c313a);
      cursor: pointer;
    }
    .icon {
      width: 20px;
      height: 20px;
      display: inline-block;
      margin-right: 8px;
      vertical-align: middle;
    }
    .directory .icon {
      color: var(--file-explorer-dir-icon-color, #569cd6);
    }
    .file .icon {
      color: var(--file-explorer-file-icon-color, #d4d4d4);
    }
  `;s([d({type:String,attribute:"current-path"})],i.prototype,"_rawCurrentPath",2);s([d({type:Array})],i.prototype,"data",2);s([d({type:String})],i.prototype,"sortColumn",2);s([d({type:String})],i.prototype,"sortDirection",2);s([f()],i.prototype,"_headerIcons",2);i=s([u("file-explorer")],i);
