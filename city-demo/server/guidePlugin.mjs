import {loadEnv} from 'vite';
import {handleGuide} from './guideHandler.mjs';

export function guidePlugin(){
  let env={};
  function middleware(req,res,next){
    if(req.url?.split('?')[0]!=='/api/guide')return next();
    let length=0;const parts=[];
    req.on('data',part=>{length+=part.length;if(length>26000){res.writeHead(413,{'Content-Type':'application/json'});res.end('{"error":"Request too large"}');req.destroy();}else parts.push(part);});
    req.on('end',async()=>{
      if(res.writableEnded)return;
      const controller=new AbortController();res.on('close',()=>{if(!res.writableEnded)controller.abort();});
      try{
        const headers=new Headers();for(const [key,value] of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
        const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers,signal:controller.signal,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(parts)}:{})});
        const result=await handleGuide(request,env);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text());
      }catch{if(!res.writableEnded){res.writeHead(500,{'Content-Type':'application/json'});res.end('{"error":"Guide unavailable"}');}}
    });
  }
  return {name:'city-guide-api',configResolved(config){const vars=loadEnv(config.mode,config.root,'');env={OPENAI_API_KEY:process.env.OPENAI_API_KEY||vars.OPENAI_API_KEY,GUIDE_MODEL:process.env.GUIDE_MODEL||vars.GUIDE_MODEL};},configureServer(server){server.middlewares.use(middleware);},configurePreviewServer(server){server.middlewares.use(middleware);}};
}
