import engine from '../lib/engine.js';
import {makeRedis} from '../lib/redis.js';
export async function handle(request,env=process.env,transport=fetch){
 const action=new URL(request.url).pathname.split('/').pop();
 if(action==='questions')return engine.fetch(request,{});
 const storage=makeRedis(env,transport);
 if(!storage)return Response.json({error:'Falta conectar o banco: configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN na Vercel e faça Redeploy.'},{status:503});
 if(action==='health'){
  try{await storage.get('health');return Response.json({ok:true,storage:'connected'})}catch{return Response.json({ok:false,error:'Não foi possível conectar ao Redis. Confira as variáveis e faça Redeploy.'},{status:503})}
 }
 if(request.method!=='POST')return Response.json({error:'Método não permitido.'},{status:405});
 let release;
 try{
  const data=await request.clone().json();
  if(['answer','advance','restart'].includes(action)){
   if(!/^\d{6}$/.test(String(data.code)))return Response.json({error:'Código inválido.'},{status:400});
   const key=action==='answer'?'player/'+data.code+'/'+String(data.id).slice(0,60):'room/'+data.code;
   release=await storage.lock(key);
   if(!release)return Response.json({error:'Outra operação está em andamento. Tente novamente.'},{status:409});
  }
  const response=await engine.fetch(request,{BUCKET:storage});response.headers.set('Cache-Control','no-store');return response;
 }catch{return Response.json({error:'Não foi possível concluir. Confira a configuração do Redis na Vercel.'},{status:503})}
 finally{if(release)await release().catch(()=>{})}
}
// Conventional Node.js Vercel handler, independent of framework.
export default async function handler(req,res){
 const route=Array.isArray(req.query?.action)?req.query.action.join('/'):req.query?.action||req.url.split('?')[0].split('/').pop();
 const headers=new Headers();for(const [key,val] of Object.entries(req.headers||{}))if(val)headers.set(key,Array.isArray(val)?val.join(','):val);
 const body=req.method==='GET'||req.method==='HEAD'?undefined:typeof req.body==='string'?req.body:JSON.stringify(req.body||{});
 const request=new Request('https://hardware-arena.local/api/'+route,{method:req.method,headers,...(body?{body}:{})});
 const response=await handle(request);res.statusCode=response.status;for(const [key,value] of response.headers)res.setHeader(key,value);res.end(await response.text());
}
