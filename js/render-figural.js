/**
 * render-figural.js
 * Renderer figural/spasial berbasis SVG.
 *
 * Fitur:
 * - Menampilkan soal figural lebih jelas dan besar
 * - Tidak perlu upload gambar PNG/JPG
 * - Mendukung sequence, odd-one-out, dan matrix 2x2 / 3x3
 * - Mendukung bentuk dasar: circle, square, triangle, diamond, arrow, half-circle, dots
 * - Mendukung elemen tambahan: dot, line, plus, cross, slash, parts
 */

const RenderFigural = (() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function render(container, stimulus = {}) {
    if (!container) return;

    container.innerHTML = '';

    if (!stimulus || typeof stimulus !== 'object') {
      container.innerHTML = '<p class="text-muted">Stimulus figural belum tersedia.</p>';
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'figural-stimulus-wrapper';
    wrapper.style.cssText = `
      margin: 1rem 0;
      padding: 1rem;
      border: 1px solid #dbe4ee;
      border-radius: 14px;
      background: #f8fbff;
    `;

    if (stimulus.title) {
      const title = document.createElement('div');
      title.style.cssText = `
        font-weight: 700;
        color: #0f2d52;
        margin-bottom: 0.75rem;
      `;
      title.textContent = stimulus.title;
      wrapper.appendChild(title);
    }

    if (stimulus.instruction) {
      const instruction = document.createElement('p');
      instruction.className = 'text-muted';
      instruction.style.cssText = `
        margin: 0 0 1rem;
        line-height: 1.6;
      `;
      instruction.textContent = stimulus.instruction;
      wrapper.appendChild(instruction);
    }

    if (stimulus.type === 'sequence') {
      wrapper.appendChild(renderSequence(stimulus.items || []));
    } else if (stimulus.type === 'odd-one-out') {
      wrapper.appendChild(renderOddOneOut(stimulus.items || []));
    } else if (stimulus.type === 'matrix') {
      wrapper.appendChild(renderMatrix(stimulus.grid || stimulus.items || []));
    } else {
      wrapper.appendChild(renderUnsupportedType(stimulus.type));
    }

    if (stimulus.options && Array.isArray(stimulus.options)) {
      wrapper.appendChild(renderVisualOptions(stimulus.options));
    }

    container.appendChild(wrapper);
  }

  /* ============================================================
     RENDER TYPES
  ============================================================ */

  function renderSequence(items = []) {
    const row = document.createElement('div');
    row.className = 'figural-sequence';
    row.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    `;

    items.forEach((item, index) => {
      row.appendChild(renderShapeCard(item));

      if (index < items.length - 1) {
        const arrow = document.createElement('div');
        arrow.textContent = '→';
        arrow.style.cssText = `
          font-size: 1.4rem;
          font-weight: 700;
          color: #4b6584;
        `;
        row.appendChild(arrow);
      }
    });

    return row;
  }

  function renderOddOneOut(items = []) {
    const row = document.createElement('div');
    row.className = 'figural-odd-one-out';
    row.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1rem;
    `;

    items.forEach((item, index) => {
      const card = renderShapeCard(item);

      const label = document.createElement('div');
      label.textContent = item.label || `Bentuk ${index + 1}`;
      label.style.cssText = `
        text-align: center;
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 0.25rem;
      `;

      const wrap = document.createElement('div');
      wrap.appendChild(card);
      wrap.appendChild(label);
      row.appendChild(wrap);
    });

    return row;
  }

  function renderMatrix(grid = []) {
    const matrixWrapper = document.createElement('div');
    matrixWrapper.className = 'figural-matrix-wrapper';
    matrixWrapper.style.cssText = `
      width: 100%;
      display: flex;
      justify-content: center;
      margin: 0.5rem 0 1rem;
    `;

    if (!Array.isArray(grid) || !grid.length) {
      matrixWrapper.innerHTML = '<p class="text-muted">Data matriks figural belum tersedia.</p>';
      return matrixWrapper;
    }

    const rows = normalizeGrid(grid);
    const columnCount = Math.max(...rows.map(row => row.length), 1);

    const matrix = document.createElement('div');
    matrix.className = 'figural-matrix';
    matrix.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${columnCount}, minmax(82px, 100px));
      gap: 0.65rem;
      padding: 0.75rem;
      border: 1px solid #dbe4ee;
      border-radius: 14px;
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
    `;

    rows.forEach(row => {
      for (let col = 0; col < columnCount; col++) {
        const item = row[col] || { empty: true };
        matrix.appendChild(renderMatrixCell(item));
      }
    });

    matrixWrapper.appendChild(matrix);
    return matrixWrapper;
  }

  function renderUnsupportedType(type) {
    const box = document.createElement('div');
    box.className = 'figural-unsupported';
    box.style.cssText = `
      padding: 1rem;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      color: #64748b;
      background: #ffffff;
      margin-bottom: 1rem;
    `;
    box.textContent = `Tipe stimulus figural "${type || '-'}" belum didukung.`;
    return box;
  }

  /* ============================================================
     OPTIONS
  ============================================================ */

  function renderVisualOptions(options = []) {
    const section = document.createElement('div');
    section.className = 'figural-visual-options';
    section.style.cssText = `
      margin-top: 1rem;
    `;

    const title = document.createElement('div');
    title.textContent = 'Pilihan jawaban visual:';
    title.style.cssText = `
      font-weight: 700;
      color: #0f2d52;
      margin-bottom: 0.75rem;
    `;
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 0.75rem;
    `;

    options.forEach(option => {
      const optionCard = document.createElement('div');
      optionCard.style.cssText = `
        border: 1px solid #dbe4ee;
        border-radius: 12px;
        background: #ffffff;
        padding: 0.65rem;
        text-align: center;
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.04);
      `;

      const label = document.createElement('div');
      label.textContent = option.id || '';
      label.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 999px;
        background: #1e3a5f;
        color: #ffffff;
        font-weight: 700;
        font-size: 0.8rem;
        margin-bottom: 0.5rem;
      `;

      optionCard.appendChild(label);
      optionCard.appendChild(renderShapeSvg(option, 76));
      grid.appendChild(optionCard);
    });

    section.appendChild(grid);
    return section;
  }

  /* ============================================================
     CARDS / CELLS
  ============================================================ */

  function renderShapeCard(item = {}, config = {}) {
    const size = config.size || 96;
    const svgSize = config.svgSize || 76;

    const card = document.createElement('div');
    card.className = 'figural-shape-card';
    card.style.cssText = `
      width: ${size}px;
      min-height: ${size}px;
      border: 1px solid #dbe4ee;
      border-radius: 14px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
    `;

    if (item && item.empty) {
      card.style.background = '#f8fafc';
      return card;
    }

    if (item && item.unknown) {
      const q = document.createElement('div');
      q.textContent = '?';
      q.style.cssText = `
        font-size: 2.2rem;
        font-weight: 800;
        color: #1e3a5f;
      `;
      card.appendChild(q);
      return card;
    }

    card.appendChild(renderShapeSvg(item, svgSize));
    return card;
  }

  function renderMatrixCell(item = {}) {
    const cell = renderShapeCard(item, {
      size: 92,
      svgSize: 72
    });

    cell.className += ' figural-matrix-cell';
    cell.style.width = 'auto';
    cell.style.minWidth = '82px';
    cell.style.minHeight = '82px';
    cell.style.boxShadow = 'none';

    if (item && item.unknown) {
      cell.style.background = '#eef6ff';
      cell.style.border = '2px dashed #1e3a5f';
    }

    return cell;
  }

  /* ============================================================
     SVG CORE
  ============================================================ */

  function renderShapeSvg(item = {}, size = 72) {
    const svg = document.createElementNS(SVG_NS, 'svg');

    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 72 72');
    svg.style.display = 'block';
    svg.style.margin = '0 auto';

    if (!item || typeof item !== 'object') {
      return svg;
    }

    if (item.unknown) {
      drawQuestionMark(svg);
      return svg;
    }

    const group = document.createElementNS(SVG_NS, 'g');

    const rotate = Number(item.rotate || 0);
    const dx = Number(item.dx || 0);
    const dy = Number(item.dy || 0);
    const scale = item.scale !== undefined ? Number(item.scale) : 1;

    group.setAttribute(
      'transform',
      `translate(${dx} ${dy}) rotate(${rotate} 36 36) scale(${scale} ${scale})`
    );

    if (Array.isArray(item.parts)) {
      item.parts.forEach(part => {
        drawSingleShape(group, {
          ...part,
          parentStroke: item.stroke,
          parentFill: item.fill
        });
      });
    } else {
      drawSingleShape(group, item);
    }

    if (item.dot) {
      drawDot(group, item.dot);
    }

    if (Array.isArray(item.dots)) {
      item.dots.forEach(dot => drawDot(group, dot));
    }

    svg.appendChild(group);
    return svg;
  }

  function drawSingleShape(group, item = {}) {
    const shape = item.shape || 'circle';

    if (shape === 'dots') {
      renderCountDots(group, Number(item.count || 1), item);
      return;
    }

    if (shape === 'circle') {
      drawCircle(group, item);
      return;
    }

    if (shape === 'square') {
      drawSquare(group, item);
      return;
    }

    if (shape === 'diamond') {
      drawDiamond(group, item);
      return;
    }

    if (shape === 'triangle') {
      drawTriangle(group, item);
      return;
    }

    if (shape === 'arrow') {
      drawArrow(group, item);
      return;
    }

    if (shape === 'half-circle') {
      drawHalfCircle(group, item);
      return;
    }

    if (shape === 'line') {
      drawLine(group, item);
      return;
    }

    if (shape === 'plus') {
      drawPlus(group, item);
      return;
    }

    if (shape === 'cross') {
      drawCross(group, item);
      return;
    }

    if (shape === 'slash') {
      drawSlash(group, item);
      return;
    }

    drawCircle(group, item);
  }

  /* ============================================================
     BASIC SHAPES
  ============================================================ */

  function drawCircle(group, item = {}) {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', item.cx || '36');
    circle.setAttribute('cy', item.cy || '36');
    circle.setAttribute('r', item.r || '22');
    applyStyle(circle, item);
    group.appendChild(circle);
  }

  function drawSquare(group, item = {}) {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', item.x || '16');
    rect.setAttribute('y', item.y || '16');
    rect.setAttribute('width', item.width || '40');
    rect.setAttribute('height', item.height || '40');
    rect.setAttribute('rx', item.rx !== undefined ? item.rx : '4');
    applyStyle(rect, item);
    group.appendChild(rect);
  }

  function drawDiamond(group, item = {}) {
    const polygon = document.createElementNS(SVG_NS, 'polygon');
    polygon.setAttribute('points', item.points || '36,10 62,36 36,62 10,36');
    applyStyle(polygon, item);
    group.appendChild(polygon);
  }

  function drawTriangle(group, item = {}) {
    const polygon = document.createElementNS(SVG_NS, 'polygon');
    polygon.setAttribute('points', item.points || '36,10 62,58 10,58');
    applyStyle(polygon, item);
    group.appendChild(polygon);
  }

  function drawArrow(group, item = {}) {
    const arrowGroup = document.createElementNS(SVG_NS, 'g');
    const rotate = Number(item.rotate || 0);
    arrowGroup.setAttribute('transform', `rotate(${rotate} 36 36)`);

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', item.d || 'M36 12 L36 54 M20 28 L36 12 L52 28');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', item.stroke || '#1e3a5f');
    path.setAttribute('stroke-width', item.strokeWidth || '6');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');

    arrowGroup.appendChild(path);
    group.appendChild(arrowGroup);
  }

  function drawHalfCircle(group, item = {}) {
    const rotate = Number(item.rotate || 0);

    const halfGroup = document.createElementNS(SVG_NS, 'g');
    halfGroup.setAttribute('transform', `rotate(${rotate} 36 36)`);

    const bg = document.createElementNS(SVG_NS, 'circle');
    bg.setAttribute('cx', '36');
    bg.setAttribute('cy', '36');
    bg.setAttribute('r', item.r || '22');
    bg.setAttribute('fill', '#ffffff');
    bg.setAttribute('stroke', item.stroke || '#1e3a5f');
    bg.setAttribute('stroke-width', item.strokeWidth || '4');

    const half = document.createElementNS(SVG_NS, 'path');
    half.setAttribute('d', item.d || 'M36 14 A22 22 0 0 1 36 58 Z');
    half.setAttribute('fill', item.color || '#1e3a5f');

    halfGroup.appendChild(bg);
    halfGroup.appendChild(half);
    group.appendChild(halfGroup);
  }

  function drawLine(group, item = {}) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', item.x1 ?? '14');
    line.setAttribute('y1', item.y1 ?? '36');
    line.setAttribute('x2', item.x2 ?? '58');
    line.setAttribute('y2', item.y2 ?? '36');
    line.setAttribute('stroke', item.stroke || '#1e3a5f');
    line.setAttribute('stroke-width', item.strokeWidth || '6');
    line.setAttribute('stroke-linecap', 'round');
    group.appendChild(line);
  }

  function drawPlus(group, item = {}) {
    drawLine(group, {
      x1: 18,
      y1: 36,
      x2: 54,
      y2: 36,
      stroke: item.stroke,
      strokeWidth: item.strokeWidth || 6
    });

    drawLine(group, {
      x1: 36,
      y1: 18,
      x2: 36,
      y2: 54,
      stroke: item.stroke,
      strokeWidth: item.strokeWidth || 6
    });
  }

  function drawCross(group, item = {}) {
    drawLine(group, {
      x1: 20,
      y1: 20,
      x2: 52,
      y2: 52,
      stroke: item.stroke,
      strokeWidth: item.strokeWidth || 6
    });

    drawLine(group, {
      x1: 52,
      y1: 20,
      x2: 20,
      y2: 52,
      stroke: item.stroke,
      strokeWidth: item.strokeWidth || 6
    });
  }

  function drawSlash(group, item = {}) {
    const direction = item.direction || 'forward';

    if (direction === 'back') {
      drawLine(group, {
        x1: 18,
        y1: 18,
        x2: 54,
        y2: 54,
        stroke: item.stroke,
        strokeWidth: item.strokeWidth || 6
      });
    } else {
      drawLine(group, {
        x1: 54,
        y1: 18,
        x2: 18,
        y2: 54,
        stroke: item.stroke,
        strokeWidth: item.strokeWidth || 6
      });
    }
  }

  function drawDot(group, dot = {}) {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', dot.x ?? '36');
    circle.setAttribute('cy', dot.y ?? '36');
    circle.setAttribute('r', dot.r || '5');
    circle.setAttribute('fill', dot.fill || '#f59e0b');
    group.appendChild(circle);
  }

  function drawQuestionMark(svg) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '36');
    text.setAttribute('y', '45');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '34');
    text.setAttribute('font-weight', '800');
    text.setAttribute('fill', '#1e3a5f');
    text.textContent = '?';
    svg.appendChild(text);
  }

  function renderCountDots(group, count, item = {}) {
    const positions = [
      [36, 36],
      [26, 36],
      [46, 36],
      [26, 26],
      [46, 26],
      [26, 46],
      [46, 46],
      [36, 22],
      [36, 50]
    ];

    const max = Math.max(0, Math.min(Number(count || 0), positions.length));

    for (let i = 0; i < max; i++) {
      const [x, y] = positions[i] || [36, 36];

      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', item.r || '7');
      circle.setAttribute('fill', item.fillColor || item.color || '#1e3a5f');
      group.appendChild(circle);
    }
  }

  /* ============================================================
     STYLE / HELPERS
  ============================================================ */

  function applyStyle(el, item = {}) {
    const fill =
      item.fill === false
        ? 'none'
        : item.fillColor || item.color || '#1e3a5f';

    const stroke = item.stroke || '#1e3a5f';
    const strokeWidth = item.strokeWidth || 4;

    el.setAttribute('fill', fill);
    el.setAttribute('stroke', stroke);
    el.setAttribute('stroke-width', strokeWidth);

    if (item.opacity !== undefined) {
      el.setAttribute('opacity', item.opacity);
    }

    if (item.dash) {
      el.setAttribute('stroke-dasharray', item.dash);
    }
  }

  function normalizeGrid(grid = []) {
    if (!Array.isArray(grid)) return [];

    return grid.map(row => {
      if (Array.isArray(row)) return row;

      return [row];
    });
  }

  return {
    render
  };
})();