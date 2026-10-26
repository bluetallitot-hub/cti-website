/* Read-only podcast lookup: title first; unique strong matches only. */
(function(g){'use strict';
let promise;
function words(s){return String(s||'').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean)}
function significant(s){return new Set(words(s).filter(w=>w.length>2&&!['the','and','for','from','what','when','with','your','you','not','does','into','about','have','comes','great','sermon','parashat'].includes(w)))}
function score(item,ep){
 const a=words(item.title).join(' '),b=words(ep.title).join(' ');
 if(a===b)return 1;
 const A=significant(item.title),B=significant(ep.title);
 const common=[...A].filter(w=>B.has(w));
 if(!common.length)return 0;
 const coverage=common.length/Math.min(A.size||1,B.size||1);
 const distinctive=common.some(w=>w.length>=5);
 const topic=significant([item.name,item.byline,item.eyebrow].join(' '));
 const details=significant(ep.description||'');
 const contextual=[...topic].some(w=>details.has(w));
 return distinctive&&coverage>=0.5&&(common.length>=2||contextual)?0.78+0.1*coverage:0;
}
function match(item,episodes){
 const candidates=episodes.map(ep=>({ep,score:score(item,ep)})).sort((a,b)=>b.score-a.score);
 if(candidates[0]?.score>=0.78&&(candidates.length===1||candidates[0].score-candidates[1].score>0.12))return candidates[0].ep.url;
 return null;
}
async function load(){
 if(!promise)promise=fetch('content/podcast-episodes.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Podcast catalog unavailable');return r.json()}).then(d=>d.episodes||[]).catch(()=>[]);
 return promise;
}
g.CTIPodcast={load,match,link:async item=>match(item,await load())||item.podcast||null};
})(window);
