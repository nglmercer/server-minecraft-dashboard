import"./custom-modal.CnXaXrgi.js";import{o as a}from"./CInput.DYPlFd8_.js";import{r as m,i as u}from"./lit-element.CdPzzhzS.js";import{T as k,x as s}from"./lit-html.Cs9YtZST.js";import{o as f}from"./map.DiiNQ3pp.js";import{e as $,i as _,t as S}from"./directive.CGE4aKEl.js";import{n as c}from"./property.a2FlD-39.js";import"./custom-element.BhZVzxrc.js";import"./state.Dj2gG79p.js";/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const x=$(class extends _{constructor(o){if(super(o),o.type!==S.ATTRIBUTE||o.name!=="class"||o.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(o){return" "+Object.keys(o).filter(e=>o[e]).join(" ")+" "}update(o,[e]){if(this.st===void 0){this.st=new Set,o.strings!==void 0&&(this.nt=new Set(o.strings.join(" ").split(/\s/).filter(i=>i!=="")));for(const i in e)e[i]&&!this.nt?.has(i)&&this.st.add(i);return this.render(e)}const t=o.element.classList;for(const i of this.st)i in e||(t.remove(i),this.st.delete(i));for(const i in e){const r=!!e[i];r===this.st.has(i)||this.nt?.has(i)||(r?(t.add(i),this.st.add(i)):(t.remove(i),this.st.delete(i)))}return k}});function w(o){try{if(Array.isArray(o)||typeof o=="object"&&o!==null)return o;if(typeof o=="string"&&(o.trim().startsWith("{")||o.trim().startsWith("[")))try{return JSON.parse(o)}catch{const t=o.replace(/([{,]\s*)(\w+)\s*:/g,'$1"$2":').replace(/:\s*'([^']+)'/g,': "$1"');return JSON.parse(t)}return o}catch(e){return console.error("Error al parsear JSON:",e,"Valor recibido:",o),o}}class C extends m{static get properties(){return{title:{type:String,reflect:!0},description:{type:String,reflect:!0},theme:{type:String,reflect:!0},options:{type:Array}}}constructor(){super(),this.title="",this.description="",this.theme="light",this.options=[]}static get styles(){return u`
      :host {
        --dlg-padding: 1.5rem;
        --dlg-border-radius: 8px;
        --dlg-font-family: system-ui, -apple-system, sans-serif;
        --dlg-title-size: 1.5rem;
        --dlg-title-weight: 600;
        --dlg-desc-size: 1rem;
        --dlg-desc-opacity: 0.8;
        --dlg-desc-max-height: 500px;
        --dlg-button-padding: 0.5rem 1rem;
        --dlg-button-radius: 4px;
        --dlg-button-font-size: 0.875rem;
        --dlg-options-gap: 0.5rem;
        --dlg-slot-margin-top: 1rem;
        --dlg-transition-speed: 0.2s;

        --dlg-text-color: #1a1a1a;
        --dlg-border-color: #e5e5e5;
        --dlg-bg-color: #ffffff;
        --dlg-button-cancel-bg: #e5e5e5;
        --dlg-button-cancel-text: #1a1a1a;
        --dlg-button-cancel-hover-bg: #d9d9d9;

        --dlg-dark-text-color: #ffffff;
        --dlg-dark-border-color: #333333;
        --dlg-dark-bg-color: #2a2a2a;
        --dlg-dark-button-cancel-bg: #444444;
        --dlg-dark-button-cancel-text: #ffffff;
        --dlg-dark-button-cancel-hover-bg: #555555;

        --dlg-button-save-bg: #007bff;
        --dlg-button-save-text: white;
        --dlg-button-save-hover-bg: #0056b3;
        --dlg-button-delete-bg: #dc3545;
        --dlg-button-delete-text: white;
        --dlg-button-delete-hover-bg: #bd2130;

        display: block;
        font-family: var(--dlg-font-family);
      }

      .container {
        padding: var(--dlg-padding);
        border-radius: var(--dlg-border-radius);
        transition: background-color var(--dlg-transition-speed) ease, border-color var(--dlg-transition-speed) ease, color var(--dlg-transition-speed) ease;
        border: 1px solid var(--dlg-border-color);
        background-color: var(--dlg-bg-color);
        color: var(--dlg-text-color);
      }

      .container.dark {
        border-color: var(--dlg-dark-border-color);
        background-color: var(--dlg-dark-bg-color);
        color: var(--dlg-dark-text-color);
      }

      .title {
        font-size: var(--dlg-title-size);
        font-weight: var(--dlg-title-weight);
        margin: 0 0 0.5rem 0;
      }

      .description {
        font-size: var(--dlg-desc-size);
        opacity: var(--dlg-desc-opacity);
        max-height: var(--dlg-desc-max-height);
        overflow-y: auto;
        margin: 0 0 1rem 0;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .options {
        display: flex;
        gap: var(--dlg-options-gap);
        flex-wrap: wrap;
        margin-top: var(--dlg-padding);
        justify-content: flex-end;
      }

      ::slotted(*) {
        display: block;
        margin-top: var(--dlg-slot-margin-top);
        margin-bottom: var(--dlg-slot-margin-top);
      }

      button {
        padding: var(--dlg-button-padding);
        border-radius: var(--dlg-button-radius);
        border: none;
        cursor: pointer;
        font-size: var(--dlg-button-font-size);
        font-family: inherit;
        transition: background-color var(--dlg-transition-speed) ease, opacity var(--dlg-transition-speed) ease;
        background-color: transparent;
        color: inherit;
        border: 1px solid transparent;
      }

      button:hover {
         opacity: 0.85;
      }

      .save-btn {
        background-color: var(--dlg-button-save-bg);
        color: var(--dlg-button-save-text);
        border-color: var(--dlg-button-save-bg);
      }
      .save-btn:hover {
        background-color: var(--dlg-button-save-hover-bg);
        border-color: var(--dlg-button-save-hover-bg);
        opacity: 1;
      }

      .cancel-btn {
        background-color: var(--dlg-button-cancel-bg);
        color: var(--dlg-button-cancel-text);
        border-color: var(--dlg-button-cancel-bg);
      }
      .cancel-btn:hover {
        background-color: var(--dlg-button-cancel-hover-bg);
        border-color: var(--dlg-button-cancel-hover-bg);
        opacity: 1;
      }
      .container.dark .cancel-btn {
        background-color: var(--dlg-dark-button-cancel-bg);
        color: var(--dlg-dark-button-cancel-text);
        border-color: var(--dlg-dark-button-cancel-bg);
      }
      .container.dark .cancel-btn:hover {
        background-color: var(--dlg-dark-button-cancel-hover-bg);
        border-color: var(--dlg-dark-button-cancel-hover-bg);
      }

      .delete-btn {
        background-color: var(--dlg-button-delete-bg);
        color: var(--dlg-button-delete-text);
        border-color: var(--dlg-button-delete-bg);
      }
      .delete-btn:hover {
        background-color: var(--dlg-button-delete-hover-bg);
        border-color: var(--dlg-button-delete-hover-bg);
        opacity: 1;
      }
    `}render(){return s`
      <div class="container ${this.theme}">
        <h2 class="title">${this.title}</h2>
        <pre class="description">${this.description}</pre>
        <slot></slot>
        <div class="options">
          ${this.options.map((e,t)=>s`<button 
              @click=${i=>this._handleOptionClick(i,t)}
              data-index="${t}"
              class="${e.class||""}"
              style="${e.style||""}"
            >${e.label}</button>`)}
        </div>
      </div>
    `}_handleOptionClick(e,t){this.options[t]?.callback&&typeof this.options[t].callback=="function"?this.options[t].callback(e):console.warn(`No valid callback found for option index ${t}`)}}class V extends m{static get properties(){return{visible:{type:Boolean,reflect:!0},required:{type:Boolean,reflect:!0}}}constructor(){super(),this.visible=!1,this.required=!1}static get styles(){return u`
      :host {
        --dlg-overlay-bg: rgba(0, 0, 0, 0.5);
        --dlg-z-index: 1000;
        --dlg-transition-duration: 0.3s;
        --dlg-content-max-height: 90dvh;
        --dlg-content-border-radius: 16px;
        --dlg-content-padding: 8px;
        --dlg-content-bg: inherit;
        --dlg-content-color: inherit;

        display: block;
        background: inherit;
        color: inherit;
      }

      .dlg-ov {
        position: fixed;
        inset: 0;
        background-color: var(--dlg-overlay-bg);

        display: flex;
        align-items: center;
        justify-content: center;

        z-index: var(--dlg-z-index);

        opacity: 0;
        visibility: hidden;

        transition: opacity var(--dlg-transition-duration) ease,
                    visibility var(--dlg-transition-duration) ease;
      }

      .dlg-cnt {
        max-height: var(--dlg-content-max-height);
        overflow-y: auto;

        background: var(--dlg-content-bg);
        color: var(--dlg-content-color);
        border-radius: var(--dlg-content-border-radius);
        padding: var(--dlg-content-padding);

        transform: scale(0.95);
        transition: transform var(--dlg-transition-duration) ease;
        transition-property: transform;
      }

      .dlg-ov.visible {
        opacity: 1;
        visibility: visible;
      }

      .dlg-ov.visible .dlg-cnt {
        transform: scale(1);
      }
    `}render(){return s`
      <div class="dlg-ov ${this.visible?"visible":""}" @click="${this._handleOverlayClick}">
        <div class="dlg-cnt">
          <slot></slot>
        </div>
      </div>
    `}_handleOverlayClick(e){e.target===e.currentTarget&&!this.required&&(console.log("Overlay click event:",e.target===e.currentTarget,this.required),this.hide(),this.emitClose())}emitClose(){this.dispatchEvent(new CustomEvent("close"))}show(){this.visible=!0}hide(){this.visible=!1}}class E extends m{static get properties(){return{type:{type:String,reflect:!0},id:{type:String,reflect:!0},name:{type:String,reflect:!0},value:{type:String},placeholder:{type:String,reflect:!0},disabled:{type:Boolean,reflect:!0},readonly:{type:Boolean,reflect:!0},darkmode:{type:Boolean,reflect:!0},options:{type:Array},required:{type:Boolean,reflect:!0},title:{type:String,reflect:!0},pattern:{type:String,reflect:!0},_isValid:{type:Boolean,state:!0},_internalValue:{state:!0},multiple:{type:Boolean,reflect:!0}}}constructor(){super(),this.type="text",this.disabled=!1,this.readonly=!1,this.darkmode=!1,this.options=[],this.required=!1,this._isValid=!0,this.value="",this._internalValue=""}attributeChangedCallback(e,t,i){if(super.attributeChangedCallback(e,t,i),e==="options"&&i!==t&&typeof i=="string")try{this.options=w(i)}catch(r){console.error(`Error parsing options attribute for c-inp [${this.id||this.name}]:`,r),this.options=[]}e==="value"&&i!==t&&(this._internalValue=this._parseValueForInternal(i))}willUpdate(e){if(e.has("value")&&(this._internalValue=this._parseValueForInternal(this.value)),e.has("multiple")){const t=e.get("multiple");this.multiple&&!t&&!Array.isArray(this._internalValue)?this._internalValue=this._internalValue!==null&&this._internalValue!==void 0&&this._internalValue!==""?[String(this._internalValue)]:[]:!this.multiple&&t&&Array.isArray(this._internalValue)&&(this._internalValue=this._internalValue.length>0?this._internalValue[0]:"")}}_parseValueForInternal(e){if(this.multiple&&this.type==="select"){if(Array.isArray(e))return e.map(String);if(typeof e=="string")try{const t=JSON.parse(e);return Array.isArray(t)?t.map(String):[]}catch{return e?[String(e)]:[]}return[]}return this.type==="checkbox"||this.type==="switch"||this.type==="boolean"?String(e).toLowerCase()==="true":this.type==="number"?e===""||e===null||e===void 0?null:Number(e):e??""}static get styles(){return u`
      :host {
        display: block;
        margin: 0.5rem;
        padding: 0.5rem;
        color-scheme: light dark;
        /* Define variables default aquí para que se puedan sobreescribir */
        --inp-border-color: #ccc;
        --inp-disabled-bg: #f5f5f5;
        --inp-disabled-color: #888;
        --inp-slider-bg: #ccc;
        --inp-slider-knob: white;
      }
      :host([darkmode]) {
         /* Sobreescribe variables para dark mode */
        --inp-border-color: #555;
        --inp-disabled-bg: #222;
        --inp-disabled-color: #666;
        --inp-slider-bg: #555;
        --inp-slider-knob: #888;
      }

      /* Elimina el padding del host para que el contenedor interno lo controle */
      :host { padding: 0; }
      .inp-cont {
        display: flex;
        flex-direction: column;
        padding: 0.5rem; /* Mueve el padding aquí */
      }
       label { /* Estilo para mejor alineación de radios/checkboxes */
           display: inline-flex;
           align-items: center;
           margin-right: 10px;
           cursor: pointer;
       }

      input, textarea, select {
        padding: 0.5rem;
        border: 1px solid var(--inp-border-color); /* Usa la variable */
        border-radius: 4px;
        font-size: 14px;
        background-color: inherit;
        color: inherit;
        box-sizing: border-box; /* Importante para consistencia de tamaño */
        margin: 0; /* Resetea márgenes por defecto */
      }
      option {
        color: slategray;
        background-color: #fff;
        text-indent: 0;
      }
      textarea { resize: vertical; min-height: 80px; } /* Ajustado min-height */

      input:disabled, textarea:disabled, select:disabled {
        background-color: var(--inp-disabled-bg); /* Usa la variable */
        cursor: not-allowed;
        color: var(--inp-disabled-color); /* Usa la variable */
        border: 1px solid var(--inp-disabled-color); /* Usa la variable */
      }
      input:read-only, textarea:read-only  {
        background-color: var(--inp-disabled-bg); /* Usa la variable */
        cursor: not-allowed;
        color: var(--inp-disabled-color); /* Usa la variable */
      }

      .sw { position: relative; display: inline-block; width: 60px; height: 30px; }
      .sw input { opacity: 0; width: 0; height: 0; }
      .sldr { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--inp-slider-bg); transition: .4s; border-radius: 34px; }
      .sldr:before { position: absolute; content: ""; height: 22px; width: 22px; left: 4px; bottom: 4px; background-color: var(--inp-slider-knob); transition: .4s; border-radius: 50%; }
      input:checked + .sldr { background-color: #2196F3; }
      input:checked + .sldr:before { transform: translateX(28px); }
      input:not(:read-only):focus,
      textarea:not(:read-only):focus,
      select:focus {
        outline: none;
        border-color: #2196F3;
        box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
        cursor: auto; /* Reestablece el cursor */
      }
      input:focus,
      textarea:focus,
      select:focus {
        outline: none; /* Elimina el contorno predeterminado del navegador */
      }
      select option:checked {
        background-color: rgb(0, 171, 255);
        color: white;             /* Might work in SOME browsers/OS, often ignored */
        font-weight: bold;        /* Often ignored */
      }
      /* Aplica estilo inválido directamente al host o a un contenedor */
      :host([invalid]) .input-element {
         border-color: red !important; /* Usa !important con cuidado, o aumenta especificidad */
         box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.2) !important;
      }
      /* Opcional: estilo para el host inválido */
       :host([invalid]) {
          /* Puedes añadir un borde al propio host si quieres */
          /* outline: 1px solid red; */
       }
    `}render(){return this.toggleAttribute("invalid",!this._isValid),s`
      <form class="val-form" @submit="${this._handleSubmit}" novalidate>
        <div class="inp-cont">
          ${this._renderInput()}
        </div>
        <!-- Botón submit oculto si quieres habilitar submit con Enter -->
         <button type="submit" style="display: none;"></button>
      </form>
    `}_renderInput(){const e="input-element";switch(this.type){case"textarea":return s`<textarea
          class=${e}
          id=${a(this.id)}
          name=${a(this.name)}
          .value=${this._internalValue??""}
          placeholder=${a(this.placeholder)}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          title=${a(this.title)}
          pattern=${a(this.pattern)}
          @input=${this._handleInputChange}
          @change=${this._handleInputChange}
        ></textarea>`;case"checkbox":case"switch":case"boolean":return s`
          <label class="sw">
            <input
              class=${e}
              type="checkbox"
              id=${a(this.id)}
              name=${a(this.name)}
              .checked=${!!this._internalValue}
              ?disabled=${this.disabled}
              ?readonly=${this.readonly}
              ?required=${this.required}
              title=${a(this.title)}
              @change=${this._handleInputChange}
            >
            <span class="sldr"></span>
          </label>`;case"select":return s`
      <select
        class=${e}
        id=${a(this.id)}
        name=${a(this.name)}
        .value=${this.multiple?void 0:this._internalValue??""}
        ?disabled=${this.disabled}
        ?readonly=${this.readonly}
        ?required=${this.required}
        title=${a(this.title)}
        @change=${this._handleInputChange}
        ?multiple=${this.multiple}
      >
        ${this.options.map(t=>{const i=this.multiple?Array.isArray(this._internalValue)&&this._internalValue.includes(String(t.value)):String(t.value)==String(this._internalValue??"");return s`
            <option
              value=${t.value}
              ?selected=${i}
            >${t.label}</option>
          `})}
      </select>`;case"radio":return s`
          ${this.options.map(t=>s`
            <label>
              <input type="radio"
                id=${`${this.id||this.name}_${t.value}`}
                name=${a(this.name)}
                value=${t.value}
                .checked=${t.value==this._internalValue}
                ?disabled=${this.disabled}
                ?readonly=${this.readonly}
                ?required=${this.required}
                title=${a(this.title)}
                @change=${this._handleInputChange}
              >
              ${t.label}
            </label>
          `)}
        `;default:return s`
          <input
            class=${e}
            type=${this.type==="string"?"text":this.type}
            id=${a(this.id)}
            name=${a(this.name)}
            .value=${this._internalValue??""}
            placeholder=${a(this.placeholder)}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            title=${a(this.title)}
            pattern=${a(this.pattern)}
            @input=${this._handleInputChange}
            @change=${this._handleInputChange}
          >`}}_handleInputChange(e){const t=e.target;let i;if(this.type==="select"&&this.multiple)i=Array.from(t.selectedOptions).map(r=>r.value);else if(this.type==="radio"){const r=this.shadowRoot.querySelector(`input[name="${this.name}"]:checked`);i=r?r.value:null}else t.type==="checkbox"?i=t.checked:i=t.value;this._internalValue=this._parseValueForInternal(i),this.value=i==null?"":String(i),this.dispatchEvent(new CustomEvent("change",{detail:{id:this.id,name:this.name,value:this._internalValue},bubbles:!0,composed:!0})),this.isValid()}_handleSubmit(e){e.preventDefault(),this.isValid()?this.dispatchEvent(new CustomEvent("form-submit",{detail:{id:this.id,name:this.name,value:this.getVal()},bubbles:!0,composed:!0})):this._getInternalInputElement()?.reportValidity()}_getInternalInputElement(){return this.type==="radio"?null:this.shadowRoot.querySelector(".input-element")}getVal(){return this._internalValue}isValid(){let e=!0;const t=this._getInternalInputElement();return t?e=t.checkValidity():this.type==="radio"&&this.required&&(e=this.shadowRoot.querySelector(`input[name="${this.name}"]:checked`)!==null),this._isValid=e,e}setVal(e){this._internalValue=this._parseValueForInternal(e),this.value=e==null?"":String(e),this.requestUpdate(),setTimeout(()=>this.isValid(),0)}reset(){let e="";this.type==="checkbox"||this.type==="switch"||this.type==="boolean"?e=!1:this.type==="radio"&&(this.shadowRoot.querySelectorAll(`input[name="${this.name}"]`).forEach(i=>i.checked=!1),e=null),this.setVal(e)}setOpts(e){["select","radio"].includes(this.type)&&(this.options=Array.isArray(e)?e:[])}getSelOpt(){if(this.type==="select"){const e=this._getInternalInputElement();return e?e.value:null}return null}}customElements.define("c-dlg",C);customElements.define("dlg-cont",V);customElements.define("c-inp",E);class A extends m{static styles=u`
      /* Tus estilos existentes */
      :host {
          display: block; font-family: sans-serif; padding: 15px;
          border: 1px solid #eee; border-radius: 8px;
          background-color: #f9f9f9; margin-bottom: 15px;
      }
      .ef-cont { display: flex; flex-direction: column; gap: 15px; }
      .flds-cont {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 10px 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;
      }
      .fld-wrp { display: flex; flex-direction: column; gap: 4px; }
      label { font-weight: 500; font-size: 0.9em; color: #333; text-transform: capitalize; }
      c-inp { margin: 0; padding: 0; }
      .fld-wrp.inv label { color: #dc3545; }
      .acts { display: flex; justify-content: flex-end; gap: 10px; }
      button {
          padding: 8px 16px; cursor: pointer; border: 1px solid #ccc;
          border-radius: 4px; font-size: 0.95em; transition: all 0.2s;
          background-color: #fff;
      }
      button:hover { filter: brightness(0.95); }
      .sv-btn { background-color: #28a745; color: white; border-color: #28a745; }
      .sv-btn:hover { background-color: #218838; border-color: #1e7e34; }
      .cncl-btn { background-color: #6c757d; color: white; border-color: #6c757d; }
      .cncl-btn:hover { background-color: #5a6268; border-color: #545b62; }
      :host([darkmode]) { background-color: #333; border-color: #555; }
      :host([darkmode]) label { color: #eee; }
      :host([darkmode]) .flds-cont { border-bottom-color: #555; }
      :host([darkmode]) button { background-color: #555; border-color: #777; color: #eee; }
      :host([darkmode]) button:hover { filter: brightness(1.1); }
      :host([darkmode]) c-inp { color-scheme: dark; }

      /* NUEVO: Estilo para ocultar el wrapper del campo */
      .fld-wrp.hidden { display: none; }
  `;static properties={itm:{type:Object},fCfg:{type:Object},cActs:{type:Array},darkmode:{type:Boolean,reflect:!0},_iItm:{state:!0},_cItm:{state:!0}};constructor(){super(),this.itm={},this._iItm={},this._cItm={},this.fCfg={},this.cActs=[],this.darkmode=!1}willUpdate(e){if(e.has("itm")){const t=this._deepCopy(this.itm);JSON.stringify(t)!==JSON.stringify(this._cItm)&&(this._cItm=t,this._iItm=this._deepCopy(t))}}_deepCopy(e){try{return JSON.parse(JSON.stringify(e||{}))}catch(t){return console.error("Err deep copy",t),{}}}setConfig(e={},t={}){this.itm=this._deepCopy(e),this.fCfg=t||{},this.requestUpdate()}setItem(e={}){this.itm=this._deepCopy(e),this.requestUpdate()}addAct(e,t,i=""){!e||typeof e!="string"||typeof t!="string"||(this.cActs=[...this.cActs.filter(r=>r.nm!==e),{nm:e,lbl:t,cls:i}])}validate(){let e=!0;return this.shadowRoot.querySelectorAll("c-inp").forEach(t=>{const i=t.closest(".fld-wrp");if(i?.classList.contains("hidden")){i?.classList.remove("inv");return}let r=!0;typeof t.isValid=="function"&&(r=t.isValid()),i?.classList.toggle("inv",!r),r||(e=!1)}),e}getData(){return this._deepCopy(this._cItm)}reset(){this._cItm=this._deepCopy(this._iItm),this.requestUpdate(),this.shadowRoot.querySelectorAll(".fld-wrp.inv").forEach(e=>e.classList.remove("inv")),this.shadowRoot.querySelectorAll("c-inp").forEach(e=>{typeof e.isValid=="function"&&e.isValid()})}_hInpChg(e){if(e.target.tagName!=="C-INP")return;let t,i;e.detail?.name!==void 0?{name:t,value:i}=e.detail:(t=e.target.name,t&&typeof e.target.getVal=="function"&&(i=e.target.getVal())),t!==void 0&&(this._cItm[t]!==i&&(this._cItm={...this._cItm,[t]:i},this.dispatchEvent(new CustomEvent("fld-chg",{detail:{n:t,v:i}}))),e.target.closest(".fld-wrp")?.classList.remove("inv")),console.log("Input:",t,"Value:",i)}_hSub(e){e.preventDefault(),this._hSave()}_hActClk(e){const t=e.target.closest("button[data-act]");if(!t)return;const i=t.dataset.act;i==="save"||(i==="cancel"?(this.dispatchEvent(new CustomEvent("cancel-edit")),this.reset()):this.dispatchEvent(new CustomEvent(i,{detail:this.getData()})))}_hSave(){if(this.validate()){const e=this.getData();this._iItm=this._deepCopy(e),this.dispatchEvent(new CustomEvent("save-item",{detail:e}))}else{const e=this.shadowRoot.querySelector(".fld-wrp:not(.hidden).inv c-inp");if(e)try{typeof e.focus=="function"?e.focus():e.shadowRoot?.querySelector("input, select, textarea")?.focus()}catch(t){console.warn("Cant focus inv fld",t)}}}_compareValues(e,t){return typeof t=="boolean"?!(["false","0","",null,void 0].includes(String(e).toLowerCase())||!e)===t:e==null?t==null||t==="":String(e)===String(t)}_shouldFieldBeVisible(e,t){const i=t.showIf;if(!i||!i.field)return!0;const r=i.field,n=this._cItm?.[r],l=i.value,h=i.negate===!0;let g;return Array.isArray(l)?g=l.some(v=>this._compareValues(n,v)):g=this._compareValues(n,l),h?!g:g}render(){return s`
          <form class="ef-cont" @submit=${this._hSub} novalidate>
              <div class="flds-cont">
                  ${f(Object.entries(this.fCfg||{}),([e,t])=>{if(t.hidden)return"";const i=this._shouldFieldBeVisible(e,t),r={"fld-wrp":!0,hidden:!i},n=`ef-${e}-${Date.now()}`,l=this._cItm?.[e],h=t.required&&i;return s`
                          <div class=${x(r)}> 
                              <label for=${n}>${t.label||e}</label>
                              <c-inp
                                  id=${n}
                                  name=${e}
                                  type=${t.type||"text"}
                                  .value=${l} 
                                  placeholder=${a(t.placeholder)}
                                  ?required=${h} 
                                  ?disabled=${t.disabled}
                                  ?readonly=${t.readonly}
                                  pattern=${a(t.pattern)}
                                  title=${a(t.title)}
                                  min=${a(t.min)}
                                  max=${a(t.max)}
                                  step=${a(t.step)}
                                  rows=${a(t.rows)}
                                  cols=${a(t.cols)}
                                  ?multiple=${t.multiple}
                                  .options=${(t.type==="select"||t.type==="radio")&&Array.isArray(t.options)?t.options:void 0}
                                  ?darkmode=${this.darkmode}
                                  @change=${this._hInpChg}
                              ></c-inp>
                          </div>
                      `})}
              </div>
              <div class="acts" @click=${this._hActClk}>
                  <button type="button" class="cncl-btn" data-act="cancel">Cancel</button>
                  <button type="submit" class="sv-btn" data-act="save">Save</button>
                  ${f(this.cActs||[],e=>s`
                      <button type="button" data-act=${e.nm} class=${a(e.cls)}>${e.lbl}</button>
                  `)}
              </div>
          </form>
      `}}customElements.define("obj-edit-frm",A);class O extends m{static styles=u`
      /* Estilos (sin cambios) */
      :host { display: block; font-family: sans-serif; margin-bottom: 15px; }
      .dyn-cont { position: relative; }
      .d-card {
          background-color: #fff; border: 1px solid #eee; border-radius: 8px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08); overflow: hidden;
          display: flex; flex-direction: column; transition: box-shadow 0.2s;
      }
      :host([darkmode]) .d-card { background-color: #333; border-color: #555; color: #eee; }
      .d-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
      :host([darkmode]) .d-card:hover { box-shadow: 0 2px 8px rgba(255,255,255,0.1); }
      .d-hdr {
          background-color: #f5f5f5; padding: 12px 16px; font-weight: bold;
          border-bottom: 1px solid #eee; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
      }
      :host([darkmode]) .d-hdr { background-color: #444; border-bottom-color: #555; }
      .d-cont {
          padding: 16px; flex-grow: 1; display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px 15px;
      }
      .d-prop { margin-bottom: 8px; display: flex; flex-direction: column; gap: 2px; }
      .d-prop-lbl {
          font-weight: 500; color: #666; font-size: 0.8em;
          text-transform: capitalize; margin-bottom: 2px;
      }
      :host([darkmode]) .d-prop-lbl { color: #bbb; }
      .d-prop-val { word-break: break-word; font-size: 0.95em; }
      .d-prop-val[data-type="boolean"], .d-prop-val[data-type="switch"], .d-prop-val[data-type="checkbox"] {
          font-style: italic; color: #333;
      }
      :host([darkmode]) .d-prop-val[data-type="boolean"], :host([darkmode]) .d-prop-val[data-type="switch"], :host([darkmode]) .d-prop-val[data-type="checkbox"] {
           color: #ddd;
      }
      .d-acts {
          padding: 10px 16px; display: flex; justify-content: flex-end;
          gap: 8px; background-color: #fafafa; border-top: 1px solid #eee;
      }
      :host([darkmode]) .d-acts { background-color: #3a3a3a; border-top-color: #555; }
      .d-acts button {
          padding: 6px 12px; cursor: pointer; border: 1px solid #ccc;
          border-radius: 4px; font-size: 0.9em; transition: all 0.2s;
          background-color: #fff;
      }
      .d-acts button:hover { filter: brightness(0.95); }
      :host([darkmode]) .d-acts button { background-color: #555; border-color: #777; color: #eee; }
      :host([darkmode]) .d-acts button:hover { filter: brightness(1.1); }
      .ed-btn { background-color: #CCE5FF; border-color: #b8daff; color: #004085; }
      .del-btn { background-color: #F8D7DA; color: #721c24; border-color: #f5c6cb; }
      :host([darkmode]) .ed-btn { background-color: #0056b3; border-color: #0056b3; color: white; }
      :host([darkmode]) .del-btn { background-color: #b81c2c; border-color: #b81c2c; color: white; }
      obj-edit-frm { display: block; }
  `;static properties={mode:{type:String},itm:{type:Object},fCfg:{type:Object},hdrKey:{type:String,attribute:"hdr-key",reflect:!0},cActs:{type:Array},darkmode:{type:Boolean,reflect:!0}};constructor(){super(),this.mode="display",this.itm={},this.fCfg={},this.cActs=[{nm:"delete",lbl:"Eliminar",cls:"del-btn"}],this.darkmode=!1}_deepCopy(e){try{return JSON.parse(JSON.stringify(e||{}))}catch(t){return console.error("Err deep copy",t),{}}}setConfig(e={},t={}){this.itm=this._deepCopy(e),this.fCfg=t||{},this.mode="display"}setItem(e={}){this.itm=this._deepCopy(e),this.mode==="edit"&&this.requestUpdate()}addAct(e,t,i=""){!e||typeof e!="string"||typeof t!="string"||(this.cActs=[...this.cActs.filter(r=>r.nm!==e),{nm:e,lbl:t,cls:i}])}hideAct(e){this.hiddenAct(e)}hiddenAct(e){!e||typeof e!="string"||(this.cActs=this.cActs.filter(t=>t.nm!==e))}_formatVal(e,t){const i=t.type||"text";if(i==="boolean"||i==="switch"||i==="checkbox")return e?t.trueLabel||"Yes":t.falseLabel||"No";if(i==="select"&&Array.isArray(t.options)){const r=t.options.find(n=>String(n.value)===String(e));return r?r.label:e??""}return e==null?"":String(e)}_hDispActClk(e){const t=e.target.closest("button[data-act]");if(!t)return;const i=t.dataset.act,r=this._deepCopy(this.itm);i==="edit"?this.mode="edit":i==="delete"?this.dispatchEvent(new CustomEvent("del-item",{detail:r})):this.dispatchEvent(new CustomEvent(i,{detail:r}))}_hSave(e){this.itm=this._deepCopy(e.detail),this.dispatchEvent(new CustomEvent("item-upd",{detail:this._deepCopy(this.itm)})),this.mode="display"}_hCancel(){this.mode="display"}_compareValues(e,t){return typeof t=="boolean"?!(["false","0","",null,void 0].includes(String(e).toLowerCase())||!e)===t:e==null?t==null||t==="":String(e)===String(t)}_shouldFieldBeVisible(e,t,i){const r=t.showIf;if(!r||!r.field)return!0;const n=r.field,l=i?.[n],h=r.value,g=r.negate===!0;let y;return Array.isArray(h)?y=h.some(v=>this._compareValues(l,v)):y=this._compareValues(l,h),g?!y:y}_renderDisp(){const e=this.hdrKey&&this.itm[this.hdrKey]!==void 0?this.itm[this.hdrKey]:null;return s`
        <div class="d-card">
            ${e!==null?s`<div class="d-hdr">${e}</div>`:""}
            <div class="d-cont">
                ${f(Object.entries(this.fCfg||{}),([t,i])=>{const r=this._shouldFieldBeVisible(t,i,this.itm);return i.hidden||t===this.hdrKey||!r?"":s`
                        <div class="d-prop">
                            <div class="d-prop-lbl">${i.label||t}</div>
                            <div class="d-prop-val" data-type=${i.type||"text"}>${this._formatVal(this.itm[t],i)}</div>
                        </div>
                    `})}
            </div>
            <div class="d-acts" @click=${this._hDispActClk}>
                 <button type="button" class="ed-btn" data-act="edit">Edit</button>
                 ${f(this.cActs||[],t=>s`
                    <button type="button" data-act=${t.nm} class=${a(t.cls)}>${t.lbl}</button>
                 `)}
            </div>
        </div>
    `}_renderEdit(){return s`
          <obj-edit-frm
              .fCfg=${this.fCfg}
              .itm=${this.itm}
              .cActs=${[]}
              ?darkmode=${this.darkmode}
              @save-item=${this._hSave}
              @cancel-edit=${this._hCancel}
          ></obj-edit-frm>
      `}render(){return!this.itm||!this.fCfg||Object.keys(this.fCfg).length===0?s`<p>No item/config.</p>`:s`
          <div class="dyn-cont">
              ${this.mode==="display"?this._renderDisp():this._renderEdit()}
          </div>
      `}}customElements.define("dyn-obj-disp",O);/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function b(o,e,t){return o?e(o):t?.(o)}var I=Object.defineProperty,p=(o,e,t,i)=>{for(var r=void 0,n=o.length-1,l;n>=0;n--)(l=o[n])&&(r=l(e,t,r)||r);return r&&I(e,t,r),r};class d extends m{constructor(){super(...arguments),this.options=[],this.Values=[],this.multiple=!1,this.grid=!1,this.showEmptyStateMessages=!1,this.isLoading=!1,this.loadingMessage="Cargando opciones...",this.noOptionsMessage="No hay opciones disponibles."}updated(e){if(e.has("multiple")){const t=e.get("multiple");t!==void 0&&this.multiple!==t&&(this.Values=[],this._dispatchChange([]))}(e.has("options")||e.has("Values"))&&this._validateSelection()}_validateSelection(){if(!this.options||this.options.length===0){this.Values.length>0&&(this.Values=[],this._dispatchChange(this.getSelectedOptions()));return}const e=new Set(this.options.map(n=>String(n.value))),i=(Array.isArray(this.Values)?this.Values:[this.Values]).map(String).filter(n=>n!=null),r=i.filter(n=>e.has(n));(r.length!==i.length||this.Values&&r.length!==this.Values.length)&&(this.Values=r,this._dispatchChange(this.getSelectedOptions()))}_handleOptionSelect(e){e&&(this.multiple?this._toggleOption(e):this._selectOption(e))}_toggleOption(e){const t=this.Values.indexOf(e);let i;t===-1?i=[...this.Values,e]:i=this.Values.filter(r=>r!==e),this.Values=i,this._dispatchChange(this.getSelectedOptions())}_selectOption(e){this.Values.length===1&&this.Values[0]===e||(this.Values=[e],this._dispatchChange(this.getSelectedOptions()))}_dispatchChange(e){this.dispatchEvent(new CustomEvent("change",{detail:e,bubbles:!0,composed:!0}))}getSelectedOptions(){if(!this.options||this.options.length===0)return this.multiple?[]:null;const e=new Set(this.Values?.map(String)),t=this.options.filter(i=>e.has(String(i.value)));return this.multiple?t:t[0]||null}setOptions(e){this.options=e||[],this.isLoading=!1,this.requestUpdate()}setSelectedValues(e){const t=Array.isArray(e)?e:e!=null?[String(e)]:[];if(this.options&&this.options.length>0){const i=new Set(this.options.map(r=>String(r.value)));this.Values=t.map(String).filter(r=>i.has(r))}else this.Values=[]}getValue(){return this.multiple?[...this.Values]:this.Values.length>0?this.Values[0]:null}_renderLoadingState(){return s`
      <div class="status-message">
        <div class="loading-spinner"></div>
        ${this.loadingMessage}
      </div>
    `}_renderNoOptionsState(){return s`<div class="status-message">${this.noOptionsMessage}</div>`}}p([c({type:Array})],d.prototype,"options");p([c({type:Array})],d.prototype,"Values");p([c({type:Boolean,reflect:!0})],d.prototype,"multiple");p([c({type:Boolean,reflect:!0})],d.prototype,"grid");p([c({type:Boolean})],d.prototype,"showEmptyStateMessages");p([c({type:Boolean})],d.prototype,"isLoading");p([c({type:String})],d.prototype,"loadingMessage");p([c({type:String})],d.prototype,"noOptionsMessage");class q extends d{static{this.styles=[u`
      :host {
        display: inherit;
        grid-template-columns: inherit;
        grid-template-rows: inherit;
        font-family: Arial, sans-serif;
        border: 0px;
      }

      .select-container {
        border-radius: 4px;
        max-width: var(--enhanced-select-max-width, 300px);
        max-height: 480px;
        overflow-y: auto;
        padding: 8px;
        background-color: var(--enhanced-select-bg-color, #1a202c);
        color: var(--enhanced-select-text-color, #e2e8f0);
      }

      :host([grid]) .select-container {
        max-width: 100%;
      }
      .options-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      :host([grid]) .options-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 8px;
      }

      .option {
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s ease;
        border: 3px solid var(--enhanced-select-option-border-color, #2e3e53);
        display: flex;
        align-items: center;
        gap: 8px;
        background-color: var(--enhanced-select-option-bg-color, #222c3a);
        color: var(--enhanced-select-option-text-color, #cbd5e1);
      }

      .option:hover {
        background-color: var(--enhanced-select-option-hover-bg-color, #2e3e53);
        border-color: var(--enhanced-select-option-hover-border-color, #4a5568);
      }

      .option.selected {
        background-color: var(--enhanced-select-option-selected-bg-color, #222c3a);
        color: var(--enhanced-select-option-selected-text-color, #32d583);
        border-color: var(--enhanced-select-option-selected-border-color, #32d583);
        font-weight: 500;
      }

      .option img {
        width: 24px;
        height: 24px;
        object-fit: cover;
        border-radius: 2px;
        flex-shrink: 0;
      }

      .option-label {
        flex-grow: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .option-state {
        font-size: 0.8em;
        opacity: 0.7;
        margin-left: auto;
        flex-shrink: 0;
      }

      /* --- ESTILOS PARA MENSAJES DE ESTADO --- */
      .status-message {
        padding: 16px;
        text-align: center;
        color: var(--enhanced-select-text-color, #e2e8f0); /* Hereda color del texto */
        font-style: italic;
      }
      .loading-spinner {
        border: 4px solid rgba(255, 255, 255, 0.3); /* Color claro con opacidad */
        border-radius: 50%;
        border-top: 4px solid var(--enhanced-select-text-color, #e2e8f0); /* Color principal del texto */
        width: 24px;
        height: 24px;
        animation: spin 1s linear infinite;
        margin: 0 auto 8px auto; /* Centrar y espacio abajo */
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      /* --- FIN ESTILOS PARA MENSAJES DE ESTADO --- */
    `]}_handleOptionClick(e){const i=e.currentTarget.dataset.value;i&&this._handleOptionSelect(i)}render(){return s`
      <div class="select-container">
        <!-- ${this._renderPreview(this.getSelectedOptions())} --> <!-- Comentado, no está implementado -->
        ${b(this.showEmptyStateMessages&&this.isLoading,()=>this._renderLoadingState(),()=>b(this.showEmptyStateMessages&&!this.isLoading&&this.options.length===0,()=>this._renderNoOptionsState(),()=>s`
              <div class="options-list">
                ${this.generateSelectorOptions()}
              </div>`))}
      </div>
    `}generateSelectorOptions(){return!this.options||this.options.length===0?[]:Array.from(f(this.options,e=>{const t=this.Values?.includes(String(e.value)),i=x({option:!0,selected:t});return s`
          <div
            class=${i}
            data-value=${e.value}
            @click=${this._handleOptionClick}
            role="option"
            aria-selected=${t}
            tabindex="0"
          >
            ${b(e.img||e.image,()=>s`<img src="${e.img||e.image}" alt="">`)}
            <span class="option-label">${e.label}</span>
            ${b(e.state,()=>s`<span class="option-state">${e.state}</span>`)}
          </div>
        `}))}_renderPreview(e){}}class j extends d{static{this.styles=[u`
    :host {
      display: block;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      padding: 1rem;
    }
    .card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      border: 2px solid #ddd;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .card.active {
      border-color: #4a90e2;
      background-color: rgba(74, 144, 226, 0.1);
    }
    .icon {
      width: 64px;
      height: 64px;
      object-fit: contain;
      margin-bottom: 0.5rem;
    }
    .title {
      text-align: center;
      font-weight: 500;
    }

    /* --- ESTILOS PARA MENSAJES DE ESTADO --- */
    .status-message-container { /* Contenedor para centrar en el grid */
        grid-column: 1 / -1; /* Ocupa todas las columnas del grid */
        text-align: center;
        padding: 2rem 0;
    }
    .status-message {
        color: #555; /* Color de texto para el mensaje */
        font-style: italic;
    }
    .loading-spinner {
        border: 4px solid rgba(0, 0, 0, 0.1); /* Color base del spinner */
        border-radius: 50%;
        border-top: 4px solid #4a90e2; /* Color principal del spinner */
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 0 auto 10px auto; /* Centrar y espacio abajo */
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    /* --- FIN ESTILOS PARA MENSAJES DE ESTADO --- */
    `]}selectCard(e){this._handleOptionSelect(e)}render(){return s`
      <div class="cards-grid">
        ${b(this.showEmptyStateMessages&&this.isLoading,()=>s`<div class="status-message-container">${this._renderLoadingState()}</div>`,()=>b(this.showEmptyStateMessages&&!this.isLoading&&this.options.length===0,()=>s`<div class="status-message-container">${this._renderNoOptionsState()}</div>`,()=>this.generateSelectorOptions()))}
      </div>
    `}generateSelectorOptions(){return!this.options||this.options.length===0?[]:Array.from(f(this.options,e=>{const t=this.Values.includes(String(e.value));return s`
          <div
            class="card ${t?"active":""}"
            data-value="${e.value}"
            @click="${()=>this.selectCard(String(e.value))}"
            role="option"
            aria-selected=${t}
            tabindex="0"
          >
            <img class="icon" src="${e.img||e.image||""}" alt="${e.label}" />
            <span class="title">${e.label}</span>
          </div>
        `}))}}customElements.define("list-selector",q);customElements.define("grid-selector",j);
