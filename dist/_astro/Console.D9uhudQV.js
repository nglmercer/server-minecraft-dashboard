import{i as x,r as y,t as S}from"./custom-element.rv7pTUKK.js";import{x as E}from"./lit-html.Cs9YtZST.js";/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const A=(l,e,t)=>(t.configurable=!0,t.enumerable=!0,Reflect.decorate&&typeof e!="object"&&Object.defineProperty(l,e,t),t);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function w(l,e){return(t,i,s)=>{const r=n=>n.renderRoot?.querySelector(l)??null;return A(t,i,{get(){return r(this)}})}}var b=function(l,e){return Object.defineProperty?Object.defineProperty(l,"raw",{value:e}):l.raw=e,l},a;(function(l){l[l.EOS=0]="EOS",l[l.Text=1]="Text",l[l.Incomplete=2]="Incomplete",l[l.ESC=3]="ESC",l[l.Unknown=4]="Unknown",l[l.SGR=5]="SGR",l[l.OSCURL=6]="OSCURL"})(a||(a={}));class C{constructor(){this.VERSION="6.0.6",this.setup_palettes(),this._use_classes=!1,this.bold=!1,this.faint=!1,this.italic=!1,this.underline=!1,this.fg=this.bg=null,this._buffer="",this._url_allowlist={http:1,https:1},this._escape_html=!0,this.boldStyle="font-weight:bold",this.faintStyle="opacity:0.7",this.italicStyle="font-style:italic",this.underlineStyle="text-decoration:underline"}set use_classes(e){this._use_classes=e}get use_classes(){return this._use_classes}set url_allowlist(e){this._url_allowlist=e}get url_allowlist(){return this._url_allowlist}set escape_html(e){this._escape_html=e}get escape_html(){return this._escape_html}set boldStyle(e){this._boldStyle=e}get boldStyle(){return this._boldStyle}set faintStyle(e){this._faintStyle=e}get faintStyle(){return this._faintStyle}set italicStyle(e){this._italicStyle=e}get italicStyle(){return this._italicStyle}set underlineStyle(e){this._underlineStyle=e}get underlineStyle(){return this._underlineStyle}setup_palettes(){this.ansi_colors=[[{rgb:[0,0,0],class_name:"ansi-black"},{rgb:[187,0,0],class_name:"ansi-red"},{rgb:[0,187,0],class_name:"ansi-green"},{rgb:[187,187,0],class_name:"ansi-yellow"},{rgb:[0,0,187],class_name:"ansi-blue"},{rgb:[187,0,187],class_name:"ansi-magenta"},{rgb:[0,187,187],class_name:"ansi-cyan"},{rgb:[255,255,255],class_name:"ansi-white"}],[{rgb:[85,85,85],class_name:"ansi-bright-black"},{rgb:[255,85,85],class_name:"ansi-bright-red"},{rgb:[0,255,0],class_name:"ansi-bright-green"},{rgb:[255,255,85],class_name:"ansi-bright-yellow"},{rgb:[85,85,255],class_name:"ansi-bright-blue"},{rgb:[255,85,255],class_name:"ansi-bright-magenta"},{rgb:[85,255,255],class_name:"ansi-bright-cyan"},{rgb:[255,255,255],class_name:"ansi-bright-white"}]],this.palette_256=[],this.ansi_colors.forEach(i=>{i.forEach(s=>{this.palette_256.push(s)})});let e=[0,95,135,175,215,255];for(let i=0;i<6;++i)for(let s=0;s<6;++s)for(let r=0;r<6;++r){let n={rgb:[e[i],e[s],e[r]],class_name:"truecolor"};this.palette_256.push(n)}let t=8;for(let i=0;i<24;++i,t+=10){let s={rgb:[t,t,t],class_name:"truecolor"};this.palette_256.push(s)}}escape_txt_for_html(e){return this._escape_html?e.replace(/[&<>"']/gm,t=>{if(t==="&")return"&amp;";if(t==="<")return"&lt;";if(t===">")return"&gt;";if(t==='"')return"&quot;";if(t==="'")return"&#x27;"}):e}append_buffer(e){var t=this._buffer+e;this._buffer=t}get_next_packet(){var e={kind:a.EOS,text:"",url:""},t=this._buffer.length;if(t==0)return e;var i=this._buffer.indexOf("\x1B");if(i==-1)return e.kind=a.Text,e.text=this._buffer,this._buffer="",e;if(i>0)return e.kind=a.Text,e.text=this._buffer.slice(0,i),this._buffer=this._buffer.slice(i),e;if(i==0){if(t<3)return e.kind=a.Incomplete,e;var s=this._buffer.charAt(1);if(s!="["&&s!="]"&&s!="(")return e.kind=a.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e;if(s=="["){this._csi_regex||(this._csi_regex=g(d||(d=b([`
                        ^                           # beginning of line
                                                    #
                                                    # First attempt
                        (?:                         # legal sequence
                          \x1B[                      # CSI
                          ([<-?]?)              # private-mode char
                          ([d;]*)                    # any digits or semicolons
                          ([ -/]?               # an intermediate modifier
                          [@-~])                # the command
                        )
                        |                           # alternate (second attempt)
                        (?:                         # illegal sequence
                          \x1B[                      # CSI
                          [ -~]*                # anything legal
                          ([\0-:])              # anything illegal
                        )
                    `],[`
                        ^                           # beginning of line
                                                    #
                                                    # First attempt
                        (?:                         # legal sequence
                          \\x1b\\[                      # CSI
                          ([\\x3c-\\x3f]?)              # private-mode char
                          ([\\d;]*)                    # any digits or semicolons
                          ([\\x20-\\x2f]?               # an intermediate modifier
                          [\\x40-\\x7e])                # the command
                        )
                        |                           # alternate (second attempt)
                        (?:                         # illegal sequence
                          \\x1b\\[                      # CSI
                          [\\x20-\\x7e]*                # anything legal
                          ([\\x00-\\x1f:])              # anything illegal
                        )
                    `]))));let n=this._buffer.match(this._csi_regex);if(n===null)return e.kind=a.Incomplete,e;if(n[4])return e.kind=a.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e;n[1]!=""||n[3]!="m"?e.kind=a.Unknown:e.kind=a.SGR,e.text=n[2];var r=n[0].length;return this._buffer=this._buffer.slice(r),e}else if(s=="]"){if(t<4)return e.kind=a.Incomplete,e;if(this._buffer.charAt(2)!="8"||this._buffer.charAt(3)!=";")return e.kind=a.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e;this._osc_st||(this._osc_st=T(_||(_=b([`
                        (?:                         # legal sequence
                          (\x1B\\)                    # ESC                           |                           # alternate
                          (\x07)                      # BEL (what xterm did)
                        )
                        |                           # alternate (second attempt)
                        (                           # illegal sequence
                          [\0-]                 # anything illegal
                          |                           # alternate
                          [\b-]                 # anything illegal
                          |                           # alternate
                          [-]                 # anything illegal
                        )
                    `],[`
                        (?:                         # legal sequence
                          (\\x1b\\\\)                    # ESC \\
                          |                           # alternate
                          (\\x07)                      # BEL (what xterm did)
                        )
                        |                           # alternate (second attempt)
                        (                           # illegal sequence
                          [\\x00-\\x06]                 # anything illegal
                          |                           # alternate
                          [\\x08-\\x1a]                 # anything illegal
                          |                           # alternate
                          [\\x1c-\\x1f]                 # anything illegal
                        )
                    `])))),this._osc_st.lastIndex=0;{let o=this._osc_st.exec(this._buffer);if(o===null)return e.kind=a.Incomplete,e;if(o[3])return e.kind=a.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e}{let o=this._osc_st.exec(this._buffer);if(o===null)return e.kind=a.Incomplete,e;if(o[3])return e.kind=a.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e}this._osc_regex||(this._osc_regex=g(p||(p=b([`
                        ^                           # beginning of line
                                                    #
                        \x1B]8;                    # OSC Hyperlink
                        [ -:<-~]*       # params (excluding ;)
                        ;                           # end of params
                        ([!-~]{0,512})        # URL capture
                        (?:                         # ST
                          (?:\x1B\\)                  # ESC                           |                           # alternate
                          (?:\x07)                    # BEL (what xterm did)
                        )
                        ([ -~]+)              # TEXT capture
                        \x1B]8;;                   # OSC Hyperlink End
                        (?:                         # ST
                          (?:\x1B\\)                  # ESC                           |                           # alternate
                          (?:\x07)                    # BEL (what xterm did)
                        )
                    `],[`
                        ^                           # beginning of line
                                                    #
                        \\x1b\\]8;                    # OSC Hyperlink
                        [\\x20-\\x3a\\x3c-\\x7e]*       # params (excluding ;)
                        ;                           # end of params
                        ([\\x21-\\x7e]{0,512})        # URL capture
                        (?:                         # ST
                          (?:\\x1b\\\\)                  # ESC \\
                          |                           # alternate
                          (?:\\x07)                    # BEL (what xterm did)
                        )
                        ([\\x20-\\x7e]+)              # TEXT capture
                        \\x1b\\]8;;                   # OSC Hyperlink End
                        (?:                         # ST
                          (?:\\x1b\\\\)                  # ESC \\
                          |                           # alternate
                          (?:\\x07)                    # BEL (what xterm did)
                        )
                    `]))));let n=this._buffer.match(this._osc_regex);if(n===null)return e.kind=a.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e;e.kind=a.OSCURL,e.url=n[1],e.text=n[2];var r=n[0].length;return this._buffer=this._buffer.slice(r),e}else if(s=="(")return e.kind=a.Unknown,this._buffer=this._buffer.slice(3),e}}ansi_to_html(e){this.append_buffer(e);for(var t=[];;){var i=this.get_next_packet();if(i.kind==a.EOS||i.kind==a.Incomplete)break;i.kind==a.ESC||i.kind==a.Unknown||(i.kind==a.Text?t.push(this.transform_to_html(this.with_state(i))):i.kind==a.SGR?this.process_ansi(i):i.kind==a.OSCURL&&t.push(this.process_hyperlink(i)))}return t.join("")}with_state(e){return{bold:this.bold,faint:this.faint,italic:this.italic,underline:this.underline,fg:this.fg,bg:this.bg,text:e.text}}process_ansi(e){let t=e.text.split(";");for(;t.length>0;){let i=t.shift(),s=parseInt(i,10);if(isNaN(s)||s===0)this.fg=null,this.bg=null,this.bold=!1,this.faint=!1,this.italic=!1,this.underline=!1;else if(s===1)this.bold=!0;else if(s===2)this.faint=!0;else if(s===3)this.italic=!0;else if(s===4)this.underline=!0;else if(s===21)this.bold=!1;else if(s===22)this.faint=!1,this.bold=!1;else if(s===23)this.italic=!1;else if(s===24)this.underline=!1;else if(s===39)this.fg=null;else if(s===49)this.bg=null;else if(s>=30&&s<38)this.fg=this.ansi_colors[0][s-30];else if(s>=40&&s<48)this.bg=this.ansi_colors[0][s-40];else if(s>=90&&s<98)this.fg=this.ansi_colors[1][s-90];else if(s>=100&&s<108)this.bg=this.ansi_colors[1][s-100];else if((s===38||s===48)&&t.length>0){let r=s===38,n=t.shift();if(n==="5"&&t.length>0){let c=parseInt(t.shift(),10);c>=0&&c<=255&&(r?this.fg=this.palette_256[c]:this.bg=this.palette_256[c])}if(n==="2"&&t.length>2){let c=parseInt(t.shift(),10),o=parseInt(t.shift(),10),h=parseInt(t.shift(),10);if(c>=0&&c<=255&&o>=0&&o<=255&&h>=0&&h<=255){let f={rgb:[c,o,h],class_name:"truecolor"};r?this.fg=f:this.bg=f}}}}}transform_to_html(e){let t=e.text;if(t.length===0||(t=this.escape_txt_for_html(t),!e.bold&&!e.italic&&!e.faint&&!e.underline&&e.fg===null&&e.bg===null))return t;let i=[],s=[],r=e.fg,n=e.bg;e.bold&&i.push(this._boldStyle),e.faint&&i.push(this._faintStyle),e.italic&&i.push(this._italicStyle),e.underline&&i.push(this._underlineStyle),this._use_classes?(r&&(r.class_name!=="truecolor"?s.push(`${r.class_name}-fg`):i.push(`color:rgb(${r.rgb.join(",")})`)),n&&(n.class_name!=="truecolor"?s.push(`${n.class_name}-bg`):i.push(`background-color:rgb(${n.rgb.join(",")})`))):(r&&i.push(`color:rgb(${r.rgb.join(",")})`),n&&i.push(`background-color:rgb(${n.rgb})`));let c="",o="";return s.length&&(c=` class="${s.join(" ")}"`),i.length&&(o=` style="${i.join(";")}"`),`<span${o}${c}>${t}</span>`}process_hyperlink(e){let t=e.url.split(":");return t.length<1||!this._url_allowlist[t[0]]?"":`<a href="${this.escape_txt_for_html(e.url)}">${this.escape_txt_for_html(e.text)}</a>`}}function g(l,...e){let t=l.raw[0],i=/^\s+|\s+\n|\s*#[\s\S]*?\n|\n/gm,s=t.replace(i,"");return new RegExp(s)}function T(l,...e){let t=l.raw[0],i=/^\s+|\s+\n|\s*#[\s\S]*?\n|\n/gm,s=t.replace(i,"");return new RegExp(s,"g")}var d,_,p,v=Object.defineProperty,k=Object.getOwnPropertyDescriptor,m=(l,e,t,i)=>{for(var s=i>1?void 0:i?k(e,t):e,r=l.length-1,n;r>=0;r--)(n=l[r])&&(s=(i?n(e,t,s):n(s))||s);return i&&s&&v(e,t,s),s};let u=class extends y{constructor(){super(),this.obfuscators={},this.currId=0,this.lastProcessedText="",this.ansiUp=new C,this.styleMap={"§0":"color:#000000","§1":"color:#0000AA","§2":"color:#00AA00","§3":"color:#00AAAA","§4":"color:#AA0000","§5":"color:#AA00AA","§6":"color:#FFAA00","§7":"color:#AAAAAA","§8":"color:#555555","§9":"color:#5555FF","§a":"color:#55FF55","§b":"color:#55FFFF","§c":"color:#FF5555","§d":"color:#FF55FF","§e":"color:#FFFF55","§f":"color:#FFFFFF","§l":"font-weight:bold","§m":"text-decoration:line-through","§n":"text-decoration:underline","§o":"font-style:italic"}}render(){return E`
            <div class="console-layout">
                <div class="console" id="console-text"></div>
            </div>
        `}obfuscate(l,e){const t=()=>String.fromCharCode(Math.floor(Math.random()*94)+33),i=r=>{const n=document.createElement("div");n.innerHTML=r;function c(o){if(o.nodeType===Node.TEXT_NODE&&o.nodeValue){let h=o.nodeValue;for(let f=0;f<h.length;f++)h[f]!==" "&&Math.random()<.7&&(h=h.substring(0,f)+t()+h.substring(f+1));o.nodeValue=h}else o.nodeType===Node.ELEMENT_NODE&&o.childNodes.forEach(c)}return c(n),n.innerHTML},s=(r,n)=>{const c=document.createElement("div");if(c.innerHTML=n,!(c.textContent?.length||0))return;this.obfuscators[this.currId]||(this.obfuscators[this.currId]=[]);const h=window.setInterval(()=>{r.innerHTML=i(r.innerHTML)},70);this.obfuscators[this.currId].push(h)};l.innerHTML=e,s(l,e)}applyCode(l,e){const t=document.createElement("span");let i=!1;return e.forEach(s=>{this.styleMap[s]&&(t.style.cssText+=this.styleMap[s]+";"),s==="§k"&&(this.obfuscate(t,l),i=!0)}),i||(t.innerHTML=l),t}parseLine(l){const e=document.createDocumentFragment();let t=[],i=l;const s=/(§[0-9a-fk-or])|([^§]+)/g;let r;for(;(r=s.exec(i))!==null;)if(r[1]){const n=r[1];n==="§r"?t=[]:this.styleMap[n]?(!["§k","§l","§m","§n","§o","§r"].includes(n)&&(t=t.filter(o=>["§k","§l","§m","§n","§o"].includes(o))),(n==="§l"||n==="§m"||n==="§n"||n==="§o")&&(t=t.filter(o=>o!==n)),t.includes(n)||t.push(n)):n==="§k"&&(t.includes(n)||t.push(n))}else if(r[2]){let n=r[2];if(n=n.replace(/\x00/g,""),n){const c=this.applyCode(n,[...t]);e.appendChild(c)}}if(e.childNodes.length===0&&i.replace(/\x00/g,"")){const n=document.createElement("span");n.innerHTML=i.replace(/\x00/g,""),e.appendChild(n)}return this.currId++,e}clearObfuscators(l){l!==void 0&&this.obfuscators[l]?(this.obfuscators[l].forEach(e=>clearInterval(e)),delete this.obfuscators[l]):(Object.keys(this.obfuscators).forEach(e=>{const t=parseInt(e,10);this.obfuscators[t]&&this.obfuscators[t].forEach(i=>clearInterval(i))}),this.obfuscators={}),l===void 0&&(this.currId=0)}refreshlogs(l){if(!this.consoleTextElem){this.updateComplete.then(()=>this.refreshlogs(l));return}if(l===this.lastProcessedText)return;this.lastProcessedText=l,this.clearObfuscators(),this.consoleTextElem.innerHTML="";const e=l.split(/\r?\n/),t=document.createDocumentFragment();e.forEach(i=>{const s=this.ansiUp.ansi_to_html(i);if(i.trim()===""){const r=document.createElement("br");t.appendChild(r)}else{const r=this.parseLine(s),n=document.createElement("div");n.appendChild(r),t.appendChild(n)}}),this.consoleTextElem.appendChild(t),requestAnimationFrame(()=>{if(!this.consoleTextElem)return;const i=this.consoleTextElem.scrollHeight,s=this.consoleTextElem.clientHeight,r=this.consoleTextElem.scrollTop;i-s-r<200&&(this.consoleTextElem.scrollTop=i)})}disconnectedCallback(){super.disconnectedCallback(),this.clearObfuscators()}};u.styles=x`
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
            color: var(--text-primary, #eee); /* Color base del texto */
            padding: 8px;
            box-sizing: border-box;
            scroll-behavior: smooth;
            white-space: pre-wrap; /* Importante para que <pre> y saltos de línea funcionen bien */
            word-break: break-word; /* Para que líneas largas no rompan el layout */
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

        /* Estilos adicionales si ansi_up usa clases (opcional) */
        .ansi-black-fg { color: #000000; }
        .ansi-red-fg { color: #AA0000; }
        .ansi-green-fg { color: #00AA00; }
        .ansi-yellow-fg { color: #FFAA00; } /* O #AAAA00 si es amarillo oscuro */
        .ansi-blue-fg { color: #0000AA; }
        .ansi-magenta-fg { color: #AA00AA; }
        .ansi-cyan-fg { color: #00AAAA; }
        .ansi-white-fg { color: #AAAAAA; }
        /* ... y para colores brillantes y fondos si es necesario */
        .ansi-bright-yellow-fg { color: #FFFF55; } /* Ajusta este color según el amarillo de tu log */
    `;m([w("#console-text")],u.prototype,"consoleTextElem",2);u=m([S("game-console")],u);export{u as G};
