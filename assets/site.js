const btn=document.querySelector('.menu');
const nav=document.querySelector('.links');
if(btn&&nav){btn.addEventListener('click',()=>{const open=nav.classList.toggle('open');btn.setAttribute('aria-expanded',open);});}

// One canonical header navigation on every CTI page.
// Page HTML may be older; JavaScript normalizes it so clicking between sections never changes headings or spacing.
const canonicalNav=[
  ['about.html','About'],
  ['leadership.html','Leadership Team'],
  ['services.html','Services'],
  ['torah.html','D’var Torah'],
  ['resources.html','Resources'],
  ['newsletter.html','Newsletter'],
  ['gallery.html','Gallery'],
  ['press.html','Press & Archives'],
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
