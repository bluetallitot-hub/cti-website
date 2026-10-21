/* CTI admin smoke and calendar contract tests. No external dependencies. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pages=['admin/index.html','admin/login.html','admin/schedule.html','admin/meldados.html','admin/meldados-editor.html','admin/archives.html','admin/archive-editor.html','admin/archive-add.html','admin/dvar-torah.html','admin/newsletter.html','admin/leadership.html','admin/gallery.html','admin/github-check.html','admin/asset-contact-sheet.html'];
let checks=0;function test(name,fn){fn();checks++;console.log('PASS',name)}
for(const p of pages){
 test(p+' has valid local script references',()=>{
  const html=read(p);
  assert.match(html,/<!doctype html>/i);
  assert.doesNotMatch(html,/<script[^>]*<script/i,'nested script tag');
  for(const match of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)){
   const src=match[1].split('?')[0];if(/^(https?:)?\/\//.test(src))continue;
   assert.ok(fs.existsSync(path.resolve(root,path.dirname(p),src)),p+' missing '+src);
  }
 });
}
test('service calendar engine loads',()=>{
 const sandbox={window:{},Intl,Date};vm.runInNewContext(read('assets/service-calendar.js'),sandbox);
 assert.equal(typeof sandbox.window.CTIServiceCalendar.build,'function');
 const build=sandbox.window.CTIServiceCalendar.build;
 const opts={from:'2027-09-01',until:'2027-11-01'};
 const base=build({services:[]},opts);
 assert.ok(base.some(s=>s.description==='Monthly Shabbat Service'));
 assert.ok(base.some(s=>s.description.includes('Rosh Hashanah')));
 const monthly=base.find(s=>s.description==='Monthly Shabbat Service');
 const changed=build({services:[],overrides:[{id:monthly.id,date:'2027-10-29',time:'8:00 PM',location:'Zoom only',description:monthly.description}]},opts);
 assert.equal(changed.find(s=>s.id===monthly.id).date,'2027-10-29');
 assert.equal(changed.find(s=>s.id===monthly.id).location,'Zoom only');
 assert.equal(changed.filter(s=>s.id===monthly.id).length,1);
 const cancelled=build({services:[],overrides:[{id:monthly.id,cancelled:true}]},opts);
 assert.ok(!cancelled.some(s=>s.id===monthly.id));
});
test('admin calendar editor uses shared engine',()=>{const s=read('admin/schedule.html');assert.match(s,/CTIServiceCalendar\.build/);assert.match(s,/overrides/);assert.match(s,/Download services\.json/)});
test('Meldados editor uses authenticated API',()=>{const s=read('admin/meldados-editor.js');assert.match(s,/CTIAuth\.api/);assert.match(s,/expectedSha/)});
console.log('Completed',checks,'admin checks');
