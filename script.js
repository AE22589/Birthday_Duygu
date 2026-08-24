(() => {
  "use strict";
  const TARGET_UTC=Date.parse("2026-09-07T22:00:00Z"),ADMIN_CODE="1337",ADMIN_CLICK_LIMIT=5,ADMIN_CLICK_WINDOW=1500;
  const $=id=>document.getElementById(id);
  const days=$("days"),hours=$("hours"),minutes=$("minutes"),seconds=$("seconds"),doorButton=$("doorButton"),lockTitle=$("lockTitle"),lockText=$("lockText"),message=$("message"),questPreview=$("questPreview"),adminModal=$("adminModal"),adminCode=$("adminCode"),adminSubmit=$("adminSubmit"),adminCancel=$("adminCancel"),adminError=$("adminError");
  let unlocked=false,timerId=null,clicks=0,firstClick=0;
  const pad=n=>String(Math.max(0,Math.floor(n))).padStart(2,"0");
  function msg(t){message.textContent=t;message.classList.add("show");clearTimeout(msg.t);msg.t=setTimeout(()=>message.classList.remove("show"),3000)}
  function update(){const r=TARGET_UTC-Date.now();if(r<=0){unlock("birthday");return}const t=Math.floor(r/1000);days.textContent=pad(t/86400);hours.textContent=pad((t%86400)/3600);minutes.textContent=pad((t%3600)/60);seconds.textContent=pad(t%60)}
  function unlock(reason){if(unlocked)return;unlocked=true;clearInterval(timerId);[days,hours,minutes,seconds].forEach(e=>e.textContent="00");doorButton.classList.add("unlocked");doorButton.setAttribute("aria-label","Open the door");lockTitle.textContent="THE DOOR IS READY";lockText.innerHTML=reason==="admin"?"Preview mode activated.<br>Click the door to begin the adventure.":"The right moment has arrived.<br>Click the door and begin the adventure.";if(reason==="admin")msg("Developer preview unlocked.")}
  function openAdmin(){adminModal.hidden=false;adminCode.value="";adminError.textContent="";setTimeout(()=>adminCode.focus(),20)}
  function closeAdmin(){adminModal.hidden=true;adminCode.value="";adminError.textContent="";clicks=0;firstClick=0}
  doorButton.addEventListener("click",()=>{if(!unlocked){const now=performance.now();if(!firstClick||now-firstClick>ADMIN_CLICK_WINDOW){firstClick=now;clicks=1}else clicks++;if(clicks>=ADMIN_CLICK_LIMIT){openAdmin();clicks=0;firstClick=0}else msg("The door is still locked...");return}if(questPreview.hidden){doorButton.style.pointerEvents="none";setTimeout(()=>questPreview.hidden=false,750)}});
  adminSubmit.addEventListener("click",()=>{if(adminCode.value.trim()===ADMIN_CODE){closeAdmin();unlock("admin")}else{adminError.textContent="Wrong code.";adminCode.select()}});
  adminCancel.addEventListener("click",closeAdmin);adminCode.addEventListener("keydown",e=>{if(e.key==="Enter")adminSubmit.click();if(e.key==="Escape")closeAdmin()});adminModal.addEventListener("click",e=>{if(e.target===adminModal)closeAdmin()});
  update();timerId=setInterval(update,250);
})();
