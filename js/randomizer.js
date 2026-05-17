/**
 * randomizer.js
 * Handles question order randomization and option shuffling.
 */

const Randomizer = (() => {
  /**
   * Fisher-Yates shuffle — returns a new shuffled array.
   * @param {Array} arr
   * @returns {Array}
   */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Randomize question order and return shuffled questions.
   * Cognitive questions also get their options shuffled (answer tracking preserved).
   * Workstyle questions are shuffled in order only (no options to shuffle).
   * @param {Array} questions
   * @returns {Array} shuffled questions with updated answer keys
   */
  function randomizeQuestions(questions) {
    if (!questions || questions.length === 0) return [];
    const shuffled = shuffle(questions);
    return shuffled.map(q => randomizeOptions(q));
  }

  /**
   * Shuffle the options of a single cognitive question.
   * Updates the "answer" field to match the new position of the correct option.
   * Workstyle and questions without options are returned unchanged.
   * @param {object} q
   * @returns {object}
   */
  function randomizeOptions(q) {
    if (!q || !q.options || !Array.isArray(q.options) || q.options.length === 0) {
      return q;
    }
    // Shuffle options
    const shuffledOptions = shuffle(q.options);
    return { ...q, options: shuffledOptions };
    // Note: answer remains the same (e.g. "A"), and option id on each item still carries "A","B"...
    // Scoring checks option.id === q.answer, so as long as id is preserved, this is correct.
  }

  /**
   * Pick N random items from an array (without replacement).
   * If array has fewer than N items, return all items shuffled.
   * @param {Array} arr
   * @param {number} n
   * @returns {Array}
   */
  function pickRandom(arr, n) {
    if (!arr || arr.length === 0) return [];
    const shuffled = shuffle(arr);
    return shuffled.slice(0, Math.min(n, shuffled.length));
  }

  /**
   * Merge multiple arrays and pick N random items from the combined pool.
   * @param {Array[]} arrays
   * @param {number} n
   * @returns {Array}
   */
  function mergeAndPick(arrays, n) {
    const combined = arrays.reduce((acc, arr) => acc.concat(arr || []), []);
    return pickRandom(combined, n);
  }

  return { shuffle, randomizeQuestions, randomizeOptions, pickRandom, mergeAndPick };
})();
