/**
 * DETERMINISTIC MATHEMATICAL COLLAGE LAYOUT ENGINE
 * Zero AI. 100% Geometry, Ratio Calculations & Proportional Grids.
 * Seamlessly supports 1 to 20 photos across all standard and custom aspect ratios.
 */

export class LayoutEngine {
  /**
   * Computes exact cell coordinates [x, y, width, height, rotation]
   * for N photos inside given canvas dimensions with padding and gap.
   */
  static computeLayout(photoCount, options = {}) {
    const {
      width = 1200,
      height = 1200,
      padding = 24,
      gap = 14,
      layoutType = 'auto', // 'auto', 'grid', 'bento', 'polaroid-stack', 'filmstrip', 'masonry', 'scatter'
      aspectRatio = '1:1'
    } = options;

    const count = Math.max(1, Math.min(20, photoCount));
    const innerW = Math.max(10, width - padding * 2);
    const innerH = Math.max(10, height - padding * 2);

    switch (layoutType) {
      case 'scatter':
      case 'polaroid-stack':
        return this.computePolaroidStack(count, innerW, innerH, padding, gap);
      case 'filmstrip':
        return this.computeFilmstrip(count, innerW, innerH, padding, gap);
      case 'masonry':
        return this.computeMasonry(count, innerW, innerH, padding, gap);
      case 'bento':
        return this.computeBento(count, innerW, innerH, padding, gap);
      case 'grid':
        return this.computeGrid(count, innerW, innerH, padding, gap);
      case 'auto':
      default:
        return this.computeSmartAestheticLayout(count, innerW, innerH, padding, gap, width, height);
    }
  }

  /**
   * Smart Aesthetic Layout: Picks the most visually striking composition for 1..20
   */
  static computeSmartAestheticLayout(count, w, h, pad, gap, canvasW, canvasH) {
    switch (count) {
      case 1:
        return [{ x: pad, y: pad, width: w, height: h, rotation: 0 }];

      case 2:
        if (w >= h) {
          const cellW = (w - gap) / 2;
          return [
            { x: pad, y: pad, width: cellW, height: h, rotation: 0 },
            { x: pad + cellW + gap, y: pad, width: cellW, height: h, rotation: 0 }
          ];
        } else {
          const cellH = (h - gap) / 2;
          return [
            { x: pad, y: pad, width: w, height: cellH, rotation: 0 },
            { x: pad, y: pad + cellH + gap, width: w, height: cellH, rotation: 0 }
          ];
        }

      case 3:
        if (w >= h) {
          const leftW = Math.round((w - gap) * 0.58);
          const rightW = w - gap - leftW;
          const subH = (h - gap) / 2;
          return [
            { x: pad, y: pad, width: leftW, height: h, rotation: 0 },
            { x: pad + leftW + gap, y: pad, width: rightW, height: subH, rotation: 0 },
            { x: pad + leftW + gap, y: pad + subH + gap, width: rightW, height: subH, rotation: 0 }
          ];
        } else {
          const topH = Math.round((h - gap) * 0.58);
          const botH = h - gap - topH;
          const subW = (w - gap) / 2;
          return [
            { x: pad, y: pad, width: w, height: topH, rotation: 0 },
            { x: pad, y: pad + topH + gap, width: subW, height: botH, rotation: 0 },
            { x: pad + subW + gap, y: pad + topH + gap, width: subW, height: botH, rotation: 0 }
          ];
        }

      case 4:
        return this.computeGrid(4, w, h, pad, gap, 2, 2);

      case 5: {
        if (w >= h) {
          const colW = (w - gap) / 2;
          const leftH1 = Math.round((h - gap) * 0.65);
          const leftH2 = h - gap - leftH1;
          const rightSubH = (h - gap * 2) / 3;
          return [
            { x: pad, y: pad, width: colW, height: leftH1, rotation: 0 },
            { x: pad, y: pad + leftH1 + gap, width: colW, height: leftH2, rotation: 0 },
            { x: pad + colW + gap, y: pad, width: colW, height: rightSubH, rotation: 0 },
            { x: pad + colW + gap, y: pad + rightSubH + gap, width: colW, height: rightSubH, rotation: 0 },
            { x: pad + colW + gap, y: pad + (rightSubH + gap) * 2, width: colW, height: rightSubH, rotation: 0 }
          ];
        } else {
          const topH = (h - gap) * 0.48;
          const botH = h - gap - topH;
          const topCellW = (w - gap) / 2;
          const botCellW = (w - gap * 2) / 3;
          return [
            { x: pad, y: pad, width: topCellW, height: topH, rotation: 0 },
            { x: pad + topCellW + gap, y: pad, width: topCellW, height: topH, rotation: 0 },
            { x: pad, y: pad + topH + gap, width: botCellW, height: botH, rotation: 0 },
            { x: pad + botCellW + gap, y: pad + topH + gap, width: botCellW, height: botH, rotation: 0 },
            { x: pad + (botCellW + gap) * 2, y: pad + topH + gap, width: botCellW, height: botH, rotation: 0 }
          ];
        }
      }

      case 6:
        return (w >= h) ? this.computeGrid(6, w, h, pad, gap, 3, 2) : this.computeGrid(6, w, h, pad, gap, 2, 3);

      case 7: {
        if (w >= h) {
          const heroW = (w - gap * 2) * 0.4;
          const gridW = w - gap - heroW;
          const rightColW = (gridW - gap) / 2;
          const rowH = (h - gap * 2) / 3;
          const cells = [{ x: pad, y: pad, width: heroW, height: h, rotation: 0 }];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 2; c++) {
              cells.push({
                x: pad + heroW + gap + c * (rightColW + gap),
                y: pad + r * (rowH + gap),
                width: rightColW,
                height: rowH,
                rotation: 0
              });
            }
          }
          return cells;
        } else {
          const heroH = (h - gap) * 0.38;
          const subH = h - gap - heroH;
          const cells = [{ x: pad, y: pad, width: w, height: heroH, rotation: 0 }];
          const subGrid = this.computeGrid(6, w, subH, pad, gap, 3, 2);
          subGrid.forEach(c => cells.push({ ...c, y: c.y + heroH + gap }));
          return cells;
        }
      }

