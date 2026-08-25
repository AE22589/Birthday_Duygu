(() => {
  'use strict';

  const CONFIG = Object.freeze({
    birthdayAt: '2026-09-08T00:00:00+02:00',
    adminCode: '1337',
    adminClicks: 5,
    adminWindowMs: 1500,
    stateKey: 'duyguBirthdayQuestStateV1'
  });

  const $ = id => document.getElementById(id);
  const els = {
    days: $('days'), hours: $('hours'), minutes: $('minutes'), seconds: $('seconds'),
    door: $('doorHit'), entrance: $('entrance'), questScreen: $('questScreen'),
    lockTitle: $('lockTitle'), lockText: $('lockText'), modal: $('adminModal'),
    adminCode: $('adminCode'), unlock: $('unlock'), cancel: $('cancel'), error: $('error'),
    toast: $('toast'), back: $('backToDoor'), keyCount: $('keyCount'), finalDoor: $('finalDoor')
  };

  const questNodes = [...document.querySelectorAll('.quest-node')];
  const targetTime = new Date(CONFIG.birthdayAt).getTime();
  let countdownTimer = null;
  let previewUnlocked = false;
  let rapidClicks = 0;
  let rapidStart = 0;
  let toastTimer = null;

  function pad(value) { return String(Math.max(0, Math.floor(value))).padStart(2, '0'); }

  function renderCountdown() {
    const remaining = targetTime - Date.now();
    if (remaining <= 0) {
      unlockDoor('birthday');
      return;
    }
    const total = Math.floor(remaining / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    els.days.textContent = pad(days);
    els.hours.textContent = pad(hours);
    els.minutes.textContent = pad(minutes);
    els.seconds.textContent = pad(seconds);
  }

  function unlockDoor(reason) {
    previewUnlocked = true;
    if (countdownTimer) clearInterval(countdownTimer);
    els.days.textContent = '00'; els.hours.textContent = '00'; els.minutes.textContent = '00'; els.seconds.textContent = '00';
    els.lockTitle.textContent = 'THE DOOR IS READY';
    els.lockText.innerHTML = reason === 'admin'
      ? 'Preview mode is active.<br>Click the door to enter the adventure.'
      : 'The appointed hour has arrived.<br>Click the door and begin the adventure.';
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2100);
  }

  function openAdmin() {
    els.modal.hidden = false;
    els.adminCode.value = '';
    els.error.textContent = '';
    setTimeout(() => els.adminCode.focus(), 30);
  }

  function closeAdmin() {
    els.modal.hidden = true;
    els.adminCode.value = '';
    els.error.textContent = '';
    rapidClicks = 0;
    rapidStart = 0;
  }

  function handleDoorPress(event) {
    event.preventDefault();
    if (els.modal.hidden === false) return;

    if (!previewUnlocked) {
      const now = performance.now();
      if (!rapidStart || now - rapidStart > CONFIG.adminWindowMs) {
        rapidStart = now;
        rapidClicks = 1;
      } else {
        rapidClicks += 1;
      }
      if (rapidClicks >= CONFIG.adminClicks) {
        openAdmin();
      } else {
        showToast('The door remains sealed.');
      }
      return;
    }

    els.questScreen.hidden = false;
    document.body.classList.add('quest-open');
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(CONFIG.stateKey);
      if (!raw) return { keys: [] };
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.keys)) return { keys: [] };
      return { keys: parsed.keys.filter(n => Number.isInteger(n) && n >= 1 && n <= 7) };
    } catch {
      return { keys: [] };
    }
  }

  function saveState(state) {
    try { localStorage.setItem(CONFIG.stateKey, JSON.stringify(state)); } catch { /* storage may be disabled */ }
  }

  function renderQuestState() {
    const state = loadState();
    els.keyCount.textContent = state.keys.length;
    questNodes.forEach(node => {
      const n = Number(node.dataset.quest);
      const completed = state.keys.includes(n);
      const available = n === 1 || state.keys.includes(n - 1);
      node.classList.toggle('active', available && !completed);
      node.classList.toggle('locked', !available && !completed);
      node.classList.toggle('complete', completed);
      const small = node.querySelector('small');
      if (small) small.textContent = completed ? 'KEY FOUND' : available ? 'READY' : 'LOCKED';
    });

    const complete = state.keys.length === 7;
    els.finalDoor.classList.toggle('openable', complete);
    els.finalDoor.setAttribute('aria-disabled', String(!complete));
  }

  function handleQuestNode(node) {
    const n = Number(node.dataset.quest);
    const state = loadState();
    const available = n === 1 || state.keys.includes(n - 1);
    if (!available) {
      showToast('The path is sealed. Complete the previous challenge.');
      return;
    }
    if (state.keys.includes(n)) {
      showToast(`Key ${n} is already yours.`);
      return;
    }
    if (n === 1) {
      showToast('Quest I is ready. The first challenge awaits.');
    } else {
      showToast(`Quest ${n} is ready.`);
    }
  }

  els.door.addEventListener('pointerup', handleDoorPress);
  els.unlock.addEventListener('click', () => {
    if (els.adminCode.value.trim() === CONFIG.adminCode) {
      closeAdmin();
      unlockDoor('admin');
      showToast('Developer preview unlocked.');
    } else {
      els.error.textContent = 'Wrong code.';
      els.adminCode.select();
    }
  });
  els.cancel.addEventListener('click', closeAdmin);
  els.adminCode.addEventListener('keydown', event => {
    if (event.key === 'Enter') els.unlock.click();
    if (event.key === 'Escape') closeAdmin();
  });
  els.modal.addEventListener('click', event => { if (event.target === els.modal) closeAdmin(); });
  els.back.addEventListener('click', () => {
    els.questScreen.hidden = true;
    document.body.classList.remove('quest-open');
  });
  questNodes.forEach(node => {
    node.addEventListener('click', () => handleQuestNode(node));
    node.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleQuestNode(node); }
    });
  });
  els.finalDoor.addEventListener('click', () => {
    const state = loadState();
    if (state.keys.length < 7) showToast('The circle is not closed. Seven keys are required.');
  });

  renderQuestState();
  renderCountdown();
  countdownTimer = setInterval(renderCountdown, 250);
})();
