const t=s=>`
<div class="${s.class?.container||"dropdown-item"}" ${s.id?`id="${s.id}"`:""}>
  <span class="material-symbols-rounded">${s.icon}</span>
  <span class="${s.class?.font||"default-font"}">${s.text||s.label}</span>
</div>`;function i(s,a,e){if(s&&"setOptions"in s)s.setOptions(a),s.show(e);else{const n=window.solidComponents?.serverOptions;n&&(n.setOptions(a),n.show(e))}}export{t as o,i as s};
