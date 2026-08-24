(() => {
const TARGET=Date.parse("2026-09-07T22:00:00Z"),ADMIN="1337",LIMIT=5,WINDOW=1500;
const $=id=>document.getElementById(id),d=$("days"),h=$("hours"),m=$("minutes"),s=$("seconds"),door=$("door"),msg=$("message"),quests=$("quests"),modal=$("admin"),code=$("code"),unlockBtn=$("unlock"),cancel=$("cancel"),err=$("error"),title=$("lockTitle"),text=$("lockText");
let unlocked=false,clicks=0,first=0,timer;
const pad=n=>String(Math.max(0,Math.floor(n))).padStart(2,"0");
function update(){let r=TARGET-Date.now();if(r<=0){unlock("birthday");return}let t=Math.floor(r/1000);d.textContent=pad(t/86400);h.textContent=pad(t%86400/3600);m.textContent=pad(t%3600/60);s.textContent=pad(t%60)}
function toast(t){msg.textContent=t;msg.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>msg.classList.remove("show"),2200)}
function unlock(reason){if(unlocked)return;unlocked=true;clearInterval(timer);[d,h,m,s].forEach(x=>x.textContent="00");title.textContent="THE DOOR IS READY";text.innerHTML=reason==="admin"?"Preview mode activated.<br>Click the door to begin the adventure.":"The right moment has arrived.<br>Click the door and begin the adventure."}
function openAdmin(){modal.hidden=false;code.value="";err.textContent="";setTimeout(()=>code.focus(),30)}
function closeAdmin(){modal.hidden=true;code.value="";err.textContent="";clicks=0;first=0}
door.addEventListener("click",()=>{if(!unlocked){let now=performance.now();if(!first||now-first>WINDOW){first=now;clicks=1}else clicks++;if(clicks>=LIMIT){openAdmin();clicks=0;first=0}else toast("The door is still locked...");return}quests.hidden=false});
unlockBtn.addEventListener("click",()=>{if(code.value.trim()===ADMIN){closeAdmin();unlock("admin");toast("Developer preview unlocked.")}else{err.textContent="Wrong code.";code.select()}});
cancel.addEventListener("click",closeAdmin);code.addEventListener("keydown",e=>{if(e.key==="Enter")unlockBtn.click();if(e.key==="Escape")closeAdmin()});modal.addEventListener("click",e=>{if(e.target===modal)closeAdmin()});
update();timer=setInterval(update,250);
})();