/**
 * admin.js
 * Admin page controller for Simulasi Psikotes Gratis.
 * Handles offline question creation and optional online save to GitHub.
 */

/* ================================================
   STATE
================================================ */
let ADMIN = {
  manifest: null,
  currentTab: 'tab-cognitive',
  currentQuestions: [],  // loaded from GitHub or empty
  currentFileSHA: null,
  generatedQuestion: null,
  questionType: 'cognitive', // 'cognitive' | 'workstyle'
};

/* ================================================
   INIT
================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    ADMIN.manifest = await DataLoader.loadManifest();
  } catch (e) {
    _showStatus('admin-status-global', 'Gagal memuat manifest.json', 'error');
  }

  _buildFileSelector();
  _bindTabEvents();
  _bindFormEvents();
  _bindGitHubEvents();
  _buildCategorySelect();
  _buildDimensionSelect();
  _initTokenInput();
});

/* ================================================
   TABS
================================================ */
function _bindTabEvents() {
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
      ADMIN.currentTab = btn.dataset.tab;
    });
  });
}

/* ================================================
   FILE SELECTOR
================================================ */
function _buildFileSelector() {
  const manifest = ADMIN.manifest;
  if (!manifest) return;
  const sel = document.getElementById('target-file-select');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Pilih File Target --</option>';
  manifest.allFiles.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.dataset.path = f.path;
    opt.dataset.category = f.category;
    opt.textContent = f.path.replace('data/', '');
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => {
    const selected = sel.options[sel.selectedIndex];
    const cat = selected.dataset.category || '';
    _updateFormForCategory(cat);
  });
}

function _buildCategorySelect() {
  const manifest = ADMIN.manifest;
  if (!manifest) return;
  const sel = document.getElementById('q-category');
  if (!sel) return;
  sel.innerHTML = '';
  manifest.categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.label;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => _updateFormForCategory(sel.value));
}

function _buildDimensionSelect() {
  const manifest = ADMIN.manifest;
  if (!manifest) return;
  const sel = document.getElementById('q-dimension');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Pilih Dimensi --</option>';
  manifest.workstyleDimensions.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = d.label;
    sel.appendChild(opt);
  });
}

function _updateFormForCategory(cat) {
  const workstyleFields = document.getElementById('workstyle-fields');
  const cognitiveFields = document.getElementById('cognitive-fields');
  const isWorkstyle = (cat === 'workstyle');
  if (workstyleFields) workstyleFields.classList.toggle('hidden', !isWorkstyle);
  if (cognitiveFields) cognitiveFields.classList.toggle('hidden', isWorkstyle);

  // Sync category selector
  const catSel = document.getElementById('q-category');
  if (catSel && cat) catSel.value = cat;

  ADMIN.questionType = isWorkstyle ? 'workstyle' : 'cognitive';
}


/* ================================================
   FORM EVENTS
================================================ */
function _bindFormEvents() {
  // Generate question button
  const genBtn = document.getElementById('btn-generate');
  if (genBtn) genBtn.addEventListener('click', _generateQuestion);

  // Copy JSON
  const copyBtn = document.getElementById('btn-copy-json');
  if (copyBtn) copyBtn.addEventListener('click', _copyJSON);

  // Download JSON
  const dlBtn = document.getElementById('btn-download-json');
  if (dlBtn) dlBtn.addEventListener('click', _downloadJSON);

  // Save to GitHub
  const saveBtn = document.getElementById('btn-save-github');
  if (saveBtn) saveBtn.addEventListener('click', _saveToGitHub);

  // Load from GitHub (to append)
  const loadBtn = document.getElementById('btn-load-github');
  if (loadBtn) loadBtn.addEventListener('click', _loadFromGitHub);

  // Reset form
  const resetBtn = document.getElementById('btn-reset-form');
  if (resetBtn) resetBtn.addEventListener('click', _resetForm);

  // Type selector changes
  const typeSel = document.getElementById('q-type');
  if (typeSel) {
    typeSel.addEventListener('change', () => {
      _updateStimulusFields(typeSel.value);
    });
  }
}

function _updateStimulusFields(type) {
  const numStimulus = document.getElementById('numerical-stimulus-fields');
  const figStimulus = document.getElementById('figural-stimulus-fields');
  if (numStimulus) numStimulus.classList.toggle('hidden', !['table', 'bar-chart', 'line-chart', 'scenario', 'number-series'].includes(type));
  if (figStimulus) figStimulus.classList.toggle('hidden', !['figural-sequence', 'matrix-pattern'].includes(type));
}

