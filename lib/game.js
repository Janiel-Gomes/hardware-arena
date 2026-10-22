const json=(x,status=200)=>Response.json(x,{status});
const rid=()=>crypto.randomUUID();
function draw(used,count){let pool=Q.map((_,i)=>i).filter(i=>!used.includes(i));if(pool.length<count){used=[];pool=Q.map((_,i)=>i)}for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}const order=pool.slice(0,count);return{order,used:[...used,...order]}}


// The secret room token makes each student's permutation stable across refreshes.
// Correctness is always checked using the original option index on the server.
async function optionOrder(room, playerId) {
 if (!room.shuffleOptions || !playerId) return [0,1,2,3];
 const seed = [room.host, room.code, room.round||1, room.index, playerId].join(':');
 const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed)));
 const order = [0,1,2,3];
 let cursor = 0;
 for (let i=3;i>0;i--) {
  const range=i+1, ceiling=256-(256%range);
  let value; do { value=digest[cursor++]; } while(value>=ceiling);
  const j=value%range; [order[i],order[j]]=[order[j],order[i]];
 }
 return order;
}

async function get(b,k){const o=await b.get(k);return o?o.json():null}
async function put(b,k,v){await b.put(k,JSON.stringify(v))}
export default {async fetch(req,env){const u=new URL(req.url);if(!u.pathname.startsWith('/api/'))return new Response(HTML,{headers:{'content-type':'text/html;charset=utf-8'}});try{
if(u.pathname==='/api/questions')return json(Q);
const b=env.BUCKET;if(!b)return json({error:'Armazenamento de salas indisponível.'},503);
const a=u.pathname.slice(5);const d=req.method==='POST'?await req.json():Object.fromEntries(u.searchParams);
if(a==='create'){const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%900000+100000);if(await get(b,'room/'+code))return json({error:'Tente criar novamente.'},409);const room={code,host:rid(),phase:'lobby',index:-1,seconds:[15,20,30,45,60].includes(+d.seconds)?+d.seconds:30,count:[5,10,20].includes(+d.count)?+d.count:20,started:0,created:Date.now(),round:1,shuffleOptions:true,...draw([], [5,10,20].includes(+d.count)?+d.count:20)};await put(b,'room/'+code,room);return json(room)}
const code=String(d.code||'');if(!/^\d{6}$/.test(code))return json({error:'Digite um código de 6 números.'},400);const room=await get(b,'room/'+code);if(!room||Date.now()-room.created>86400000)return json({error:'Sala não encontrada ou expirada.'},404);
if(a==='join'){if(room.phase!=='lobby')return json({error:'Esta partida já começou.'},400);const name=String(d.name||'').trim().slice(0,28);if(!name)return json({error:'Digite seu nome.'},400);const player={id:rid(),name,answers:{}};await put(b,code+'/p/'+player.id,player);return json({id:player.id})}
const host=d.host===room.host;const key=String(room.round||1)+':'+room.index;const question=Q[room.order?room.order[room.index]:room.index];
if(a==='restart'){if(!host)return json({error:'Acesso exclusivo do professor.'},403);if(room.phase!=='done')return json({error:'Conclua a rodada atual primeiro.'},400);Object.assign(room,draw(room.used||[],room.count),{round:(room.round||1)+1,phase:'lobby',index:-1,started:0});await put(b,'room/'+code,room);return json({ok:true})}
if(a==='advance'){if(!host)return json({error:'Acesso exclusivo do professor.'},403);if(room.phase==='lobby'||room.phase==='reveal'){room.index++;room.phase=room.index>=room.count?'done':'question';room.started=Date.now()}else if(room.phase==='question')room.phase='reveal';await put(b,'room/'+code,room);return json({ok:true})}
if(a==='answer'){const player=await get(b,code+'/p/'+d.id);if(!player)return json({error:'Entre na sala novamente.'},403);if(room.phase!=='question'||Date.now()-room.started>room.seconds*1000||+d.index!==room.index)return json({error:'Tempo encerrado.'},400);if(player.answers[key])return json({error:'Resposta já registrada.'},400);const choice=+d.choice;if(!Number.isInteger(choice)||choice<0||choice>3)return json({error:'Alternativa inválida.'},400);const order=await optionOrder(room,player.id);const originalChoice=order[choice];const elapsed=Date.now()-room.started;player.answers[key]={choice:originalChoice,displayedChoice:choice,points:originalChoice===question[2]?Math.round(500+500*(1-elapsed/(room.seconds*1000))):0};await put(b,code+'/p/'+d.id,player);return json({ok:true})}
if(a==='state'){const list=await b.list({prefix:code+'/p/',limit:1000});const players=(await Promise.all(list.objects.map(x=>get(b,x.key)))).filter(Boolean);const ranking=players.map(p=>({name:p.name,score:Object.entries(p.answers).filter(([k])=>k.startsWith(String(room.round||1)+':')).map(([,v])=>v).reduce((s,x)=>s+x.points,0),correct:Object.entries(p.answers).filter(([k])=>k.startsWith(String(room.round||1)+':')).map(([,v])=>v).filter(x=>x.points>0).length})).sort((a,b)=>b.score-a.score);const q=question;const closed=room.phase!=='question'||Date.now()-room.started>=room.seconds*1000;const me=players.find(p=>p.id===d.id);if(!host&&!me)return json({error:'Entre na sala novamente.'},403);const order=await optionOrder(room,host?null:me.id);const stored=me?.answers[key];const mine=stored?{...stored,choice:order.indexOf(stored.choice)}:null;return json({code,round:room.round||1,phase:room.phase,index:room.index,count:room.count,seconds:room.seconds,remaining:Math.max(0,room.seconds-(Date.now()-room.started)/1000),ranking,players:players.length,answered:players.filter(p=>p.answers[key]).length,mine,question:q?{text:q[0],options:order.map(i=>q[1][i]),correct:closed?order.indexOf(q[2]):null,explanation:closed?q[3]:null}:null})}
return json({error:'Operação inválida'},404)
}catch(e){return json({error:'Não foi possível concluir. Tente novamente.'},500)}}};
