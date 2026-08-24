(() => {
  "use strict";

  // 08 September 2026, 00:00 Europe/Berlin (CEST)
  const TARGET_UTC = Date.parse("2026-09-07T22:00:00Z");

  // Admin preview access:
  // 5 clicks on the locked door within 1.5 seconds, then code 1337.
  const ADMIN_CODE = "1337";
  const ADMIN_CLICK_LIMIT = 5;
  const ADMIN_CLICK_WINDOW = 1500;

  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");
  const doorButton = document.getElementById("doorButton");
  const doorState = document.getElementById("doorState");
  const doorHint = document.getElementById("doorHint");
  const message = document.getElementById("message");
  const questPreview = document.getElementById("questPreview");
  const enterButton = document.getElementById("enterButton");

  const adminModal = document.getElementById("adminModal");
  const adminCode = document.getElementById("adminCode");
  const adminSubmit = document.getElementById("adminSubmit");
  const adminCancel = document.getElementById("adminCancel");
  const adminError = document.getElementById("adminError");

  let unlocked = false;
  let timerId = null;
  let adminClicks = 0;
  let firstAdminClickAt = 0;

  function pad(value) {
    return String(Math.max(0, Math.floor(value))).padStart(2, "0");
  }

  function showMessage(text) {
    message.textContent = text;
    message.classList.add("show");
    window.clearTimeout(showMessage.timeout);
    showMessage.timeout = window.setTimeout(() => {
      message.classList.remove("show");
    }, 3500);
  }

  function updateCountdown() {
    const remaining = TARGET_UTC - Date.now();

    if (remaining <= 0) {
      unlockDoor("birthday");
      return;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  }

  function unlockDoor(reason) {
    if (unlocked) return;
    unlocked = true;

    window.clearInterval(timerId);
    timerId = null;

    daysEl.textContent = "00";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";

    doorButton.classList.add("unlocked");
    doorState.textContent = "UNLOCKED";
    doorHint.textContent = reason === "admin"
      ? "Preview mode active. Click the door to begin."
      : "The door is ready. Click it to begin.";

    doorButton.setAttribute("aria-label", "Open Duygu's birthday door");

    if (reason === "admin") {
      showMessage("Developer preview unlocked.");
    }
  }

  function openAdminModal() {
    adminModal.hidden = false;
    adminCode.value = "";
    adminError.textContent = "";
    window.setTimeout(() => adminCode.focus(), 30);
  }

  function closeAdminModal() {
    adminModal.hidden = true;
    adminCode.value = "";
    adminError.textContent = "";
    adminClicks = 0;
    firstAdminClickAt = 0;
  }

  function registerAdminClick() {
    if (unlocked) return;

    const now = performance.now();

    if (!firstAdminClickAt || now - firstAdminClickAt > ADMIN_CLICK_WINDOW) {
      firstAdminClickAt = now;
      adminClicks = 1;
      return;
    }

    adminClicks += 1;

    if (adminClicks >= ADMIN_CLICK_LIMIT) {
      openAdminModal();
      adminClicks = 0;
      firstAdminClickAt = 0;
    }
  }

  function submitAdminCode() {
    if (adminCode.value.trim() === ADMIN_CODE) {
      closeAdminModal();
      unlockDoor("admin");
      return;
    }

    adminError.textContent = "Wrong code.";
    adminCode.select();
  }

  doorButton.addEventListener("click", () => {
    if (!unlocked) {
      registerAdminClick();
      if (adminClicks > 0 && adminClicks < ADMIN_CLICK_LIMIT) {
        showMessage(`${ADMIN_CLICK_LIMIT - adminClicks} more...`);
      }
      if (adminModal.hidden) {
        showMessage("Not yet... the door is still locked.");
      }
      return;
    }

    if (questPreview.hidden) {
      doorButton.style.pointerEvents = "none";
      window.setTimeout(() => {
        questPreview.hidden = false;
      }, 650);
    }
  });

  adminSubmit.addEventListener("click", submitAdminCode);

  adminCancel.addEventListener("click", closeAdminModal);

  adminCode.addEventListener("keydown", (event) => {
    if (event.key === "Enter") submitAdminCode();
    if (event.key === "Escape") closeAdminModal();
  });

  adminModal.addEventListener("click", (event) => {
    if (event.target === adminModal) closeAdminModal();
  });

  enterButton.addEventListener("click", () => {
    questPreview.querySelector("h2").textContent = "Quest 1 is coming next.";
    questPreview.querySelector("p:not(.preview-kicker)").textContent =
      "The locked-door foundation is ready. Next we build the actual adventure.";
    enterButton.textContent = "BACK TO THE DOOR";
    enterButton.addEventListener("click", () => window.location.reload(), { once: true });
  });

  updateCountdown();
  timerId = window.setInterval(updateCountdown, 250);
})();
