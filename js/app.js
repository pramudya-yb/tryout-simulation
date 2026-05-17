/**
 * app.js
 * Main application controller for Simulasi Psikotes Gratis.
 *
 * Fokus file ini:
 * - alur aplikasi
 * - start test
 * - render soal
 * - timer
 * - navigasi
 * - autosave
 * - finish logic
 *
 * Render hasil dipindahkan ke:
 * - js/result-renderer.js
 *
 * Interpretasi hasil dipindahkan ke:
 * - js/result-interpreter.js
 */

/* ================================================
   STATE
================================================ */
let APP = {
  manifest: null,

  selectedSetId: null,
  selectedCategoryId: null,

  questions: [],
  answers: {},
  currentIndex: 0,

  totalSeconds: 0,
  remainingSeconds: 0,

  isFullMix: false,
  fullMixSubtests: [],
  fullMixSubtestIndex: 0,
  fullMixAnswers: {},
  subtestLocked: [],

  started: false,
  finished: false
};

const APP_STORAGE_KEY = 'simulasi_psikotes_session_v1';

/* ================================================
   SCREEN MANAGEMENT
================================================ */
const SCREENS = [
  'screen-home',
  'screen-instruction',
  'screen-test',
  'screen-result',
  'screen-empty',
  'screen-subtest-transition'
];

function showScreen(id) {
  SCREENS.forEach(screenId => {
    const el = document.getElementById(screenId);
    if (el) el.classList.toggle('hidden', screenId !== id);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================================================
   INIT
================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    APP.manifest = await DataLoader.loadManifest();
  } catch (error) {
    console.error(error);
    showToast('Gagal memuat manifest. Pastikan data/manifest.json tersedia dan valid.', 'danger');
  }

  _buildSetTabs();
  _bindNavEvents();
  _buildConfirmModal();
  _checkResumable();

  showScreen('screen-home');
});

/* ================================================
   BASIC HELPERS
================================================ */
function _bindId(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}

function _safeText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function _getCategoryLabel() {
  return _categoryLabelById(APP.selectedCategoryId);
}

function _categoryLabelById(categoryId) {
  if (!APP.manifest || !APP.manifest.categories) return categoryId || '-';

  const cat = APP.manifest.categories.find(c => c.id === categoryId);
  return cat ? cat.label : categoryId;
}

function _getCategoryById(categoryId) {
  if (!APP.manifest || !APP.manifest.categories) return null;

  return APP.manifest.categories.find(c => c.id === categoryId) || null;
}

function _getSetById(setId) {
  if (!APP.manifest || !APP.manifest.sets) return null;

  return APP.manifest.sets.find(s => s.id === setId) || null;
}

function _isAnsweredValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function _escapeHtml(text) {
  if (text === null || text === undefined) return '';

  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* ================================================
   NAVIGATION / NAVBAR
================================================ */
function _bindNavEvents() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('open');
      toggle.classList.toggle('open');
    });
  }

  document.querySelectorAll('#nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
      if (menu) menu.classList.remove('open');
      if (toggle) toggle.classList.remove('open');
    });
  });

  _bindId('btn-hero-start', () => {
    const el = document.getElementById('section-packages');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });

  _bindId('btn-hero-fullmix', () => selectSet('set0'));
  _bindId('btn-result-restart', restartTest);
  _bindId('btn-result-home', goHome);
  _bindId('btn-result-review', () => showScreen('screen-home'));
  _bindId('btn-empty-home', goHome);
  _bindId('btn-next-subtest', startNextSubtest);
}

