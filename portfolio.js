(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let state,active=null,filter='all';const editing=false;
const project=id=>state.projects.find(p=>p.id===id);
const toast=message=>{const e=$('#toast');($$('dialog[open]').at(-1)||document.body).append(e);e.textContent=message;e.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.hidden=true,6000)};
function media(im,label,attrs='',extra=''){return `<button class="media ${extra}" ${attrs} aria-label="${esc(label)}" style="--ratio:${im?.crop?.ratio==='original'?(im?.naturalRatio||1.5):(Number(im?.crop?.ratio)||1.5)}">${im?.src?`<img src="${esc(im.src)}" alt="${esc(im.caption||label)}" loading="lazy">`:`<span class="placeholder"><span>${esc(label)}</span><span class="image-type">Image placeholder</span></span>`}${editing?'<span class="edit-label"><span>Thêm hoặc thay ảnh</span></span>':''}</button>`;}
function render(){
 const shown=state.projects.filter(p=>filter==='all'||p.category===filter);$('#project-count').textContent='('+String(shown.length).padStart(2,'0')+')';
 $('#project-grid').innerHTML=shown.map(p=>`<article class="project ${p===state.projects[0]?'featured':''}" data-category="${p.category}">${media(p.images[0],p.title,`data-open="${p.id}"`)}<div class="project-meta"><span class="project-index">${p.number}</span><h3 class="project-title"><button data-open="${p.id}">${esc(p.title)}</button></h3><p class="project-type"><span>${esc(p.type)}</span>${p===state.projects[0]?'<span>'+esc(p.location)+'</span>':''}</p></div>${editing?`<div class="project-tools"><button data-open="${p.id}">Quản lý ảnh</button><button data-text="${p.id}">Sửa nội dung</button></div>`:''}</article>`).join('');
 $('.hero-copy p').textContent=state.intro;$$('.bio').forEach((el,i)=>el.textContent=state.bio[i]||'');
 const portrait=$('.portrait');portrait.innerHTML=state.portrait.src?`<img src="${esc(state.portrait.src)}" alt="Portrait">`:'<span class="placeholder"><span>Portrait</span><span class="image-type">Image placeholder</span></span>';portrait.disabled=!editing;portrait.dataset.replace='portrait';
 if(active)renderDetail();
}
function renderDetail(){const p=project(active);if(!p)return;const next=state.projects[(state.projects.indexOf(p)+1)%state.projects.length];$('#detail-kicker').textContent='Selected project / '+p.number;
 $('#dialog-body').innerHTML=`<div class="detail-top"><div><h2 class="detail-title" id="detail-title">${esc(p.title)}</h2><p class="detail-summary">${esc(p.summary)}</p></div><dl class="detail-facts">${p.facts.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>${p.body?`<div class="detail-copy">${esc(p.body)}</div>`:''}${editing?`<div class="project-tools" style="margin-bottom:30px"><button class="solid" data-add="${p.id}">+ Thêm ảnh</button><button data-text="${p.id}">Sửa nội dung dự án</button><button data-save>Lưu lên web</button></div>`:''}<div class="gallery">${p.images.map((im,i)=>`<figure>${media(im,im.caption||p.title,editing?`data-replace="${im.id}"`:'disabled')}${im.caption?`<figcaption>${esc(im.caption)}</figcaption>`:''}${editing?`<div class="gallery-tools"><button data-replace="${im.id}">Thay ảnh</button><button data-crop="${im.id}" ${!im.src?'disabled':''}>Cắt ảnh</button><button data-caption="${im.id}">Chú thích</button><button data-cover="${im.id}" ${i===0?'disabled':''}>Làm ảnh bìa</button><button data-move="${im.id}" data-direction="-1" ${i===0?'disabled':''} aria-label="Đưa ảnh lên trước">↑</button><button data-move="${im.id}" data-direction="1" ${i===p.images.length-1?'disabled':''} aria-label="Đưa ảnh xuống sau">↓</button><button data-remove="${im.id}" ${p.images.length===1?'disabled':''}>Xóa</button></div>`:''}</figure>`).join('')}</div><div class="detail-bottom"><button data-close>Back to projects</button><button data-open="${next.id}">Next project →</button></div>`;
}
function openProject(id){if(!project(id))return;active=id;renderDetail();if(!$('#project-dialog').open)$('#project-dialog').showModal();document.body.classList.add('dialog-open');$('#project-dialog').scrollTop=0;}
function closeProject(){active=null;$('#project-dialog').close();document.body.classList.remove('dialog-open');history.replaceState(null,'','#work');}
function route(){if(location.hash.startsWith('#project/'))openProject(location.hash.slice(9));}

$('#dialog-close').addEventListener('click',closeProject);
$('#project-dialog').addEventListener('cancel',e=>{e.preventDefault();closeProject()});
window.addEventListener('hashchange',route);
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(state)render()}));
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;if(d.dismiss){$('#'+d.dismiss).close();return;}if(d.open){history.replaceState(null,'','#project/'+d.open);openProject(d.open);return;}if('close'in d)closeProject();});
$('#share-site').addEventListener('click',()=>{$('#share-url').value=location.origin+(active?'/#project/'+active:'/');$('#share-dialog').showModal()});$('#copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#share-url').value);toast('Đã sao chép đường dẫn.')}catch{$('#share-url').select();toast('Chọn Sao chép để lấy đường dẫn.')}});

async function start(){try{const r=await fetch('portfolio.json');if(!r.ok)throw Error('Không tải được nội dung portfolio.');state=await r.json();render();route();}catch(e){$('#project-grid').innerHTML='<div class="load-error">'+esc(e.message)+' <button onclick="location.reload()">Thử lại</button></div>';}}
start();
})();
