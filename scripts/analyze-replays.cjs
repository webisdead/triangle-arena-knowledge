// Replay evidence, not a bot SDK and not a counterfactual strategy simulator.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const E=require('./instrument-engine.cjs');
const ROOT=path.join(__dirname,'../data');
const SOURCE='https://triangle-arena.vercel.zone/api/screen/code-talks-2026';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const engineHash=sha(fs.readFileSync(path.join(__dirname,'vendor/engine.cjs')));
const analyzerHash=sha(fs.readFileSync(__filename)+fs.readFileSync(path.join(__dirname,'instrument-engine.cjs'))+engineHash);
function read(file,fallback){return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):fallback;}
function write(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(data)+'\n');fs.renameSync(file+'.tmp',file);}
function incomeState(s){const linked=new Uint8Array(s.grid.size),income=[0,0,0],strandedValue=[0,0,0];
 for(let p=0;p<3;p++){linked[s.homes[p]]=1;const q=[s.homes[p]];for(let i=0;i<q.length;i++)for(const n of s.grid.neighbors[q[i]])if(!linked[n]&&s.owner[n]===p){linked[n]=1;q.push(n);}}
 for(let c=0;c<s.grid.size;c++){const p=s.owner[c];if(p<0)continue;const discount=s.rules.supplyLines&&!linked[c]?(1-(s.variant.strandedShare??.5)):0;strandedValue[p]+=s.cellValue[c]*discount;income[p]+=s.cellValue[c]*(1-discount);}
 if(s.variant.hotspotSet)for(const area of s.hotspotRegions){const p=s.owner[area[0]];if(p>=0&&area.every(c=>s.owner[c]===p))income[p]+=s.variant.hotspotSet;}
 return {linked,income,strandedValue};}