/* ================================================
   TOAST
================================================ */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      right: 18px;
      top: 80px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 360px;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  const colors = {
    info: '#1e3a5f',
    success: '#0f766e',
    warning: '#b45309',
    danger: '#b91c1c'
  };

  toast.style.cssText = `
    background: #ffffff;
    color: ${colors[type] || colors.info};
    border-left: 5px solid ${colors[type] || colors.info};
    border-radius: 10px;
    padding: 12px 14px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
    font-size: 0.9rem;
    line-height: 1.5;
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(10px)';
    toast.style.transition = '0.2s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

/* ================================================
   CONFIRM MODAL
================================================ */
function _buildConfirmModal() {
  if (document.getElementById('confirm-modal')) return;

  const overlay = document.createElement('div');
  overlay.id = 'confirm-modal';
  overlay.style.cssText = [
    'display:none',
    'position:fixed',
    'inset:0',
    'background:rgba(0,0,0,0.45)',
    'z-index:10000',
    'align-items:center',
    'justify-content:center',
    'padding:1.25rem'
  ].join(';');

  overlay.innerHTML = `
    <div style="
      background:#fff;
      border-radius:14px;
      padding:2rem;
      max-width:460px;
      width:100%;
      box-shadow:0 8px 32px rgba(30,58,95,0.18);
      font-family:inherit;
    ">
      <h3 id="modal-title" style="
        font-size:1.1rem;
        color:#1e3a5f;
        margin-bottom:0.75rem;
        line-height:1.4;
      "></h3>
      <p id="modal-body" style="
        font-size:0.92rem;
        color:#6b7c93;
        margin-bottom:1.5rem;
        line-height:1.6;
      "></p>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;justify-content:flex-end;">
        <button id="modal-cancel" style="
          padding:0.65rem 1.15rem;
          border-radius:8px;
          border:1px solid #d8dee8;
          background:#f4f7fb;
          color:#1e3a5f;
          font-weight:600;
          font-size:0.9rem;
          cursor:pointer;
        "></button>
        <button id="modal-confirm" style="
          padding:0.65rem 1.15rem;
          border-radius:8px;
          border:none;
          background:#1e3a5f;
          color:#fff;
          font-weight:600;
          font-size:0.9rem;
          cursor:pointer;
        "></button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function showConfirmModal(title, body, cancelLabel, confirmLabel, onConfirm, onCancel) {
  const modal = document.getElementById('confirm-modal');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const cancelBtn = document.getElementById('modal-cancel');
  const confirmBtn = document.getElementById('modal-confirm');

  if (!modal || !titleEl || !bodyEl || !cancelBtn || !confirmBtn) {
    const yes = window.confirm(`${title}\n\n${body}`);
    if (yes && typeof onConfirm === 'function') onConfirm();
    if (!yes && typeof onCancel === 'function') onCancel();
    return;
  }

  titleEl.textContent = title;
  bodyEl.textContent = body;
  cancelBtn.textContent = cancelLabel;
  confirmBtn.textContent = confirmLabel;

  modal.style.display = 'flex';

  const newCancel = cancelBtn.cloneNode(true);
  const newConfirm = confirmBtn.cloneNode(true);

  cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
  confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);

  newCancel.addEventListener('click', () => {
    modal.style.display = 'none';
    if (typeof onCancel === 'function') onCancel();
  });

  newConfirm.addEventListener('click', () => {
    modal.style.display = 'none';
    if (typeof onConfirm === 'function') onConfirm();
  });

  modal.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
      if (typeof onCancel === 'function') onCancel();
    }
  };
}

/* ================================================
   HOME — SET TABS & CATEGORY CARDS
================================================ */
function _buildSetTabs() {
  const container = document.getElementById('set-tabs');
  if (!container || !APP.manifest || !APP.manifest.sets) return;

  container.innerHTML = '';

  const practiceSets = APP.manifest.sets.filter(set => set.type === 'practice');

  practiceSets.forEach(set => {
    const btn = document.createElement('button');
    btn.className = 'set-tab';
    btn.dataset.setId = set.id;
    btn.textContent = `${set.label} — ${set.labelId || set.id}`;

    btn.addEventListener('click', () => {
      document.querySelectorAll('.set-tab').forEach(item => item.classList.remove('active'));
      btn.classList.add('active');
      _renderCategoryCards(set.id);
    });

    container.appendChild(btn);
  });

  const first = container.querySelector('.set-tab');

  if (first) {
    first.classList.add('active');
    _renderCategoryCards(first.dataset.setId);
  }
}

function _renderCategoryCards(setId) {
  const container = document.getElementById('category-cards');
  if (!container || !APP.manifest) return;

  container.innerHTML = '';

  const setDef = _getSetById(setId);
  if (!setDef || !setDef.files) return;

  setDef.files.forEach(file => {
    const cat = _getCategoryById(file.categoryId);
    if (!cat) return;

    const card = document.createElement('div');
    card.className = `category-card category-${cat.id}`;
    card.innerHTML = `
      <div class="icon">${cat.icon || '📝'}</div>
      <div class="name">${_escapeHtml(cat.label)}</div>
      <div class="meta">${file.targetQuestions || 0} soal &bull; ${file.durationMinutes || 0} menit</div>
      <p class="text-muted">${_escapeHtml(cat.description || '')}</p>
    `;

    card.addEventListener('click', () => selectSet(setId, file.categoryId));
    container.appendChild(card);
  });
}

/* ================================================
   SELECT SET / CATEGORY
================================================ */
function selectSet(setId, categoryId) {
  if (!APP.manifest) return;

  APP.selectedSetId = setId;
  APP.selectedCategoryId = categoryId || null;
  APP.isFullMix = setId === 'set0';

  _renderInstructionScreen();
  showScreen('screen-instruction');
}

