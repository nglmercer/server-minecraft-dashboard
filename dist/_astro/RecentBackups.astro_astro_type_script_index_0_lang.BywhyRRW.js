import{b as x}from"./fetchapi.BPw2E3aO.js";import{i as F,r as M}from"./lit-element.CdPzzhzS.js";import{T as O,x as v}from"./lit-html.Cs9YtZST.js";import{t as E}from"./custom-element.BhZVzxrc.js";import{n as z}from"./property.a2FlD-39.js";import{e as S,i as _,t as C}from"./directive.CGE4aKEl.js";import{p as I,v as m,r as f,M as y,m as R}from"./directive-helpers.CY_bUdrT.js";/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const L=(e,t,r)=>{const a=new Map;for(let o=t;o<=r;o++)a.set(e[o],o);return a},j=S(class extends _{constructor(e){if(super(e),e.type!==C.CHILD)throw Error("repeat() can only be used in text expressions")}dt(e,t,r){let a;r===void 0?r=t:t!==void 0&&(a=t);const o=[],n=[];let i=0;for(const p of e)o[i]=a?a(p,i):i,n[i]=r(p,i),i++;return{values:n,keys:o}}render(e,t,r){return this.dt(e,t,r).values}update(e,[t,r,a]){const o=I(e),{values:n,keys:i}=this.dt(t,r,a);if(!Array.isArray(o))return this.ut=i,n;const p=this.ut??=[],u=[];let g,$,c=0,l=o.length-1,s=0,d=n.length-1;for(;c<=l&&s<=d;)if(o[c]===null)c++;else if(o[l]===null)l--;else if(p[c]===i[s])u[s]=m(o[c],n[s]),c++,s++;else if(p[l]===i[d])u[d]=m(o[l],n[d]),l--,d--;else if(p[c]===i[d])u[d]=m(o[c],n[d]),f(e,u[d+1],o[c]),c++,d--;else if(p[l]===i[s])u[s]=m(o[l],n[s]),f(e,o[c],o[l]),l--,s++;else if(g===void 0&&(g=L(i,s,d),$=L(p,c,l)),g.has(p[c]))if(g.has(p[l])){const b=$.get(i[s]),w=b!==void 0?o[b]:null;if(w===null){const D=f(e,o[c]);m(D,n[s]),u[s]=D}else u[s]=m(w,n[s]),f(e,o[c],w),o[b]=null;s++}else y(o[l]),l--;else y(o[c]),c++;for(;s<=d;){const b=f(e,u[d+1]);m(b,n[s]),u[s++]=b}for(;c<=l;){const b=o[c++];b!==null&&y(b)}return this.ut=i,R(e,u),O}});var P=Object.defineProperty,U=Object.getOwnPropertyDescriptor,B=(e,t,r,a)=>{for(var o=a>1?void 0:a?U(t,r):t,n=e.length-1,i;n>=0;n--)(i=e[n])&&(o=(a?i(t,r,o):i(o))||o);return a&&o&&P(t,r,o),o};let k=class extends M{constructor(){super(...arguments),this.backups=[],this.showActions=!0}formatFileSize(e){if(e===0)return"0 B";const t=1024,r=["B","KB","MB","GB","TB"],a=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,a)).toFixed(2))+" "+r[a]}formatDate(e){const t=new Date(e);return t.toLocaleDateString()+" "+t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}handleAction(e,t){const r=new CustomEvent("backup-action",{detail:{action:e,item:t},bubbles:!0,composed:!0});this.dispatchEvent(r)}renderBackupItem(e){return v`
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
                
                ${this.showActions?v`
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
        `}render(){return!this.backups||this.backups.length===0?v`
                <div class="backup-container">
                    <div class="empty-state">
                        <div class="empty-icon">📦</div>
                        <h3>No backups found</h3>
                        <p>There are no backup items to display.</p>
                    </div>
                </div>
            `:v`
            <div class="backup-container">
                <div class="backup-header">
                    Backup Items (${this.backups.length})
                </div>
                ${j(this.backups,e=>`${e.path}-${e.name}`,e=>this.renderBackupItem(e))}
            </div>
        `}};k.styles=F`
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
  `;B([z({type:Array})],k.prototype,"backups",2);B([z({type:Boolean})],k.prototype,"showActions",2);k=B([E("backup-list")],k);async function A(){const e=await x.getBackups();console.log("result",e);const t=e.data?.files;if(!t||t.length===0){console.log("No backups"),h.backups=[];return}return h&&(h.backups=t),e}async function N(e){console.log("backup",e);const t=await x.restoreBackups(e);return console.log("result",t),t}const h=document.getElementById("backups_List");function T(e){const t="-backup-",r=e.replace(/\.tar\.gz$/,""),a=r.indexOf(t);if(a===-1)return{name:r,date:"",fullFilename:e};const o=r.substring(0,a),n=r.substring(a+t.length);return{name:o,date:n,fullFilename:e}}async function Y(){h&&h.addEventListener("backup-action",async e=>{const{action:t,item:r}=e.detail;if(!t||!r)return;let a;switch(t){case"restore":const o={filename:r.name,outputFolderName:T(r.name).name};a=await N(o),console.log("result",a);break;case"download":const n=await x.downloadBackup(r.name);console.log("download",r),G(n,r.name);break;case"delete":a=await x.deleteBackup(r.name),console.log("delete",r),A();break;default:console.error("Acción no reconocida",t);break}console.log("action",t,r)})}function G(e,t){const r=window.URL.createObjectURL(e),a=document.createElement("a");a.href=r,a.download=t,document.body.appendChild(a),a.click(),document.body.removeChild(a),window.URL.revokeObjectURL(r)}document.addEventListener("DOMContentLoaded",()=>{Y(),A()});export{A as g};
