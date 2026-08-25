(() => {
  'use strict';

  const VERSION = '1.0.10';
  const TARGET_MS = Date.parse('2026-09-08T00:00:00+02:00');
  const ADMIN_CODE = '1337';
  const CLICK_LIMIT = 5;
  const CLICK_WINDOW_MS = 2500;
  const STATE_KEY = 'duyguBirthdayQuestState_v1';

  const $ = (id) => document.getElementById(id);
  const entrance = $('entrance');
  const questScreen = $('questScreen');
  const doorHit = $('doorHit');
  const questMap = $('questMap');
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

  if (!entrance || !questScreen || !doorHit || !questMap) return;

  const defaultState = { completed: [] };
  let previewGranted = false;
  let state = loadState();
  let countdownTimer = null;
  let clickCount = 0;
  let clickWindowStart = 0;

  function loadState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        completed: Array.isArray(parsed.completed)
          ? parsed.completed.filter(Number.isInteger)
          : []
      };
    } catch {
      return {...defaultState};
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({completed: state.completed}));
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

  function isMobileViewport() {
    return window.matchMedia('(max-width: 700px)').matches;
  }

  function syncMapViewport() {
    // One SVG, two intrinsic coordinate systems. The artwork, clips, rings and
    // hit targets therefore always scale together as a single unit.
    questMap.setAttribute('viewBox', isMobileViewport() ? '0 0 322 696' : '0 0 1672 941');
  }

  function isUnlocked() {
    return previewGranted || Date.now() >= TARGET_MS;
  }

  function refreshCountdown() {
    const remaining = TARGET_MS - Date.now();
    setCountdown(remaining);
    if (remaining <= 0) {
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
    clickCount = 0;
    clickWindowStart = 0;
    modal.hidden = false;
    codeInput.value = '';
    error.textContent = '';
    requestAnimationFrame(() => codeInput.focus());
  }

  function closePreviewModal() {
    modal.hidden = true;
    clickCount = 0;
    clickWindowStart = 0;
    codeInput.value = '';
    error.textContent = '';
  }

  function showQuestMap() {
    if (!isUnlocked()) {
      showToast('The door is still locked...');
      return;
    }
    syncMapViewport();
    entrance.hidden = true;
    questScreen.hidden = false;
    document.title = "Duygu's Birthday Quest";
  }

  function showEntrance() {
    questScreen.hidden = true;
    modal.hidden = true;
    entrance.hidden = false;
    previewGranted = false;
    refreshCountdown();
  }

  function handleDoorActivation(event) {
    if (modal && !modal.hidden) return;
    if (event) event.preventDefault();

    if (isUnlocked()) {
      showQuestMap();
      return;
    }

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

    showToast(`The door remains sealed. ${CLICK_LIMIT - clickCount} more taps...`);
  }

  function completeQuest(questNumber) {
    if (questNumber !== 1) return;
    showToast('Quest I is ready. The first challenge will be added in v1.1.0.');
  }

  function handleQuestActivation(target) {
    const number = Number(target.dataset.quest);
    if (!Number.isInteger(number)) return;
    if (number !== 1) {
      showToast('Complete the previous challenge to unlock this quest.');
      return;
    }
    completeQuest(number);
  }

  // One pointer event handles mouse and touch. Keyboard activation is handled
  // separately so the secret gate remains deterministic and cannot double-count.
  doorHit.addEventListener('pointerup', handleDoorActivation);
  doorHit.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') handleDoorActivation(event);
  });

  const mapShell = document.querySelector('.map-shell');
  document.querySelectorAll('.quest-hit[data-quest]').forEach((hit) => {
    hit.addEventListener('pointerup', (event) => {
      event.preventDefault();
      handleQuestActivation(hit);
    });
    hit.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleQuestActivation(hit);
      }
    });
  });

  const activeHits = document.querySelectorAll('.active-hit[data-quest="1"]');
  activeHits.forEach((hit) => {
    hit.addEventListener('pointerenter', () => mapShell?.classList.add('is-hover'));
    hit.addEventListener('pointerleave', () => mapShell?.classList.remove('is-hover'));
    hit.addEventListener('focus', () => mapShell?.classList.add('is-hover'));
    hit.addEventListener('blur', () => mapShell?.classList.remove('is-hover'));
  });

  document.querySelectorAll('.final-hit[data-final="true"]').forEach((hit) => {
    const openFinalDoor = (event) => {
      if (event) event.preventDefault();
      const allKeys = state.completed.length === 7;
      if (!allKeys) showToast('Complete each challenge. Claim every key. Close the circle.');
    };
    hit.addEventListener('pointerup', openFinalDoor);
    hit.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') openFinalDoor(event);
    });
  });

  document.querySelectorAll('.return-hit[data-return="true"]').forEach((hit) => {
    const goBack = (event) => {
      if (event) event.preventDefault();
      showEntrance();
    };
    hit.addEventListener('pointerup', goBack);
    hit.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') goBack(event);
    });
  });

  unlockButton.addEventListener('click', () => {
    if (codeInput.value.trim() !== ADMIN_CODE) {
      error.textContent = 'Wrong code.';
      codeInput.select();
      return;
    }
    previewGranted = true;
    closePreviewModal();
    unlockEntrance();
    showQuestMap();
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

  const mediaQuery = window.matchMedia('(max-width: 700px)');
  const handleViewportChange = () => syncMapViewport();
  if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', handleViewportChange);
  else mediaQuery.addListener(handleViewportChange);
  window.addEventListener('resize', syncMapViewport, {passive: true});

  syncMapViewport();
  refreshCountdown();
  countdownTimer = setInterval(refreshCountdown, 250);
})();