      case 8:
        return (w >= h) ? this.computeGrid(8, w, h, pad, gap, 4, 2) : this.computeGrid(8, w, h, pad, gap, 2, 4);

      case 9:
        return this.computeGrid(9, w, h, pad, gap, 3, 3);

      case 10:
        return (w >= h) ? this.computeGrid(10, w, h, pad, gap, 5, 2) : this.computeGrid(10, w, h, pad, gap, 2, 5);

      case 11: {
        const heroH = (h - gap) * 0.35;
        const subH = h - gap - heroH;
        const cells = [{ x: pad, y: pad, width: w, height: heroH, rotation: 0 }];
        const subCells = this.computeGrid(10, w, subH, pad, gap, 5, 2);
        subCells.forEach(c => cells.push({ ...c, y: c.y + heroH + gap }));
        return cells;
      }

      case 12:
        return (w >= h) ? this.computeGrid(12, w, h, pad, gap, 4, 3) : this.computeGrid(12, w, h, pad, gap, 3, 4);

      case 13: {
        const heroW = (w - gap) * 0.35;
        const subW = w - gap - heroW;
        const cells = [{ x: pad, y: pad, width: heroW, height: h, rotation: 0 }];
        const subGrid = this.computeGrid(12, subW, h, pad + heroW + gap, gap, 3, 4);
        return cells.concat(subGrid);
      }

      case 14:
        return (w >= h) ? this.computeGrid(14, w, h, pad, gap, 7, 2) : this.computeMasonry(14, w, h, pad, gap, 3);

      case 15:
        return (w >= h) ? this.computeGrid(15, w, h, pad, gap, 5, 3) : this.computeGrid(15, w, h, pad, gap, 3, 5);

      case 16:
        return this.computeGrid(16, w, h, pad, gap, 4, 4);

      case 17:
        return this.computeBento(17, w, h, pad, gap);

      case 18:
        return (w >= h) ? this.computeGrid(18, w, h, pad, gap, 6, 3) : this.computeGrid(18, w, h, pad, gap, 3, 6);

      case 19:
        return this.computeBento(19, w, h, pad, gap);

      case 20:
        return (w >= h) ? this.computeGrid(20, w, h, pad, gap, 5, 4) : this.computeGrid(20, w, h, pad, gap, 4, 5);

