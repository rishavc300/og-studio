// Run with: node tests/early.test.js
const fs=require('fs'),vm=require('vm');const code=fs.readFileSync(require('path').join(__dirname,'../extension/src/early.js'),'utf8');
const K='WebFEAllStudioByChannel__enable_analytics_hub_web',C='WebFEAllStudioByChannel__enable_content_hub_web';
function run(flags,{path='/channel/X/analytics/hub_overview',pre=false,skip=null,form='obj',replaceFlags=false,search=''}={}){
 const replaced=[];const win={};const ds={};
 const ctx={window:win,location:{pathname:path,search},history:{state:null,replaceState:(a,b,u)=>replaced.push(u)},document:{documentElement:{dataset:ds}},
  sessionStorage:{getItem:k=>skip},localStorage:{getItem:()=>null},Date,Number,String,Object};
 const mk=()=>{const data={};return {d(){return data},data_:data,get(k){return data[k]},set(...a){if(a.length>1)data[a[0]]=a[1];else Object.assign(data,a[0])}}};
 if(pre)win.ytcfg=mk();
 vm.runInNewContext(code,ctx);
 if(!pre)win.ytcfg=mk();
 if(form==='obj')win.ytcfg.set({EXPERIMENT_FLAGS:flags});else win.ytcfg.set('EXPERIMENT_FLAGS',flags);
 if(replaceFlags)win.ytcfg.set({EXPERIMENT_FLAGS:{...flags,[K]:true}});
 const f=win.ytcfg.d().EXPERIMENT_FLAGS;
 return {hub:f[K],content:f[C],ds,replaced};
}
let failed=0;
const t=(n,r,ok)=>{const pass=ok(r);if(!pass)failed++;console.log(pass?'PASS':'FAIL',n,JSON.stringify(r));};
t('new channel',run({[K]:true,[C]:true}),r=>r.hub===false&&r.content===false&&r.ds.ogNative==='1'&&r.replaced[0]==='/channel/X/analytics/tab-overview/period-default');
t('old channel (no flags)',run({other:true}),r=>r.hub===undefined&&!r.ds.ogNative&&!r.replaced.length);
t('flag present but false',run({[K]:false}),r=>r.hub===false&&!r.ds.ogNative);
t('ytcfg before script',run({[K]:true},{pre:true}),r=>r.hub===false);
t('key,value set',run({[K]:true},{form:'kv'}),r=>r.hub===false);
t('flags replaced later',run({[K]:true},{replaceFlags:true}),r=>r.hub===false);
t('not hub path',run({[K]:true},{path:'/channel/X/videos/upload'}),r=>r.hub===false&&!r.replaced.length);
t('stood down',run({[K]:true},{skip:String(Date.now()+9e5)}),r=>r.hub===true&&!r.ds.ogNative);
t('stand-down expired',run({[K]:true},{skip:String(Date.now()-5)}),r=>r.hub===false);
t('explore link keeps its query',run({[K]:true},{path:'/channel/X/analytics/hub_overview/explore',search:'?a=1'}),r=>r.replaced[0]==='/channel/X/analytics/tab-overview/period-default/explore?a=1');
process.exit(failed?1:0);
