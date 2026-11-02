/* Shared, user-adjustable image cropper for CTI admin thumbnails. */
window.CTICrop=async function(file,width,height){
 const bitmap=await createImageBitmap(file);
 return new Promise(resolve=>{
  const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;background:#000b;z-index:99999;display:grid;place-items:center;padding:12px';
  const panel=document.createElement('div');panel.style.cssText='background:white;color:#18354a;border-radius:12px;padding:18px;max-width:550px;width:100%;max-height:95vh;overflow:auto;font:16px system-ui';
  const title=document.createElement('h3');title.textContent='Crop thumbnail — '+width+' × '+height;
  const help=document.createElement('p');help.textContent='Drag the image to position it. Adjust zoom to crop. The original file will not be changed.';
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.style.cssText='display:block;max-width:100%;max-height:55vh;margin:auto;touch-action:none;cursor:grab;background:#ddd';
  const zoom=document.createElement('input');zoom.type='range';zoom.min='1';zoom.max='3';zoom.step='.01';zoom.value='1';zoom.style.width='100%';zoom.setAttribute('aria-label','Crop zoom');
  const actions=document.createElement('div');actions.style.cssText='display:flex;gap:12px;margin-top:12px';
  const cancel=document.createElement('button');cancel.textContent='Cancel';cancel.type='button';
  const save=document.createElement('button');save.textContent='Use this thumbnail';save.type='button';
  actions.append(cancel,save);panel.append(title,help,canvas,zoom,actions);overlay.append(panel);document.body.append(overlay);
  const ctx=canvas.getContext('2d');let ox=0,oy=0,drag=null;
  function geometry(){const scale=Math.max(width/bitmap.width,height/bitmap.height)*Number(zoom.value);return {w:bitmap.width*scale,h:bitmap.height*scale}}
  function clamp(){const {w,h}=geometry();ox=Math.max((width-w)/2,Math.min((w-width)/2,ox));oy=Math.max((height-h)/2,Math.min((h-height)/2,oy))}
  function draw(){clamp();const {w,h}=geometry();ctx.clearRect(0,0,width,height);ctx.drawImage(bitmap,(width-w)/2+ox,(height-h)/2+oy,w,h)}
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,ox,oy};canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;ox=drag.ox+(e.clientX-drag.x)*width/canvas.getBoundingClientRect().width;oy=drag.oy+(e.clientY-drag.y)*height/canvas.getBoundingClientRect().height;draw()});
  canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
  zoom.addEventListener('input',draw);
  function finish(value){bitmap.close();overlay.remove();resolve(value)}
  cancel.onclick=()=>finish(null);
  save.onclick=()=>{draw();finish(canvas.toDataURL('image/jpeg',.9).split(',')[1])};
  draw();
 });
};
