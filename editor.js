(()=>{
'use strict';
const page=location.pathname.split('/').pop()||'index.html', storage='catalina-editor-v1';
const editing=new URLSearchParams(location.search).has('edit');
const candidates=[...document.querySelectorAll('main h2, main .about-title, main .project-overlay-title, main .project-meta strong, main .detail-role, main .about-copy p, main .eyebrow, main .gallery img, main .project-image img, main .hero, main .section-banner, main>section:first-child')];
const targets=[];let counters={};
for(const el of candidates){let type=el.tagName==='IMG'?'photo':(el.classList.contains('hero')||el.classList.contains('section-banner')||(el.tagName==='SECTION'&&el===document.querySelector('main>section:first-child'))?'background':'text');
 let key=type+'-'+(++counters[type]); el.dataset.editKey=key;targets.push({el,key,type});}
let state={};try{state=JSON.parse(localStorage.getItem(storage)||'{}')}catch(e){}
const selector=(p,k)=>`body[data-editor-page="${p}"] [data-edit-key="${k}"]`;
document.body.dataset.editorPage=page;
const style=document.createElement('style');style.id='editor-overrides';document.head.append(style);
function rule(type,v){let a=[];
if(type==='photo'){
 a.push('object-position:'+v.x+'% '+v.y+'% !important');
 a.push('transform:scale('+(v.zoom/100)+') !important');
 a.push('transform-origin:'+v.x+'% '+v.y+'% !important');
}else if(type==='background'){
 a.push('background-position:'+v.x+'% '+v.y+'% !important');
 a.push('background-size:'+v.zoom+'% auto !important');
}else{
 a.push('font-size:'+v.size+'px !important');
 a.push('transform:translate('+v.x+'px,'+v.y+'px) !important');
 a.push('position:relative !important');
}
return a.join(';')+';';}
function render(){let out='';for(const [p,items] of Object.entries(state))for(const [k,v] of Object.entries(items)){if(v&&v.type)out+=selector(p,k)+'{'+rule(v.type,v)+'}\n';}style.textContent=out;}
render();
document.querySelectorAll('a[href]').forEach(link => {
  const href = link.getAttribute('href');

  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return;
  }

  const url = new URL(href, location.href);

  if (url.origin === location.origin && url.pathname.endsWith('.html')) {
    url.searchParams.set('edit', '1');
    link.href = url.href;
  }
});
const css=document.createElement('style');css.textContent=`
body.editor-active [data-edit-key]{cursor:crosshair}body.editor-active [data-edit-key]:hover{outline:2px dashed #ff9b52;outline-offset:3px}body.editor-active .editor-selected{outline:3px solid #ff9b52!important;outline-offset:3px}#c-editor{position:fixed;right:18px;bottom:18px;width:min(340px,calc(100vw - 36px));z-index:999999;background:#161616;color:#f5f5f5;border:1px solid #595959;border-radius:12px;padding:18px;box-shadow:0 12px 50px #000b;font:13px Arial,sans-serif}#c-editor *{box-sizing:border-box}#c-editor h3{font:20px Georgia,serif;margin:0 0 7px}#c-editor p{line-height:1.5;color:#bbb;margin:5px 0 13px}#c-editor label{display:block;margin:13px 0 5px;color:#eee}#c-editor input[type=range]{width:100%;accent-color:#e88b49}#c-editor .editor-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}#c-editor button,#c-editor a{background:#292929;color:white;border:1px solid #555;padding:9px 11px;border-radius:5px;cursor:pointer;font:12px Arial,sans-serif;text-decoration:none}#c-editor button.primary{background:#dd8243;border-color:#dd8243;color:#111;font-weight:bold}#c-editor small{color:#aaa}#c-editor .close{float:right}#c-editor .control{display:none}#c-editor .control.active{display:block}body.editor-active .project-card{pointer-events:auto}body.editor-active .project-card [data-edit-key]{pointer-events:auto}
`;document.head.append(css);document.body.classList.add('editor-active');
const panel=document.createElement('aside');panel.id='c-editor';panel.innerHTML=`<button class="close" id="editor-close">Salir</button><h3>Editor visual</h3><p id="editor-desc">Haz clic en una foto o texto para seleccionarlo.</p><div class="control" id="editor-controls"><label id="lab-x">Horizontal <span id="val-x"></span></label><input id="inp-x" type="range"><label id="lab-y">Vertical <span id="val-y"></span></label><input id="inp-y" type="range"><label id="lab-z">Zoom <span id="val-z"></span></label><input id="inp-z" type="range"><div class="editor-actions"><button id="editor-reset">Restablecer elemento</button></div></div><div class="editor-actions"><button class="primary" id="editor-export">Exportar ajustes CSS</button><button id="editor-clear">Borrar todos los ajustes</button></div><p><small>Se guarda automáticamente en este navegador. Para publicar, sube el CSS exportado a la raíz de GitHub con el nombre overrides.css.</small></p>`;
document.body.append(panel);
let selected=null, values=null;
const $=id=>document.getElementById(id);
function defaults(type,el){if(type==='text'){let s=parseFloat(getComputedStyle(el).fontSize)||20;return {type,x:0,y:0,size:Math.round(s)};}return {type,x:50,y:50,zoom:100};}
function setSliders(){let text=selected.type==='text';$('lab-x').firstChild.textContent=text?'Mover horizontal ':'Encuadre horizontal ';
$('lab-y').firstChild.textContent=text?'Mover vertical ':'Encuadre vertical ';
$('lab-z').firstChild.textContent=text?'Tamaño del texto ':'Zoom ';
for(const [id,min,max,val] of [['x',text?-300:0,text?300:100,values.x],['y',text?-300:0,text?300:100,values.y],['z',text?12:100,text?180:200,text?values.size:values.zoom]]){
 const inp=$('inp-'+id);inp.min=min;inp.max=max;inp.step=1;inp.value=val;$('val-'+id).textContent=val+(text?'px':'%');
}}
function select(t){if(selected)selected.el.classList.remove('editor-selected');selected=t;selected.el.classList.add('editor-selected');values=structuredClone(state[page]?.[t.key]||defaults(t.type,t.el));$('editor-controls').classList.add('active');$('editor-desc').textContent=t.type==='text'?'Texto seleccionado: mueve o cambia el tamaño.':'Imagen seleccionada: ajusta el encuadre y el zoom.';setSliders();}
document.addEventListener('click', e => {
  if (e.target.closest('#c-editor')) return;

  const element = e.target.closest('[data-edit-key]');
  if (!element) return;

  const target = targets.find(t => t.el === element);
  if (!target) return;

  e.preventDefault();
  e.stopPropagation();

  select(target);
}, true);
for(const id of ['x','y','z'])$('inp-'+id).addEventListener('input',()=>{if(!selected)return;const val=Number($('inp-'+id).value);values[id==='z'?(selected.type==='text'?'size':'zoom'):id]=val;state[page]??={};state[page][selected.key]=structuredClone(values);localStorage.setItem(storage,JSON.stringify(state));render();$('val-'+id).textContent=val+(selected.type==='text'?'px':'%');});
$('editor-reset').onclick=()=>{if(!selected)return;delete state[page]?.[selected.key];localStorage.setItem(storage,JSON.stringify(state));render();select(selected)};
$('editor-clear').onclick=()=>{if(!confirm('¿Borrar todos los ajustes guardados en este navegador?'))return;state={};localStorage.removeItem(storage);render();if(selected)select(selected)};
$('editor-export').onclick=()=>{let rules='/* Catalina Arribas — ajustes visuales exportados */\n';for(const [p,items] of Object.entries(state))for(const [k,v] of Object.entries(items)){if(v&&v.type)rules+=selector(p,k)+'{'+rule(v.type,v)+'}\n';}const blob=new Blob([rules],{type:'text/css'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='overrides.css';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('editor-close').onclick=()=>{const u=new URL(location.href);u.searchParams.delete('edit');location.href=u.href};
})();
