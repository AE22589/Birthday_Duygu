(() => {
  "use strict";

  // September 8, 2026 at 00:00 in Europe/Berlin (CEST = UTC+2).
  const TARGET = Date.parse("2026-09-07T22:00:00Z");
  const ADMIN_CODE = "1337";
  const REQUIRED_CLICKS = 5;
  const CLICK_WINDOW_MS = 1500;

  const $ = (id) => document.getElementById(id);

  const days = $("days");
  const hours = $("hours");
  const minutes = $("minutes");
  const seconds = $("seconds");
  const door = $("door");
  const toast = $("toast");
  const questScreen = $("questScreen");
  const adminModal = $("adminModal");
  const adminCode = $("adminCode");
  const adminUnlock = $("unlock");
  const adminCancel = $("cancel");
  const adminError = $("error");
  const lockTitle = $("lockTitle");
  const lockText = $("lockText");
  const backToDoor = $("backToDoor");
  const questStops = document.querySelectorAll(".quest-stop");

  let unlocked = false;
  let countdownTimer = null;
  let clickCount = 0;
  let firstClickAt = 0;

  function pad(value) {
    return String(Math.max(0, Math.floor(value))).padStart(2, "0");
  }

  function updateCountdown() {
    const remaining = TARGET - Date.now();

    if (remaining <= 0) {
      unlockAdventure("birthday");
      return;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const dayCount = Math.floor(totalSeconds / 86400);
    const hourCount = Math.floor((totalSeconds % 86400) / 3600);
    const minuteCount = Math.floor((totalSeconds % 3600) / 60);
    const secondCount = totalSeconds % 60;

    days.textContent = pad(dayCount);
    hours.textContent = pad(hourCount);
    minutes.textContent = pad(minuteCount);
    seconds.textContent = pad(secondCount);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  }

  function unlockAdventure(reason) {
    if (unlocked) return;

    unlocked = true;
    clearInterval(countdownTimer);
    countdownTimer = null;

    days.textContent = "00";
    hours.textContent = "00";
    minutes.textContent = "00";
    seconds.textContent = "00";

    lockTitle.textContent = "THE DOOR IS READY";
    lockText.innerHTML = reason === "admin"
      ? "Preview mode activated.<br>Click the door to begin the adventure."
      : "The right moment has arrived.<br>Click the door and begin the adventure.";
  }

  function openQuestMap() {
    questScreen.hidden = false;
    questScreen.scrollTop = 0;
  }

  function registerDoorClick() {
    if (unlocked) {
      openQuestMap();
      return;
    }

    const now = performance.now();

    if (!firstClickAt || now - firstClickAt > CLICK_WINDOW_MS) {
      firstClickAt = now;
      clickCount = 1;
    } else {
      clickCount += 1;
    }

    if (clickCount >= REQUIRED_CLICKS) {
      clickCount = 0;
      firstClickAt = 0;
      openAdmin();
    } else {
      showToast("The door is still locked...");
    }
  }

  function openAdmin() {
    adminModal.hidden = false;
    adminCode.value = "";
    adminError.textContent = "";
    setTimeout(() => adminCode.focus(), 30);
  }

  function closeAdmin() {
    adminModal.hidden = true;
    adminCode.value = "";
    adminError.textContent = "";
    clickCount = 0;
    firstClickAt = 0;
  }

  door.addEventListener("click", (event) => {
    event.preventDefault();
    registerDoorClick();
  });

  // Explicit touch handling for phones/tablets.
  // The click event is still used on desktop; this prevents a touch device
  // from depending on browser-specific delayed click behaviour.
  let lastTouchAt = 0;
  door.addEventListener("touchend", (event) => {
    event.preventDefault();
    const now = performance.now();
    if (now - lastTouchAt < 350) return;
    lastTouchAt = now;
    registerDoorClick();
  }, { passive: false });

  adminUnlock.addEventListener("click", () => {
    if (adminCode.value.trim() === ADMIN_CODE) {
      closeAdmin();
      unlockAdventure("admin");
      showToast("Developer preview unlocked.");
    } else {
      adminError.textContent = "Wrong code.";
      adminCode.select();
    }
  });

  adminCancel.addEventListener("click", closeAdmin);

  adminCode.addEventListener("keydown", (event) => {
    if (event.key === "Enter") adminUnlock.click();
    if (event.key === "Escape") closeAdmin();
  });

  adminModal.addEventListener("click", (event) => {
    if (event.target === adminModal) closeAdmin();
  });

  backToDoor.addEventListener("click", () => {
    questScreen.hidden = true;
    window.scrollTo(0, 0);
  });

  questStops.forEach((stop) => {
    stop.addEventListener("click", () => {
      if (stop.classList.contains("locked")) {
        showToast("Complete the previous quest to unlock this one.");
        return;
      }
      showToast("Quest I is ready. The first challenge comes next.");
    });
  });

  // Start immediately and then update four times per second.
  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 250);
})();
