/* Quest VII — German Word Challenge */
'use strict';

const WORD_CHALLENGE_QUESTIONS = Object.freeze([
  { word: 'LÜFTEN', answers: ['To air out a room', 'To lock a room', 'To clean a window'], correct: 'A' },
  { word: 'GARDINE', answers: ['A carpet', 'A curtain', 'A blanket'], correct: 'B' },
  { word: 'PÜNKTLICH', answers: ['Very early', 'Extremely careful', 'On time'], correct: 'C' },
  { word: 'SCHMETTERLING', answers: ['A dragonfly', 'A grasshopper', 'A butterfly'], correct: 'C' },
  { word: 'SCHUBLADE', answers: ['A drawer', 'A shelf', 'A cupboard'], correct: 'A' },
  { word: 'GEMÜTLICH', answers: ['Quiet and empty', 'Cozy and comfortable', 'Expensive and luxurious'], correct: 'B' },
  { word: 'STUR', answers: ['Nervous and uncertain', 'Friendly and generous', 'Stubborn and unwilling to change'], correct: 'C' },
  { word: 'QUATSCH', answers: ['Nonsense or silly talk', 'A small snack', 'A difficult task'], correct: 'A' },
  { word: 'FEIERABEND', answers: ['A public holiday', 'A birthday celebration', 'The time after work when your working day is over'], correct: 'C' },
  { word: 'ZWICKMÜHLE', answers: ['A comfortable chair', 'A difficult situation with no easy choice', 'A noisy argument'], correct: 'B' }
]);
const WORD_CHALLENGE_KEY = 'duyguBirthdayQuestState_v1';

if (typeof document !== 'undefined') (function () {
  const $ = id => document.getElementById(id);
  const screen = $('wordChallengeScreen');
  const game = $('wordChallengeGame');
  const result = $('wordChallengeResult');
  const wordCounter = $('gwWordCounter');
  const scoreCounter = $('gwScoreCounter');
  const progress = $('gwProgress');
  const word = $('gwWord');
  const answers = Array.from(document.querySelectorAll('[data-gw-answer]'));
  const feedback = $('gwFeedback');
  const next = $('gwNextButton');
  const resultTitle = $('gwResultTitle');
  const resultMessage = $('gwResultMessage');
  const backToMap = $('gwBackToMap');
  if (!screen || !game || !result || !wordCounter || !scoreCounter || !progress || !word || answers.length !== 3 || !feedback || !next || !resultTitle || !resultMessage || !backToMap) return;

  let questionIndex = 0;
  let score = 0;
  let answered = false;
  let answerResults = [];
  let phase = 'INTRO';

  function setView(view) {
    game.hidden = view !== 'game';
    result.hidden = view !== 'result';
    screen.hidden = false;
  }

  function resultTier(value) {
    if (value === 10) return 'GERMAN MASTER!';
    if (value >= 8) return 'VERY IMPRESSIVE!';
    if (value >= 6) return 'GOOD JOB!';
    return 'KEEP LEARNING!';
  }

  function resetAnswerButtons() {
    answers.forEach(button => {
      button.classList.remove('selected-correct', 'selected-wrong');
      button.disabled = false;
      button.querySelector('.gw-answer-text').textContent = '';
    });
  }

  function renderProgress() {
    Array.from(progress.querySelectorAll('[data-gw-progress]')).forEach(segment => {
      const index = Number(segment.dataset.gwProgress);
      segment.classList.remove('progress-correct', 'progress-wrong', 'progress-current', 'progress-upcoming');
      if (answerResults[index] === 'correct') segment.classList.add('progress-correct');
      else if (answerResults[index] === 'wrong') segment.classList.add('progress-wrong');
      else if (index === questionIndex) segment.classList.add('progress-current');
      else segment.classList.add('progress-upcoming');
    });
    progress.setAttribute('aria-valuenow', String(questionIndex));
  }

  function renderQuestion() {
    const current = WORD_CHALLENGE_QUESTIONS[questionIndex];
    phase = 'QUESTION';
    answered = false;
    wordCounter.textContent = `WORD ${String(questionIndex + 1).padStart(2, '0')}/10`;
    scoreCounter.textContent = `SCORE ${score}/10`;
    word.textContent = current.word;
    resetAnswerButtons();
    answers.forEach((button, index) => { button.querySelector('.gw-answer-text').textContent = current.answers[index]; });
    feedback.textContent = '';
    next.disabled = true;
    next.hidden = true;
    renderProgress();
  }

  function chooseAnswer(button) {
    if (phase !== 'QUESTION' || answered) return;
    answered = true;
    phase = 'ANSWERED';
    const current = WORD_CHALLENGE_QUESTIONS[questionIndex];
    const choice = button.dataset.gwAnswer;
    const correctButton = answers.find(item => item.dataset.gwAnswer === current.correct);
    if (choice === current.correct) {
      score += 1;
      answerResults[questionIndex] = 'correct';
      button.classList.add('selected-correct');
      feedback.textContent = `✓ CORRECT!\n${current.word} = ${current.answers[current.correct.charCodeAt(0) - 65]}`;
    } else {
      answerResults[questionIndex] = 'wrong';
      button.classList.add('selected-wrong');
      correctButton?.classList.add('selected-correct');
      feedback.textContent = `✕ NOT QUITE!\nThe correct answer is: ${current.answers[current.correct.charCodeAt(0) - 65]}`;
    }
    answers.forEach(item => { item.disabled = true; });
    scoreCounter.textContent = `SCORE ${score}/10`;
    next.disabled = false;
    next.hidden = false;
  }

  function completeWordChallenge() {
    try {
      const saved = JSON.parse(localStorage.getItem(WORD_CHALLENGE_KEY) || '{}');
      const completed = Array.isArray(saved.completed) ? saved.completed.filter(Number.isInteger) : [];
      if (!completed.includes(7)) completed.push(7);
      localStorage.setItem(WORD_CHALLENGE_KEY, JSON.stringify({ completed: [...new Set(completed)].sort((a, b) => a - b) }));
    } catch {}
    phase = 'RESULT';
    resultTitle.textContent = resultTier(score);
    resultMessage.textContent = `${score}/10\nYOUR GERMAN LEVEL\n${score >= 8 ? '★ KEY UNLOCKED ★\nFAST VERDÄCHTIG' : '★ KEY UNLOCKED ★'}`;
    setView('result');
  }

  function nextWord() {
    if (phase !== 'ANSWERED') return;
    if (questionIndex === WORD_CHALLENGE_QUESTIONS.length - 1) { completeWordChallenge(); return; }
    questionIndex += 1;
    renderQuestion();
  }

  function start() {
    questionIndex = 0;
    score = 0;
    answered = false;
    answerResults = [];
    phase = 'INTRO';
    resultMessage.textContent = '';
    resetAnswerButtons();
    setView('game');
    renderQuestion();
  }

  answers.forEach(button => button.addEventListener('click', () => chooseAnswer(button)));
  next.addEventListener('click', nextWord);
  backToMap.addEventListener('click', () => { setView('game'); window.showQuestMap?.(); });
  window.showWordChallengeScreen = start;
})();

if (typeof module !== 'undefined' && module.exports) module.exports = { questions: WORD_CHALLENGE_QUESTIONS };
