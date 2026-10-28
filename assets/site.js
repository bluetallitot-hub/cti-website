
// CTI theme: the original palette remains untouched unless a published custom scheme exists.
(async function(){
 try{
  const response=await fetch(new URL('../content/site-colors.json',document.querySelector('script[src*="assets/site.js"]')?.src||document.baseURI),{cache:'no-cache'});
  if(!response.ok)return;
  const data=await response.json(),c=data.colors||{};
  const original={primary:'#244642',background:'#fffdf8',accent:'#a78042'};
  if(!Object.keys(original).every(k=>typeof c[k]==='string'&&/^#[0-9a-f]{6}$/i.test(c[k])))return;
  if(Object.keys(original).every(k=>c[k].toLowerCase()===original[k]))return;
  const root=document.documentElement.style;
  root.setProperty('--deep',c.primary);
  root.setProperty('--site-background',c.background);
  root.setProperty('--gold',c.accent);
  root.setProperty('--site-background-alt',`color-mix(in srgb, ${c.background} 92%, ${c.primary})`);
  root.setProperty('--site-card-background',`color-mix(in srgb, ${c.background} 90%, white)`);
  root.setProperty('--site-header-background',`color-mix(in srgb, ${c.background} 95%, transparent)`);
  root.setProperty('--site-footer-background',`color-mix(in srgb, ${c.primary} 88%, black)`);
  root.setProperty('--line',`color-mix(in srgb, ${c.primary} 18%, ${c.background})`);
  root.setProperty('--site-archive-thumbnail-background',`color-mix(in srgb, ${c.background} 88%, ${c.accent})`);
  root.setProperty('--site-gallery-thumbnail-background',`color-mix(in srgb, ${c.background} 92%, ${c.primary})`);
  root.setProperty('--site-gallery-image-background',`color-mix(in srgb, ${c.background} 94%, ${c.primary})`);
  root.setProperty('--site-image-placeholder-background',`color-mix(in srgb, ${c.background} 84%, ${c.primary})`);
  root.setProperty('--site-album-placeholder-background',`color-mix(in srgb, ${c.background} 76%, ${c.primary})`);
  root.setProperty('--site-embed-placeholder-background',`color-mix(in srgb, ${c.background} 90%, ${c.accent})`);
  root.setProperty('--site-rotated-photo-background',`var(--site-image-placeholder-background)`);
  root.setProperty('--site-history-connector-background',`color-mix(in srgb, ${c.primary} 22%, transparent)`);
  root.setProperty('--photo-placeholder-overlay',`linear-gradient(180deg,transparent 30%,color-mix(in srgb, ${c.background} 65%,transparent))`);
  root.setProperty('--site-notice-background',`color-mix(in srgb, ${c.background} 90%, ${c.accent})`);
  root.setProperty('--photo-placeholder-gradient',`linear-gradient(135deg,color-mix(in srgb, ${c.background} 78%, ${c.primary}),color-mix(in srgb, ${c.background} 85%, ${c.accent}))`);
  root.setProperty('--leader-photo-placeholder-gradient','var(--photo-placeholder-gradient)');
  const style=document.createElement('style');
  style.textContent='.hero{background:linear-gradient(120deg,var(--deep),color-mix(in srgb,var(--deep) 78%,black))}';
  document.head.appendChild(style);
 }catch(e){console.warn('CTI theme unavailable; using original colors',e)}
})();

// Use the CTI menorah logo as the browser tab and bookmark icon on every page.
(function(){
  const icon=document.querySelector('link[rel="icon"]')||document.createElement('link');
  icon.rel='icon';
  icon.type='image/png';
  icon.href=new URL('images/branding/CTI-logo-web.png',document.querySelector('script[src*="assets/site.js"]')?.src||document.baseURI).href;
  if(!icon.parentNode)document.head.appendChild(icon);
})();

const btn=document.querySelector('.menu');
const nav=document.querySelector('.links');
if(btn&&nav){btn.addEventListener('click',()=>{const open=nav.classList.toggle('open');btn.setAttribute('aria-expanded',open);});}

// One canonical header navigation on every CTI page.
// Page HTML may be older; JavaScript normalizes it so clicking between sections never changes headings or spacing.
const canonicalNav=[
  ['about.html','About'],
  ['history.html','Our History'],
  ['leadership.html','Leadership Team'],
  ['services.html',"What's Happening"],
  ['meldados.html','Meldathos'],
  ['torah.html',"Rabbi's Corner"],
  ['resources.html','Congregational Resources'],
  ['give.html','Give','givebtn']
];
document.querySelectorAll('nav.links').forEach(nav=>{
  nav.replaceChildren(...canonicalNav.map(([href,label,cls])=>{
    const a=document.createElement('a');
    a.href=href; a.textContent=label;
    if(cls) a.className=cls;
    return a;
  }));
});

document.querySelectorAll('.footer-grid').forEach(footer=>{
  const cols=footer.querySelectorAll(':scope > div');
  const target=cols[1]||cols[0];
  if(target&&!target.querySelector('a[href="gallery.html"]')){
    const a=document.createElement('a');a.href='gallery.html';a.textContent='Gallery';target.appendChild(a);
  }
  if(target&&!target.querySelector('a[href="press.html"]')){
    const a=document.createElement('a');a.href='press.html';a.textContent='Press & Archives';target.appendChild(a);
  }
  const connect=cols[2]||target;
  if(connect&&!connect.querySelector('a[href="rabbi-bio.html#zoom-torah-class"]')){
    const a=document.createElement('a');a.href='rabbi-bio.html#zoom-torah-class';a.textContent='Weekly Zoom Torah Class';connect.appendChild(a);
  }
});


// Canonical archive/gallery interaction behavior.
// Any image wrapped by .gallery-image-link or .archive-image-link opens full-screen in-page.
// Titles/captions remain ordinary links to their related article/archive/history page.
(function(){
  const selectors='.gallery-image-link, .archive-image-link';
  const links=[...document.querySelectorAll(selectors)];
  if(!links.length) return;
  let box=document.getElementById('cti-image-lightbox');
  if(!box){
    box=document.createElement('div');
    box.id='cti-image-lightbox';
    box.className='gallery-lightbox';
    box.hidden=true;
    box.setAttribute('role','dialog');
    box.setAttribute('aria-modal','true');
    box.setAttribute('aria-label','Full-size image');
    box.innerHTML='<button class="gallery-lightbox-close" type="button" aria-label="Close full-size image">×</button><img alt="">';
    document.body.appendChild(box);
  }
  const full=box.querySelector('img');
  const close=()=>{box.hidden=true;full.removeAttribute('src');document.body.style.overflow='';};
  links.forEach(a=>{
    a.removeAttribute('target');
    a.addEventListener('click',e=>{
      e.preventDefault();
      full.src=a.href;
      full.alt=(a.querySelector('img')||{}).alt||'Full-size image';
      box.hidden=false;
      document.body.style.overflow='hidden';
    });
  });
  box.querySelector('button').addEventListener('click',close);
  box.addEventListener('click',e=>{if(e.target===box) close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!box.hidden) close();});
})();