      default:
        return this.computeGrid(count, w, h, pad, gap);
    }
  }

  /**
   * Classical Clean Uniform Grid
   */
  static computeGrid(count, w, h, pad, gap, forceCols, forceRows) {
    let cols = forceCols;
    let rows = forceRows;

    if (!cols || !rows) {
      if (count <= 1) { cols = 1; rows = 1; }
      else if (count === 2) { cols = w >= h ? 2 : 1; rows = w >= h ? 1 : 2; }
      else if (count === 3) { cols = w >= h ? 3 : 1; rows = w >= h ? 1 : 3; }
      else if (count === 4) { cols = 2; rows = 2; }
      else if (count <= 6) { cols = w >= h ? 3 : 2; rows = w >= h ? 2 : 3; }
      else if (count <= 8) { cols = w >= h ? 4 : 2; rows = w >= h ? 2 : 4; }
      else if (count === 9) { cols = 3; rows = 3; }
      else if (count <= 12) { cols = w >= h ? 4 : 3; rows = w >= h ? 3 : 4; }
      else if (count <= 16) { cols = 4; rows = 4; }
      else { cols = w >= h ? 5 : 4; rows = w >= h ? 4 : 5; }
    }

    const cellW = (w - gap * (cols - 1)) / cols;
    const cellH = (h - gap * (rows - 1)) / rows;
    const cells = [];

    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;

      let offsetX = 0;
      const isLastRow = r === rows - 1;
      const itemsInLastRow = count - r * cols;
      if (isLastRow && itemsInLastRow < cols) {
        offsetX = ((cols - itemsInLastRow) * (cellW + gap)) / 2;
      }

      cells.push({
        x: pad + c * (cellW + gap) + offsetX,
        y: pad + r * (cellH + gap),
        width: cellW,
        height: cellH,
        rotation: 0
      });
    }

    return cells;
  }

  /**
   * Bento Matrix: 1 prominent showcase block + modular satellites
   */
  static computeBento(count, w, h, pad, gap) {
    if (count <= 3) {
      return this.computeSmartAestheticLayout(count, w, h, pad, gap);
    }

    const cols = count > 12 ? 5 : count > 6 ? 4 : 3;
    const rows = Math.ceil((count + 3) / cols);
    const unitW = (w - gap * (cols - 1)) / cols;
    const unitH = (h - gap * (rows - 1)) / rows;

    const cells = [];
    const heroW = unitW * 2 + gap;
    const heroH = unitH * 2 + gap;
    cells.push({ x: pad, y: pad, width: heroW, height: heroH, rotation: 0 });

    let index = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r < 2 && c < 2) continue;
        if (index >= count) break;

        cells.push({
          x: pad + c * (unitW + gap),
          y: pad + r * (unitH + gap),
          width: unitW,
          height: unitH,
          rotation: 0
        });
        index++;
      }
      if (index >= count) break;
    }

    return cells;
  }

  /**
   * 35mm Continuous Filmstrip layout with sprockets
   */
  static computeFilmstrip(count, w, h, pad, gap) {
    const strips = count > 10 ? 2 : 1;
    const itemsPerStrip = Math.ceil(count / strips);
    const stripH = (h - gap * (strips - 1)) / strips;
    const cellW = (w - gap * (itemsPerStrip - 1)) / itemsPerStrip;

    const cells = [];
    for (let i = 0; i < count; i++) {
      const s = Math.floor(i / itemsPerStrip);
      const col = i % itemsPerStrip;
      cells.push({
        x: pad + col * (cellW + gap),
        y: pad + s * (stripH + gap),
        width: cellW,
        height: stripH,
        rotation: 0,
        isFilmstrip: true
      });
    }
    return cells;
  }

  /**
   * Polaroid Stack / Scatter: Slightly angled artistic polaroids
   */
  static computePolaroidStack(count, w, h, pad, gap) {
    const baseGrid = this.computeGrid(count, w, h, pad + 15, gap + 15);
    const angles = [-2.8, 2.2, -1.4, 3.1, -2.1, 1.6, -3.2, 2.7, -1.8, 2.9, -2.4, 1.7, -3.0, 2.2, -1.5, 3.4, -2.7, 1.1, -1.9, 2.6];

    return baseGrid.map((cell, idx) => ({
      ...cell,
      rotation: angles[idx % angles.length],
      isPolaroid: true,
      zIndex: idx + 1
    }));
  }

  /**
   * Masonry Waterfall: Balanced multi-column vertical flow
   */
  static computeMasonry(count, w, h, pad, gap, explicitCols) {
    const cols = explicitCols || (count <= 4 ? 2 : count <= 9 ? 3 : count <= 16 ? 4 : 5);
    const colW = (w - gap * (cols - 1)) / cols;

    const colHeights = new Array(cols).fill(0);
    const cells = [];
    const heightWeights = [1.2, 0.9, 1.1, 1.3, 0.85, 1.15, 1.0, 1.25, 0.95, 1.05, 1.2, 0.88, 1.12, 1.0, 1.18, 0.92, 1.08, 1.22, 0.96, 1.04];
    const avgCellH = h / (count / cols);

    for (let i = 0; i < count; i++) {
      let minCol = 0;
      for (let c = 1; c < cols; c++) {
        if (colHeights[c] < colHeights[minCol]) minCol = c;
      }

      const factor = heightWeights[i % heightWeights.length];
      const cellH = Math.min(avgCellH * factor, h * 0.45);

      cells.push({
        x: pad + minCol * (colW + gap),
        y: pad + colHeights[minCol],
        width: colW,
        height: cellH,
        rotation: 0
      });

      colHeights[minCol] += cellH + gap;
    }

    const maxHeight = Math.max(...colHeights);
    if (maxHeight > 0) {
      const scaleY = (h - gap) / maxHeight;
      cells.forEach(c => {
        c.y = pad + (c.y - pad) * scaleY;
        c.height = c.height * scaleY;
      });
    }

    return cells;
  }
}
