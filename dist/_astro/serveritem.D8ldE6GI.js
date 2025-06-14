import{i as d,r as v}from"./lit-element.CdPzzhzS.js";import{x as h}from"./lit-html.Cs9YtZST.js";import{t as p}from"./custom-element.BhZVzxrc.js";import{n as a}from"./property.a2FlD-39.js";var m=Object.defineProperty,u=Object.getOwnPropertyDescriptor,n=(t,e,i,s)=>{for(var o=s>1?void 0:s?u(e,i):e,c=t.length-1,l;c>=0;c--)(l=t[c])&&(o=(s?l(e,i,o):l(o))||o);return s&&o&&m(e,i,o),o};let r=class extends v{constructor(){super(...arguments),this.server=null,this.size=0,this.version="Unknown",this.modified=null,this.status=null,this.icon=null,this.title="",this.active=!1}formatFileSize(t){if(!t)return"0 B";const e=["B","KB","MB","GB","TB"],i=Math.floor(Math.log(t)/Math.log(1024));return`${(t/Math.pow(1024,i)).toFixed(2)} ${e[i]}`}formatDate(t){if(!t)return"";try{return new Date(t).toLocaleDateString()}catch{return""}}getDetails(){return{server:this.server,size:this.size,modified:this.modified,version:this.version,status:this.status,title:this.title,icon:this.icon}}setActive(t){this.active=t}handleClick(t){const e=t.composedPath(),i=this.shadowRoot?.querySelector(".server-actions"),s=this.shadowRoot?.querySelector("slot"),o=s&&Array.from(s.assignedNodes()).some(l=>e.includes(l)||l instanceof Element&&l.contains(t.target)),c=i&&e.includes(i);o||c||(this.setActive(!0),this.emitEvent("selected",{data:this.getDetails(),event:t}))}handleContextMenu(t){t.preventDefault(),this.emitEvent("menu",{data:this.getDetails(),event:t})}emitEvent(t,e){this.dispatchEvent(new CustomEvent(t,{detail:e,bubbles:!0,composed:!0}))}firstUpdated(){this.addEventListener("click",this.handleClick),this.addEventListener("contextmenu",this.handleContextMenu)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("click",this.handleClick),this.removeEventListener("contextmenu",this.handleContextMenu)}render(){const t=this.formatFileSize(this.size),e=this.formatDate(this.modified),i=this.active?"server-item active":"server-item",s=this.title?this.title.replace(/\s+/g,"-").toLowerCase():"";return h`
      <div class="${i}" id="server-${s}">
        <div class="icon-circle-bg">
          <img src="${this.icon||""}" alt="${this.title||""}">
        </div>
        <div class="server-details">
          <span class="server-title">${this.title||""}</span>
          <span class="server-meta">Size: ${t} | Modified: ${e} | v${this.version}</span>
        </div>
        <div class="server-actions" id="server-actions-${s}">
          <div class="server-custom-slot">
            <slot></slot>
          </div>
        </div>
      </div>
    `}};r.styles=d`
    :host {
      display: block;
      --primary-color: #5865F2;
      --active-bg: #5865F280;
      --hover-bg: rgba(88, 101, 242, 0.1);
      --text-color: inherit;
    }
    
    .server-item {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      border-radius: 8px;
      color: var(--text-color);
      transition: all 0.2s ease;
      cursor: pointer;
      user-select: none;
    }
    
    .server-item:hover:not(.active) {
      background: var(--hover-bg);
    }
    
    .active {
      background: var(--active-bg) !important;
      color: white !important;
    }
    
    .icon-circle-bg {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-color);
      margin-right: 1rem;
      flex-shrink: 0;
      transition: background-color 0.2s ease;
    }
    
    .icon-circle-bg img {
      width: 20px;
      height: 20px;
      object-fit: contain;
      filter: brightness(0) invert(1);
    }
    
    .server-details {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      overflow: hidden;
    }
    
    .server-title {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .server-meta {
      font-size: 0.75rem;
      opacity: 0.7;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .server-actions {
      margin-left: auto;
      display: flex;
      align-items: center;
    }
    
    .server-custom-slot {
      width: 100%;
    }
  `;n([a({type:String,attribute:"data-server"})],r.prototype,"server",2);n([a({type:Number,attribute:"data-size"})],r.prototype,"size",2);n([a({type:String,attribute:"data-version"})],r.prototype,"version",2);n([a({type:String,attribute:"data-modified"})],r.prototype,"modified",2);n([a({type:String,attribute:"data-status"})],r.prototype,"status",2);n([a({type:String})],r.prototype,"icon",2);n([a({type:String})],r.prototype,"title",2);n([a({type:Boolean,reflect:!0})],r.prototype,"active",2);r=n([p("server-item")],r);
