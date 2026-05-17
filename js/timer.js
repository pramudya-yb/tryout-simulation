/**
 * timer.js
 * Handles countdown timers for practice sets and Full Mix sub-tests.
 */

const Timer = (() => {
  let _intervalId = null;
  let _seconds = 0;
  let _onTick = null;
  let _onExpire = null;
  let _running = false;

  /**
   * Start a countdown timer.
   * @param {number} totalSeconds - Duration in seconds
   * @param {function} onTick - Called every second with (secondsRemaining)
   * @param {function} onExpire - Called when timer reaches zero
   */
  function start(totalSeconds, onTick, onExpire) {
    stop(); // clear any existing timer
    _seconds = totalSeconds;
    _onTick = onTick;
    _onExpire = onExpire;
    _running = true;

    if (_onTick) _onTick(_seconds);

    _intervalId = setInterval(() => {
      _seconds--;
      if (_onTick) _onTick(_seconds);
      if (_seconds <= 0) {
        stop();
        if (_onExpire) _onExpire();
      }
    }, 1000);
  }

  /** Pause the timer (keeps remaining seconds). */
  function pause() {
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
      _running = false;
    }
  }

  /** Resume a paused timer. */
  function resume() {
    if (!_running && _seconds > 0) {
      _running = true;
      _intervalId = setInterval(() => {
        _seconds--;
        if (_onTick) _onTick(_seconds);
        if (_seconds <= 0) {
          stop();
          if (_onExpire) _onExpire();
        }
      }, 1000);
    }
  }

  /** Stop and reset the timer. */
  function stop() {
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
    _running = false;
  }

  /** Set remaining seconds (for restoring from localStorage). */
  function setRemaining(seconds) {
    _seconds = Math.max(0, seconds);
  }

  /** Get current remaining seconds. */
  function getRemaining() {
    return _seconds;
  }

  /** Check if timer is running. */
  function isRunning() {
    return _running;
  }

  /**
   * Format seconds to MM:SS string.
   * @param {number} seconds
   * @returns {string}
   */
  function format(seconds) {
    const s = Math.max(0, seconds);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  /**
   * Get CSS class for timer display based on urgency.
   * @param {number} seconds
   * @param {number} totalSeconds
   * @returns {string} '' | 'warning' | 'danger'
   */
  function urgencyClass(seconds, totalSeconds) {
    const ratio = seconds / totalSeconds;
    if (ratio <= 0.1 || seconds <= 30) return 'danger';
    if (ratio <= 0.25 || seconds <= 120) return 'warning';
    return '';
  }

  return { start, pause, resume, stop, setRemaining, getRemaining, isRunning, format, urgencyClass };
})();
