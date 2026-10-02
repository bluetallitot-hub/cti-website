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
