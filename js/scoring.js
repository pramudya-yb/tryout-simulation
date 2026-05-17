/**
 * scoring.js
 * Handles cognitive scoring, estimated percentile, passing grade,
 * and workstyle dimension scoring.
 */

const Scoring = (() => {

  /* -----------------------------------------------
     COGNITIVE SCORING
  ----------------------------------------------- */

  /**
   * Score cognitive answers against correct answers.
   * @param {Array} questions - array of question objects
   * @param {object} answers - map of questionId -> selectedOptionId (or null)
   * @returns {object} { correct, wrong, blank, total, score, percent }
   */
  function scoreCognitive(questions, answers) {
    if (!questions || questions.length === 0) {
      return { correct: 0, wrong: 0, blank: 0, total: 0, score: 0, percent: 0 };
    }

    let correct = 0, wrong = 0, blank = 0;

    questions.forEach(q => {
      const given = answers[q.id];
      if (!given || given === null || given === '') {
        blank++;
      } else if (given === q.answer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const total = questions.length;
    const score = correct; // 1 per correct, 0 wrong/blank
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { correct, wrong, blank, total, score, percent };
  }

  /**
   * Get estimated percentile label for a given percentage score.
   * Uses manifest percentile map if available, or built-in fallback.
   * @param {number} percent - 0 to 100
   * @param {Array} [percentileMap] - from manifest.scoring.cognitive.percentileMap
   * @returns {string}
   */
  function getEstimatedPercentile(percent, percentileMap) {
    const map = percentileMap || [
      { minPercent: 90, maxPercent: 100, estimasiPersentil: '90–95' },
      { minPercent: 80, maxPercent: 89,  estimasiPersentil: '80–89' },
      { minPercent: 65, maxPercent: 79,  estimasiPersentil: '65–79' },
      { minPercent: 50, maxPercent: 64,  estimasiPersentil: '50–64' },
      { minPercent: 35, maxPercent: 49,  estimasiPersentil: '35–49' },
      { minPercent: 0,  maxPercent: 34,  estimasiPersentil: 'di bawah 35' }
    ];

    for (const entry of map) {
      if (percent >= entry.minPercent && percent <= entry.maxPercent) {
        return `Estimasi Persentil ${entry.estimasiPersentil}`;
      }
    }
    return 'Estimasi Persentil di bawah 35';
  }

  /**
   * Get recommendation status based on percent score.
   * @param {number} percent
   * @returns {string}
   */
  function getRecommendationStatus(percent) {
    if (percent >= 80) return 'Sangat Direkomendasikan';
    if (percent >= 65) return 'Direkomendasikan';
    if (percent >= 50) return 'Cukup / Perlu Penguatan';
    return 'Perlu Latihan Lebih Lanjut';
  }

  /**
   * Get CSS class for status badge.
   * @param {string} status
   * @returns {string}
   */
  function getStatusClass(status) {
    if (status === 'Sangat Direkomendasikan' || status === 'Direkomendasikan') return 'status-recommended';
    if (status === 'Disarankan Pertimbangan') return 'status-consider';
    if (status === 'Cukup / Perlu Penguatan') return 'status-medium';
    return 'status-practice';
  }

  /**
   * Calculate overall cognitive result for Full Mix or single sub-test.
   * @param {Array} subtestResults - array of { categoryId, label, ...scoreCognitive result }
   * @param {Array} [percentileMap]
   * @returns {object} overall result with status, percentile, etc.
   */
  function calcOverallCognitive(subtestResults, percentileMap) {
    if (!subtestResults || subtestResults.length === 0) {
      return { overallPercent: 0, status: 'Perlu Latihan Lebih Lanjut', percentile: 'Estimasi Persentil di bawah 35', anyBelowPassing: true };
    }

    // Only cognitive sub-tests for passing check
    const cognitiveResults = subtestResults.filter(r => r.scoringType !== 'workstyle');

    const totalCorrect = cognitiveResults.reduce((s, r) => s + r.correct, 0);
    const totalQuestions = cognitiveResults.reduce((s, r) => s + r.total, 0);
    const overallPercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    const anyBelowPassing = cognitiveResults.some(r => r.percent < 50);
    const status = anyBelowPassing ? 'Disarankan Pertimbangan' : getRecommendationStatus(overallPercent);
    const percentile = getEstimatedPercentile(overallPercent, percentileMap);

    return { overallPercent, status, percentile, anyBelowPassing };
  }

  /* -----------------------------------------------
     WORKSTYLE SCORING
  ----------------------------------------------- */

  /**
   * Score workstyle (Likert) answers.
   * @param {Array} questions - workstyle question objects
   * @param {object} answers - map of questionId -> numeric value (1-5 or null)
   * @returns {object} { dimensions: {id, label, score, maxScore, percent}[], answered, blank, total }
   */
  function scoreWorkstyle(questions, answers) {
    if (!questions || questions.length === 0) {
      return { dimensions: [], answered: 0, blank: 0, total: 0 };
    }

    // Accumulate per dimension
    const dimMap = {};

    questions.forEach(q => {
      const dim = q.dimension || 'unknown';
      if (!dimMap[dim]) dimMap[dim] = { sum: 0, count: 0 };

      let raw = answers[q.id];
      if (raw === null || raw === undefined || raw === '') {
        dimMap[dim].count++; // count question but no score contribution
        return;
      }

      raw = parseInt(raw, 10);
      // Reverse scoring if needed
      const scored = q.reverseScored ? (6 - raw) : raw;
      dimMap[dim].sum += scored;
      dimMap[dim].count++;
    });

    const answered = Object.values(answers).filter(v => v !== null && v !== undefined && v !== '').length;
    const blank = questions.length - answered;

    // Build dimension results
    const dimensions = Object.entries(dimMap).map(([id, data]) => {
      const maxScore = data.count * 5;
      const percent = maxScore > 0 ? Math.round((data.sum / maxScore) * 100) : 0;
      return { id, sum: data.sum, count: data.count, maxScore, percent };
    });

    // Sort by percent descending
    dimensions.sort((a, b) => b.percent - a.percent);

    return { dimensions, answered, blank, total: questions.length };
  }

  /**
   * Get top N strongest and bottom N weakest dimensions.
   * @param {Array} dimensions - from scoreWorkstyle result
   * @param {number} topN
   * @param {number} bottomN
   * @returns {{ strongest: Array, weakest: Array }}
   */
  function getWorkstyleHighlights(dimensions, topN = 3, bottomN = 2) {
    if (!dimensions || dimensions.length === 0) return { strongest: [], weakest: [] };
    const sorted = [...dimensions].sort((a, b) => b.percent - a.percent);
    return {
      strongest: sorted.slice(0, topN),
      weakest: sorted.slice(-bottomN).reverse()
    };
  }

  /**
   * Get human-readable label for a workstyle dimension id.
   * Uses manifest if provided, else built-in labels.
   * @param {string} dimId
   * @param {Array} [dimensionDefs] - from manifest.workstyleDimensions
   * @returns {string}
   */
  function getDimensionLabel(dimId, dimensionDefs) {
    if (dimensionDefs) {
      const def = dimensionDefs.find(d => d.id === dimId);
      if (def) return def.label;
    }
    const fallback = {
      leadership:     'Kepemimpinan',
      influence:      'Komunikasi dan Pengaruh Sosial',
      steadiness:     'Stabilitas dan Konsistensi',
      compliance:     'Ketelitian dan Kepatuhan Prosedur',
      teamwork:       'Kerjasama Tim',
      adaptability:   'Adaptasi',
      achievement:    'Orientasi Target',
      responsibility: 'Tanggung Jawab'
    };
    return fallback[dimId] || dimId;
  }

  return {
    scoreCognitive,
    getEstimatedPercentile,
    getRecommendationStatus,
    getStatusClass,
    calcOverallCognitive,
    scoreWorkstyle,
    getWorkstyleHighlights,
    getDimensionLabel
  };
})();