function fluidExtraMoves(tick,phase,oldUntil,maxTicks){return Math.max(0,Math.min(maxTicks,tick+8)-Math.max(tick,oldUntil))+(phase===1&&oldUntil<tick?1:0);}
function analyzeReplay(m){
 if(!Number.isInteger(m.replay?.seed)||m.replay.seed<0||m.replay.seed>0xffffffff)throw Error('Missing or invalid replay seed metadata');
 if(!Array.isArray(m.botIds)||m.botIds.length!==3||new Set(m.botIds).size!==3||!Array.isArray(m.scores)||m.scores.length!==3||!m.scores.every(Number.isFinite)||!Array.isArray(m.ranking)||!m.replay?.moves||m.replay.moves.length!==3||!m.replay.moves.every(Array.isArray))throw Error('Incomplete replay metadata');
 const stats=m.botIds.map((id,p)=>({botId:id,player:p,corner:p,botVersion:null,moves:0,successfulMoves:0,blockedMoves:0,stationaryDecisions:0,ownedMoves:0,backtracks:0,extraMoves:0,productiveExtraMoves:0,newlyStrandedCells:0,reconnectedCells:0,strandedCellTicks:0,strandedValueTicks:0,strandedPenaltyPoints:0,hotspotCellTicks:0,linkedHotspotCellTicks:0,hotspotScore:0,firstHotspotTick:null,enclosedCells:0,enclosureEvents:0,pickups:[],timeline:[]}));
 let s,phase=0,phaseTick=-1,before,afterMovement,lastPreviousPosition=[-1,-1,-1],missing=false;const consumed=[0,0,0];
 const bots=m.replay.moves.map((moves,p)=>({create:()=>ctx=>{const i=consumed[p]++;if(i>=moves.length){missing=true;return ctx.position;}return moves[i];}}));
 s=E.createGame(bots,{seed:m.replay.seed});
 const copy=()=>({owner:s.owner.slice(),positions:s.positions.slice(),boost:s.boostUntil.slice()});
 s.observe=(kind,payload)=>{
  if(kind==='phaseStart'){if(phaseTick!==s.tick){phaseTick=s.tick;phase=0;}phase++;before=copy();}
  if(kind==='movement'){
   for(const p of payload.active){const b=stats[p],target=payload.targets.get(p)??before.positions[p],from=before.positions[p],to=s.positions[p];b.moves++;
    if(phase===2)b.extraMoves++;
    if(target===from)b.stationaryDecisions++;else if(to===from)b.blockedMoves++;else {b.successfulMoves++;if(before.owner[to]===p)b.ownedMoves++;if(to===lastPreviousPosition[p])b.backtracks++;if(phase===2&&before.owner[to]!==p&&s.owner[to]===p)b.productiveExtraMoves++;lastPreviousPosition[p]=from;}
   }afterMovement=copy();
  }
  if(kind==='powerEffects')for(const pu of payload.pickups){const p=pu.player,entry={tick:s.tick,phase,kind:pu.kind,cell:pu.cell,phaseShared:payload.pickups.length>1};
   if(pu.kind==='fluid')entry.additionalScheduledMoves=fluidExtraMoves(s.tick,phase,before.boost[p],s.maxTicks);
   if(pu.kind==='deploy'||pu.kind==='rollback'){const gained=[];for(let c=0;c<s.grid.size;c++)if(afterMovement.owner[c]!==p&&s.owner[c]===p)gained.push(c);entry.cellsGained=gained.length;entry.rawValueGained=gained.reduce((n,c)=>n+s.cellValue[c],0);}
   stats[p].pickups.push(entry);
  }
  if(kind==='beforePurge')for(const pu of payload.pickups){const entry=stats[pu.player].pickups.at(-1),area=E.purgeArea(s,pu.cell);entry.ownCellsDeleted=area.filter(c=>s.owner[c]===pu.player).length;entry.enemyCellsDeleted=area.filter(c=>s.owner[c]>=0&&s.owner[c]!==pu.player).length;entry.ownRawValueDeleted=area.filter(c=>s.owner[c]===pu.player).reduce((n,c)=>n+s.cellValue[c],0);entry.enemyRawValueDeleted=area.filter(c=>s.owner[c]>=0&&s.owner[c]!==pu.player).reduce((n,c)=>n+s.cellValue[c],0);}
 };
 const hot=s.hotspotRegions.flat();let previousOwner=s.owner.slice(),previousLinked=s.connected.slice();
 while(!E.isFinished(s)){E.step(s);const view=incomeState(s),w=E.scoreWeight(s.tick,s.maxTicks);
  for(let p=0;p<3;p++){const b=stats[p];let lost=0,recovered=0,stranded=0,strandedRaw=0,hotOwned=0,hotLinked=0,hotIncome=0,flipped=0;
   for(let c=0;c<s.grid.size;c++)if(s.owner[c]===p){if(!s.connected[c]){stranded++;strandedRaw+=s.cellValue[c];}if(previousOwner[c]===p&&previousLinked[c]&&!s.connected[c])lost++;if(previousOwner[c]===p&&!previousLinked[c]&&s.connected[c])recovered++;if(s.flippedAt[c]===s.tick)flipped++;}
   for(const c of hot)if(s.owner[c]===p){hotOwned++;if(s.connected[c])hotLinked++;hotIncome+=s.cellValue[c]*(!s.rules.supplyLines||s.connected[c]?1:s.variant.strandedShare??.5);}
   b.newlyStrandedCells+=lost;b.reconnectedCells+=recovered;b.strandedCellTicks+=stranded;b.strandedValueTicks+=strandedRaw;b.strandedPenaltyPoints+=view.strandedValue[p]*w;b.hotspotCellTicks+=hotOwned;b.linkedHotspotCellTicks+=hotLinked;b.hotspotScore+=hotIncome*w;b.enclosedCells+=flipped;if(flipped)b.enclosureEvents++;if(hotOwned&&b.firstHotspotTick===null)b.firstHotspotTick=s.tick;
   b.timeline.push({tick:s.tick,score:s.scores[p],income:s.income[p],owned:s.painted[p],stranded,strandedRawValue:strandedRaw,connectionPenaltyIncome:view.strandedValue[p],hotspotCells:hotOwned,linkedHotspotCells:hotLinked,newlyStrandedCells:lost,reconnectedCells:recovered,enclosedCells:flipped});
  }previousOwner=s.owner.slice();previousLinked=s.connected.slice();
 }
 if(missing||consumed.some((n,p)=>n!==m.replay.moves[p].length))throw Error('Incomplete or truncated move stream');
 const error=Math.max(...s.scores.map((x,p)=>Math.abs(x-m.scores[p])));
 if(error>1e-8)throw Error('Published score mismatch: '+error);
 const ranking=E.ranking(s).map(x=>x.player);if(JSON.stringify(ranking)!==JSON.stringify(m.ranking))throw Error('Published ranking mismatch');
 for(let p=0;p<3;p++){const b=stats[p],opponents=s.scores.filter((_,i)=>i!==p);b.score=s.scores[p];b.place=ranking.indexOf(p)+1;b.marginToBestOpponent=b.score-Math.max(...opponents);b.opponentIds=m.botIds.filter((_,i)=>i!==p);b.ownedMoveShare=b.successfulMoves?b.ownedMoves/b.successfulMoves:0;b.blockedMoveShare=b.moves?b.blockedMoves/b.moves:0;b.hotspotScoreShare=b.score?b.hotspotScore/b.score:0;}
 return {matchId:m.id,seed:m.replay.seed,playsAt:m.playsAt??null,firstSeenAt:m.firstSeenAt??null,source:SOURCE,verified:true,verification:{maxScoreError:error,rankingMatches:true,engineHash,analyzerHash},maxTicks:s.maxTicks,players:stats};
}
function run(root=ROOT){const directory=path.join(root,'replays'),out=path.join(root,'metrics'),matches={},failures=[],byBot={};let calculated=0;
 fs.mkdirSync(path.join(out,'matches'),{recursive:true});
 for(const file of fs.readdirSync(directory).filter(f=>/^[a-f0-9]{64}\.json$/.test(f))){const key=file.slice(0,-5),raw=fs.readFileSync(path.join(directory,file)),replayHash=sha(raw),target=path.join(out,'matches',file);let result=read(target,null);
  try{if(!result||result.verification?.analyzerHash!==analyzerHash||result.replayHash!==replayHash){result={...analyzeReplay(JSON.parse(raw)),replayHash};write(target,result);calculated++;}
   matches[key]={matchId:result.matchId,playsAt:result.playsAt,botIds:result.players.map(b=>b.botId),verified:true};
   for(const b of result.players){const bot=byBot[b.botId]??={botId:b.botId,sampleSize:0,wins:0,matchKeys:[],averages:{},byCorner:{}};bot.sampleSize++;if(b.place===1)bot.wins++;bot.matchKeys.push(key);const corner=bot.byCorner[b.corner]??={sampleSize:0,wins:0};corner.sampleSize++;if(b.place===1)corner.wins++;
    for(const metric of ['score','marginToBestOpponent','strandedPenaltyPoints','ownedMoveShare','blockedMoveShare','hotspotScoreShare','linkedHotspotCellTicks','enclosedCells','newlyStrandedCells','reconnectedCells','extraMoves','productiveExtraMoves'])bot.averages[metric]=(bot.averages[metric]??0)+b[metric];
   }
  }catch(error){failures.push({key,error:error.message});if(fs.existsSync(target))fs.unlinkSync(target);}
 }
 for(const bot of Object.values(byBot))for(const metric in bot.averages)bot.averages[metric]/=bot.sampleSize;
 const result={source:SOURCE,engineHash,analyzerHash,verifiedMatches:Object.keys(matches).length,rejectedMatches:failures.length,failures,matches,bots:byBot,limitations:['Public rotating replay sample; not representative.','Bot versions and intended projects are not provided.','Stranded penalty assumes current owned cells fully connected; it is not a proven repair payoff.','Pickup effects describe actual paint changes; no causal net future score or detour cost is inferred.','Simultaneous pickup resolution is flagged phaseShared.']};
 write(path.join(out,'index.json'),result);
 const fields=['matchId','botId','corner','score','place','marginToBestOpponent','strandedPenaltyPoints','newlyStrandedCells','reconnectedCells','hotspotScoreShare','linkedHotspotCellTicks','ownedMoveShare','blockedMoveShare','enclosedCells','extraMoves','productiveExtraMoves'];const lines=[fields.join(',')];
 const csvCell=value=>{if(value==null)return '';if(typeof value==='number')return String(value);let text=String(value);if(/^[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
 for(const key in matches){const m=read(path.join(out,'matches',key+'.json'));for(const b of m.players)lines.push(fields.map(f=>csvCell(f==='matchId'?m.matchId:b[f]??null)).join(','));}
 fs.writeFileSync(path.join(out,'appearances.csv'),lines.join('\n')+'\n');
 console.log(JSON.stringify({verifiedMatches:result.verifiedMatches,rejectedMatches:result.rejectedMatches,botAppearances:lines.length-1,calculated}));
 return result;
}
module.exports={analyzeReplay,fluidExtraMoves,incomeState,run};
if(require.main===module){const result=run(process.argv[2]||ROOT);if(result.rejectedMatches)process.exitCode=1;}
