import{i as m,r as h,t as b}from"./custom-element.rv7pTUKK.js";import{E as g,x as c}from"./lit-html.Cs9YtZST.js";import{n as p}from"./property.Bn3N06vY.js";import{o as u}from"./map.DiiNQ3pp.js";var f=Object.defineProperty,y=Object.getOwnPropertyDescriptor,d=(t,i,e,n)=>{for(var s=n>1?void 0:n?y(i,e):i,r=t.length-1,a;r>=0;r--)(a=t[r])&&(s=(n?a(i,e,s):a(s))||s);return n&&s&&f(i,e,s),s};let o=class extends h{constructor(){super(...arguments),this.elements=[],this.type="plugins"}addElement(t){const i=typeof t=="string"?t:t.name;return this.elements.some(e=>(typeof e=="string"?e:e.name)===i)?!1:(this.elements=[...this.elements,t],!0)}removeElement(t){const i=typeof t=="string"?t:t.name,e=this.elements.length;return this.elements=this.elements.filter(n=>(typeof n=="string"?n:n.name)!==i),this.elements.length<e}_getItemName(t){return typeof t=="string"?t:t.name}_createItemHTML(t,i){const e=this._getItemName(t);if(!e)return console.warn("Item sin nombre:",t),g;const n=!e.toLowerCase().endsWith(".dis"),s=e.replace(/\.(jar|dis)$/i,"");return c`
        <div class="item" data-item-name="${e}">
          <div class="item-container">
            <label class="switch">
              <input
                type="checkbox"
                .checked=${n}
                data-item-name="${e}"
                data-item-type="${i}"
                aria-label="Toggle ${s}"
              />
              <span class="slider round"></span>
            </label>
            <span class="filename">${s}</span>
          </div>
          <button
            class="dark-btn icon-only"
            data-item-name="${e}"
            data-item-type="${i}"
            aria-label="Delete ${s}"
          >
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      `}_handleToggle(t){const i=t.target;if(!i||i.type!=="checkbox"||!i.dataset.itemName)return;const e=i.dataset.itemName,n=i.dataset.itemType||this.type,s=i.checked;let r;const a=e.replace(/\.(jar|dis)$/i,""),l=e.substring(a.length).toLowerCase();s?(r=l===".dis"?a+e.substring(a.length).replace(/\.dis$/i,""):e.replace(/\.dis$/i,""),r.toLowerCase().endsWith(".jar")):r=e.toLowerCase().endsWith(".dis")?e:a+(l||".jar")+".dis",r.toLowerCase().endsWith(".jar.dis")?r=a+".jar.dis":!s&&!e.toLowerCase().endsWith(".dis")?r=e+".dis":s&&e.toLowerCase().endsWith(".dis")&&(r=e.replace(/\.dis$/i,"")),this._emitEvent("toggle",{item:e,type:n,newName:r})}_handleDelete(t){const i=t.target.closest("button.dark-btn");if(!i||!i.dataset.itemName)return;const e=i.dataset.itemName,n=i.dataset.itemType||this.type;this._emitEvent("delete",{item:e,type:n})}_emitEvent(t,i){this.dispatchEvent(new CustomEvent(t,{detail:i,bubbles:!0,composed:!0}))}render(){return c`
        <link href="/materialSymbols.css" rel="stylesheet" />
        <div
          id="elements-list-container"
          @change=${this._handleToggle}
          @click=${this._handleDelete}
        >
          ${u(this.elements,t=>this._createItemHTML(t,this.type))}
        </div>
      `}};o.styles=m`
      :host {
        display: block;
        width: 100%;
      }
      button {
        appearance: none;
        outline: none;
        border: 0;
        padding: 12px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        font-size: 14pt;
        cursor: pointer;
      }
      button:hover {
        background: var(--bg-dark-accent-light, #333c4a);
      }
      .item {
        background: #222c3a;
        display: flex;
        align-items: center;
        padding-block: 1rem;
        padding-inline: 6px;
        justify-content: space-between;
        width: 100%;
        border-radius: 10px;
        box-sizing: border-box;
      }
      .item-container {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .filename {
        color: white;
        word-break: break-all; /* Evitar desbordamiento con nombres largos */
      }
      .switch {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 28px;
        flex-shrink: 0;
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
        background-color: #e0e0e0;
        transition: .3s;
        border-radius: 34px;
      }
      .slider:before {
        position: absolute;
        content: "";
        height: 20px;
        width: 20px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .3s;
        border-radius: 50%;
      }
      input:checked + .slider {
        background-color: #2196F3;
      }
      input:checked + .slider:before {
        transform: translateX(32px);
      }
      .dark-btn {
        background-color: transparent;
        color: white;
        border: none;
        padding: 5px 10px;
        cursor: pointer;
      }
      .icon-only {
        padding: 8px;
        line-height: 0;
      }
      .icon-only .material-symbols-outlined {
        font-size: 20px;
      }
      #elements-list-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 10px;
      }
    `;d([p({type:Array})],o.prototype,"elements",2);d([p({type:String})],o.prototype,"type",2);o=d([b("plugins-ui")],o);
