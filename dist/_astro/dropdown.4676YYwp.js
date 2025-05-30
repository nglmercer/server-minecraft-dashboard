const a=s=>`
<div class="${s.class?.container||"dropdown-item"}" ${s.id?`id="${s.id}"`:""}>
  <span class="material-symbols-rounded">${s.icon}</span>
  <span class="${s.class?.font||"default-font"}">${s.text||s.label}</span>
</div>`;function i(s,n,t){if(console.log("Setting popup options:",n,s),s&&"setOptions"in s)s.setOptions(n),s.show(t);else{const e=window.solidComponents?.serverOptions;e&&(e.setOptions(n),e.show(t))}}export{a as o,i as s};
