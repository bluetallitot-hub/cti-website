/* Shared CTI Torah naming rules. No stored filename or manually assigned ID required. */
(function(g){'use strict';
const books={1:'Genesis',2:'Exodus',3:'Leviticus',4:'Numbers',5:'Deuteronomy'};
function clean(s){return String(s||'').trim().replace(/[\\/]/g,'-').replace(/[^A-Za-z0-9 ()'-]/g,'').trim()}
function path(r,version='Reader'){if(!['Reader','Email'].includes(version))throw Error('Invalid edition');const yy=String(Number(r.year)%100).padStart(2,'0');let folder,file;if(r.holidayCode){folder='Holiday';file=clean(r.holidayCode).toUpperCase()+'-'+yy+' ('+clean(r.name)+')-'+version+'.md'}else{folder=books[r.book];if(!folder||!Number.isInteger(r.portion)||r.portion<1||r.portion>99)throw Error('Invalid Torah reference');file=r.book+'-'+String(r.portion).padStart(2,'0')+'-'+yy+'-'+version+' ('+clean(r.name)+').md'}if(!r.name||!Number.isInteger(r.year)||r.year<2000||r.year>2099)throw Error('Invalid Torah record');return 'content/dvar-torah/'+folder+'/'+file}
function key(r){return r.holidayCode?'holiday-'+clean(r.holidayCode).toLowerCase()+'-'+r.year+'-'+clean(r.name).toLowerCase().replace(/[^a-z0-9]+/g,'-'):'torah-'+r.book+'-'+String(r.portion).padStart(2,'0')+'-'+r.year}
function find(items,id){return items.find(r=>key(r)===id||(r.legacyIds||[]).includes(id))}
g.CTITorahFiles={path,key,find,books};
})(window);
