/* Optional on-screen Hebrew keyboard; does not require an installed Hebrew input method. */
(function(){
 'use strict';
 const rows=['ק ר א ט ו ן ם פ','ש ד ג כ ע י ח ל ך ף','ז ס ב ה נ מ צ ת ץ'];
 function attach(input){
  if(!input||input.dataset.hebrewKeyboard)return;
  input.dataset.hebrewKeyboard='true';
  input.dir='rtl';input.lang='he';input.autocomplete='off';
  const wrap=document.createElement('div');wrap.className='cti-hebrew-input';
  input.parentNode.insertBefore(wrap,input);wrap.append(input);
  const toggle=document.createElement('button');toggle.type='button';toggle.className='cti-hebrew-toggle';toggle.textContent='⌨ Hebrew keyboard';toggle.setAttribute('aria-expanded','false');
  const panel=document.createElement('div');panel.className='cti-hebrew-panel';panel.hidden=true;panel.setAttribute('role','group');panel.setAttribute('aria-label','Hebrew on-screen keyboard');
  const insert=letter=>{const a=input.selectionStart??input.value.length,b=input.selectionEnd??a;input.setRangeText(letter,a,b,'end');input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()};
  for(const line of rows){const row=document.createElement('div');row.className='cti-hebrew-row';for(const letter of line.split(' ')){const key=document.createElement('button');key.type='button';key.textContent=letter;key.setAttribute('aria-label','Insert '+letter);key.addEventListener('mousedown',e=>e.preventDefault());key.addEventListener('click',()=>insert(letter));row.append(key)}panel.append(row)}
  const actions=document.createElement('div');actions.className='cti-hebrew-row';
  for(const [name,action] of [['Space',()=>insert(' ')],['׳',()=>insert('׳')],['״',()=>insert('״')],['⌫ Delete',()=>{const a=input.selectionStart??input.value.length,b=input.selectionEnd??a;if(a!==b)input.setRangeText('',a,b,'end');else if(a>0)input.setRangeText('',a-1,a,'end');input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()}]]){const button=document.createElement('button');button.type='button';button.textContent=name;button.addEventListener('click',action);actions.append(button)}
  panel.append(actions);wrap.append(toggle,panel);
  toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)input.focus()});
  input.addEventListener('focus',()=>{panel.hidden=false;toggle.setAttribute('aria-expanded','true')});
 }
 function init(){const input=document.getElementById('hebrewName');if(input)attach(input)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
 const observer=new MutationObserver(()=>init());observer.observe(document.documentElement,{childList:true,subtree:true});
 window.CTIHebrewKeyboard={attach};
})();
