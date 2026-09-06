(() => {
  'use strict';
  const SOURCE_URL='/games/doom-shareware.zip';
  const fpsProfile=window.RetroDOSFPSProfile;
  const source=window.RetroDOSSourceLoader;
  const $=(q)=>document.querySelector(q);
  const els={dos:$('#dos'),boot:$('#bootOverlay'),start:$('#startBtn'),error:$('#bootError'),progress:$('#progressBar'),dataState:$('#dataState'),dataLabel:$('#downloadLabel'),bytes:$('#downloadBytes'),engineState:$('#engineState'),inputState:$('#inputState'),command:$('#bootCommand'),status:$('#statusText'),badge:$('#profileBadge'),gameMode:$('#gameModeBtn'),portraitMode:$('#portraitModeBtn'),mirrorMode:$('#gameModeBtnMirror'),exitMode:$('#exitModeBtn'),save:$('#saveBtn'),mute:$('#muteBtn')};
  let ci=null,player=null,started=false,muted=false,runtimeWired=false;

  const formatBytes=(v)=>{if(!v)return'0 B';const u=['B','KB','MB','GB'];const i=Math.min(Math.floor(Math.log(v)/Math.log(1024)),u.length-1);return`${(v/1024**i).toFixed(i<2?0:1)} ${u[i]}`;};

  function onProgress(loaded,total){
    const pct=total?Math.min(100,Math.round(loaded/total*100)):0;
    els.progress.style.width=total?`${pct}%`:'35%';
    els.dataState.textContent=total?`${pct}%`:formatBytes(loaded);
    els.bytes.textContent=total?`${formatBytes(loaded)} / ${formatBytes(total)}`:formatBytes(loaded);
  }

  function wireRuntime(){
    if(runtimeWired||!ci)return;
    runtimeWired=true;
    let first=true;
    ci.events().onFrame(()=>{
      if(!first)return;
      first=false;
      els.command.textContent='C:\\GAMES\\DOOM> DOOM';
      setTimeout(()=>{els.boot.classList.add('is-hidden');setTimeout(()=>els.boot.classList.add('is-gone'),420);},120);
    });
    ci.events().onExit(()=>els.status.textContent='STOP');
  }

  async function boot(){
    if(started)return;
    started=true;
    els.start.disabled=true;
    els.error.hidden=true;
    els.status.textContent='CHARGEMENT';
    els.dataLabel.textContent='Téléchargement du shareware installé…';
    els.command.textContent='C:\\RETRODOS> FETCH DOOM-SHAREWARE.ZIP';
    try{
      if(!window.fflate)throw new Error('Décompresseur ZIP indisponible');
      if(!source?.loadInstalledZip)throw new Error('Source loader RetroDOS indisponible');
      if(!fpsProfile?.createFpsLayers)throw new Error('Profil FPS RetroDOS indisponible');

      const game=await source.loadInstalledZip(SOURCE_URL,window.fflate,onProgress);
      els.progress.style.width='100%';
      els.dataState.textContent='OK';
      els.engineState.textContent='INIT';
      els.inputState.textContent='FPS';
      els.command.textContent=`C:\\RETRODOS> ${game.executable}`;

      const layers=fpsProfile.createFpsLayers();
      player=Dos(els.dos,{
        dosboxConf:source.buildDosboxConf(game.executable),
        jsdosConf:{version:'8',layersConfig:layers},
        initFs:game.initFs,
        autoStart:true,
        kiosk:true,
        style:'none',
        noSideBar:true,
        noFullscreen:true,
        noSocialLinks:true,
        backend:'dosbox',
        backendLocked:true,
        renderAspect:'4/3',
        imageRendering:'pixelated',
        softFullscreen:false,
        noCursor:true,
        scaleControls:.82,
        fsChanges:{local:true,urlToKey:async()=> 'retrodos-doom-shareware-clean-fps'},
        onEvent:async(event,arg)=>{
          if(event==='emu-ready'){
            els.engineState.textContent='READY';
            els.engineState.style.color='var(--green)';
          }
          if(event==='ci-ready'){
            ci=arg;
            els.inputState.textContent='FPS ✓';
            els.inputState.style.color='var(--green)';
            els.badge.textContent='RETRODOS FPS PROFILE ✓ — SOURIS DOOM OFF';
            els.status.textContent='RUNNING';
            wireRuntime();
          }
        }
      });
      player.setNoCloud?.(true);
      player.setScaleControls?.(.82);
    }catch(error){
      started=false;
      els.start.disabled=false;
      els.status.textContent='ERREUR';
      els.error.hidden=false;
      els.error.textContent=`Erreur : ${error.message}`;
      console.error(error);
    }
  }

  async function enterGameMode(){
    document.body.classList.add('game-mode');
    try{await document.documentElement.requestFullscreen?.();}catch{}
    try{await screen.orientation?.lock?.('landscape');}catch{}
    setTimeout(()=>window.scrollTo(0,0),50);
  }
  function exitGameMode(){document.body.classList.remove('game-mode');try{screen.orientation?.unlock?.();}catch{}}
  async function save(){if(!player)return;const t=els.save.textContent;els.save.textContent='SAVE…';let ok=false;try{ok=!!(await player.save?.());}catch{}els.save.textContent=ok?'SAUVÉ ✓':'SAVE INDISPO';setTimeout(()=>els.save.textContent=t,1300);}
  function toggleMute(){if(!ci)return;muted=!muted;muted?ci.mute():ci.unmute();els.mute.textContent=muted?'SON OFF':'SON ON';}

  els.start.addEventListener('click',boot);
  for(const b of [els.gameMode,els.portraitMode,els.mirrorMode])b.addEventListener('click',enterGameMode);
  els.exitMode.addEventListener('click',async()=>{try{await document.exitFullscreen?.();}catch{}exitGameMode();});
  els.save.addEventListener('click',save);
  els.mute.addEventListener('click',toggleMute);
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&document.body.classList.contains('game-mode'))exitGameMode();});
})();
