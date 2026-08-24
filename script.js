(() => {
const TARGET_UTC=Date.parse("2026-09-07T22:00:00Z"),ADMIN_CODE="1337",LIMIT=5,WINDOW=1500;
const $=id=>document.getElementById(id),days=$("days"),hours=$("hours"),minutes=$("minutes"),seconds=$("seconds"),door=$("doorButton"),title=$("lockTitle"),text=$("lockText"),message=$("message"),preview=$("questPreview"),modal=$("adminModal"),code=$("adminCode"),submit=$("adminSubmit"),cancel=$("adminCancel"),error=$("adminError");
let unlocked=false,timer,clicks=0,first=0;
const pad=n=>String(Math.max(0,Math.floor(n))).padStart(2,"0");
function msg(t){message.textContent=t;message.classList.add("show");clearTimeout(msg.t);msg.t=setTimeout(()=>message.classList.remove("show"),3000)}
function update(){let r=TARGET_UTC-Date.now();if(r<=0){unlock("birthday");return}let t=Math.floor(r/1000);days.textContent=pad(t/86400);hours.textContent=pad(t%86400/3600);minutes.textContent=pad(t%3600/60);seconds.textContent=pad(t%60)}
function unlock(reason){if(unlocked)return;unlocked=true;clearInterval(timer);[days,hours,minutes,seconds].forEach(e=>e.textContent="00");door.classList.add("unlocked");title.textContent="THE DOOR IS READY";text.innerHTML=reason==="admin"?"Preview mode activated.<br>Click the door to begin the adventure.":"The right moment has arrived.<br>Click the door and begin the adventure.";if(reason==="admin")msg("Developer preview unlocked.")}
function openAdmin(){modal.hidden=false;code.value="";error.textContent="";setTimeout(()=>code.focus(),20)}
function closeAdmin(){modal.hidden=true;code.value="";error.textContent="";clicks=0;first=0}
door.addEventListener("click",()=>{if(!unlocked){let now=performance.now();if(!first||now-first>WINDOW){first=now;clicks=1}else clicks++;if(clicks>=LIMIT){openAdmin();clicks=0;first=0}else msg("The door is still locked...");return}if(preview.hidden){door.style.pointerEvents="none";setTimeout(()=>preview.hidden=false,750)}});
submit.addEventListener("click",()=>{if(code.value.trim()===ADMIN_CODE){closeAdmin();unlock("admin")}else{error.textContent="Wrong code.";code.select()}});
cancel.addEventListener("click",closeAdmin);code.addEventListener("keydown",e=>{if(e.key==="Enter")submit.click();if(e.key==="Escape")closeAdmin()});modal.addEventListener("click",e=>{if(e.target===modal)closeAdmin()});
update();timer=setInterval(update,250);
})();
