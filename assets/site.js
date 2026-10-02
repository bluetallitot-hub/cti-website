const btn=document.querySelector('.menu');
const nav=document.querySelector('.links');
if(btn&&nav){btn.addEventListener('click',()=>{const open=nav.classList.toggle('open');btn.setAttribute('aria-expanded',open);});}


// Canonicalize the shared navigation on every page.
document.querySelectorAll('nav.links').forEach(nav=>{
  const oldRabbi=nav.querySelector('a[href="rabbi.html"]');
  if(oldRabbi){oldRabbi.href='leadership.html';oldRabbi.textContent='Leadership Team';}
});

// Keep Gallery available across the canonical site without duplicating markup in every page.
document.querySelectorAll('nav.links').forEach(nav=>{
  if(!nav.querySelector('a[href="gallery.html"]')){
    const gallery=document.createElement('a');
    gallery.href='gallery.html';
    gallery.textContent='Gallery';
    const give=nav.querySelector('.givebtn');
    if(give) nav.insertBefore(gallery,give); else nav.appendChild(gallery);
  }
});
document.querySelectorAll('.footer-grid').forEach(footer=>{
  if(!footer.querySelector('a[href="gallery.html"]')){
    const cols=footer.querySelectorAll('div');
    const target=cols[1]||cols[0];
    if(target){const a=document.createElement('a');a.href='gallery.html';a.textContent='Gallery';target.appendChild(a);}
  }
});

// Keep Press & Archives available across the canonical site.
document.querySelectorAll('nav.links').forEach(nav=>{
  if(!nav.querySelector('a[href="press.html"]')){
    const press=document.createElement('a'); press.href='press.html'; press.textContent='Press & Archives';
    const give=nav.querySelector('.givebtn'); if(give) nav.insertBefore(press,give); else nav.appendChild(press);
  }
});
document.querySelectorAll('.footer-grid').forEach(footer=>{
  if(!footer.querySelector('a[href="press.html"]')){
    const cols=footer.querySelectorAll('div'); const target=cols[1]||cols[0];
    if(target){const a=document.createElement('a');a.href='press.html';a.textContent='Press & Archives';target.appendChild(a);}
  }
});
