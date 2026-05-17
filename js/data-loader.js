/**
 * data-loader.js
 * Loads manifest.json and question bank JSON files.
 * Handles empty arrays gracefully.
 */

const DataLoader = (() => {
  let _manifest = null;
  // Cache: fileId -> array of questions
  const _cache = {};

  /**
   * Load and parse manifest.json.
   * @returns {Promise<object>}
   */
  async function loadManifest() {
    if (_manifest) return _manifest;
    try {
      const res = await fetch('data/manifest.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      _manifest = await res.json();
      return _manifest;
    } catch (e) {
      console.error('DataLoader: failed to load manifest.json', e);
      throw e;
    }
  }

  /**
   * Get the cached manifest (must call loadManifest first).
   * @returns {object|null}
   */
  function getManifest() {
    return _manifest;
  }

  /**
   * Load a single question bank JSON file by its path.
   * Returns [] if the file is empty or not found.
   * @param {string} path - e.g. "data/verbal-set-1.json"
   * @param {string} fileId - used as cache key
   * @returns {Promise<Array>}
   */
  async function loadFile(path, fileId) {
    if (_cache[fileId] !== undefined) return _cache[fileId];
    try {
      const res = await fetch(path);
      if (!res.ok) {
        console.warn(`DataLoader: ${path} returned HTTP ${res.status}, treating as empty.`);
        _cache[fileId] = [];
        return [];
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.warn(`DataLoader: ${path} is not an array, treating as empty.`);
        _cache[fileId] = [];
        return [];
      }
      _cache[fileId] = data;
      return data;
    } catch (e) {
      console.warn(`DataLoader: could not load ${path}`, e);
      _cache[fileId] = [];
      return [];
    }
  }

  /**
   * Load all files for a given set and category from manifest.
   * @param {string} setId - "set1" | "set2" | "set3"
   * @param {string} categoryId - "verbal" | "numerical" | etc.
   * @returns {Promise<{questions: Array, fileInfo: object|null}>}
   */
  async function loadPracticeSet(setId, categoryId) {
    const manifest = await loadManifest();
    const setDef = manifest.sets.find(s => s.id === setId);
    if (!setDef || setDef.type !== 'practice') {
      return { questions: [], fileInfo: null };
    }
    const fileInfo = setDef.files.find(f => f.categoryId === categoryId);
    if (!fileInfo) {
      return { questions: [], fileInfo: null };
    }
    const questions = await loadFile(fileInfo.path, fileInfo.fileId);
    return { questions, fileInfo };
  }

  /**
   * Load all source pools for Full Mix test.
   * Returns a map: categoryId -> Array of questions from all source sets.
   * @returns {Promise<object>}
   */
  async function loadFullMixPools() {
    const manifest = await loadManifest();
    const set0 = manifest.sets.find(s => s.id === 'set0');
    if (!set0) return {};

    const pools = {};

    for (const subtest of set0.subtests) {
      const allQuestions = [];
      for (const fileId of subtest.sourceSets) {
        const fileInfo = manifest.allFiles.find(f => f.id === fileId);
        if (fileInfo) {
          const qs = await loadFile(fileInfo.path, fileInfo.id);
          allQuestions.push(...qs);
        }
      }
      pools[subtest.categoryId] = allQuestions;
    }

    return pools;
  }

  /**
   * Clear the file cache (useful for admin after uploading new questions).
   */
  function clearCache() {
    Object.keys(_cache).forEach(k => delete _cache[k]);
  }

  return { loadManifest, getManifest, loadFile, loadPracticeSet, loadFullMixPools, clearCache };
})();
