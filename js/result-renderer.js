/**
 * result-renderer.js
 * Renderer hasil untuk Simulasi Psikotes Gratis.
 *
 * Versi laporan psikotes:
 * - Tampilan hasil dibuat lebih mirip laporan asesmen
 * - Render hasil kognitif: Verbal, Numerik, Logika, Figural
 * - Render hasil Workstyle / Gaya Kerja
 * - Render hasil Full Mix
 * - Tidak menampilkan Detail Dimensi angka 0,1,2,3
 * - Radar chart tetap dipertahankan untuk Workstyle
 * - Jika ada error render, web tidak freeze total
 *
 * Catatan:
 * Hasil tetap bersifat simulasi latihan, bukan diagnosis psikologis resmi.
 */

const ResultRenderer = (() => {
  /* ============================================================
     MAIN RENDER
  ============================================================ */

  function renderSingle({
    container,
    result,
    questions = [],
    answers = {},
    categoryId = '',
    categoryLabel = ''
  } = {}) {
    try {
      if (!container) return;

      container.innerHTML = '';

      if (!result) {
        renderError(container, 'Hasil belum tersedia.');
        return;
      }

      if (result.type === 'workstyle' || result.dimensions) {
        renderWorkstyle({
          container,
          result,
          showActions: true
        });
        return;
      }

      renderCognitive({
        container,
        result,
        questions,
        answers,
        categoryId,
        categoryLabel
      });
    } catch (error) {
      console.error('ResultRenderer.renderSingle error:', error);
      renderError(container, 'Terjadi kesalahan saat menampilkan hasil.');
    }
  }

  /* ============================================================
     COGNITIVE RESULT
  ============================================================ */

  function renderCognitive({
    container,
    result,
    questions = [],
    answers = {},
    categoryId = '',
    categoryLabel = ''
  } = {}) {
    try {
      if (!container) return;

      const normalized = normalizeCognitive({
        result,
        questions,
        answers,
        categoryId,
        categoryLabel
      });

      const scoreBand = getScoreBand(normalized.percentage);
      const statusNote = getStatusNote(normalized.status);
      const accuracy = normalized.total > 0
        ? Math.round((normalized.correct / normalized.total) * 100)
        : 0;

      container.innerHTML = `
        <div class="result-card">
          <div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;flex-wrap:wrap;margin-bottom:1rem;">
            <div>
              <p class="text-muted" style="margin:0 0 .35rem;">Laporan Simulasi Psikotes</p>
              <h2 style="margin:0;">${escapeHtml(normalized.categoryLabel || 'Hasil Tes')}</h2>
            </div>
            <div style="
              display:inline-flex;
              align-items:center;
              justify-content:center;
              padding:.45rem .8rem;
              border-radius:999px;
              background:#f0f7ff;
              color:#1e3a5f;
              font-size:.82rem;
              font-weight:700;
              border:1px solid #dbeafe;
            ">
              ${escapeHtml(scoreBand)}
            </div>
          </div>

          <div style="
            display:grid;
            grid-template-columns: minmax(180px, .8fr) minmax(240px, 1.2fr);
            gap:1rem;
            align-items:stretch;
            margin-top:1rem;
          " class="result-report-top">
            <div style="
              border:1px solid #dbe4ee;
              border-radius:18px;
              padding:1.25rem;
              background:linear-gradient(180deg,#ffffff,#f8fbff);
              text-align:center;
              box-shadow:0 8px 22px rgba(15,23,42,.06);
            ">
              <div style="font-size:.82rem;color:#64748b;font-weight:700;margin-bottom:.35rem;">
                Skor Utama
              </div>
              <div class="result-score-big" style="margin:.25rem 0;">${normalized.percentage}%</div>
              <div class="result-status" style="margin-top:.4rem;">${escapeHtml(normalized.status)}</div>
              <p class="text-muted" style="margin:.65rem 0 0;font-size:.85rem;">
                ${escapeHtml(normalized.percentile)}
              </p>
            </div>

            <div style="
              border:1px solid #dbe4ee;
              border-radius:18px;
              padding:1.25rem;
              background:#ffffff;
              box-shadow:0 8px 22px rgba(15,23,42,.04);
            ">
              <h3 style="margin:0 0 .75rem;color:#1e3a5f;">Ringkasan Hasil</h3>
              <div class="result-summary" style="margin-top:.75rem;">
                <div><strong>Benar:</strong> ${normalized.correct}</div>
                <div><strong>Salah:</strong> ${normalized.wrong}</div>
                <div><strong>Kosong:</strong> ${normalized.blank}</div>
                <div><strong>Total Soal:</strong> ${normalized.total}</div>
              </div>

              <div style="margin-top:1rem;">
                <div style="display:flex;justify-content:space-between;gap:.75rem;margin-bottom:.35rem;font-size:.86rem;color:#64748b;">
                  <span>Akurasi Jawaban</span>
                  <strong style="color:#1e3a5f;">${accuracy}%</strong>
                </div>
                <div class="result-bar" style="height:10px;">
                  <span style="width:${clamp(normalized.percentage, 0, 100)}%"></span>
                </div>
              </div>

              <p class="text-muted" style="margin:1rem 0 0;line-height:1.6;font-size:.9rem;">
                ${escapeHtml(statusNote)}
              </p>
            </div>
          </div>

          <div class="result-conclusion" style="margin-top:1.25rem; padding:1rem; border-radius:14px; background:#f0f7ff; border-left:4px solid #2b8a9a;">
            <h3 style="margin-bottom:0.5rem;">Interpretasi Profil Kemampuan</h3>
            <p style="margin:0; line-height:1.75;">${escapeHtml(normalized.conclusion)}</p>
          </div>

          ${
            normalized.advice
              ? `
                <div class="result-conclusion" style="margin-top:1rem; padding:1rem; border-radius:14px; background:#fff7ed; border-left:4px solid #f59e0b;">
                  <h3 style="margin-bottom:0.5rem;">Saran Pengembangan</h3>
                  <p style="margin:0; line-height:1.75;">${escapeHtml(normalized.advice)}</p>
                </div>
              `
              : ''
          }

          <div class="alert alert-info" style="margin-top:1rem; font-size:0.85rem; line-height:1.6;">
            💡 Hasil ini adalah simulasi latihan psikotes dan tidak menggantikan asesmen resmi oleh psikolog atau lembaga profesional.
          </div>

          <div class="result-actions">
            <button class="btn-primary" onclick="restartTest()">Mulai Ulang</button>
            <button class="btn-secondary" onclick="goHome()">Kembali ke Beranda</button>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('ResultRenderer.renderCognitive error:', error);
      renderError(container, 'Terjadi kesalahan saat menampilkan hasil tes.');
    }
  }

  /* ============================================================
     WORKSTYLE RESULT
  ============================================================ */

  function renderWorkstyle({
    container,
    result,
    showActions = true
  } = {}) {
    try {
      if (!container) return;

      const rawDimensions = result && result.dimensions ? result.dimensions : {};
      const interpretation = getWorkstyleInterpretation(rawDimensions);

      const strengths = cleanList(interpretation.strengths || []);
      const developmentAreas = cleanList(interpretation.developmentAreas || []);
      const workEnvironment = Array.isArray(interpretation.workEnvironment)
        ? interpretation.workEnvironment
        : [];

      container.innerHTML = `
        <div class="result-card">
          <div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;flex-wrap:wrap;margin-bottom:1rem;">
            <div>
              <p class="text-muted" style="margin:0 0 .35rem;">Laporan Profil Gaya Kerja</p>
              <h2 style="margin:0;">Profil Gaya Kerja</h2>
            </div>
            <div style="
              display:inline-flex;
              align-items:center;
              justify-content:center;
              padding:.45rem .8rem;
              border-radius:999px;
              background:#fff7ed;
              color:#9a3412;
              font-size:.82rem;
              font-weight:700;
              border:1px solid #fed7aa;
            ">
              Workstyle Profile
            </div>
          </div>

          <p class="text-muted" style="line-height:1.65;">
            Hasil ini menggambarkan kecenderungan gaya kerja berdasarkan jawaban Anda, meliputi tanggung jawab,
            ketelitian, adaptasi, kerja sama, stabilitas, kepemimpinan, komunikasi, dan orientasi target.
          </p>

          <div style="
            display:grid;
            grid-template-columns:minmax(260px,1fr) minmax(260px,1fr);
            gap:1rem;
            align-items:start;
            margin-top:1.2rem;
          " class="result-report-top">
            <div style="
              border:1px solid #dbe4ee;
              border-radius:18px;
              padding:1rem;
              background:#ffffff;
              box-shadow:0 8px 22px rgba(15,23,42,.04);
            ">
              <h3 style="margin:0 0 .75rem;color:#1e3a5f;">Grafik Profil</h3>
              <div id="radar-result" class="radar-container"></div>
            </div>

            <div style="
              border:1px solid #dbe4ee;
              border-radius:18px;
              padding:1rem;
              background:linear-gradient(180deg,#ffffff,#f8fbff);
              box-shadow:0 8px 22px rgba(15,23,42,.04);
            ">
              <h3 style="margin:0 0 .75rem;color:#1e3a5f;">Gaya Kerja Dominan</h3>
              <div style="
                padding:1rem;
                border-radius:14px;
                background:#fff7ed;
                border-left:4px solid #f59e0b;
                line-height:1.7;
                font-weight:700;
                color:#1e3a5f;
              ">
                ${escapeHtml(interpretation.dominantProfile || 'Profil Gaya Kerja')}
              </div>

              <div style="margin-top:1rem;">
                <h4 style="margin:0 0 .5rem;color:#1e3a5f;">Kekuatan Utama</h4>
                ${
                  strengths.length
                    ? `
                      <ol style="margin:.25rem 0 0;padding-left:1.2rem;line-height:1.7;">
                        ${strengths.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                      </ol>
                    `
                    : '<p class="text-muted">Belum tersedia.</p>'
                }
              </div>
            </div>
          </div>

          <div class="result-conclusion" style="margin-top:1rem; padding:1rem; border-radius:14px; background:#f0f7ff; border-left:4px solid #2b8a9a;">
            <h3 style="margin-bottom:0.5rem;">Interpretasi Profil</h3>
            <p style="margin:0; line-height:1.75;">
              ${escapeHtml(interpretation.summary || 'Profil gaya kerja belum dapat dianalisis secara lengkap.')}
            </p>
          </div>

          <div class="result-grid" style="margin-top:1rem;">
            <div class="result-subtest-card">
              <h4>Area Pengembangan</h4>
              ${
                developmentAreas.length
                  ? `<ol>${developmentAreas.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol>`
                  : '<p class="text-muted">Belum tersedia.</p>'
              }
            </div>

            <div class="result-subtest-card">
              <h4>Rekomendasi Fokus Diri</h4>
              <p class="text-muted" style="line-height:1.6;margin:0;">
                Gunakan hasil ini untuk mengenali pola kerja dominan dan area yang perlu diseimbangkan.
                Hasil yang baik bukan berarti tanpa pengembangan, dan hasil rendah bukan berarti kelemahan mutlak.
              </p>
            </div>
          </div>

          <div class="result-conclusion" style="margin-top:1rem; padding:1rem; border-radius:14px; background:#f8fafc; border-left:4px solid #64748b;">
            <h3 style="margin-bottom:0.5rem;">Rekomendasi Lingkungan Kerja</h3>
            ${
              workEnvironment.length
                ? `
                  <ul style="margin:0; padding-left:1.2rem; line-height:1.75;">
                    ${workEnvironment.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                  </ul>
                `
                : '<p class="text-muted">Belum tersedia.</p>'
            }
          </div>

          <div class="alert alert-info" style="margin-top:1rem; font-size:0.85rem; line-height:1.6;">
            💡 ${escapeHtml(interpretation.notes || 'Hasil ini bersifat simulasi latihan dan bukan diagnosis psikologis resmi.')}
          </div>
        </div>

        ${
          showActions
            ? `
              <div class="result-actions">
                <button class="btn-primary" onclick="restartTest()">Mulai Ulang</button>
                <button class="btn-secondary" onclick="goHome()">Kembali ke Beranda</button>
              </div>
            `
            : ''
        }
      `;

      renderRadar(rawDimensions);
    } catch (error) {
      console.error('ResultRenderer.renderWorkstyle error:', error);
      renderError(container, 'Terjadi kesalahan saat menampilkan Profil Gaya Kerja.');
    }
  }

  /* ============================================================
     FULL MIX RESULT
  ============================================================ */

  function renderFullMix({
    container,
    result,
    categoryLabelById = null
  } = {}) {
    try {
      if (!container) return;

      const cognitiveResults = result && result.cognitiveResults ? result.cognitiveResults : {};
      const totalCognitive = result && result.totalCognitive ? result.totalCognitive : {};
      const workstyle = result && result.workstyle ? result.workstyle : { type: 'workstyle', dimensions: {} };

      const fullMixInterpretation = getFullMixInterpretation({
        cognitiveResults,
        totalCognitive,
        workstyle
      });

      const totalConclusion =
        fullMixInterpretation.conclusion ||
        totalCognitive.conclusion ||
        generateFallbackCognitiveConclusion({
          percentage: totalCognitive.percentage || 0,
          correct: totalCognitive.correct || 0,
          wrong: totalCognitive.wrong || 0,
          blank: totalCognitive.blank || 0,
          total: totalCognitive.total || 0,
          categoryLabel: 'Total Kognitif'
        });

      container.innerHTML = `
        <div class="result-card">
          <p class="text-muted" style="margin:0 0 .35rem;">Laporan Gabungan Simulasi Psikotes</p>
          <h2 style="margin:0 0 1rem;">Hasil Full Mix Test</h2>

          <div style="
            display:grid;
            grid-template-columns:minmax(180px,.8fr) minmax(240px,1.2fr);
            gap:1rem;
            align-items:stretch;
          " class="result-report-top">
            <div style="
              border:1px solid #dbe4ee;
              border-radius:18px;
              padding:1.25rem;
              background:linear-gradient(180deg,#ffffff,#f8fbff);
              text-align:center;
              box-shadow:0 8px 22px rgba(15,23,42,.06);
            ">
              <div style="font-size:.82rem;color:#64748b;font-weight:700;margin-bottom:.35rem;">
                Skor Kognitif Total
              </div>
              <div class="result-score-big">${totalCognitive.percentage || 0}%</div>
              <div class="result-status">
                ${escapeHtml(fullMixInterpretation.status || totalCognitive.status || 'Belum Ada Status')}
              </div>
              <p class="text-muted" style="margin:.65rem 0 0;font-size:.85rem;">
                ${escapeHtml(fullMixInterpretation.percentile || totalCognitive.percentile || 'Estimasi persentil belum tersedia.')}
              </p>
            </div>

            <div style="
              border:1px solid #dbe4ee;
              border-radius:18px;
              padding:1.25rem;
              background:#ffffff;
              box-shadow:0 8px 22px rgba(15,23,42,.04);
            ">
              <h3 style="margin:0 0 .75rem;color:#1e3a5f;">Kesimpulan Kognitif</h3>
              <p style="margin:0;line-height:1.75;">${escapeHtml(totalConclusion)}</p>
            </div>
          </div>
        </div>

        <div class="result-grid" id="subtest-results" style="margin-top:1rem;"></div>

        <div id="fullmix-workstyle-result"></div>

        <div class="result-actions">
          <button class="btn-primary" onclick="restartTest()">Mulai Ulang</button>
          <button class="btn-secondary" onclick="goHome()">Kembali ke Beranda</button>
        </div>
      `;

      renderSubtestCards({
        cognitiveResults,
        categoryLabelById
      });

      const workstyleContainer = document.getElementById('fullmix-workstyle-result');

      if (workstyleContainer) {
        renderWorkstyle({
          container: workstyleContainer,
          result: workstyle,
          showActions: false
        });
      }
    } catch (error) {
      console.error('ResultRenderer.renderFullMix error:', error);
      renderError(container, 'Terjadi kesalahan saat menampilkan hasil Full Mix.');
    }
  }

  function renderSubtestCards({
    cognitiveResults = {},
    categoryLabelById = null
  } = {}) {
    try {
      const grid = document.getElementById('subtest-results');
      if (!grid) return;

      grid.innerHTML = '';

      const keys = Object.keys(cognitiveResults || {});

      if (!keys.length) {
        grid.innerHTML = `
          <div class="result-subtest-card">
            <h4>Sub-Tes Kognitif</h4>
            <p class="text-muted">Data sub-tes belum tersedia.</p>
          </div>
        `;
        return;
      }

      keys.forEach(key => {
        const item = cognitiveResults[key] || {};
        const label =
          item.categoryLabel ||
          (typeof categoryLabelById === 'function' ? categoryLabelById(key) : key);

        const card = document.createElement('div');
        card.className = 'result-subtest-card';

        card.innerHTML = `
          <h4>${escapeHtml(label)}</h4>

          <div class="result-bar">
            <span style="width:${clamp(item.percentage || 0, 0, 100)}%"></span>
          </div>

          <p style="margin:.65rem 0 .35rem;">
            <strong>${item.percentage || 0}%</strong>
            • Benar ${item.correct || 0}/${item.total || 0}
          </p>

          ${
            item.status
              ? `<p style="font-size:.82rem;font-weight:700;color:#1e3a5f;margin:.25rem 0;">${escapeHtml(item.status)}</p>`
              : ''
          }

          ${
            item.advice
              ? `<p class="text-muted" style="font-size:0.82rem; line-height:1.5;">${escapeHtml(item.advice)}</p>`
              : ''
          }
        `;

        grid.appendChild(card);
      });
    } catch (error) {
      console.error('ResultRenderer.renderSubtestCards error:', error);
    }
  }

  /* ============================================================
     RADAR
  ============================================================ */

  function renderRadar(dimensions = {}) {
    const radarEl = document.getElementById('radar-result');
    if (!radarEl) return;

    try {
      radarEl.innerHTML = '';

      if (typeof RadarChart !== 'undefined' && RadarChart.render) {
        RadarChart.render(radarEl, dimensions);
      } else {
        radarEl.innerHTML = '<p class="text-muted">Grafik radar belum tersedia.</p>';
      }
    } catch (error) {
      console.error('ResultRenderer.renderRadar error:', error);
      radarEl.innerHTML = '<p class="text-muted">Grafik radar belum dapat ditampilkan.</p>';
    }
  }

  /* ============================================================
     ERROR
  ============================================================ */

  function renderError(container, message = 'Terjadi kesalahan saat menghitung hasil.') {
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state">
        <h3>Hasil belum tersedia</h3>
        <p>${escapeHtml(message)}</p>
      </div>
      <div class="result-actions">
        <button class="btn-primary" onclick="restartTest()">Mulai Ulang</button>
        <button class="btn-secondary" onclick="goHome()">Kembali ke Beranda</button>
      </div>
    `;
  }

  /* ============================================================
     NORMALIZE COGNITIVE
  ============================================================ */

  function normalizeCognitive({
    result = {},
    questions = [],
    answers = {},
    categoryId = '',
    categoryLabel = ''
  } = {}) {
    try {
      if (
        typeof ResultInterpreter !== 'undefined' &&
        ResultInterpreter.normalizeCognitiveResult
      ) {
        return ResultInterpreter.normalizeCognitiveResult({
          result,
          questions,
          answers,
          categoryId,
          categoryLabel
        });
      }
    } catch (error) {
      console.error('ResultRenderer.normalizeCognitive interpreter error:', error);
    }

    const total = toNumber(result.total ?? result.totalQuestions ?? questions.length ?? 0);
    const correct = toNumber(result.correct ?? result.correctCount ?? result.benar ?? 0);
    const blank = toNumber(result.blank ?? result.blankCount ?? result.empty ?? result.kosong ?? 0);
    const wrong = toNumber(result.wrong ?? result.wrongCount ?? result.salah ?? Math.max(total - correct - blank, 0));

    let percentage = result.percentage ?? result.percent ?? result.scorePercentage ?? result.score;

    if (percentage === undefined || percentage === null || percentage === '') {
      percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    }

    percentage = Math.round(toNumber(percentage));

    const status = result.status || getFallbackStatus(percentage);
    const percentile = result.percentile || getFallbackPercentile(percentage);

    const conclusion =
      result.conclusion ||
      generateFallbackCognitiveConclusion({
        percentage,
        correct,
        wrong,
        blank,
        total,
        categoryLabel
      });

    return {
      ...result,
      type: 'cognitive',
      categoryId,
      categoryLabel,
      total,
      correct,
      wrong,
      blank,
      percentage,
      status,
      percentile,
      conclusion,
      advice: result.advice || ''
    };
  }

  /* ============================================================
     INTERPRETER BRIDGE
  ============================================================ */

  function getWorkstyleInterpretation(dimensions = {}) {
    try {
      if (
        typeof ResultInterpreter !== 'undefined' &&
        ResultInterpreter.generateWorkstyleInterpretation
      ) {
        const result = ResultInterpreter.generateWorkstyleInterpretation(dimensions);

        if (result && typeof result === 'object') {
          return sanitizeWorkstyleInterpretation(result);
        }
      }
    } catch (error) {
      console.error('ResultRenderer.getWorkstyleInterpretation error:', error);
    }

    return sanitizeWorkstyleInterpretation({
      type: 'workstyle',
      title: 'Profil Gaya Kerja',
      dominantProfile: 'Profil Gaya Kerja',
      summary:
        'Berdasarkan jawaban Anda, profil gaya kerja menunjukkan kecenderungan tertentu dalam cara bekerja. Gunakan hasil ini sebagai bahan refleksi latihan.',
      strengths: [],
      developmentAreas: [],
      workEnvironment: [
        'Lingkungan kerja yang seimbang antara arahan yang jelas, ruang belajar, dan dukungan tim.'
      ],
      notes:
        'Hasil ini bersifat simulasi latihan dan bukan diagnosis psikologis resmi.'
    });
  }

  function sanitizeWorkstyleInterpretation(input = {}) {
    return {
      type: 'workstyle',
      title: input.title || 'Profil Gaya Kerja',
      dominantProfile: sanitizeLabel(input.dominantProfile || 'Profil Gaya Kerja'),
      summary: sanitizeSummary(input.summary || ''),
      strengths: cleanList(input.strengths || []),
      developmentAreas: cleanList(input.developmentAreas || []),
      workEnvironment: Array.isArray(input.workEnvironment) ? input.workEnvironment : [],
      notes:
        input.notes ||
        'Hasil ini bersifat simulasi latihan dan bukan diagnosis psikologis resmi.'
    };
  }

  function getFullMixInterpretation({
    cognitiveResults = {},
    totalCognitive = {},
    workstyle = {}
  } = {}) {
    try {
      if (
        typeof ResultInterpreter !== 'undefined' &&
        ResultInterpreter.normalizeFullMixResult
      ) {
        const result = ResultInterpreter.normalizeFullMixResult({
          cognitiveResults,
          totalCognitive,
          workstyle
        });

        if (result && typeof result === 'object') {
          return result;
        }
      }
    } catch (error) {
      console.error('ResultRenderer.getFullMixInterpretation error:', error);
    }

    return {
      status: totalCognitive.status || getFallbackStatus(totalCognitive.percentage || 0),
      percentile: totalCognitive.percentile || getFallbackPercentile(totalCognitive.percentage || 0),
      conclusion:
        totalCognitive.conclusion ||
        generateFallbackCognitiveConclusion({
          percentage: totalCognitive.percentage || 0,
          correct: totalCognitive.correct || 0,
          wrong: totalCognitive.wrong || 0,
          blank: totalCognitive.blank || 0,
          total: totalCognitive.total || 0,
          categoryLabel: 'Total Kognitif'
        })
    };
  }

  /* ============================================================
     HELPERS
  ============================================================ */

  function cleanList(items = []) {
    if (!Array.isArray(items)) return [];

    return items
      .map((item, index) => {
        if (typeof item === 'string') return sanitizeLabel(item);

        if (item && typeof item === 'object') {
          return sanitizeLabel(item.label || item.title || item.id || item.name || `Dimensi ${index + 1}`);
        }

        return '';
      })
      .filter(Boolean)
      .filter(item => !/^\d+$/.test(item));
  }

  function sanitizeSummary(text = '') {
    const value = String(text || '').trim();

    if (!value) {
      return 'Profil gaya kerja belum dapat dianalisis secara lengkap.';
    }

    return value;
  }

  function sanitizeLabel(value = '') {
    const text = String(value || '').trim();

    if (!text) return '';

    if (/^\d+$/.test(text)) {
      return '';
    }

    return text;
  }

  function getStatusNote(status) {
    if (
      typeof ResultInterpreter !== 'undefined' &&
      ResultInterpreter.getStatusNote
    ) {
      try {
        return ResultInterpreter.getStatusNote(status);
      } catch (error) {
        console.error('ResultRenderer.getStatusNote error:', error);
      }
    }

    return 'Gunakan hasil ini sebagai bahan evaluasi latihan, bukan sebagai penilaian resmi.';
  }

  function getScoreBand(percentage) {
    const score = toNumber(percentage);

    if (score >= 85) return 'Sangat Tinggi';
    if (score >= 70) return 'Tinggi';
    if (score >= 55) return 'Cukup';
    if (score >= 40) return 'Perlu Penguatan';
    return 'Dasar Perlu Dilatih';
  }

  function getFallbackPercentile(percentage) {
    const score = toNumber(percentage);

    if (score >= 90) return 'Estimasi Persentil 90-95';
    if (score >= 80) return 'Estimasi Persentil 80-89';
    if (score >= 70) return 'Estimasi Persentil 65-79';
    if (score >= 60) return 'Estimasi Persentil 50-64';
    if (score >= 50) return 'Estimasi Persentil 35-49';
    return 'Estimasi Persentil di bawah 35';
  }

  function getFallbackStatus(percentage) {
    const score = toNumber(percentage);

    if (score >= 85) return 'Potensi Sangat Kuat';
    if (score >= 70) return 'Potensi Baik';
    if (score >= 55) return 'Potensi Cukup';
    if (score >= 40) return 'Perlu Penguatan';
    return 'Perlu Penguatan Dasar';
  }

  function generateFallbackCognitiveConclusion({
    percentage = 0,
    correct = 0,
    wrong = 0,
    blank = 0,
    total = 0,
    categoryLabel = 'tes ini'
  } = {}) {
    const score = toNumber(percentage);

    if (!total) {
      return 'Belum ada data jawaban yang dapat dianalisis.';
    }

    if (score >= 85) {
      return `Hasil ${categoryLabel} menunjukkan potensi sangat kuat. Anda menjawab ${correct} dari ${total} soal dengan benar.`;
    }

    if (score >= 70) {
      return `Hasil ${categoryLabel} menunjukkan potensi baik. Anda menjawab ${correct} dari ${total} soal dengan benar.`;
    }

    if (score >= 55) {
      return `Hasil ${categoryLabel} berada pada kategori cukup. Anda menjawab ${correct} dari ${total} soal dengan benar.`;
    }

    let text =
      `Hasil ${categoryLabel} masih perlu penguatan. Anda menjawab ${correct} dari ${total} soal dengan benar.`;

    if (blank > 0) {
      text += ` Terdapat ${blank} soal yang belum dijawab.`;
    }

    return text;
  }

  function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(toNumber(value), min), max);
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';

    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  return {
    renderSingle,
    renderCognitive,
    renderWorkstyle,
    renderFullMix,
    renderSubtestCards,
    renderRadar,
    normalizeCognitive
  };
})();