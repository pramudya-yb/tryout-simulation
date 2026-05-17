/**
 * render-numerical.js
 * Renders tables and simple bar/line charts from JSON stimulus data.
 * Uses HTML/CSS/SVG — no external chart libraries.
 *
 * Supported stimulus types:
 *   table, bar-chart, line-chart, scenario (text only)
 */

const RenderNumerical = (() => {

  /**
   * Render a numerical stimulus into a container element.
   * @param {HTMLElement} container
   * @param {object|null} stimulus
   */
  function render(container, stimulus) {
    if (!container) return;
    container.innerHTML = '';

    if (!stimulus || !stimulus.type) {
      return; // No stimulus — just show question text, no placeholder needed
    }

    try {
      switch (stimulus.type) {
        case 'table':      _renderTable(container, stimulus); break;
        case 'bar-chart':  _renderBarChart(container, stimulus); break;
        case 'line-chart': _renderLineChart(container, stimulus); break;
        case 'scenario':   _renderScenario(container, stimulus); break;
        default:
          container.innerHTML = `<p style="color:#6b7c93;font-size:0.88rem;">[ Tipe stimulus "${stimulus.type}" belum didukung ]</p>`;
      }
    } catch (e) {
      console.warn('RenderNumerical: render error', e);
      container.innerHTML = '<p style="color:#e05c5c;font-size:0.88rem;">[ Gagal merender data numerik ]</p>';
    }
  }

  /* --- Table renderer --- */
  function _renderTable(container, stimulus) {
    // stimulus.headers: string[]
    // stimulus.rows: string[][]
    const headers = stimulus.headers || [];
    const rows = stimulus.rows || [];

    if (stimulus.title) {
      const h = document.createElement('p');
      h.style.cssText = 'font-weight:700;font-size:0.88rem;color:#1e3a5f;margin-bottom:0.5rem;';
      h.textContent = stimulus.title;
      container.appendChild(h);
    }

    const wrapper = document.createElement('div');
    wrapper.style.overflowX = 'auto';

    const table = document.createElement('table');
    table.className = 'stim-table';

    if (headers.length > 0) {
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');
      headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        tr.appendChild(th);
      });
      thead.appendChild(tr);
      table.appendChild(thead);
    }

    const tbody = document.createElement('tbody');
    rows.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    wrapper.appendChild(table);
    container.appendChild(wrapper);
  }

  /* --- Bar chart renderer (SVG) --- */
  function _renderBarChart(container, stimulus) {
    // stimulus.title, stimulus.labels: string[], stimulus.values: number[], stimulus.unit?
    const labels = stimulus.labels || [];
    const values = stimulus.values || [];
    const unit = stimulus.unit || '';
    const n = labels.length;

    if (n === 0) {
      container.innerHTML = '<p style="color:#6b7c93;font-size:0.88rem;">[ Data grafik kosong ]</p>';
      return;
    }

    if (stimulus.title) {
      const h = document.createElement('p');
      h.style.cssText = 'font-weight:700;font-size:0.88rem;color:#1e3a5f;margin-bottom:0.5rem;';
      h.textContent = stimulus.title;
      container.appendChild(h);
    }

    const maxVal = Math.max(...values, 1);
    const barW = 40;
    const gap = 20;
    const chartH = 140;
    const padL = 40;
    const padB = 40;
    const padTop = 20;
    const svgW = padL + n * (barW + gap) + gap;
    const svgH = chartH + padB + padTop;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.setAttribute('width', Math.min(svgW, 480));
    svg.setAttribute('height', Math.round(Math.min(svgW, 480) * svgH / svgW));
    svg.style.display = 'block';
    svg.style.margin = '0 auto';

    // Y-axis line
    const yLine = document.createElementNS(ns, 'line');
    Object.entries({ x1: padL, y1: padTop, x2: padL, y2: padTop + chartH, stroke: '#c0c8d8', 'stroke-width': 1 }).forEach(([k, v]) => yLine.setAttribute(k, v));
    svg.appendChild(yLine);
    // X-axis line
    const xLine = document.createElementNS(ns, 'line');
    Object.entries({ x1: padL, y1: padTop + chartH, x2: svgW - gap, y2: padTop + chartH, stroke: '#c0c8d8', 'stroke-width': 1 }).forEach(([k, v]) => xLine.setAttribute(k, v));
    svg.appendChild(xLine);

    // Y-axis gridlines + labels
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const yVal = Math.round((maxVal / gridSteps) * i);
      const yPos = padTop + chartH - (yVal / maxVal) * chartH;
      const grid = document.createElementNS(ns, 'line');
      Object.entries({ x1: padL, y1: yPos, x2: svgW - gap, y2: yPos, stroke: '#e8eaf0', 'stroke-width': 1 }).forEach(([k, v]) => grid.setAttribute(k, v));
      svg.appendChild(grid);
      const label = document.createElementNS(ns, 'text');
      Object.entries({ x: padL - 5, y: yPos + 4, 'text-anchor': 'end', 'font-size': 9, fill: '#6b7c93', 'font-family': 'sans-serif' }).forEach(([k, v]) => label.setAttribute(k, v));
      label.textContent = yVal + (unit ? unit : '');
      svg.appendChild(label);
    }

    // Bars
    values.forEach((val, i) => {
      const barH = (val / maxVal) * chartH;
      const x = padL + gap + i * (barW + gap);
      const y = padTop + chartH - barH;

      const rect = document.createElementNS(ns, 'rect');
      Object.entries({ x, y, width: barW, height: barH, fill: '#2a8a8a', rx: 3 }).forEach(([k, v]) => rect.setAttribute(k, v));
      svg.appendChild(rect);

      // Value on top
      const vText = document.createElementNS(ns, 'text');
      Object.entries({ x: x + barW / 2, y: y - 4, 'text-anchor': 'middle', 'font-size': 9, fill: '#1e3a5f', 'font-weight': 'bold', 'font-family': 'sans-serif' }).forEach(([k, v]) => vText.setAttribute(k, v));
      vText.textContent = val + (unit ? unit : '');
      svg.appendChild(vText);

      // Label
      const lText = document.createElementNS(ns, 'text');
      Object.entries({ x: x + barW / 2, y: padTop + chartH + 14, 'text-anchor': 'middle', 'font-size': 9, fill: '#6b7c93', 'font-family': 'sans-serif' }).forEach(([k, v]) => lText.setAttribute(k, v));
      lText.textContent = labels[i] || '';
      svg.appendChild(lText);
    });

    container.appendChild(svg);
  }

  /* --- Line chart renderer (SVG) --- */
  function _renderLineChart(container, stimulus) {
    const labels = stimulus.labels || [];
    const values = stimulus.values || [];
    const n = labels.length;

    if (n === 0) {
      container.innerHTML = '<p style="color:#6b7c93;font-size:0.88rem;">[ Data grafik kosong ]</p>';
      return;
    }

    if (stimulus.title) {
      const h = document.createElement('p');
      h.style.cssText = 'font-weight:700;font-size:0.88rem;color:#1e3a5f;margin-bottom:0.5rem;';
      h.textContent = stimulus.title;
      container.appendChild(h);
    }

    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;
    const chartW = Math.max(300, n * 60);
    const chartH = 120;
    const padL = 40; const padR = 20; const padTop = 20; const padB = 40;
    const svgW = padL + chartW + padR;
    const svgH = chartH + padTop + padB;
    const ns = 'http://www.w3.org/2000/svg';

    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.setAttribute('width', Math.min(svgW, 480));
    svg.setAttribute('height', Math.round(Math.min(svgW, 480) * svgH / svgW));
    svg.style.display = 'block';
    svg.style.margin = '0 auto';

    const xStep = chartW / (n - 1 || 1);

    const getX = i => padL + i * xStep;
    const getY = v => padTop + chartH - ((v - minVal) / range) * chartH;

    // Axes
    const axes = [
      { x1: padL, y1: padTop, x2: padL, y2: padTop + chartH },
      { x1: padL, y1: padTop + chartH, x2: padL + chartW, y2: padTop + chartH }
    ];
    axes.forEach(a => {
      const line = document.createElementNS(ns, 'line');
      Object.entries({ ...a, stroke: '#c0c8d8', 'stroke-width': 1 }).forEach(([k, v]) => line.setAttribute(k, v));
      svg.appendChild(line);
    });

    // Line path
    const pts = values.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
    const path = document.createElementNS(ns, 'polyline');
    Object.entries({ points: pts, fill: 'none', stroke: '#2a8a8a', 'stroke-width': 2 }).forEach(([k, v]) => path.setAttribute(k, v));
    svg.appendChild(path);

    // Dots + labels
    values.forEach((v, i) => {
      const dot = document.createElementNS(ns, 'circle');
      Object.entries({ cx: getX(i), cy: getY(v), r: 4, fill: '#1e3a5f' }).forEach(([k, v2]) => dot.setAttribute(k, v2));
      svg.appendChild(dot);

      const lbl = document.createElementNS(ns, 'text');
      Object.entries({ x: getX(i), y: padTop + chartH + 14, 'text-anchor': 'middle', 'font-size': 9, fill: '#6b7c93', 'font-family': 'sans-serif' }).forEach(([k, v2]) => lbl.setAttribute(k, v2));
      lbl.textContent = labels[i] || '';
      svg.appendChild(lbl);
    });

    container.appendChild(svg);
  }

  /* --- Scenario (text + numbers) --- */
  function _renderScenario(container, stimulus) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'background:#f0f4fb;border-radius:8px;padding:0.85rem 1rem;font-size:0.9rem;color:#1e3a5f;line-height:1.7;';
    wrapper.textContent = stimulus.text || '';
    container.appendChild(wrapper);
  }

  return { render };
})();