/* ================================================
   GENERATE QUESTION
================================================ */
function _generateQuestion() {
  const isWorkstyle = ADMIN.questionType === 'workstyle';
  let q;
  if (isWorkstyle) {
    q = _buildWorkstyleQuestion();
  } else {
    q = _buildCognitiveQuestion();
  }

  if (!q) return;

  const errors = _validateQuestion(q);
  if (errors.length > 0) {
    _showStatus('form-status', 'Validasi gagal: ' + errors.join(', '), 'error');
    return;
  }

  ADMIN.generatedQuestion = q;
  _renderJSONOutput(q);
  _renderPreview(q);
  _showStatus('form-status', 'Soal berhasil digenerate. Periksa preview dan JSON di bawah.', 'success');
}

function _buildCognitiveQuestion() {
  const fileSel = document.getElementById('target-file-select');
  const fileOpt = fileSel ? fileSel.options[fileSel.selectedIndex] : null;
  const fileId = fileOpt ? fileOpt.value : '';
  const category = (fileOpt ? fileOpt.dataset.category : '') || document.getElementById('q-category')?.value || 'verbal';
  const setNum = fileId ? (fileId.match(/(\d)$/) || ['', '1'])[1] : '1';
  const idPrefix = fileId || `${category}-set${setNum}`;

  const idInput = document.getElementById('q-id');
  const typeInput = document.getElementById('q-type');
  const diffInput = document.getElementById('q-difficulty');
  const questionInput = document.getElementById('q-question');
  const explanationInput = document.getElementById('q-explanation');

  const id = idInput?.value.trim() || `${idPrefix}-${Date.now()}`;
  const type = typeInput?.value || 'synonym';
  const difficulty = diffInput?.value || 'medium';
  const question = questionInput?.value.trim() || '';
  const explanation = explanationInput?.value.trim() || '';

  if (!question) {
    _showStatus('form-status', 'Teks pertanyaan wajib diisi.', 'error');
    return null;
  }

  // Options
  const options = [];
  let answer = '';
  const optIds = ['A', 'B', 'C', 'D', 'E'];
  optIds.forEach(id => {
    const input = document.getElementById(`opt-${id}`);
    const radio = document.querySelector(`input[name="correct-opt"][value="${id}"]`);
    if (input && input.value.trim()) {
      options.push({ id, text: input.value.trim() });
      if (radio && radio.checked) answer = id;
    }
  });

  if (options.length < 2) {
    _showStatus('form-status', 'Minimal 2 pilihan jawaban harus diisi.', 'error');
    return null;
  }
  if (!answer) {
    _showStatus('form-status', 'Jawaban benar belum dipilih.', 'error');
    return null;
  }

  const q = { id, category, type, difficulty, question, options, answer };
  if (explanation) q.explanation = explanation;

  // Stimulus
  const stimJson = document.getElementById('q-stimulus-json')?.value.trim();
  if (stimJson) {
    try { q.stimulus = JSON.parse(stimJson); } catch (e) {
      _showStatus('form-status', 'Format JSON stimulus tidak valid.', 'error');
      return null;
    }
  }

  return q;
}

function _buildWorkstyleQuestion() {
  const fileSel = document.getElementById('target-file-select');
  const fileOpt = fileSel ? fileSel.options[fileSel.selectedIndex] : null;
  const fileId = fileOpt ? fileOpt.value : '';
  const setNum = fileId ? (fileId.match(/(\d)$/) || ['', '1'])[1] : '1';
  const idPrefix = fileId || `workstyle-set${setNum}`;

  const idInput = document.getElementById('q-id');
  const dimensionSel = document.getElementById('q-dimension');
  const statementInput = document.getElementById('q-statement');
  const reverseCheck = document.getElementById('q-reverse-scored');
  const interpretInput = document.getElementById('q-interpretation');

  const id = idInput?.value.trim() || `${idPrefix}-${Date.now()}`;
  const dimension = dimensionSel?.value || '';
  const statement = statementInput?.value.trim() || '';
  const reverseScored = reverseCheck ? reverseCheck.checked : false;
  const interpretation = interpretInput?.value.trim() || '';

  if (!statement) {
    _showStatus('form-status', 'Teks pernyataan wajib diisi.', 'error');
    return null;
  }
  if (!dimension) {
    _showStatus('form-status', 'Dimensi gaya kerja wajib dipilih.', 'error');
    return null;
  }

  const q = { id, category: 'workstyle', type: 'likert', dimension, statement, reverseScored };
  if (interpretation) q.interpretation = interpretation;
  return q;
}

function _validateQuestion(q) {
  const errors = [];
  if (!q.id) errors.push('ID kosong');
  if (!q.category) errors.push('Kategori kosong');
  if (q.category === 'workstyle') {
    if (!q.statement) errors.push('Pernyataan kosong');
    if (!q.dimension) errors.push('Dimensi kosong');
  } else {
    if (!q.question) errors.push('Pertanyaan kosong');
    if (!q.options || q.options.length < 2) errors.push('Minimal 2 pilihan jawaban');
    if (!q.answer) errors.push('Jawaban benar belum ditentukan');
  }
  return errors;
}

