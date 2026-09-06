(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.RetroDOSSourceLoader=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const DOOM_KEYS={
    use_mouse:'0',use_joystick:'0',
    key_right:'174',key_left:'172',key_up:'173',key_down:'175',
    key_fire:'157',key_use:'32',key_strafe:'184',key_speed:'182'
  };
  const normalize=p=>String(p||'').replace(/\\/g,'/').replace(/^\.\//,'').replace(/^\/+/, '');
  const baseName=p=>normalize(p).split('/').pop();
  function findExecutable(paths,name){const wanted=String(name).toLowerCase();return paths.map(normalize).find(p=>baseName(p).toLowerCase()===wanted)||null;}
  function upsertSetting(text,name,value){
    const re=new RegExp(`(^|\\n)(\\s*${name}\\s+)[^\\r\\n]*`,'i');
    if(re.test(text)) return text.replace(re,(m,prefix,label)=>`${prefix}${label}${value}`);
    const sep=text && !/\n$/.test(text)?'\r\n':'';
    return `${text}${sep}${name} ${value}\r\n`;
  }
  function patchDoomConfig(text){let out=String(text||'');for(const [name,value] of Object.entries(DOOM_KEYS))out=upsertSetting(out,name,value);return out;}
  function buildDosboxConf(executablePath){
    const path=normalize(executablePath);const parts=path.split('/');const exe=parts.pop();const dir=parts.join('\\');
    const lines=['[sdl]','autolock=false','[autoexec]','mount c .','c:'];
    if(dir) lines.push(`cd ${dir}`);
    lines.push(exe,'exit');
    return `${lines.join('\n')}\n`;
  }
  function findDoomConfigPath(paths,executablePath){
    const exeDir=normalize(executablePath).split('/').slice(0,-1).join('/').toLowerCase();
    const candidates=paths.map(normalize).filter(p=>baseName(p).toLowerCase()==='default.cfg');
    return candidates.find(p=>p.split('/').slice(0,-1).join('/').toLowerCase()===exeDir)||candidates[0]||`${exeDir?normalize(executablePath).split('/').slice(0,-1).join('/')+'/':''}DEFAULT.CFG`;
  }
  async function loadInstalledZip(url,fflateApi,onProgress){
    const response=await fetch(url,{cache:'force-cache'});if(!response.ok)throw new Error(`Source ZIP inaccessible (${response.status})`);
    const total=Number(response.headers.get('content-length'))||0;let bytes;
    if(response.body){const reader=response.body.getReader();const chunks=[];let loaded=0;for(;;){const {done,value}=await reader.read();if(done)break;chunks.push(value);loaded+=value.byteLength;onProgress?.(loaded,total);}bytes=new Uint8Array(loaded);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}}
    else{bytes=new Uint8Array(await response.arrayBuffer());onProgress?.(bytes.byteLength,total||bytes.byteLength);}
    const zip=(fflateApi||globalThis.fflate).unzipSync(bytes);
    const files={};
    for(const [rawPath,contents] of Object.entries(zip)){
      const path=normalize(rawPath);if(!path||path.endsWith('/')||path.startsWith('__MACOSX/'))continue;files[path]=contents;
    }
    const paths=Object.keys(files);
    const executable=findExecutable(paths,'DOOMWEB.BAT')||findExecutable(paths,'DOOM.BAT')||findExecutable(paths,'DOOM.EXE');
    if(!executable)throw new Error('Exécutable DOOM introuvable dans le ZIP');
    const cfgPath=findDoomConfigPath(paths,executable);
    const decoder=new TextDecoder('windows-1252');const encoder=new TextEncoder();
    const existing=files[cfgPath]?decoder.decode(files[cfgPath]):'';
    files[cfgPath]=encoder.encode(patchDoomConfig(existing));
    return {executable,configPath:cfgPath,initFs:Object.entries(files).map(([path,contents])=>({path,contents}))};
  }
  return {findExecutable,patchDoomConfig,buildDosboxConf,findDoomConfigPath,loadInstalledZip};
});