function _renderInstructionScreen() {
  const setDef = _getSetById(APP.selectedSetId);
  if (!setDef) return;

  const titleEl = document.getElementById('instr-title');
  const subtitleEl = document.getElementById('instr-subtitle');
  const statsEl = document.getElementById('instr-stats');
  const rulesEl = document.getElementById('instr-rules');

  if (APP.isFullMix) {
    if (titleEl) titleEl.textContent = 'Full Mix Test — Simulasi Real';
    if (subtitleEl) subtitleEl.textContent = 'Tes lengkap mencakup semua sub-tes dengan timer terpisah.';

    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat"><div class="stat-value">120</div><div class="stat-label">Target Soal</div></div>
        <div class="stat"><div class="stat-value">80</div><div class="stat-label">Menit Total</div></div>
        <div class="stat"><div class="stat-value">5</div><div class="stat-label">Sub-Tes</div></div>
      `;
    }

    if (rulesEl) {
      rulesEl.innerHTML = `
        <h4>Peraturan Full Mix Test</h4>
        <ul>
          <li>Terdiri dari 5 sub-tes berurutan dengan timer masing-masing.</li>
          <li>Jika waktu habis, sub-tes berpindah otomatis.</li>
          <li>Sub-tes yang sudah selesai tidak dapat diulang.</li>
          <li>Jika waktu masih tersedia, semua soal dalam sub-tes wajib dijawab sebelum melanjutkan.</li>
          <li>Jawaban tersimpan otomatis.</li>
        </ul>
      `;
    }
  } else {
    const fileInfo = setDef.files.find(file => file.categoryId === APP.selectedCategoryId);
    const cat = _getCategoryById(APP.selectedCategoryId);

    if (!fileInfo || !cat) return;

    if (titleEl) titleEl.textContent = `${setDef.label} — ${cat.label}`;
    if (subtitleEl) subtitleEl.textContent = `${setDef.labelId || setDef.id}: ${cat.description || ''}`;

    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat"><div class="stat-value">${fileInfo.targetQuestions || 0}</div><div class="stat-label">Soal</div></div>
        <div class="stat"><div class="stat-value">${fileInfo.durationMinutes || 0}</div><div class="stat-label">Menit</div></div>
        <div class="stat"><div class="stat-value">${cat.scoringType === 'workstyle' ? 'Likert' : 'Pilihan Ganda'}</div><div class="stat-label">Format</div></div>
      `;
    }

    if (rulesEl) {
      rulesEl.innerHTML = `
        <h4>Peraturan Sesi Latihan</h4>
        <ul>
          <li>Jawab setiap soal dengan memilih satu jawaban terbaik.</li>
          <li>Anda dapat berpindah maju dan mundur dalam sesi latihan.</li>
          <li>Jika ada soal belum dijawab saat selesai, sistem akan meminta konfirmasi.</li>
          <li>Timer berjalan selama tes berlangsung.</li>
          <li>Jika waktu habis, sesi otomatis berakhir.</li>
          <li>Jawaban tersimpan otomatis di browser.</li>
          ${cat.scoringType === 'workstyle' ? '<li>Tes Gaya Kerja menggunakan skala kesesuaian dan tidak memiliki jawaban benar atau salah.</li>' : ''}
        </ul>
      `;
    }
  }

  const startBtn = document.getElementById('btn-instr-start');
  if (startBtn) startBtn.onclick = () => startTest();

  const backBtn = document.getElementById('btn-instr-back');
  if (backBtn) backBtn.onclick = goHome;
}

/* ================================================
   START TEST
================================================ */
async function startTest() {
  _stopTimer();

  APP.questions = [];
  APP.answers = {};
  APP.currentIndex = 0;
  APP.remainingSeconds = 0;
  APP.fullMixSubtests = [];
  APP.fullMixSubtestIndex = 0;
  APP.fullMixAnswers = {};
  APP.subtestLocked = [];
  APP.started = false;
  APP.finished = false;

  Storage.clear();
  localStorage.removeItem(APP_STORAGE_KEY);
  _removeResumeBanner();

  if (APP.isFullMix) {
    await _startFullMix();
  } else {
    await _startPractice();
  }
}

async function _startPractice() {
  let loaded;

  try {
    loaded = await DataLoader.loadPracticeSet(APP.selectedSetId, APP.selectedCategoryId);
  } catch (error) {
    console.error(error);
    showToast('Gagal memuat file soal.', 'danger');
    _showEmptyState(false);
    return;
  }

  const questions = loaded.questions || [];
  const fileInfo = loaded.fileInfo || {};

  if (!questions.length) {
    _showEmptyState(false);
    return;
  }

  APP.questions = Randomizer.randomizeQuestions
    ? Randomizer.randomizeQuestions(questions)
    : _shuffleArray(questions);

  APP.answers = {};
  APP.currentIndex = 0;
  APP.totalSeconds = (fileInfo.durationMinutes || 10) * 60;
  APP.remainingSeconds = APP.totalSeconds;
  APP.started = true;
  APP.finished = false;

  _saveSession();

  showScreen('screen-test');
  _renderTestScreen();
  _startTimer(APP.totalSeconds);
}

