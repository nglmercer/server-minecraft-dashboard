import{b as v}from"./fetchapi.BgkDLfI7.js";import{i as A,r as F,t as M}from"./custom-element.rv7pTUKK.js";import{T as O,x as g}from"./lit-html.Cs9YtZST.js";import{n as z}from"./property.Bn3N06vY.js";import{e as E,i as S,t as _}from"./directive.CGE4aKEl.js";import{p as C,v as m,r as f,M as w,m as I}from"./directive-helpers.CY_bUdrT.js";/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const L=(e,t,r)=>{const a=new Map;for(let o=t;o<=r;o++)a.set(e[o],o);return a},R=E(class extends S{constructor(e){if(super(e),e.type!==_.CHILD)throw Error("repeat() can only be used in text expressions")}dt(e,t,r){let a;r===void 0?r=t:t!==void 0&&(a=t);const o=[],n=[];let c=0;for(const p of e)o[c]=a?a(p,c):c,n[c]=r(p,c),c++;return{values:n,keys:o}}render(e,t,r){return this.dt(e,t,r).values}update(e,[t,r,a]){const o=C(e),{values:n,keys:c}=this.dt(t,r,a);if(!Array.isArray(o))return this.ut=c,n;const p=this.ut??=[],u=[];let k,$,i=0,l=o.length-1,s=0,d=n.length-1;for(;i<=l&&s<=d;)if(o[i]===null)i++;else if(o[l]===null)l--;else if(p[i]===c[s])u[s]=m(o[i],n[s]),i++,s++;else if(p[l]===c[d])u[d]=m(o[l],n[d]),l--,d--;else if(p[i]===c[d])u[d]=m(o[i],n[d]),f(e,u[d+1],o[i]),i++,d--;else if(p[l]===c[s])u[s]=m(o[l],n[s]),f(e,o[i],o[l]),l--,s++;else if(k===void 0&&(k=L(c,s,d),$=L(p,i,l)),k.has(p[i]))if(k.has(p[l])){const b=$.get(c[s]),x=b!==void 0?o[b]:null;if(x===null){const D=f(e,o[i]);m(D,n[s]),u[s]=D}else u[s]=m(x,n[s]),f(e,o[i],x),o[b]=null;s++}else w(o[l]),l--;else w(o[i]),i++;for(;s<=d;){const b=f(e,u[d+1]);m(b,n[s]),u[s++]=b}for(;i<=l;){const b=o[i++];b!==null&&w(b)}return this.ut=c,I(e,u),O}});var j=Object.defineProperty,P=Object.getOwnPropertyDescriptor,B=(e,t,r,a)=>{for(var o=a>1?void 0:a?P(t,r):t,n=e.length-1,c;n>=0;n--)(c=e[n])&&(o=(a?c(t,r,o):c(o))||o);return a&&o&&j(t,r,o),o};let h=class extends F{constructor(){super(...arguments),this.backups=[],this.showActions=!0}formatFileSize(e){if(e===0)return"0 B";const t=1024,r=["B","KB","MB","GB","TB"],a=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,a)).toFixed(2))+" "+r[a]}formatDate(e){const t=new Date(e);return t.toLocaleDateString()+" "+t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}handleAction(e,t){const r=new CustomEvent("backup-action",{detail:{action:e,item:t},bubbles:!0,composed:!0});this.dispatchEvent(r)}renderBackupItem(e){return g`
            <div class="backup-item">
                <div class="backup-info">
                    <div class="backup-name">
                        <span class="backup-icon">
                            ${e.isDirectory?"📁":"📄"}
                        </span>
                        <div>
                            <div>${e.name}</div>
                            <div class="backup-path">${e.path}</div>
                        </div>
                    </div>
                    <div class="backup-size">
                        ${e.isDirectory?"Directory":this.formatFileSize(e.size)}
                    </div>
                    <div class="backup-modified">
                        ${this.formatDate(e.modified)}
                    </div>
                </div>
                
                ${this.showActions?g`
                    <div class="backup-actions">
                        <button 
                            class="action-btn restore-btn"
                            @click=${()=>this.handleAction("restore",e)}
                            title="Restore backup"
                        >
                            Restore
                        </button>
                        <button 
                            class="action-btn download-btn"
                            @click=${()=>this.handleAction("download",e)}
                            title="Download backup"
                        >
                            Download
                        </button>
                        <button 
                            class="action-btn delete-btn"
                            @click=${()=>this.handleAction("delete",e)}
                            title="Delete backup"
                        >
                            Delete
                        </button>
                    </div>
                `:""}
            </div>
        `}render(){return!this.backups||this.backups.length===0?g`
                <div class="backup-container">
                    <div class="empty-state">
                        <div class="empty-icon">📦</div>
                        <h3>No backups found</h3>
                        <p>There are no backup items to display.</p>
                    </div>
                </div>
            `:g`
            <div class="backup-container">
                <div class="backup-header">
                    Backup Items (${this.backups.length})
                </div>
                ${R(this.backups,e=>`${e.path}-${e.name}`,e=>this.renderBackupItem(e))}
            </div>
        `}};h.styles=A`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
      /* Light mode variables */
      --border-color: #e1e5e9;
      --background-header: #f8f9fa;
      --background-hover: #f8f9fa;
      --text-primary: #495057;
      --text-secondary: #6c757d;
      --text-muted: #adb5bd;
      --box-shadow: rgba(0, 0, 0, 0.1);
      --background-color: white;
    }
  
    @media (prefers-color-scheme: dark) {
      :host {
        --border-color: #3a3f44;
        --background-header: #2a2d30;
        --background-hover: #343a40;
        --text-primary: #f1f3f5;
        --text-secondary: #ced4da;
        --text-muted: #868e96;
        --box-shadow: rgba(0, 0, 0, 0.3);
        --background-color: #1e1e1e;
      }
    }
  
    .backup-container {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px var(--box-shadow);
      background-color: var(--background-color);
    }
  
    .backup-header {
      background-color: var(--background-header);
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      font-weight: 600;
      color: var(--text-primary);
    }
  
    .backup-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      transition: background-color 0.2s ease;
      background-color: var(--background-color);
    }
  
    .backup-item:last-child {
      border-bottom: none;
    }
  
    .backup-item:hover {
      background-color: var(--background-hover);
    }
  
    .backup-info {
      flex: 1;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 16px;
      align-items: center;
    }
  
    .backup-name {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary);
    }
  
    .backup-icon {
      width: 16px;
      height: 16px;
      opacity: 0.7;
    }
  
    .backup-size,
    .backup-modified {
      font-size: 14px;
      color: var(--text-secondary);
    }
  
    .backup-path {
      font-size: 12px;
      color: var(--text-muted);
      font-family: monospace;
    }
  
    .backup-actions {
      display: flex;
      gap: 8px;
      margin-left: 16px;
    }
  
    .action-btn {
      padding: 6px 12px;
      border: 1px solid;
      border-radius: 4px;
      background: var(--background-color);
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  
    .action-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px var(--box-shadow);
    }
  
    .action-btn:active {
      transform: translateY(0);
    }
  
    .restore-btn {
      border-color: #28a745;
      color: #28a745;
    }
  
    .restore-btn:hover {
      background-color: #28a745;
      color: white;
    }
  
    .download-btn {
      border-color: #007bff;
      color: #007bff;
    }
  
    .download-btn:hover {
      background-color: #007bff;
      color: white;
    }
  
    .delete-btn {
      border-color: #dc3545;
      color: #dc3545;
    }
  
    .delete-btn:hover {
      background-color: #dc3545;
      color: white;
    }
  
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-secondary);
    }
  
    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
  
    @media (max-width: 768px) {
      .backup-info {
        grid-template-columns: 1fr;
        gap: 4px;
      }
  
      .backup-actions {
        margin-left: 0;
        margin-top: 8px;
      }
  
      .backup-item {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `;B([z({type:Array})],h.prototype,"backups",2);B([z({type:Boolean})],h.prototype,"showActions",2);h=B([M("backup-list")],h);async function U(){const e=await v.getBackups();console.log("result",e);const t=e.data?.files;if(!t||t.length===0){console.log("No backups");return}return y.backups=t,e}async function N(e){console.log("backup",e);const t=await v.restoreBackup(e);return console.log("result",t),t}const y=document.getElementById("backups_List");function T(e){const t="-backup-",r=e.replace(/\.tar\.gz$/,""),a=r.indexOf(t);if(a===-1)return{name:r,date:"",fullFilename:e};const o=r.substring(0,a),n=r.substring(a+t.length);return{name:o,date:n,fullFilename:e}}async function Y(){y&&y.addEventListener("backup-action",async e=>{const{action:t,item:r}=e.detail;if(!t||!r)return;let a;switch(t){case"restore":const o={filename:r.name,outputFolderName:T(r.name).name};a=await N(o),console.log("result",a);break;case"download":const n=await v.downloadBackup(r.name);console.log("download",r),G(n,r.name);break;case"delete":a=await v.deleteBackup(r.name),console.log("delete",r);break;default:console.error("Acción no reconocida",t);break}console.log("action",t,r)})}function G(e,t){const r=window.URL.createObjectURL(e),a=document.createElement("a");a.href=r,a.download=t,document.body.appendChild(a),a.click(),document.body.removeChild(a),window.URL.revokeObjectURL(r)}document.addEventListener("DOMContentLoaded",()=>{Y(),U()});
