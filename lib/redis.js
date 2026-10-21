const PREFIX='hardware-arena:v2:';
export function makeRedis(env=process.env,transport=fetch){
 const url=env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL;
 const token=env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN;
 if(!url||!token)return null;
 const cache=new Map();
 async function send(body,endpoint=''){
  const r=await transport(url.replace(/\/$/,'')+endpoint,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw Error('Falha na conexão com o armazenamento. Confira as variáveis da Vercel.');
  const result=await r.json();const items=Array.isArray(result)?result:[result];
  if(items.some(x=>x.error))throw Error('O armazenamento recusou a operação.');
  return Array.isArray(result)?items.map(x=>x.result):result.result;
 }
 return {
  async get(key){const data=cache.has(key)?cache.get(key):await send(['GET',PREFIX+key]);return data===null?null:{json:async()=>typeof data==='string'?JSON.parse(data):data}},
  async put(key,value){const commands=[['SET',PREFIX+key,value,'EX',86400]];if(key.includes('/p/')){const code=key.split('/')[0];commands.push(['SADD',PREFIX+'players/'+code,key],['EXPIRE',PREFIX+'players/'+code,86400])}await send(commands,'/multi-exec')},
  async list({prefix,limit=1000}){const code=prefix.split('/')[0];const keys=await send(['SMEMBERS',PREFIX+'players/'+code]);const selected=keys.filter(k=>k.startsWith(prefix)).slice(0,limit);if(selected.length){const values=await send(['MGET',...selected.map(k=>PREFIX+k)]);selected.forEach((k,i)=>cache.set(k,values[i]))}return{objects:selected.map(key=>({key}))}},
  async lock(key){const value=crypto.randomUUID();const k=PREFIX+'lock/'+key;const acquired=await send(['SET',k,value,'NX','EX',25]);if(!acquired)return null;return async()=>send(['EVAL',"if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end",1,k,value])}
 }
}
