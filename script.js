(() => {
  "use strict";

  const TARGET_UTC = Date.parse("2026-09-07T22:00:00Z");
  const ADMIN_CODE = "1337";
  const ADMIN_CLICK_LIMIT = 5;
  const ADMIN_CLICK_WINDOW = 1500;

  const $ = id => document.getElementById(id);
  const days=$("days"),hours=$("hours"),minutes=$("minutes"),seconds=$("seconds");
  const doorButton=$("doorButton"),lockTitle=$("lockTitle"),lockText=$("lockText");
  const message=$("message"),questPreview=$("questPreview");
  const adminModal=$("adminModal"),adminCode=$("adminCode"),adminSubmit=$("adminSubmit"),adminCancel=$("adminCancel"),adminError=$("adminError");

  let unlocked=false,timerId=null,clicks=0,firstClick=0;

  const pad=n=>String(Math.max(0,Math.floor(n))).padStart(2,"0");

  function msg(text){
    message.textContent=text;message.classList.add("show");
    clearTimeout(msg.t);msg.t=setTimeout(()=>message.classList.remove("show"),3000);
  }

  function update(){
    const remaining=TARGET_UTC-Date.now();
    if(remaining<=0){unlock("birthday");return}
    const total=Math.floor(remaining/1000);
    days.textContent=pad(total/86400);
    hours.textContent=pad((total%86400)/3600);
    minutes.textContent=pad((total%3600)/60);
    seconds.textContent=pad(total%60);
  }

  function unlock(reason){
    if(unlocked)return;
    unlocked=true;clearInterval(timerId);
    [days,hours,minutes,seconds].forEach(el=>el.textContent="00");
    doorButton.classList.add("unlocked");
    doorButton.setAttribute("aria-label","Tür öffnen");
    lockTitle.textContent="DIE TÜR IST BEREIT";
    lockText.innerHTML=reason==="admin"
      ?"Preview-Modus aktiviert.<br>Klick auf die Tür, um das Abenteuer zu beginnen."
      :"Der richtige Moment ist gekommen.<br>Klick auf die Tür und öffne das Abenteuer.";
    if(reason==="admin")msg("Developer preview unlocked.");
  }

  function openAdmin(){
    adminModal.hidden=false;adminCode.value="";adminError.textContent="";
    setTimeout(()=>adminCode.focus(),20);
  }
  function closeAdmin(){
    adminModal.hidden=true;adminCode.value="";adminError.textContent="";clicks=0;firstClick=0;
  }

  doorButton.addEventListener("click",()=>{
    if(!unlocked){
      const now=performance.now();
      if(!firstClick||now-firstClick>ADMIN_CLICK_WINDOW){firstClick=now;clicks=1}else clicks++;
      if(clicks>=ADMIN_CLICK_LIMIT){openAdmin();clicks=0;firstClick=0}
      else msg("Die Tür bleibt noch verschlossen...");
      return;
    }
    if(questPreview.hidden){
      doorButton.style.pointerEvents="none";
      setTimeout(()=>questPreview.hidden=false,750);
    }
  });

  adminSubmit.addEventListener("click",()=>{
    if(adminCode.value.trim()===ADMIN_CODE){closeAdmin();unlock("admin")}
    else{adminError.textContent="Wrong code.";adminCode.select()}
  });
  adminCancel.addEventListener("click",closeAdmin);
  adminCode.addEventListener("keydown",e=>{if(e.key==="Enter")adminSubmit.click();if(e.key==="Escape")closeAdmin()});
  adminModal.addEventListener("click",e=>{if(e.target===adminModal)closeAdmin()});

  update();timerId=setInterval(update,250);
})();