async function _startFullMix() {
  let pools;

  try {
    pools = await DataLoader.loadFullMixPools();
  } catch (error) {
    console.error(error);
    showToast('Gagal memuat bank soal Full Mix.', 'danger');
    _showEmptyState(true);
    return;
  }

  const set0 = _getSetById('set0');

  if (!set0 || !set0.subtests || !set0.subtests.length) {
    _showEmptyState(true);
    return;
  }

  APP.fullMixSubtests = [];
  APP.fullMixAnswers = {};
  APP.subtestLocked = [];

  let hasEnoughData = true;
  let totalPicked = 0;

  set0.subtests
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach(sub => {
      const pool = pools[sub.categoryId] || [];
      const picked = _pickQuestions(pool, sub.targetQuestions || 0);

      if (picked.length < (sub.targetQuestions || 0)) hasEnoughData = false;

      APP.fullMixSubtests.push({
        categoryId: sub.categoryId,
        label: sub.label || _categoryLabelById(sub.categoryId),
        questions: picked,
        durationMinutes: sub.durationMinutes || 10,
        targetQuestions: sub.targetQuestions || picked.length,
        order: sub.order || 0
      });

      APP.subtestLocked.push(false);
      totalPicked += picked.length;
    });

  if (!hasEnoughData || totalPicked === 0) {
    _showEmptyState(true);
    return;
  }

  APP.fullMixSubtestIndex = 0;
  APP.isFullMix = true;
  APP.started = true;
  APP.finished = false;

  _saveSession();
  _loadFullMixSubtest(0);
}

function _loadFullMixSubtest(index) {
  const sub = APP.fullMixSubtests[index];

  if (!sub) {
    _finishFullMix();
    return;
  }

  APP.fullMixSubtestIndex = index;
  APP.questions = sub.questions || [];
  APP.answers = APP.fullMixAnswers[sub.categoryId] || {};
  APP.currentIndex = 0;
  APP.totalSeconds = (sub.durationMinutes || 10) * 60;
  APP.remainingSeconds = APP.totalSeconds;

  if (!APP.questions.length) {
    APP.subtestLocked[index] = true;
    _loadFullMixSubtest(index + 1);
    return;
  }

  _saveSession();

  showScreen('screen-test');
  _renderTestScreen();
  _startTimer(APP.totalSeconds, () => _onSubtestTimeExpired(index));
}

function _onSubtestTimeExpired(index) {
  const sub = APP.fullMixSubtests[index];

  if (sub) {
    APP.fullMixAnswers[sub.categoryId] = { ...APP.answers };
  }

  APP.subtestLocked[index] = true;
  _saveSession();

  const nextIndex = index + 1;

  if (nextIndex < APP.fullMixSubtests.length) {
    _showSubtestTransition(nextIndex);
  } else {
    _finishFullMix();
  }
}

function _showSubtestTransition(nextIndex) {
  _stopTimer();

  const next = APP.fullMixSubtests[nextIndex];

  _safeText('transition-title', next ? `Berikutnya: ${next.label}` : 'Tes selesai');
  _safeText(
    'transition-desc',
    next ? `${next.questions.length} soal • ${next.durationMinutes} menit` : 'Semua sub-tes telah selesai.'
  );

  showScreen('screen-subtest-transition');
}

function startNextSubtest() {
  const index = APP.fullMixSubtestIndex + 1;

  if (index < APP.fullMixSubtests.length) {
    _loadFullMixSubtest(index);
  } else {
    _finishFullMix();
  }
}

/* ================================================
   TIMER
================================================ */
function _startTimer(totalSeconds, onExpire) {
  _stopTimer();

  const timerEl = document.getElementById('test-timer');

  const handleTick = (remaining) => {
    APP.remainingSeconds = remaining;

    if (timerEl) {
      timerEl.textContent = '⏱ ' + _formatTime(remaining);
      timerEl.className = 'test-timer ' + _timerUrgencyClass(remaining, totalSeconds);
    }

    if (typeof Storage !== 'undefined' && Storage.set) {
      Storage.set('remainingSeconds', remaining);
    }

    _saveSession(false);
  };

  const handleExpire = () => {
    APP.remainingSeconds = 0;

    if (typeof onExpire === 'function') {
      onExpire();
    } else {
      _onPracticeTimeExpired();
    }
  };

  if (typeof Timer !== 'undefined' && Timer.start) {
    Timer.start(totalSeconds, handleTick, handleExpire);
  } else {
    let remaining = totalSeconds;
    handleTick(remaining);

    APP._fallbackTimer = setInterval(() => {
      remaining -= 1;
      handleTick(remaining);

      if (remaining <= 0) {
        clearInterval(APP._fallbackTimer);
        APP._fallbackTimer = null;
        handleExpire();
      }
    }, 1000);
  }
}

function _stopTimer() {
  if (typeof Timer !== 'undefined' && Timer.stop) Timer.stop();

  if (APP._fallbackTimer) {
    clearInterval(APP._fallbackTimer);
    APP._fallbackTimer = null;
  }
}

