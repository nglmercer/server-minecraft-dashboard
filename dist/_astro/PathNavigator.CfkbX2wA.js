import{d as T,l as P,c as F,o as R,n as y,g as p,i as g,b,t as d,f as z,e as A,r as x,k as _,F as W}from"./web.DYW8A-n5.js";import{n as u,p as n,R as h}from"./globalSignals.xjL0ZJXr.js";var C=d("<button class=up-button>Subir Nivel (..)"),M=d(`<div class=path-navigator><div class=breadcrumb-bar></div><div class=controls></div><style>
        .path-navigator {
          font-family: sans-serif;
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .breadcrumb-bar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }
        .breadcrumb-segment {
          padding: 4px 6px;
          border-radius: 3px;
        }
        .breadcrumb-segment.is-link {
          color: #007bff;
          cursor: pointer;
          text-decoration: none;
        }
        .breadcrumb-segment.is-link:hover {
          background-color: #e9ecef;
          text-decoration: underline;
        }
        .breadcrumb-separator {
          margin: 0 4px;
          color: #6c757d;
        }
        .controls .up-button {
          padding: 6px 10px;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-size: 0.9em;
        }
        .controls .up-button:hover {
          background-color: #5a6268;
        }W
      `),O=d("<span class=breadcrumb-segment>"),U=d("<span class=breadcrumb-separator> / ");const $=(typeof window<"u"?window.selectedServer:"")||"/",I=E=>{const l=P(()=>{let e=E.basePath;(!e||e===h)&&(e=$);const t=u(e);if(t===h&&e!==h){const a=u($);return a===h&&a!==h&&console.error("Critical: DEFAULT_SERVER_NAME_IF_EMPTY results in ROOT_PATH. Check configuration."),a}return t}),S=()=>{const e=u(n.value),t=l(),a=!e.startsWith(t)||e.length<t.length?t:e;return n.value!==a&&(n.value=a),a},[c,w]=F(S()),f=P(()=>{const e=c(),t=l(),a=[],r=t.split("/").filter(o=>o.length>0),s=r.length>0?r[r.length-1]:"Base";if(a.push({name:s,path:t}),e===t)return a;let i="";e.startsWith(t)&&e.length>t.length&&(i=e.substring(t.length+1));const m=i.split("/").filter(o=>o.length>0);if(m.length>0){let o=t;for(const v of m)o=`${o}/${v}`,(o.includes("//")||o.includes("\\"))&&(o=u(o)),a.push({name:v,path:o})}return a});R(()=>{const e=n.subscribe(t=>{const a=u(t),r=l();if(t!==a&&n.value===t){n.value=a;return}const s=a.startsWith(r)&&a.length>=r.length?a:r;s!==a&&n.value!==s&&(n.value=s),c()!==s&&w(s)});z(e)}),y(()=>{const e=l(),t=c();(!t.startsWith(e)||t.length<e.length)&&n.value!==e&&(n.value=e)});const k=()=>{const e=c(),t=l();if(e===t)return;const a=e.split("/").filter(i=>i.length>0);a.pop();let r=`${h}${a.join("/")}`;r=u(r);const s=!r.startsWith(t)||r.length<t.length?t:r;n.value!==s&&(n.value=s)},N=e=>{const t=u(e),a=l(),r=t.startsWith(a)&&t.length>=a.length?t:a;n.value!==r&&(n.value=r)};return(()=>{var e=p(M),t=e.firstChild,a=t.nextSibling;return g(t,b(W,{get each(){return f()},children:(r,s)=>[(()=>{var i=p(O);return i.$$click=()=>r.path!==c()&&N(r.path),g(i,()=>r.name),A(()=>i.classList.toggle("is-link",r.path!==c())),x(),i})(),b(_,{get when(){return s()<f().length-1},get children(){return p(U)}})]})),g(a,b(_,{get when(){return c()!==l()},get children(){var r=p(C);return r.$$click=k,x(),r}})),e})()};T(["click"]);export{I as default};
