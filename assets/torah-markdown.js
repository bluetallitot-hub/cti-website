/* Shared safe Markdown renderer for CTI Reader and publisher previews. */
(function(root){'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inline(value){
 let s=esc(value);
 s=s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,(_,label,url)=>'<a href="'+url+'" target="_blank" rel="noopener noreferrer">'+label+'</a>');
 s=s.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/__([^_\n]+)__/g,'<strong>$1</strong>');
 s=s.replace(/\*([^*\n]+)\*/g,'<em>$1</em>').replace(/_([^_\n]+)_/g,'<em>$1</em>');
 s=s.replace(/`([^`]+)`/g,'<code>$1</code>');
 return s;
}
function render(source){
 const lines=String(source||'').replace(/\r\n?/g,'\n').split('\n');let out=[],i=0;
 while(i<lines.length){
  let line=lines[i];if(!line.trim()){i++;continue}
  if(/^\s*([-*_]\s*){3,}$/.test(line)){out.push('<hr>');i++;continue}
  let m=line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
  if(m){out.push('<h'+m[1].length+'>'+inline(m[2])+'</h'+m[1].length+'>');i++;continue}
  if(i+1<lines.length&&/^\s*(=+|-+)\s*$/.test(lines[i+1])){const level=lines[i+1].trim()[0]==='='?1:2;out.push('<h'+level+'>'+inline(line.trim())+'</h'+level+'>');i+=2;continue}
  if(/^\s*>/.test(line)){let block=[];while(i<lines.length&&/^\s*>/.test(lines[i]))block.push(lines[i++].replace(/^\s*>\s?/,''));out.push('<blockquote>'+render(block.join('\n'))+'</blockquote>');continue}
  if(/^\s*([-*+] |\d+\. )/.test(line)){const ordered=/^\s*\d+\. /.test(line);let items=[];while(i<lines.length&&/^\s*([-*+] |\d+\. )/.test(lines[i]))items.push('<li>'+inline(lines[i++].replace(/^\s*([-*+] |\d+\. )/,''))+'</li>');out.push('<'+(ordered?'ol':'ul')+'>'+items.join('')+'</'+(ordered?'ol':'ul')+'>');continue}
  let para=[line.trim()];i++;
  while(i<lines.length&&lines[i].trim()&&!/^\s*(#{1,6}\s|>|[-*+] |\d+\. )/.test(lines[i]))para.push(lines[i++].trim());
  out.push('<p>'+inline(para.join(' '))+'</p>');
 }
 return out.join('\n');
}
root.CTITorahMarkdown={render,inline,escape:esc};
})(window);