function _formatTime(seconds) {
  if (typeof Timer !== 'undefined' && Timer.format) return Timer.format(seconds);

  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;

  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function _timerUrgencyClass(remaining, total) {
  if (typeof Timer !== 'undefined' && Timer.urgencyClass) {
    return Timer.urgencyClass(remaining, total);
  }

  if (remaining <= 60) return 'danger';
  if (remaining <= total * 0.25) return 'warning';
  return '';
}

function _onPracticeTimeExpired() {
  showToast('Waktu habis! Sesi berakhir otomatis.', 'warning');
  setTimeout(() => _doFinishTest(), 1000);
}

function _getRemainingSeconds() {
  if (typeof Timer !== 'undefined' && Timer.getRemaining) {
    return Timer.getRemaining();
  }

  return APP.remainingSeconds || 0;
}

/* ================================================
   RENDER TEST SCREEN
================================================ */
function _renderTestScreen() {
  const sub = APP.isFullMix ? APP.fullMixSubtests[APP.fullMixSubtestIndex] : null;
  const sectionLabel = sub ? sub.label : _getCategoryLabel();

  _safeText('test-section-label', sectionLabel);

  _updateProgressBar();
  _renderQuestion(APP.currentIndex);
  _updateNavButtons();
}

function _renderQuestion(index) {
  const q = APP.questions[index];
  if (!q) return;

  const numEl = document.getElementById('question-number');
  const textEl = document.getElementById('question-text');
  const stimEl = document.getElementById('question-stimulus');

  if (numEl) numEl.textContent = `Soal ${index + 1} dari ${APP.questions.length}`;
  if (textEl) textEl.textContent = q.question || q.statement || '';

  if (stimEl) {
    stimEl.innerHTML = '';

    const hasStimulus = q.stimulus && Object.keys(q.stimulus).length > 0;

    if (hasStimulus && q.category === 'figural') {
      stimEl.classList.remove('hidden');

      if (typeof RenderFigural !== 'undefined' && RenderFigural.render) {
        RenderFigural.render(stimEl, q.stimulus);
      } else {
        stimEl.textContent = 'Visual figural belum tersedia.';
      }
    } else if (hasStimulus && q.category === 'numerical') {
      stimEl.classList.remove('hidden');

      if (typeof RenderNumerical !== 'undefined' && RenderNumerical.render) {
        RenderNumerical.render(stimEl, q.stimulus);
      } else {
        stimEl.textContent = 'Stimulus numerik belum tersedia.';
      }
    } else if (q.stimulus && q.stimulus.text) {
      stimEl.classList.remove('hidden');
      stimEl.innerHTML = `<p>${_escapeHtml(q.stimulus.text)}</p>`;
    } else {
      stimEl.classList.add('hidden');
    }
  }

  const oldOptions = document.getElementById('options-area');
  if (!oldOptions) return;

  const newOptions = document.createElement('div');
  newOptions.id = 'options-area';

  if (q.category === 'workstyle' || q.type === 'likert') {
    _buildLikert(newOptions, q);
  } else {
    _buildOptions(newOptions, q);
  }

  oldOptions.parentNode.replaceChild(newOptions, oldOptions);
}

function _buildOptions(container, q) {
  if (!q.options || q.options.length === 0) {
    const p = document.createElement('p');
    p.className = 'text-muted';
    p.textContent = 'Pilihan jawaban belum tersedia.';
    container.appendChild(p);
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'options-list';

  q.options.forEach(opt => {
    const li = document.createElement('li');
    li.className = 'option-item';
    li.dataset.optId = opt.id;

    if (APP.answers[q.id] === opt.id) {
      li.classList.add('selected');
    }

    li.innerHTML = `
      <input
        type="radio"
        name="q_${_escapeHtml(q.id)}"
        value="${_escapeHtml(opt.id)}"
        ${APP.answers[q.id] === opt.id ? 'checked' : ''}
        style="flex-shrink:0;margin-top:3px;accent-color:#1e3a5f;"
      >
      <span><strong>${_escapeHtml(opt.id)}.</strong> ${_escapeHtml(opt.text)}</span>
    `;

    li.addEventListener('click', () => {
      APP.answers[q.id] = opt.id;

      ul.querySelectorAll('.option-item').forEach(item => {
        item.classList.remove('selected');
        const radio = item.querySelector('input[type="radio"]');
        if (radio) radio.checked = false;
      });

      li.classList.add('selected');

      const radio = li.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      _saveSession();
      _updateProgressBar();
    });

    ul.appendChild(li);
  });

  container.appendChild(ul);
}

function _buildLikert(container, q) {
  const scale = APP.manifest && APP.manifest.likertScale
    ? APP.manifest.likertScale
    : [
        { value: 1, label: 'Sangat Tidak Sesuai' },
        { value: 2, label: 'Tidak Sesuai' },
        { value: 3, label: 'Netral' },
        { value: 4, label: 'Sesuai' },
        { value: 5, label: 'Sangat Sesuai' }
      ];

  const storedValue = APP.answers[q.id] !== undefined
    ? parseInt(APP.answers[q.id], 10)
    : null;

  const wrap = document.createElement('div');
  wrap.className = 'likert-options';

  scale.forEach(item => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'likert-btn';
    btn.dataset.value = item.value;

    if (storedValue === item.value) {
      btn.classList.add('selected');
    }

    btn.innerHTML = `
      <span class="val">${item.value}</span>
      ${_escapeHtml(item.label)}
    `;

    btn.addEventListener('click', () => {
      APP.answers[q.id] = item.value;

      wrap.querySelectorAll('.likert-btn').forEach(button => {
        button.classList.remove('selected');
      });

      btn.classList.add('selected');

      _saveSession();
      _updateProgressBar();
    });

    wrap.appendChild(btn);
  });

  container.appendChild(wrap);
}

function _updateProgressBar() {
  const total = APP.questions.length;
  const current = APP.currentIndex;
  const answered = APP.questions.filter(q => _isAnsweredValue(APP.answers[q.id])).length;

  const progText = document.getElementById('progress-text');
  const progFill = document.getElementById('progress-fill');

  if (progText) {
    progText.innerHTML = `Soal <strong>${current + 1}</strong> dari ${total} &bull; Terjawab: ${answered}`;
  }

  if (progFill) {
    progFill.style.width = total > 0 ? `${((current + 1) / total) * 100}%` : '0%';
  }
}

function _updateNavButtons() {
  const total = APP.questions.length;
  const current = APP.currentIndex;

  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const finishBtn = document.getElementById('btn-finish');

  if (prevBtn) {
    prevBtn.disabled = current === 0 || (APP.isFullMix && APP.subtestLocked[APP.fullMixSubtestIndex]);
    prevBtn.onclick = goToPrev;
  }

  if (nextBtn) {
    const isLast = current >= total - 1;
    nextBtn.classList.toggle('hidden', isLast);
    nextBtn.onclick = goToNext;
  }

  if (finishBtn) {
    const isLast = current >= total - 1;
    finishBtn.classList.toggle('hidden', !isLast);
    finishBtn.onclick = handleFinishClick;
  }
}

/* ================================================
   QUESTION NAVIGATION
================================================ */
function goToNext() {
  if (APP.currentIndex < APP.questions.length - 1) {
    APP.currentIndex++;
    _saveSession();
    _renderTestScreen();
  }
}

function goToPrev() {
  if (APP.currentIndex > 0) {
    APP.currentIndex--;
    _saveSession();
    _renderTestScreen();
  }
}

/* ================================================
   FINISH LOGIC
================================================ */
function _countUnanswered() {
  return APP.questions.filter(q => !_isAnsweredValue(APP.answers[q.id])).length;
}

function _firstUnansweredIndex() {
  return APP.questions.findIndex(q => !_isAnsweredValue(APP.answers[q.id]));
}

function handleFinishClick() {
  if (APP.isFullMix) {
    _handleFullMixFinishClick();
  } else {
    _handlePracticeFinishClick();
  }
}

function _handlePracticeFinishClick() {
  const unanswered = _countUnanswered();

  if (unanswered === 0) {
    _doFinishTest();
    return;
  }

  showConfirmModal(
    'Konfirmasi Selesai',
    `Masih ada ${unanswered} soal yang belum dijawab. Apakah Anda yakin ingin menyelesaikan tes?`,
    'Lanjutkan Mengerjakan',
    'Ya, Selesaikan',
    () => _doFinishTest(),
    () => {}
  );
}

function _handleFullMixFinishClick() {
  const unanswered = _countUnanswered();
  const remaining = _getRemainingSeconds();

  if (unanswered > 0 && remaining > 0) {
    showConfirmModal(
      'Soal Belum Lengkap',
      'Masih ada soal yang belum dijawab. Selesaikan semua soal sebelum melanjutkan.',
      'Tetap di Soal Ini',
      'Ke Soal Belum Dijawab',
      () => _jumpToFirstUnanswered(),
      () => {}
    );
    return;
  }

  const currentSub = APP.fullMixSubtests[APP.fullMixSubtestIndex];

  if (currentSub) {
    APP.fullMixAnswers[currentSub.categoryId] = { ...APP.answers };
    APP.subtestLocked[APP.fullMixSubtestIndex] = true;
  }

  _saveSession();

  const nextIndex = APP.fullMixSubtestIndex + 1;

  if (nextIndex < APP.fullMixSubtests.length) {
    _showSubtestTransition(nextIndex);
  } else {
    _finishFullMix();
  }
}

function _jumpToFirstUnanswered() {
  const index = _firstUnansweredIndex();

  if (index >= 0) {
    APP.currentIndex = index;
    _saveSession();
    _renderTestScreen();
  }
}

/* ================================================
   RESULT
================================================ */
function _doFinishTest() {
  _stopTimer();

  APP.finished = true;

  const category = _getCategoryById(APP.selectedCategoryId);
  let result;

  if (category && category.scoringType === 'workstyle') {
    result = _safeScoreWorkstyle(APP.questions, APP.answers);
  } else {
    result = _safeScoreCognitive(
      APP.questions,
      APP.answers,
      APP.selectedCategoryId,
      _categoryLabelById(APP.selectedCategoryId)
    );
  }

  _renderResult(result, false);
  _clearSessionCompletely();
  showScreen('screen-result');
}

function _finishFullMix() {
  _stopTimer();

  APP.finished = true;

  const cognitiveResults = {};
  let allCognitiveQuestions = [];
  let allCognitiveAnswers = {};
  let workstyleQuestions = [];
  let workstyleAnswers = {};

  APP.fullMixSubtests.forEach(sub => {
    const answers = APP.fullMixAnswers[sub.categoryId] || {};

    if (sub.categoryId === 'workstyle') {
      workstyleQuestions = workstyleQuestions.concat(sub.questions || []);
      workstyleAnswers = { ...workstyleAnswers, ...answers };
    } else {
      allCognitiveQuestions = allCognitiveQuestions.concat(sub.questions || []);
      allCognitiveAnswers = { ...allCognitiveAnswers, ...answers };

      cognitiveResults[sub.categoryId] = _safeScoreCognitive(
        sub.questions || [],
        answers,
        sub.categoryId,
        sub.label || _categoryLabelById(sub.categoryId)
      );
    }
  });

  const totalCognitive = _safeScoreCognitive(
    allCognitiveQuestions,
    allCognitiveAnswers,
    'total',
    'Total Kognitif'
  );

  const workstyle = _safeScoreWorkstyle(workstyleQuestions, workstyleAnswers);

  const finalResult = {
    type: 'fullmix',
    cognitiveResults,
    totalCognitive,
    workstyle
  };

  _renderResult(finalResult, true);
  _clearSessionCompletely();
  showScreen('screen-result');
}

function _safeScoreCognitive(questions, answers, categoryId = '', categoryLabel = '') {
  let result = null;

  if (typeof Scoring !== 'undefined' && Scoring.scoreCognitive) {
    try {
      result = Scoring.scoreCognitive(questions, answers);
    } catch (error) {
      console.warn('Scoring.scoreCognitive error, using fallback:', error);
    }
  }

  if (!result) {
    const total = questions.length;
    let correct = 0;
    let wrong = 0;
    let blank = 0;

    questions.forEach(q => {
      const ans = answers[q.id];

      if (!_isAnsweredValue(ans)) {
        blank++;
      } else if (ans === q.answer) {
        correct++;
      } else {
        wrong++;
      }
    });

    result = { total, correct, wrong, blank };
  }

  if (typeof ResultRenderer !== 'undefined' && ResultRenderer.normalizeCognitive) {
    return ResultRenderer.normalizeCognitive({
      result,
      questions,
      answers,
      categoryId,
      categoryLabel
    });
  }

  return result;
}

function _safeScoreWorkstyle(questions, answers) {
  let result = null;

  if (typeof Scoring !== 'undefined' && Scoring.scoreWorkstyle) {
    try {
      result = Scoring.scoreWorkstyle(questions, answers);
    } catch (error) {
      console.warn('Scoring.scoreWorkstyle error, using fallback:', error);
    }
  }

  if (result && result.dimensions) {
    return {
      type: 'workstyle',
      ...result
    };
  }

  const dimensions = {};

  questions.forEach(q => {
    if (!q.dimension) return;

    let val = parseInt(answers[q.id], 10);

    if (!Number.isFinite(val)) return;
    if (q.reverseScored) val = 6 - val;

    if (!dimensions[q.dimension]) {
      dimensions[q.dimension] = {
        total: 0,
        count: 0,
        average: 0
      };
    }

    dimensions[q.dimension].total += val;
    dimensions[q.dimension].count += 1;
    dimensions[q.dimension].average = Math.round((dimensions[q.dimension].total / dimensions[q.dimension].count) * 10) / 10;
  });

  return {
    type: 'workstyle',
    dimensions
  };
}

function _renderResult(result, isFullMix) {
  const container = document.getElementById('result-content');
  if (!container) return;

  if (typeof ResultRenderer !== 'undefined') {
    if (isFullMix && ResultRenderer.renderFullMix) {
      ResultRenderer.renderFullMix({
        container,
        result,
        categoryLabelById: _categoryLabelById
      });
      return;
    }

    if (!isFullMix && ResultRenderer.renderSingle) {
      ResultRenderer.renderSingle({
        container,
        result,
        questions: APP.questions,
        answers: APP.answers,
        categoryId: APP.selectedCategoryId,
        categoryLabel: _categoryLabelById(APP.selectedCategoryId)
      });
      return;
    }
  }

  container.innerHTML = `
    <div class="empty-state">
      <h3>Hasil tidak dapat ditampilkan</h3>
      <p>Modul result-renderer.js belum terbaca. Pastikan file tersebut sudah dipanggil sebelum app.js.</p>
    </div>
  `;
}

/* ================================================
   EMPTY STATE
================================================ */
function _showEmptyState(isFullMix) {
  _stopTimer();

  const title = document.getElementById('empty-title');
  const msg = document.getElementById('empty-message');
  const btn = document.getElementById('empty-admin-link');

  if (title) {
    title.textContent = isFullMix ? 'Soal Full Mix Belum Mencukupi' : 'Soal Belum Tersedia';
  }

  if (msg) {
    msg.textContent = isFullMix
      ? 'Soal Full Mix belum mencukupi. Silakan tambahkan soal melalui halaman admin.'
      : 'Soal untuk paket ini belum tersedia. Silakan tambahkan soal melalui halaman admin.';
  }

  if (btn) {
    btn.setAttribute('href', 'admin.html');
  }

  showScreen('screen-empty');
}

/* ================================================
   STORAGE / RESUME
================================================ */
function _saveSession(useStorage = true) {
  const data = {
    selectedSetId: APP.selectedSetId,
    selectedCategoryId: APP.selectedCategoryId,
    questions: APP.questions,
    answers: APP.answers,
    currentIndex: APP.currentIndex,
    totalSeconds: APP.totalSeconds,
    remainingSeconds: APP.remainingSeconds,
    isFullMix: APP.isFullMix,
    fullMixSubtests: APP.fullMixSubtests,
    fullMixSubtestIndex: APP.fullMixSubtestIndex,
    fullMixAnswers: APP.fullMixAnswers,
    subtestLocked: APP.subtestLocked,
    started: APP.started,
    finished: APP.finished
  };

  try {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Gagal menyimpan session:', error);
  }

  if (useStorage && typeof Storage !== 'undefined' && Storage.set) {
    Storage.set('appSession', data);
  }

  const indicator = document.getElementById('autosave-indicator');

  if (indicator) {
    indicator.textContent = '💾 Tersimpan otomatis';
  }
}

function _loadSession() {
  try {
    const raw = localStorage.getItem(APP_STORAGE_KEY);
    if (!raw) return null;

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function _checkResumable() {
  const session = _loadSession();
  if (!session || !session.started || session.finished) return;

  let banner = document.getElementById('resume-banner');

  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'resume-banner';
    banner.style.cssText = `
      position: fixed;
      left: 16px;
      right: 16px;
      bottom: 16px;
      z-index: 9999;
      background: #1e3a5f;
      color: #fff;
      border-radius: 14px;
      padding: 14px 16px;
      box-shadow: 0 12px 28px rgba(15,23,42,.22);
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      font-size: .92rem;
    `;

    banner.innerHTML = `
      <span>Anda memiliki tes yang belum selesai.</span>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button id="btn-resume-test" style="padding:8px 12px;border-radius:8px;border:none;cursor:pointer;font-weight:600;">Lanjutkan Tes Terakhir</button>
        <button id="btn-clear-session" style="padding:8px 12px;border-radius:8px;border:1px solid #fff;background:transparent;color:#fff;cursor:pointer;font-weight:600;">Mulai Ulang</button>
      </div>
    `;

    document.body.appendChild(banner);
  }

  const resumeBtn = document.getElementById('btn-resume-test');
  const clearBtn = document.getElementById('btn-clear-session');

  if (resumeBtn) {
    resumeBtn.onclick = () => {
      banner.remove();
      _resumeSession(session);
    };
  }

  if (clearBtn) {
    clearBtn.onclick = () => {
      _clearSessionCompletely();
      banner.remove();
    };
  }
}

function _resumeSession(session) {
  APP = {
    ...APP,
    ...session
  };

  showScreen('screen-test');
  _renderTestScreen();
  _startTimer(APP.remainingSeconds || APP.totalSeconds);
}

function _removeResumeBanner() {
  const banner = document.getElementById('resume-banner');
  if (banner) banner.remove();
}

function _clearSessionCompletely() {
  try {
    localStorage.removeItem(APP_STORAGE_KEY);
    localStorage.removeItem('remainingSeconds');
  } catch (e) {}

  if (typeof Storage !== 'undefined' && Storage.clear) {
    Storage.clear();
  }

  _removeResumeBanner();
}

function restartTest() {
  _stopTimer();
  _clearSessionCompletely();

  APP.questions = [];
  APP.answers = {};
  APP.currentIndex = 0;
  APP.fullMixSubtests = [];
  APP.fullMixSubtestIndex = 0;
  APP.fullMixAnswers = {};
  APP.subtestLocked = [];
  APP.started = false;
  APP.finished = false;

  showScreen('screen-home');
}

function goHome() {
  _stopTimer();

  if (APP.started && !APP.finished) {
    showConfirmModal(
      'Kembali ke Beranda',
      'Tes sedang berjalan. Jika kembali ke beranda, progress saat ini tetap tersimpan di browser.',
      'Tetap di Tes',
      'Kembali',
      () => showScreen('screen-home'),
      () => {}
    );
    return;
  }

  showScreen('screen-home');
}

/* ================================================
   RANDOM HELPERS
================================================ */
function _shuffleArray(arr) {
  const copy = [...arr];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function _pickQuestions(pool, target) {
  if (!Array.isArray(pool)) return [];

  const shuffled = Randomizer.randomizeQuestions
    ? Randomizer.randomizeQuestions(pool)
    : _shuffleArray(pool);

  return shuffled.slice(0, target);
}

/* ================================================
   GLOBALS FOR HTML ONCLICK
================================================ */
window.selectSet = selectSet;
window.startTest = startTest;
window.restartTest = restartTest;
window.goHome = goHome;
window.goToNext = goToNext;
window.goToPrev = goToPrev;
window.handleFinishClick = handleFinishClick;
window.startNextSubtest = startNextSubtest;