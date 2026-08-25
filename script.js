(() => {
  "use strict";

  const BIRTHDAY = new Date("2026-09-08T00:00:00+02:00");
  const PREVIEW_CODE = "1337";
  const PREVIEW_LIMIT = 5;
  const PREVIEW_WINDOW = 1500;
  const STORAGE_KEY = "duygu-birthday-quest-v1.0.1";

  const $ = (id) => document.getElementById(id);
  const entrance = $("entrance");
  const questMap = $("questMap");
  const doorButton = $("doorButton");
  const previewModal = $("previewModal");
  const previewCode = $("previewCode");
  const previewError = $("previewError");
  const finalDoor = $("finalDoor");
  const questModal = $("questModal");
  const state = loadState();

  let clickTimes = [];

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (parsed && typeof parsed === "object") return parsed;
    } catch (_) {}
    return { preview: false, keys: 0 };
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function show(screen) {
    entrance.hidden = screen !== "entrance";
    questMap.hidden = screen !== "map";
  }

  function updateCountdown() {
    const remaining = BIRTHDAY.getTime() - Date.now();
    if (remaining <= 0) {
      $("days").textContent = "00";
      $("hours").textContent = "00";
      $("minutes").textContent = "00";
      $("seconds").textContent = "00";
      $("lockTitle").textContent = "THE DOOR IS READY";
      $("lockText").textContent = "The hour has come. Open the door and begin the adventure.";
      return;
    }
    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    $("days").textContent = String(days).padStart(2,"0");
    $("hours").textContent = String(hours).padStart(2,"0");
    $("minutes").textContent = String(minutes).padStart(2,"0");
    $("seconds").textContent = String(seconds).padStart(2,"0");
  }

  function birthdayReached() {
    return Date.now() >= BIRTHDAY.getTime();
  }

  function showPreviewModal() {
    previewError.textContent = "";
    previewCode.value = "";
    previewModal.hidden = false;
    setTimeout(() => previewCode.focus(), 0);
  }

  function closePreviewModal() {
    previewModal.hidden = true;
  }

  function unlockPreview() {
    if (previewCode.value.trim() !== PREVIEW_CODE) {
      previewError.textContent = "ACCESS DENIED.";
      previewCode.select();
      return;
    }
    state.preview = true;
    saveState();
    closePreviewModal();
    openMap();
  }

  function openMap() {
    show("map");
    updateMap();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function openDoor() {
    if (birthdayReached() || state.preview) {
      openMap();
    }
  }

  function registerRapidDoorTap() {
    const now = performance.now();
    clickTimes = clickTimes.filter(t => now - t <= PREVIEW_WINDOW);
    clickTimes.push(now);
    if (clickTimes.length >= PREVIEW_LIMIT) {
      clickTimes = [];
      showPreviewModal();
    }
  }

  function updateMap() {
    const nodes = document.querySelectorAll(".quest-node");
    nodes.forEach((node) => {
      const quest = Number(node.dataset.quest);
      node.classList.toggle("active", quest === state.keys + 1 && state.keys < 7);
      node.classList.toggle("locked", quest > state.keys + 1);
    });

    $("keyCount").textContent = String(state.keys);
    $("questStatus").textContent =
      state.keys >= 7 ? "ALL KEYS FOUND — FINAL DOOR READY" :
      `QUEST ${state.keys + 1} READY`;
    finalDoor.setAttribute("aria-label",
      state.keys >= 7 ? "Final Door, unlocked" : "Final Door, locked");
  }

  function openQuest(quest) {
    if (quest !== state.keys + 1) {
      if (quest > state.keys + 1) {
        $("questStatus").textContent = "COMPLETE THE PREVIOUS CHALLENGE FIRST";
      }
      return;
    }
    if (quest !== 1) return;
    questModal.hidden = false;
  }

  // Shared pointer event for mouse + touch.
  doorButton.addEventListener("pointerup", (event) => {
    event.preventDefault();
    if (birthdayReached() || state.preview) {
      openDoor();
    } else {
      registerRapidDoorTap();
    }
  });

  doorButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (birthdayReached() || state.preview) openDoor();
      else registerRapidDoorTap();
    }
  });

  $("previewUnlock").addEventListener("click", unlockPreview);
  $("previewCancel").addEventListener("click", closePreviewModal);
  previewCode.addEventListener("keydown", (event) => {
    if (event.key === "Enter") unlockPreview();
    if (event.key === "Escape") closePreviewModal();
  });

  $("returnDoor").addEventListener("click", () => show("entrance"));
  $("questClose").addEventListener("click", () => { questModal.hidden = true; });

  document.querySelectorAll(".quest-node").forEach(node => {
    const activate = () => openQuest(Number(node.dataset.quest));
    node.addEventListener("pointerup", activate);
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });

  finalDoor.addEventListener("pointerup", (event) => {
    event.preventDefault();
    if (state.keys >= 7) {
      $("questStatus").textContent = "THE FINAL DOOR IS OPEN";
    } else {
      $("questStatus").textContent = "THE CIRCLE MUST CLOSE — 7 KEYS REQUIRED";
    }
  });

  updateCountdown();
  setInterval(updateCountdown, 1000);
  updateMap();
})();
