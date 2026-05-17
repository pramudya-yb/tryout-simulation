/**
 * github-api.js
 * Handles reading and writing question bank JSON files
 * to GitHub via the GitHub Contents API.
 *
 * TOKEN RULE: Token is NEVER hardcoded. Always entered manually by the user.
 * If temporarily stored, use sessionStorage only.
 */

const GitHubAPI = (() => {
  const BASE = 'https://api.github.com';
  const TOKEN_KEY = 'psikotes_gh_token'; // sessionStorage key

  /* --- Token management --- */

  function saveToken(token) {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
  }

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  }

  function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
  }

  function hasToken() {
    return !!getToken();
  }

  /* --- Core API --- */

  /**
   * Get file content from GitHub.
   * @param {object} config - { owner, repo, branch, path }
   * @returns {Promise<{ content: Array, sha: string }>}
   */
  async function getFile(config) {
    const { owner, repo, branch, path } = config;
    const token = getToken();
    if (!token) throw new Error('Token GitHub tidak ditemukan. Masukkan token terlebih dahulu.');

    const url = `${BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`GitHub API error ${res.status}: ${err.message || res.statusText}`);
    }

    const data = await res.json();
    const decoded = atob(data.content.replace(/\n/g, ''));
    let content;
    try {
      content = JSON.parse(decoded);
    } catch (e) {
      content = [];
    }

    return { content, sha: data.sha };
  }

  /**
   * Append a new question to a file and commit to GitHub.
   * @param {object} config - { owner, repo, branch, path }
   * @param {object} newQuestion - question object to append
   * @param {string} [commitMessage]
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function appendQuestion(config, newQuestion, commitMessage) {
    const token = getToken();
    if (!token) return { success: false, message: 'Token GitHub tidak ditemukan. Masukkan token terlebih dahulu.' };

    try {
      // Get current file
      const { content: current, sha } = await getFile(config);
      const updated = Array.isArray(current) ? [...current, newQuestion] : [newQuestion];

      const msg = commitMessage || `Tambah soal: ${newQuestion.id || 'baru'} via Admin`;
      return await _putFile(config, updated, sha, msg);
    } catch (e) {
      console.error('GitHubAPI appendQuestion error:', e);
      return { success: false, message: e.message || 'Gagal menambahkan soal ke GitHub.' };
    }
  }

  /**
   * Replace entire file content (e.g. full updated question array).
   * @param {object} config - { owner, repo, branch, path }
   * @param {Array} questions - full updated array
   * @param {string} sha - current file SHA
   * @param {string} [commitMessage]
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function putFile(config, questions, sha, commitMessage) {
    const token = getToken();
    if (!token) return { success: false, message: 'Token GitHub tidak ditemukan.' };
    const msg = commitMessage || `Update soal via Admin`;
    return _putFile(config, questions, sha, msg);
  }

  async function _putFile(config, data, sha, message) {
    const token = getToken();
    const { owner, repo, branch, path } = config;
    const url = `${BASE}/repos/${owner}/${repo}/contents/${path}`;

    const body = {
      message,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
      branch
    };
    if (sha) body.sha = sha;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: `GitHub API error ${res.status}: ${err.message || res.statusText}` };
    }

    return { success: true, message: `Berhasil disimpan ke GitHub: ${path}` };
  }

  /**
   * Test if the current token is valid by fetching the repo info.
   * @param {string} owner
   * @param {string} repo
   * @returns {Promise<{ valid: boolean, message: string }>}
   */
  async function testToken(owner, repo) {
    const token = getToken();
    if (!token) return { valid: false, message: 'Token belum dimasukkan.' };
    try {
      const res = await fetch(`${BASE}/repos/${owner}/${repo}`, {
        headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }
      });
      if (res.ok) return { valid: true, message: 'Token valid dan repositori dapat diakses.' };
      return { valid: false, message: `Gagal: HTTP ${res.status}. Periksa token dan nama repositori.` };
    } catch (e) {
      return { valid: false, message: 'Koneksi gagal. Periksa jaringan internet Anda.' };
    }
  }

  return { saveToken, getToken, clearToken, hasToken, getFile, appendQuestion, putFile, testToken };
})();
