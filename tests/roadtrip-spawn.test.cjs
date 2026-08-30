const assert = require('node:assert/strict');
const L = require('../roadtrip.js');
const sprite = (type, lane, progress=0) => ({type,lane,progress,travelMs:L.SPRITES[type].travelMs,hit:false});
assert.equal(L.canSpawn(sprite('star',1),[]),true);
assert.equal(L.canSpawn(sprite('star',1),[sprite('barrel',1,.1)]),false,'faster star must not catch a hazard');
assert.equal(L.canSpawn(sprite('star',2),[sprite('cat',0,.1)]),false,'star/cat arrival conflict also forbidden across lanes');
assert.equal(L.canSpawn(sprite('cat',2),[sprite('star',0,0)]),false,'arrival guard works in both spawn orders');
assert.equal(L.canSpawn(sprite('star',1),[{...sprite('cat',1),hit:true}]),true);
assert.equal(L.canSpawn(sprite('star',1),[sprite('cat',1,1)]),true);
assert.equal(L.canSpawn(sprite('star',4),[]),false);
assert.equal(L.canSpawn({...sprite('star',1),type:'unknown'},[]),false);

// Independent 10ms playback oracle (finer than the 20ms swept spawn check).
// Simulate original spawn cadence, different travel speeds and all three lanes.
let totalAccepted=0,totalSkipped=0,minStars=Infinity;
for(let seed=1;seed<=40;seed++){
  let randomState=seed;
  const random=()=>((randomState=(Math.imul(randomState,1664525)+1013904223)>>>0)/2**32);
  let active=[],starAt=0,hazardAt=0,stars=0;
  for(let ms=0;ms<60000;ms+=10){
    active=active.filter(o=>o.progress<1);
    for(const kind of ['star','hazard']){
      if(ms<(kind==='star'?starAt:hazardAt))continue;
      const type=kind==='star'?'star':random()<.7?'barrel':'cat';
      const candidate=sprite(type,Math.floor(random()*3));
      if(L.canSpawn(candidate,active)){
        active.push(candidate);totalAccepted++;if(type==='star')stars++;
      }else totalSkipped++;
      if(kind==='star')starAt=ms+700+random()*600;
      else hazardAt=ms+1500+random()*1300;
    }
    for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
      const a=active[i],b=active[j];
      // Compute actual painted rectangles independently, not via spriteBounds.
      for(const [width,height] of [[240,180],[298,223.5],[640,480]]){
        const box=o=>{
          const p=o.progress**1.6,scale=.18+.82*p,size=L.SPRITES[o.type].size;
          const x=(50+(o.lane-1)*(6+24*p))*width/100;
          const top=(8+76*p)*height/100+size*(1-scale);
          return {left:x-size*scale/2-4,right:x+size*scale/2+4,top:top-4,bottom:top+size*scale+4};
        };
        const x=box(a),y=box(b);
        assert.ok(x.right<=y.left||y.right<=x.left||x.bottom<=y.top||y.bottom<=x.top,
          `overlap: seed=${seed} ms=${ms} board=${width}`);
        if(width===240){
          const gap=3+9*Math.max(a.progress,b.progress)**2;
          assert.ok(x.right+gap<=y.left||y.right+gap<=x.left||x.bottom+gap<=y.top||y.bottom+gap<=x.top,
            'safety margin must grow towards the car');
        }
      }
      if((a.type==='star')!==(b.type==='star')){
        const entry=((70-8)/(84-8))**(1/1.6);
        const aStart=Math.max(0,(entry-a.progress)*a.travelMs),aEnd=(1-a.progress)*a.travelMs;
        const bStart=Math.max(0,(entry-b.progress)*b.travelMs),bEnd=(1-b.progress)*b.travelMs;
        assert.ok(aStart>=bEnd+350-1e-6||bStart>=aEnd+350-1e-6,'star/hazard reaction gap');
      }
    }
    active.forEach(o=>o.progress+=10/o.travelMs);
  }
  minStars=Math.min(minStars,stars);
  assert.ok(stars>=20,`enough opportunities for the unchanged 15-star target: ${stars}`);
}
assert.ok(totalSkipped>0);
console.log(`PASS: 40 seeded rounds; no overlaps/arrival conflicts; ${totalAccepted} accepted, ${totalSkipped} skipped; minimum ${minStars} stars`);
