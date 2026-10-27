import fs from 'node:fs/promises';
const path=new URL('../lib/market-snapshot.json',import.meta.url);
const existing=JSON.parse(await fs.readFile(path,'utf8'));
const symbols=process.argv.slice(2).length?process.argv.slice(2):Object.keys(existing);
if(!symbols.every(s=>/^[A-Z0-9&-]{1,24}$/.test(s)))throw Error('Use NSE symbols without the .NS suffix.');
let fetched=0;
for(let offset=0;offset<symbols.length;offset+=3){
 await Promise.all(symbols.slice(offset,offset+3).map(async symbol=>{
  try{
   const r=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}.NS?range=1y&interval=1d`,{headers:{'User-Agent':'FINN research prototype'},signal:AbortSignal.timeout(20000)});
   if(!r.ok)throw Error('Provider status '+r.status);
   const d=(await r.json()).chart?.result?.[0];if(!d?.timestamp?.length)throw Error('No history');
   const q=d.indicators.quote[0],adjusted=d.indicators.adjclose?.[0]?.adjclose||[];
   const points=d.timestamp.map((time,i)=>({date:new Date(time*1000).toISOString().slice(0,10),close:q.close[i]===null?null:Math.round(q.close[i]*100)/100,adjusted:adjusted[i]===undefined||adjusted[i]===null?null:Math.round(adjusted[i]*100)/100,volume:q.volume[i]||0})).filter(p=>Number.isFinite(p.close)&&p.close>0);
   existing[symbol]={symbol,currency:d.meta.currency||'INR',source:'Yahoo Finance',sourceUrl:`https://finance.yahoo.com/quote/${symbol}.NS/history/`,fetchedAt:new Date().toISOString(),points};
   fetched++;console.log(symbol,points.length,'sessions through',points.at(-1).date);
  }catch(error){console.warn(symbol,'retaining previous snapshot:',error.message);}
 }));
}
if(!fetched)throw Error('No series refreshed; original snapshot unchanged.');
const temp=new URL('../lib/market-snapshot.json.tmp',import.meta.url);
await fs.writeFile(temp,JSON.stringify(existing));await fs.rename(temp,path);
console.log('Saved',fetched,'refreshed series. Review data and commit before rebuilding.');
