(() => {
  'use strict';

  const VERSION = '1.0.2';
  const TARGET_MS = Date.parse('2026-09-08T00:00:00+02:00');
  const ADMIN_CODE = '1337';
  const CLICK_LIMIT = 5;
  const CLICK_WINDOW_MS = 1500;
  const STATE_KEY = 'duyguBirthdayQuestState_v1';
  const PREVIEW_SESSION_KEY = 'duyguBirthdayQuestPreview_v1';

  const $ = (id) => document.getElementById(id);
  const entrance = $('entrance');
  const questScreen = $('questScreen');
  const doorHit = $('doorHit');
  const returnDoor = $('returnDoor');
  const finalDoor = $('finalDoor');
  const modal = $('adminModal');
  const codeInput = $('adminCode');
  const unlockButton = $('unlock');
  const cancelButton = $('cancel');
  const error = $('error');
  const toast = $('toast');
  const lockTitle = $('lockTitle');
  const lockText = $('lockText');
  const countdown = {
    days: $('days'), hours: $('hours'), minutes: $('minutes'), seconds: $('seconds')
  };

  if (!entrance || !questScreen || !doorHit) return;

  const defaultState = { preview: false, completed: [] };
  let state = loadState();
  let countdownTimer = null;
  let clickCount = 0;
  let clickWindowStart = 0;

  function loadState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const sessionPreview = sessionStorage.getItem(PREVIEW_SESSION_KEY) === '1';
      return {
        preview: sessionPreview,
        completed: Array.isArray(parsed.completed) ? parsed.completed.filter(Number.isInteger) : []
      };
    } catch {
      return {...defaultState};
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({completed: state.completed}));
      if (state.preview) sessionStorage.setItem(PREVIEW_SESSION_KEY, '1');
      else sessionStorage.removeItem(PREVIEW_SESSION_KEY);
    } catch { /* private browsing */ }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function setCountdown(msRemaining) {
    const total = Math.max(0, Math.floor(msRemaining / 1000));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    countdown.days.textContent = String(days).padStart(2, '0');
    countdown.hours.textContent = String(hours).padStart(2, '0');
    countdown.minutes.textContent = String(minutes).padStart(2, '0');
    countdown.seconds.textContent = String(seconds).padStart(2, '0');
  }

  function isUnlocked() {
    return state.preview || Date.now() >= TARGET_MS;
  }

  function refreshCountdown() {
    const remaining = TARGET_MS - Date.now();
    setCountdown(remaining);
    if (remaining <= 0 || state.preview) {
      unlockEntrance();
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }
  }

  function unlockEntrance() {
    lockTitle.textContent = 'THE DOOR IS READY';
    lockText.innerHTML = 'The right moment has arrived.<br>Click the door and begin the adventure.';
  }

  function openPreviewModal() {
    modal.hidden = false;
    codeInput.value = '';
    error.textContent = '';
    requestAnimationFrame(() => codeInput.focus());
  }

  function closePreviewModal() {
    modal.hidden = true;
    codeInput.value = '';
    error.textContent = '';
  }

  function showQuestMap() {
    entrance.hidden = true;
    questScreen.hidden = false;
    document.title = `Duygu's Birthday Quest · v${VERSION}`;
    window.scrollTo(0, 0);
  }

  function showEntrance() {
    questScreen.hidden = true;
    entrance.hidden = false;
  }

  function handleDoorActivation(event) {
    event.preventDefault();
    const now = performance.now();
    if (!clickWindowStart || now - clickWindowStart > CLICK_WINDOW_MS) {
      clickWindowStart = now;
      clickCount = 1;
    } else {
      clickCount += 1;
    }

    if (clickCount >= CLICK_LIMIT) {
      clickCount = 0;
      clickWindowStart = 0;
      openPreviewModal();
      return;
    }

    if (!isUnlocked()) {
      showToast('The door is still locked...');
      return;
    }

    showQuestMap();
  }

  function completeQuest(questNumber) {
    if (questNumber !== 1) return;
    showToast('Quest I is ready. The first challenge will be added in v1.1.0.');
  }

  function handleQuestClick(button) {
    const number = Number(button.dataset.quest);
    if (number !== 1) {
      showToast('Complete the previous challenge to unlock this quest.');
      return;
    }
    completeQuest(number);
  }

  doorHit.addEventListener('pointerup', handleDoorActivation);
  doorHit.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') handleDoorActivation(event);
  });

  document.querySelectorAll('.quest-screen .hotspot[data-quest]').forEach((button) => {
    button.addEventListener('pointerup', (event) => {
      event.preventDefault();
      handleQuestClick(button);
    });
  });

  if (finalDoor) {
    finalDoor.addEventListener('pointerup', (event) => {
      event.preventDefault();
      const allKeys = state.completed.length === 7;
      if (!allKeys) showToast('Complete each challenge. Claim every key. Close the circle.');
    });
  }

  returnDoor.addEventListener('click', showEntrance);
  unlockButton.addEventListener('click', () => {
    if (codeInput.value.trim() !== ADMIN_CODE) {
      error.textContent = 'Wrong code.';
      codeInput.select();
      return;
    }
    state.preview = true;
    saveState();
    closePreviewModal();
    unlockEntrance();
    showToast('Developer preview unlocked.');
  });
  cancelButton.addEventListener('click', closePreviewModal);
  codeInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') unlockButton.click();
    if (event.key === 'Escape') closePreviewModal();
  });
  modal.addEventListener('pointerup', (event) => {
    if (event.target === modal) closePreviewModal();
  });

  refreshCountdown();
  countdownTimer = setInterval(refreshCountdown, 250);
})();
