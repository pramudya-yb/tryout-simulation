/**
 * radar-chart.js
 * Renders an SVG radar/spider chart for workstyle dimension scores.
 * No external chart library — pure SVG.
 */

const RadarChart = (() => {

  /**
   * Render radar chart into a container element.
   * @param {HTMLElement} container
   * @param {Array} dimensions - [{ id, label, percent }]
   * @param {object} [options]
   */
  function render(container, dimensions, options = {}) {
    if (!container) return;
    container.innerHTML = '';

    if (!dimensions || dimensions.length === 0) {
      container.innerHTML = '<p style="color:#6b7c93;font-size:0.88rem;text-align:center;">[ Data dimensi tidak tersedia ]</p>';
      return;
    }

    const {
      size = 280,
      levels = 5,
      primaryColor = '#2a8a8a',
      fillOpacity = 0.22,
      strokeWidth = 2,
      dotRadius = 4,
      fontFamily = 'Segoe UI, system-ui, sans-serif'
    } = options;

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.35;
    const n = dimensions.length;
    const angleStep = (2 * Math.PI) / n;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.style.display = 'block';
    svg.style.margin = '0 auto';
    svg.style.maxWidth = '100%';

    // --- Background grid (concentric polygons) ---
    for (let l = 1; l <= levels; l++) {
      const r = (radius / levels) * l;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const angle = i * angleStep - Math.PI / 2;
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      const poly = document.createElementNS(ns, 'polygon');
      poly.setAttribute('points', pts.join(' '));
      poly.setAttribute('fill', 'none');
      poly.setAttribute('stroke', '#d4dce8');
      poly.setAttribute('stroke-width', 1);
      svg.appendChild(poly);
    }

    // --- Axis lines ---
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      const line = document.createElementNS(ns, 'line');
      Object.entries({ x1: cx, y1: cy, x2: x, y2: y, stroke: '#d4dce8', 'stroke-width': 1 }).forEach(([k, v]) => line.setAttribute(k, v));
      svg.appendChild(line);
    }

    // --- Data polygon ---
    const dataPoints = [];
    dimensions.forEach((dim, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const pct = Math.min(100, Math.max(0, dim.percent || 0)) / 100;
      const r = radius * pct;
      dataPoints.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    });

    const dataFill = document.createElementNS(ns, 'polygon');
    dataFill.setAttribute('points', dataPoints.join(' '));
    dataFill.setAttribute('fill', primaryColor);
    dataFill.setAttribute('fill-opacity', fillOpacity);
    dataFill.setAttribute('stroke', primaryColor);
    dataFill.setAttribute('stroke-width', strokeWidth);
    svg.appendChild(dataFill);

    // --- Data dots ---
    dimensions.forEach((dim, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const pct = Math.min(100, Math.max(0, dim.percent || 0)) / 100;
      const r = radius * pct;
      const dot = document.createElementNS(ns, 'circle');
      Object.entries({ cx: cx + r * Math.cos(angle), cy: cy + r * Math.sin(angle), r: dotRadius, fill: primaryColor }).forEach(([k, v]) => dot.setAttribute(k, v));
      svg.appendChild(dot);
    });

    // --- Axis labels ---
    const labelPad = 22;
    dimensions.forEach((dim, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const lx = cx + (radius + labelPad) * Math.cos(angle);
      const ly = cy + (radius + labelPad) * Math.sin(angle);

      const text = document.createElementNS(ns, 'text');
      text.setAttribute('x', lx);
      text.setAttribute('y', ly);
      text.setAttribute('text-anchor', Math.abs(lx - cx) < 5 ? 'middle' : lx < cx ? 'end' : 'start');
      text.setAttribute('dominant-baseline', Math.abs(ly - cy) < 5 ? 'middle' : ly < cy ? 'auto' : 'hanging');
      text.setAttribute('font-size', 10);
      text.setAttribute('font-family', fontFamily);
      text.setAttribute('fill', '#1e3a5f');
      text.setAttribute('font-weight', '600');

      // Shorten long labels for chart
      const label = dim.label || dim.id || '';
      const shortLabel = label.length > 16 ? label.substring(0, 15) + '…' : label;
      text.textContent = shortLabel;
      svg.appendChild(text);

      // Percentage label near dot
      const pct = Math.min(100, Math.max(0, dim.percent || 0));
      const pr = radius * (pct / 100);
      const pctText = document.createElementNS(ns, 'text');
      pctText.setAttribute('x', cx + pr * Math.cos(angle) + 6 * Math.cos(angle));
      pctText.setAttribute('y', cy + pr * Math.sin(angle) - 6);
      pctText.setAttribute('text-anchor', 'middle');
      pctText.setAttribute('font-size', 9);
      pctText.setAttribute('font-family', fontFamily);
      pctText.setAttribute('fill', '#1f7070');
      pctText.setAttribute('font-weight', 'bold');
      pctText.textContent = pct + '%';
      svg.appendChild(pctText);
    });

    container.appendChild(svg);
  }

  return { render };
})();
