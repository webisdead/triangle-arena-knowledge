const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const file=path.join(__dirname,'../scripts/analyze-replays.cjs');
const analyzer=fs.existsSync(file)?require(file):{};
test('verified real replay: timelines integrate to published score',()=>{
 const root=path.join(__dirname,'../data/replays');
 const match=JSON.parse(fs.readFileSync(path.join(root,fs.readdirSync(root).sort()[0])));
 const out=analyzer.analyzeReplay(match);
 assert.equal(out.verified,true);
 for(let p=0;p<3;p++){
  const b=out.players[p];
  assert.equal(b.timeline.length,240);
  const sum=b.timeline.reduce((s,t)=>s+t.income*20*t.tick/(240*240),0);
  assert.ok(Math.abs(sum-match.scores[p])<1e-8);
  assert.equal(b.botVersion,null);
  assert.ok(b.strandedPenaltyPoints>=0);
  assert.equal(b.moves,b.successfulMoves+b.blockedMoves+b.stationaryDecisions);
  assert.ok(b.linkedHotspotCellTicks<=b.hotspotCellTicks);
 }
});
test('incorrect published scores never become verified metrics',()=>{
 const root=path.join(__dirname,'../data/replays');
 const m=JSON.parse(fs.readFileSync(path.join(root,fs.readdirSync(root).sort()[0])));
 m.scores[0]+=10;
 assert.throws(()=>analyzer.analyzeReplay(m),/score/i);
});
test('a missing seed is rejected rather than randomly reconstructed',()=>{
 const root=path.join(__dirname,'../data/replays');
 const m=JSON.parse(fs.readFileSync(path.join(root,fs.readdirSync(root).sort()[0])));
 delete m.replay.seed;
 assert.throws(()=>analyzer.analyzeReplay(m),/metadata|seed/i);
});
test('truncated moves never become stationary fallback evidence',()=>{
 const root=path.join(__dirname,'../data/replays');
 const m=JSON.parse(fs.readFileSync(path.join(root,fs.readdirSync(root).sort()[0])));
 m.replay.moves[0]=m.replay.moves[0].slice(0,2);
 assert.throws(()=>analyzer.analyzeReplay(m),/incomplete|truncat/i);
});
test('Fluid marginal movement accounts for phase and existing expiry',()=>{
 assert.equal(analyzer.fluidExtraMoves(10,1,-1,240),9);
 assert.equal(analyzer.fluidExtraMoves(10,2,10,240),8);
 assert.equal(analyzer.fluidExtraMoves(10,1,17,240),1);
 assert.equal(analyzer.fluidExtraMoves(239,1,-1,240),2);
});
test('disconnected 5x hotspot has exactly half-income penalty',()=>{
 const E=require('../scripts/vendor/engine.cjs');
 const s=E.createGame([0,1,2].map(()=>({create:()=>ctx=>ctx.position})),{seed:123});
 const baseline=analyzer.incomeState(s);
 const cell=s.hotspotRegions[0][0];s.owner[cell]=0;
 const after=analyzer.incomeState(s);
 assert.equal(after.strandedValue[0],2.5);
 assert.equal(after.income[0]-baseline.income[0],2.5);
});