/* ================================================
   JSON OUTPUT & PREVIEW
================================================ */
function _renderJSONOutput(q) {
  const el = document.getElementById('json-output');
  if (el) el.textContent = JSON.stringify(q, null, 2);
}

function _renderPreview(q) {
  const el = document.getElementById('preview-content');
  if (!el) return;

  if (q.category === 'workstyle') {
    el.innerHTML = `
      <p style="font-weight:700;color:#1e3a5f;margin-bottom:0.5rem;">${q.statement}</p>
      <p class="text-muted" style="font-size:0.85rem;">Dimensi: <strong>${q.dimension}</strong> | Reverse: ${q.reverseScored ? 'Ya' : 'Tidak'}</p>
      <div style="margin-top:0.75rem;display:flex;gap:0.4rem;flex-wrap:wrap;">
        ${[1,2,3,4,5].map(v => `<span style="padding:0.3rem 0.6rem;border:1px solid #e0e4ea;border-radius:6px;font-size:0.82rem;">${v}</span>`).join('')}
      </div>
    `;
  } else {
    const opts = (q.options || []).map(o => `
      <div style="padding:0.4rem 0.75rem;border:1px solid ${o.id === q.answer ? '#2a8a8a' : '#e0e4ea'};border-radius:6px;margin-bottom:0.3rem;font-size:0.88rem;background:${o.id === q.answer ? '#d4f0f0' : '#fff'};">
        <strong>${o.id}.</strong> ${o.text} ${o.id === q.answer ? '✓' : ''}
      </div>
    `).join('');
    el.innerHTML = `
      <p style="font-weight:700;color:#1e3a5f;margin-bottom:0.75rem;">${q.question}</p>
      ${opts}
      ${q.explanation ? `<p class="text-muted" style="font-size:0.82rem;margin-top:0.5rem;">Pembahasan: ${q.explanation}</p>` : ''}
    `;
  }
}

function _copyJSON() {
  const el = document.getElementById('json-output');
  if (!el || !el.textContent.trim()) {
    _showStatus('form-status', 'Belum ada JSON yang digenerate.', 'error');
    return;
  }
  navigator.clipboard.writeText(el.textContent).then(() => {
    _showStatus('form-status', 'JSON berhasil disalin ke clipboard.', 'success');
  }).catch(() => {
    _showStatus('form-status', 'Gagal menyalin. Coba salin manual.', 'error');
  });
}

