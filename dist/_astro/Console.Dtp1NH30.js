import{i as x,r as g,t as C}from"./custom-element.rv7pTUKK.js";import{x as F}from"./lit-html.Cs9YtZST.js";/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const T=(t,s,e)=>(e.configurable=!0,e.enumerable=!0,Reflect.decorate&&typeof s!="object"&&Object.defineProperty(t,s,e),e);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function y(t,s){return(e,o,r)=>{const n=l=>l.renderRoot?.querySelector(t)??null;return T(e,o,{get(){return n(this)}})}}var A=Object.defineProperty,v=Object.getOwnPropertyDescriptor,b=(t,s,e,o)=>{for(var r=o>1?void 0:o?v(s,e):s,n=t.length-1,l;n>=0;n--)(l=t[n])&&(r=(o?l(s,e,r):l(r))||r);return o&&r&&A(s,e,r),r};let u=class extends g{constructor(){super(...arguments),this.obfuscators={},this.currId=0,this.lastProcessedText="",this.styleMap={"§0":"color:#000000","§1":"color:#0000AA","§2":"color:#00AA00","§3":"color:#00AAAA","§4":"color:#AA0000","§5":"color:#AA00AA","§6":"color:#FFAA00","§7":"color:#AAAAAA","§8":"color:#555555","§9":"color:#5555FF","§a":"color:#55FF55","§b":"color:#55FFFF","§c":"color:#FF5555","§d":"color:#FF55FF","§e":"color:#FFFF55","§f":"color:#FFFFFF","§l":"font-weight:bold","§m":"text-decoration:line-through","§n":"text-decoration:underline","§o":"font-style:italic"}}render(){return F`
            <div class="console-layout">
                <div class="console" id="console-text"></div>
            </div>
        `}obfuscate(t,s){const e=()=>String.fromCharCode(Math.floor(Math.random()*32)+64),o=(n,l)=>n.substring(0,l)+e()+n.substring(l+1),r=(n,l)=>{const a=l.replace(/<[^>]*>?/gm,"").length;if(!a)return;this.obfuscators[this.currId]||(this.obfuscators[this.currId]=[]);let c=0;const i=window.setInterval(()=>{c>=a&&(c=0);const d=n.textContent||"";d.length>c&&(n.textContent=o(d,c)),c++},50);this.obfuscators[this.currId].push(i)};if(s.includes("<br>")){t.innerHTML=s;const n=document.createTreeWalker(t,NodeFilter.SHOW_TEXT,null);let l;for(;l=n.nextNode();)if(l.nodeValue&&l.nodeValue.trim()!==""){const a=document.createElement("span");a.textContent=l.nodeValue,l.parentNode.replaceChild(a,l),r(a,a.textContent)}}else t.textContent=s,r(t,s)}applyCode(t,s){const e=document.createElement("span");let o=!1;const r=t.replace(/\x00/g,"");return s.forEach(n=>{this.styleMap[n]&&(e.style.cssText+=this.styleMap[n]+";"),n==="§k"&&(this.obfuscate(e,r),o=!0)}),o||(e.innerHTML=r),e}parseLine(t){const s=document.createElement("pre"),e=t.match(/§./g)||[],o=[];let r=[];this.obfuscators[this.currId]||(this.obfuscators[this.currId]=[]);let n=t.replace(/\n|\\n/g,"<br>"),l=n;e.forEach(c=>{const i=l.indexOf(c);i!==-1&&(o.push(i),l=l.substring(0,i)+"\0\0"+l.substring(i+2))});const a=n.substring(0,o.length>0?o[0]:n.length);a&&s.appendChild(this.applyCode(a,[]));for(let c=0;c<e.length;c++){const i=e[c];i==="§r"?r=[]:(r.includes(i)||r.push(i),Object.keys(this.styleMap).some(h=>h===i&&h.length===2&&!["§k","§l","§m","§n","§o"].includes(h))&&(r=r.filter(h=>!(Object.keys(this.styleMap).some(f=>f===h&&f.length===2&&!["§k","§l","§m","§n","§o"].includes(f))&&h!==i))));const d=o[c]+2,m=c+1<o.length?o[c+1]:n.length,p=n.substring(d,m);p&&s.appendChild(this.applyCode(p,[...r]))}return this.currId++,s}clearObfuscators(t){t!==void 0&&this.obfuscators[t]?(this.obfuscators[t].forEach(s=>clearInterval(s)),delete this.obfuscators[t]):(Object.keys(this.obfuscators).forEach(s=>{const e=parseInt(s,10);this.obfuscators[e].forEach(o=>clearInterval(o))}),this.obfuscators={})}refreshlogs(t){if(!this.consoleTextElem){this.updateComplete.then(()=>this.refreshlogs(t));return}if(t===this.lastProcessedText)return;this.lastProcessedText=t,this.clearObfuscators(),this.consoleTextElem.innerHTML="";const s=t.split(/\r?\n/),e=document.createDocumentFragment();s.forEach(o=>{if(o.trim()==="")e.appendChild(document.createElement("br"));else{const r=this.parseLine(o);for(;r.firstChild;)e.appendChild(r.firstChild);e.appendChild(document.createElement("br"))}}),this.consoleTextElem.appendChild(e),requestAnimationFrame(()=>{if(!this.consoleTextElem)return;const o=this.consoleTextElem.scrollHeight,r=this.consoleTextElem.clientHeight,n=this.consoleTextElem.scrollTop;o-r-n<200&&(this.consoleTextElem.scrollTop=o)})}disconnectedCallback(){super.disconnectedCallback(),this.clearObfuscators()}};u.styles=x`
        .console-layout {
            width: 100%;
            height: 100%;
            min-height: 300px;
            background: var(--bg-darker, #222);
            border-radius: 8px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
        }

        .console {
            flex-grow: 1;
            width: 100%;
            max-height: 500px;
            overflow-y: auto;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            line-height: 1.5;
            color: var(--text-primary, #eee);
            padding: 8px;
            box-sizing: border-box;
            scroll-behavior: smooth;
        }

        .console::-webkit-scrollbar {
            width: 8px;
        }

        .console::-webkit-scrollbar-track {
            background: var(--bg-darker, #222);
            border-radius: 4px;
        }

        .console::-webkit-scrollbar-thumb {
            background: var(--bg-dark-accent, #444);
            border-radius: 4px;
        }

        .console::-webkit-scrollbar-thumb:hover {
            background: var(--bg-dark-accent-lighter, #666);
        }
    `;b([y("#console-text")],u.prototype,"consoleTextElem",2);u=b([C("game-console")],u);export{u as G};
