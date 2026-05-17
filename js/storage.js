/**
 * storage.js
 * Handles localStorage save/load/clear for test session state.
 */

const Storage = (() => {
  const KEY = 'psikotes_session';

  /**
   * Save the entire session state object.
   * @param {object} state
   */
  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Storage: could not save session state.', e);
    }
  }

  /**
   * Load the saved session state.
   * @returns {object|null}
   */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Storage: could not load session state.', e);
      return null;
    }
  }

  /**
   * Clear the saved session state.
   */
  function clear() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {
      console.warn('Storage: could not clear session state.', e);
    }
  }

  /**
   * Check if there is a saved session that can be resumed.
   * A session is resumable if it is not finished and was started.
   * @returns {boolean}
   */
  function hasResumable() {
    const state = load();
    return !!(state && state.started && !state.finished);
  }

  /**
   * Save a specific key-value pair within the session.
   * @param {string} key
   * @param {*} value
   */
  function set(key, value) {
    const state = load() || {};
    state[key] = value;
    save(state);
  }

  /**
   * Get a specific key from the session state.
   * @param {string} key
   * @param {*} defaultValue
   * @returns {*}
   */
  function get(key, defaultValue = null) {
    const state = load();
    if (!state) return defaultValue;
    return key in state ? state[key] : defaultValue;
  }

  return { save, load, clear, hasResumable, set, get };
})();