function _downloadJSON() {
  if (!ADMIN.generatedQuestion) {
    _showStatus('form-status', 'Belum ada soal yang digenerate.', 'error');
    return;
  }
  const fileSel = document.getElementById('target-file-select');
  const fileOpt = fileSel ? fileSel.options[fileSel.selectedIndex] : null;
  const filename = fileOpt && fileOpt.value ? fileOpt.value + '_new.json' : 'soal_baru.json';
  const blob = new Blob([JSON.stringify([ADMIN.generatedQuestion], null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function _resetForm() {
  document.querySelectorAll('#admin-form input[type="text"], #admin-form textarea').forEach(el => el.value = '');
  document.querySelectorAll('#admin-form select').forEach(el => el.selectedIndex = 0);
  document.querySelectorAll('#admin-form input[type="radio"]').forEach(el => el.checked = false);
  document.querySelectorAll('#admin-form input[type="checkbox"]').forEach(el => el.checked = false);
  const previewEl = document.getElementById('preview-content');
  if (previewEl) previewEl.innerHTML = '<p class="preview-empty">Preview soal akan muncul di sini setelah digenerate.</p>';
  const jsonEl = document.getElementById('json-output');
  if (jsonEl) jsonEl.textContent = '';
  ADMIN.generatedQuestion = null;
  _showStatus('form-status', '', '');
}

/* ================================================
   GITHUB INTEGRATION
================================================ */
function _initTokenInput() {
  const tokenInput = document.getElementById('gh-token');
  const toggleBtn = document.getElementById('btn-token-toggle');
  const savedToken = GitHubAPI.getToken();
  if (tokenInput && savedToken) tokenInput.value = savedToken;

  if (toggleBtn && tokenInput) {
    toggleBtn.addEventListener('click', () => {
      tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password';
      toggleBtn.textContent = tokenInput.type === 'password' ? '👁' : '🙈';
    });
  }

  if (tokenInput) {
    tokenInput.addEventListener('change', () => {
      GitHubAPI.saveToken(tokenInput.value.trim());
    });
  }
}

function _bindGitHubEvents() {
  const testBtn = document.getElementById('btn-test-token');
  if (testBtn) testBtn.addEventListener('click', async () => {
    _saveTokenFromInput();
    const config = _getGitHubConfig();
    _showStatus('github-status', 'Menguji koneksi...', 'loading');
    const result = await GitHubAPI.testToken(config.owner, config.repo);
    _showStatus('github-status', result.message, result.valid ? 'success' : 'error');
  });

  const clearTokenBtn = document.getElementById('btn-clear-token');
  if (clearTokenBtn) clearTokenBtn.addEventListener('click', () => {
    GitHubAPI.clearToken();
    const tokenInput = document.getElementById('gh-token');
    if (tokenInput) tokenInput.value = '';
    _showStatus('github-status', 'Token dihapus dari sesi ini.', 'info');
  });
}

async function _loadFromGitHub() {
  if (!GitHubAPI.hasToken()) {
    _showStatus('github-status', 'Masukkan token GitHub terlebih dahulu.', 'error');
    return;
  }
  _saveTokenFromInput();
  const config = _getGitHubConfig();
  if (!config.path) {
    _showStatus('github-status', 'Pilih file target terlebih dahulu.', 'error');
    return;
  }
  _showStatus('github-status', 'Memuat data dari GitHub...', 'loading');
  try {
    const { content, sha } = await GitHubAPI.getFile(config);
    ADMIN.currentQuestions = Array.isArray(content) ? content : [];
    ADMIN.currentFileSHA = sha;
    _showStatus('github-status', `Berhasil memuat ${ADMIN.currentQuestions.length} soal dari GitHub.`, 'success');
    _renderQuestionList(ADMIN.currentQuestions);
  } catch (e) {
    _showStatus('github-status', e.message, 'error');
  }
}

async function _saveToGitHub() {
  if (!ADMIN.generatedQuestion) {
    _showStatus('github-status', 'Generate soal terlebih dahulu sebelum menyimpan.', 'error');
    return;
  }
  if (!GitHubAPI.hasToken()) {
    _showStatus('github-status', 'Masukkan token GitHub terlebih dahulu.', 'error');
    return;
  }
  _saveTokenFromInput();
  const config = _getGitHubConfig();
  if (!config.path) {
    _showStatus('github-status', 'Pilih file target terlebih dahulu.', 'error');
    return;
  }
  _showStatus('github-status', 'Menyimpan ke GitHub...', 'loading');
  const result = await GitHubAPI.appendQuestion(config, ADMIN.generatedQuestion);
  _showStatus('github-status', result.message, result.success ? 'success' : 'error');
  if (result.success) {
    DataLoader.clearCache();
    ADMIN.generatedQuestion = null;
  }
}

function _getGitHubConfig() {
  const owner = document.getElementById('gh-owner')?.value.trim() || 'sagaevans';
  const repo  = document.getElementById('gh-repo')?.value.trim()  || 'SIMULASI-PSIKOTES-ONLINE';
  const branch= document.getElementById('gh-branch')?.value.trim()|| 'main';
  const fileSel = document.getElementById('target-file-select');
  const fileOpt = fileSel ? fileSel.options[fileSel.selectedIndex] : null;
  const path = fileOpt ? (fileOpt.dataset.path || '') : '';
  return { owner, repo, branch, path };
}

function _saveTokenFromInput() {
  const tokenInput = document.getElementById('gh-token');
  if (tokenInput && tokenInput.value.trim()) {
    GitHubAPI.saveToken(tokenInput.value.trim());
  }
}

/* ================================================
   QUESTION LIST (loaded from GitHub)
================================================ */
function _renderQuestionList(questions) {
  const el = document.getElementById('question-list');
  if (!el) return;
  el.innerHTML = '';
  if (!questions || questions.length === 0) {
    el.innerHTML = '<p class="text-muted" style="font-size:0.88rem;">Belum ada soal di file ini.</p>';
    return;
  }
  const ul = document.createElement('ul');
  ul.className = 'q-list';
  questions.forEach((q, i) => {
    const li = document.createElement('li');
    li.className = 'q-list-item';
    const text = q.question || q.statement || '(soal tanpa teks)';
    li.innerHTML = `
      <span class="q-index">${i + 1}</span>
      <span class="q-text">${text}</span>
      <span class="q-meta">${q.type || ''}</span>
    `;
    ul.appendChild(li);
  });
  el.appendChild(ul);
}

/* ================================================
   STATUS MESSAGES
================================================ */
function _showStatus(elementId, message, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (!message) { el.className = 'status-msg'; el.textContent = ''; el.style.display = 'none'; return; }
  el.className = `status-msg ${type}`;
  el.textContent = message;
  el.style.display = 'block';
}
