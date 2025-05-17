import{i as u,r as p}from"./lit-element.CdPzzhzS.js";import{x as d}from"./lit-html.Cs9YtZST.js";import{t as c}from"./custom-element.BhZVzxrc.js";import{n as h}from"./property.a2FlD-39.js";var b=Object.defineProperty,m=Object.getOwnPropertyDescriptor,r=(t,e,o,n)=>{for(var i=n>1?void 0:n?m(e,o):e,s=t.length-1,l;s>=0;s--)(l=t[s])&&(i=(n?l(e,o,i):l(i))||i);return n&&i&&b(e,o,i),i};let a=class extends p{constructor(){super(...arguments),this.buttons=[]}_handleButtonClick(t){t.disabled||this.dispatchEvent(new CustomEvent("button-clicked",{detail:{id:t.id,action:t.action},bubbles:!0,composed:!0}))}render(){return d`
      <div class="actions">
        ${this.buttons.map(t=>d`
          <button
            id=${t.id}
            class="action-btn ${t.iconOnly?"icon-only":""} ${t.hidden?"hidden":""}"
            title=${t.tooltip||t.label||t.action||""}
            data-action=${t.action||""}
            ?disabled=${t.disabled}
            @click=${()=>this._handleButtonClick(t)}
          >
            <span class="material-symbols-rounded">${t.icon}</span>
            ${!t.iconOnly&&t.label?d`<span>${t.label}</span>`:""}
          </button>
        `)}
      </div>
    `}addButton(t){const e={label:"",iconOnly:!1,action:t.id,disabled:!1,hidden:!1,tooltip:t.label||t.action||t.id,...t};this.buttons=[...this.buttons,e]}_updateButtonState(t,e){this.buttons=this.buttons.map(o=>o.id===t?{...o,...e}:o)}hideButton(t){this._updateButtonState(t,{hidden:!0})}showButton(t){this._updateButtonState(t,{hidden:!1})}disableButton(t){this._updateButtonState(t,{disabled:!0})}enableButton(t){this._updateButtonState(t,{disabled:!1})}hideAllButtons(){this.buttons=this.buttons.map(t=>({...t,hidden:!0}))}showAllButtons(){this.buttons=this.buttons.map(t=>({...t,hidden:!1}))}getButtonConfig(t){return this.buttons.find(e=>e.id===t)}updateButton(t,e){this._updateButtonState(t,e)}};a.styles=u`
    :host {
      display: block; /* Or inline-block, depending on desired layout flow */
    }
    .actions {
      display: flex;
      gap: 8px;
      padding: 8px;
    }
    .action-btn {
      background: #222c3a;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background-color 0.2s, opacity 0.2s;
      font-family: inherit; /* Inherit font from host */
      font-size: inherit; /* Inherit font-size from host */
    }
    .action-btn:hover:not(:disabled) {
      background: #2e3e53;
    }
    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .icon-only {
      padding: 8px;
    }
    /* Ensure Material Symbols are loaded in your project */
    .material-symbols-rounded {
      font-family: 'Material Symbols Outlined', 'Material Symbols Rounded'; /* Add fallback */
      font-weight: normal;
      font-style: normal;
      font-size: 20px; /* Or as desired */
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      display: inline-block;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      -moz-osx-font-smoothing: grayscale;
      font-feature-settings: 'liga';
    }
    .hidden {
      display: none !important;
    }
  `;r([h({type:Array})],a.prototype,"buttons",2);a=r([c("action-buttons-lit")],a);export{a as A};
