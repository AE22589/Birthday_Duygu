(() => {
const TARGET=Date.parse("2026-09-07T22:00:00Z");
const ADMIN="1337",LIMIT=5,WINDOW=1500;
const $=id=>document.getElementById(id);
const d=$("days"),h=$("hours"),m=$("minutes"),s=$("seconds"),door=$("door"),toast=$("toast"),screen=$("questScreen"),modal=$("adminModal"),code=$("adminCode"),unlock=$("unlock"),cancel=$("cancel"),error=$("error"),title=$("lockTitle"),text=$("lockText");
let unlocked=false,clicks=0,first=0,timer;
const pad=n=>String(Math.max(0,Math.floor(n))).padStart(2,"0");
function update(){const r=TARGET-Date.now();if(r<=0){openDoor("birthday");return}const t=Math.floor(r/1000);d.textContent=pad(t/86400);h.textContent=pad(t%86400/3600);m.textContent=pad(t%3600/60);s.textContent=pad(t%60)}
function showToast(t){toast.textContent=t;toast.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove("show"),2200)}
function openDoor(reason){if(unlocked)return;unlocked=true;clearInterval(timer);[d,h,m,s].forEach(x=>x.textContent="00");title.textContent="THE DOOR IS READY";text.innerHTML=reason==="admin"?"Preview mode activated.<br>Click the door to begin the adventure.":"The right moment has arrived.<br>Click the door and begin the adventure."}
function openAdmin(){modal.hidden=false;code.value="";error.textContent="";setTimeout(()=>code.focus(),20)}
function closeAdmin(){modal.hidden=true;code.value="";error.textContent="";clicks=0;first=0}
door.addEventListener("click",(event)=>{
  event.preventDefault();
  if(!unlocked){
    const now=performance.now();
    if(!first||now-first>WINDOW){first=now;clicks=1}else clicks++;
    if(clicks>=LIMIT){openAdmin();clicks=0;first=0}
    else showToast("The door is still locked...");
    return;
  }
  screen.hidden=false;
  screen.scrollTop=0;
});
unlock.addEventListener("click",()=>{if(code.value.trim()===ADMIN){closeAdmin();openDoor("admin");showToast("Developer preview unlocked.")}else{error.textContent="Wrong code.";code.select()}});
cancel.addEventListener("click",closeAdmin);
code.addEventListener("keydown",e=>{if(e.key==="Enter")unlock.click();if(e.key==="Escape")closeAdmin()});
modal.addEventListener("click",e=>{if(e.target===modal)closeAdmin()});
update();timer=setInterval(update,250);
})();

// Mobile fallback: a quick touch sequence on the door opens the private preview.
let touchCount=0,touchStart=0;
door.addEventListener("touchend",(event)=>{
  event.preventDefault();
  const now=performance.now();
  if(!unlocked){
    if(!touchStart || now-touchStart>WINDOW){touchStart=now;touchCount=1}else touchCount++;
    if(touchCount>=LIMIT){openAdmin();touchCount=0;touchStart=0}
    else showToast("The door is still locked...");
  }else{
    screen.hidden=false;
    screen.scrollTop=0;
  }
},{passive:false});


// Quest map navigation
const backToDoor = document.getElementById("backToDoor");
const questStops = document.querySelectorAll(".quest-stop");
if (backToDoor) {
  backToDoor.addEventListener("click", () => {
    screen.hidden = true;
    window.scrollTo(0, 0);
  });
}
questStops.forEach(stop => {
  stop.addEventListener("click", () => {
    if (stop.classList.contains("locked")) {
      showToast("Complete the previous quest to unlock this one.");
      return;
    }
    showToast("Quest I is ready. The first challenge comes next.");
  });
});
