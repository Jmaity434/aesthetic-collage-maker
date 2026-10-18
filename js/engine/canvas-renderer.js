/**
 * HIGH-PERFORMANCE DETERMINISTIC CANVAS 2D RENDERER
 * Zero Artificial Intelligence. 100% Canvas 2D Graphic Transforms.
 * Real-time 60FPS preview, procedural textures, washi tape, 35mm film sprockets,
 * polaroids, digital date stamps, and Ultra-HD 4K print export.
 */

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.noiseCanvasCache = null;
    this.lastNoiseLevel = -1;
  }

  /**
   * Main render method called whenever state changes.
   */
  render(state) {
    const {
      photos = [],
      cells = [],
      style = {},
      width = 1200,
      height = 1200,
      scale = 1,
      selectedPhotoIndex = null,
      draggedPhotoIndex = null,
      hoverCellIndex = null
    } = state;

    // Resize canvas if needed
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(scale, scale);

    // 1. Draw Canvas Background (Color, Gradient, Paper Textures)
    this.drawBackground(ctx, style, width, height);

    // 2. Draw Photo Cells
    cells.forEach((cell, idx) => {
      const photo = photos[idx];
      const isSelected = selectedPhotoIndex === idx;
      const isHovered = hoverCellIndex === idx;
      const isDragging = draggedPhotoIndex === idx;

      this.drawCell(ctx, cell, photo, style, idx, { isSelected, isHovered, isDragging });
    });

    // 3. Draw Filmstrip Sprockets & Edge Marks (if filmstrip mode enabled)
    if (style.filmsprockets || style.frameStyle === 'filmstrip') {
      this.drawFilmSprockets(ctx, cells, style, width, height);
    }

    // 4. Draw Washi Tape Accents (if enabled)
    if (style.tape) {
      this.drawWashiTapes(ctx, cells, style);
    }

    // 5. Draw Vintage Camera Date Stamp (if enabled)
    if (style.dateStamp) {
      this.drawDateStamp(ctx, style, width, height);
    }

    // 6. Draw Editorial Headline & Typography (if caption present)
    if (style.caption) {
      this.drawEditorialText(ctx, style, width, height);
    }

    // 7. Apply Post-processing Film Grain (Procedural Monochromatic Grain)
    if (style.grain && style.grain > 0) {
      this.drawFilmGrain(ctx, style.grain, width, height);
    }

    ctx.restore();
  }

  /**
   * Draws the background color, gradient, or subtle paper weave
   */
  drawBackground(ctx, style, w, h) {
    const bg = style.background || '#FAF9F6';

    if (bg.startsWith('linear-gradient')) {
      // Parse simple 2-color linear gradient
      const matches = bg.match(/#[a-fA-F0-9]{3,8}|rgba?\([^)]+\)/g);
      if (matches && matches.length >= 2) {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, matches[0]);
        grad.addColorStop(1, matches[1]);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = '#181A20';
      }
    } else {
      ctx.fillStyle = bg;
    }

    ctx.fillRect(0, 0, w, h);

    // Optional subtle grid lines if style is blueprint or dot grid
    if (style.name && style.name.toLowerCase().includes('blueprint')) {
      this.drawBlueprintGrid(ctx, w, h);
    } else if (style.name && style.name.toLowerCase().includes('moleskine')) {
      this.drawDotGrid(ctx, w, h);
    }
  }

  /**
   * Draws individual photo cell with framing, shadows, clipping, pan/zoom
   */
  drawCell(ctx, cell, photo, style, index, flags) {
    ctx.save();

    const { x, y, width: w, height: h, rotation = 0 } = cell;
    const { isSelected, isHovered, isDragging } = flags;
    const isPolaroid = style.frameStyle === 'polaroid' || cell.isPolaroid;
    const radius = isPolaroid ? 3 : Math.min(style.radius !== undefined ? style.radius : 6, w / 2, h / 2);

    // Apply rotation around center of cell
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    if (rotation !== 0) {
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Semi-transparency if currently being dragged
    if (isDragging) {
      ctx.globalAlpha = 0.45;
    }

    // Soft drop shadow for polaroids, floating cards, or high-elevation styles
    if (isPolaroid || style.frameStyle === 'floating-shadow' || rotation !== 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 6;
    }

    // Determine photo inner bounding box
    let photoX = x;
    let photoY = y;
    let photoW = w;
    let photoH = h;
    let frameBg = '#FFFFFF';

    if (isPolaroid) {
      // Classic Polaroid: 8% border sides/top, 24% chin at bottom
      const marginH = Math.max(8, Math.round(w * 0.07));
      const marginTop = Math.max(8, Math.round(w * 0.07));
      const chinBottom = Math.max(26, Math.round(h * 0.22));

      // Draw polaroid paper mount
      ctx.fillStyle = '#FFFFFF';
      this.drawRoundedRect(ctx, x, y, w, h, radius);
      ctx.fill();

      // Reset shadow for actual photo inside
      ctx.shadowColor = 'transparent';

      photoX = x + marginH;
      photoY = y + marginTop;
      photoW = w - marginH * 2;
      photoH = h - marginTop - chinBottom;

      // Draw faint polaroid inner border
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      this.drawRoundedRect(ctx, photoX, photoY, photoW, photoH, 1);
      ctx.stroke();

    } else if (style.frameStyle === 'passepartout') {
      // Museum matting
      const mat = Math.max(12, Math.round(Math.min(w, h) * 0.1));
      ctx.fillStyle = '#FFFFFF';
      this.drawRoundedRect(ctx, x, y, w, h, radius);
      ctx.fill();

      photoX = x + mat;
      photoY = y + mat;
      photoW = w - mat * 2;
      photoH = h - mat * 2;

      ctx.strokeStyle = style.borderColor || '#D1D5DB';
      ctx.lineWidth = style.borderWidth || 1;
      ctx.strokeRect(photoX, photoY, photoW, photoH);

    } else if (style.borderWidth && style.borderWidth > 0) {
      // Custom solid border
      ctx.strokeStyle = style.borderColor || '#111111';
      ctx.lineWidth = style.borderWidth;
      this.drawRoundedRect(ctx, x, y, w, h, radius);
      ctx.stroke();
    }

    // Reset shadow before drawing image content
    ctx.shadowColor = 'transparent';

    // Draw Image content or Placeholder
    if (photo && photo.image) {
      ctx.save();
      // Clip inside cell inner boundaries
      this.drawRoundedRect(ctx, photoX, photoY, photoW, photoH, isPolaroid ? 2 : radius);
      ctx.clip();

      this.drawImageWithTransform(ctx, photo.image, photoX, photoY, photoW, photoH, photo.transform || {});
      ctx.restore();

    } else {
      // Placeholder aesthetic cell
      ctx.fillStyle = style.background === '#FFFFFF' ? '#F3F4F6' : 'rgba(255, 255, 255, 0.08)';
      this.drawRoundedRect(ctx, photoX, photoY, photoW, photoH, radius);
      ctx.fill();

      // Placeholder upload icon and number
      ctx.fillStyle = style.textColor || 'rgba(156, 163, 175, 0.6)';
      ctx.font = '500 13px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`PHOTO ${index + 1}`, photoX + photoW / 2, photoY + photoH / 2);
    }

    // Interactive outline when selected or hovered
    if (isSelected) {
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 3;
      this.drawRoundedRect(ctx, x - 2, y - 2, w + 4, h + 4, radius + 2);
      ctx.stroke();

      // Corner resize/action handles
      ctx.fillStyle = '#6366F1';
      ctx.fillRect(x - 5, y - 5, 10, 10);
      ctx.fillRect(x + w - 5, y - 5, 10, 10);
      ctx.fillRect(x - 5, y + h - 5, 10, 10);
      ctx.fillRect(x + w - 5, y + h - 5, 10, 10);
    } else if (isHovered) {
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
      ctx.lineWidth = 2;
      this.drawRoundedRect(ctx, x, y, w, h, radius);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draws image using pan, zoom, rotate, and aspect-fill (cover)
   */
  drawImageWithTransform(ctx, img, x, y, w, h, transform) {
    const {
      zoom = 1,
      panX = 0,
      panY = 0,
      rotation = 0,
      flipH = false,
      flipV = false
    } = transform;

    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;
    if (!imgW || !imgH) return;

    // Calculate aspect fill scale
    const scaleFactor = Math.max(w / imgW, h / imgH) * Math.max(0.2, zoom);
    const drawW = imgW * scaleFactor;
    const drawH = imgH * scaleFactor;

    ctx.save();
    // Center of image target area
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.translate(cx, cy);

    // Flip
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // In-cell rotation (90, 180, 270)
    if (rotation !== 0) {
      ctx.rotate((rotation * Math.PI) / 180);
    }

    // Pan offset
    const posX = -drawW / 2 + (panX / 100) * w;
    const posY = -drawH / 2 + (panY / 100) * h;

    ctx.drawImage(img, posX, posY, drawW, drawH);
    ctx.restore();
  }

  /**
   * Draws 35mm film perforations / sprockets along film boundaries
   */
  drawFilmSprockets(ctx, cells, style, canvasW, canvasH) {
    ctx.save();
    ctx.fillStyle = '#FFFFFF';

    cells.forEach((cell, idx) => {
      if (!cell.isFilmstrip && style.frameStyle !== 'filmstrip') return;

      const sprockW = 8;
      const sprockH = 12;
      const gap = 16;
      const count = Math.floor(cell.width / (sprockW + gap));

      // Top row sprockets
      for (let i = 0; i < count; i++) {
        const sx = cell.x + 8 + i * (sprockW + gap);
        this.drawRoundedRect(ctx, sx, cell.y - 14, sprockW, sprockH, 2);
        ctx.fill();
        this.drawRoundedRect(ctx, sx, cell.y + cell.height + 2, sprockW, sprockH, 2);
        ctx.fill();
      }

      // Edge film metadata numbers
      ctx.fillStyle = '#D97706';
      ctx.font = 'bold 9px "Space Grotesk", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`KODAK 400 • ${20 + idx}A`, cell.x + 10, cell.y - 18);
      ctx.fillStyle = '#FFFFFF';
    });

    ctx.restore();
  }

  /**
   * Draws realistic semi-transparent washi tape at cell corners
   */
  drawWashiTapes(ctx, cells, style) {
    ctx.save();
    const tapeColor = style.tapeColor || 'rgba(245, 158, 11, 0.65)';

    cells.forEach((cell, idx) => {
      // Tape top-left and bottom-right corners
      const tapeW = 42;
      const tapeH = 16;

      // Top-Left Corner Tape
      ctx.save();
      ctx.translate(cell.x + 12, cell.y + 6);
      ctx.rotate(-0.35);
      this.drawTornTape(ctx, -tapeW / 2, -tapeH / 2, tapeW, tapeH, tapeColor);
      ctx.restore();

      // Top-Right Corner Tape for even indices
      if (idx % 2 === 1) {
        ctx.save();
        ctx.translate(cell.x + cell.width - 12, cell.y + 6);
        ctx.rotate(0.35);
        this.drawTornTape(ctx, -tapeW / 2, -tapeH / 2, tapeW, tapeH, tapeColor);
        ctx.restore();
      }
    });

    ctx.restore();
  }

  /**
   * Renders a jagged, semi-transparent torn piece of washi tape
   */
  drawTornTape(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Top edge with subtle fiber roughness
    ctx.lineTo(x + w, y);

    // Right torn edge
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const stepY = y + (h / steps) * i;
      const jag = (i % 2 === 0 ? 3 : -2);
      ctx.lineTo(x + w + jag, stepY);
    }

    // Bottom edge
    ctx.lineTo(x, y + h);

    // Left torn edge
    for (let i = steps; i >= 0; i--) {
      const stepY = y + (h / steps) * i;
      const jag = (i % 2 === 0 ? -3 : 2);
      ctx.lineTo(x + jag, stepY);
    }

    ctx.closePath();
    ctx.fill();

    // Subtle paper crease highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /**
   * Draws vintage orange 7-segment digital camera date stamp
   */
  drawDateStamp(ctx, style, w, h) {
    ctx.save();
    const dateText = style.caption && style.caption.startsWith("'") ? style.caption : "'26 10 18";
    const color = style.dateStampColor || '#FF6B00';

    ctx.font = 'bold 20px "VT323", "Space Grotesk", monospace';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    ctx.fillText(dateText, w - 28, h - 22);
    ctx.restore();
  }

  /**
   * Draws editorial magazine headline typography
   */
  drawEditorialText(ctx, style, w, h) {
    // Avoid double rendering if it was used for the date stamp
    if (style.dateStamp && style.caption && style.caption.startsWith("'")) return;

    ctx.save();
    const textColor = style.textColor || (style.background === '#FFFFFF' || style.background === '#FAF9F6' ? '#18181B' : '#F4F4F5');
    const fontFamily = style.fontFamily || "'Cormorant Garamond', serif";

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = `600 18px ${fontFamily}`;

    // Subtly position at bottom center with tracking
    ctx.letterSpacing = '3px';
    ctx.fillText(style.caption, w / 2, h - 14);

    ctx.restore();
  }

  /**
   * Fast procedural monochromatic film grain overlay
   */
  drawFilmGrain(ctx, intensity, w, h) {
    const grainAlpha = Math.min(0.35, (intensity / 100) * 0.35);

    // Generate or reuse cached noise canvas
    if (!this.noiseCanvasCache || this.lastNoiseLevel !== intensity) {
      const nw = 300;
      const nh = 300;
      const nc = document.createElement('canvas');
      nc.width = nw;
      nc.height = nh;
      const nctx = nc.getContext('2d');
      const imgData = nctx.createImageData(nw, nh);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const val = Math.floor(Math.random() * 255);
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = Math.floor(Math.random() * (intensity * 2.2));
      }

      nctx.putImageData(imgData, 0, 0);
      this.noiseCanvasCache = nc;
      this.lastNoiseLevel = intensity;
    }

    ctx.save();
    ctx.globalAlpha = grainAlpha;
    ctx.globalCompositeOperation = 'overlay';

    // Tile pattern over entire canvas
    const pattern = ctx.createPattern(this.noiseCanvasCache, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
  }

  /**
   * Draws blueprint subtle grid lines
   */
  drawBlueprintGrid(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const step = 30;

    ctx.beginPath();
    for (let x = 0; x < w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draws moleskine subtle dot grid
   */
  drawDotGrid(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(120, 113, 108, 0.2)';
    const step = 28;

    for (let x = 14; x < w; x += step) {
      for (let y = 14; y < h; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /**
   * Helper: draws a rounded rectangle path
   */
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, width, height, radius);
    } else {
      const r = Math.min(radius, width / 2, height / 2);
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + width - r, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + r);
      ctx.lineTo(x + width, y + height - r);
      ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      ctx.lineTo(x + r, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  }

  /**
   * High-Resolution Export Engine
   * Generates crystal-clear images up to 4K Ultra HD.
   */
  exportToBlob(state, exportScale = 2, format = 'image/png', quality = 0.95) {
    return new Promise((resolve) => {
      const offCanvas = document.createElement('canvas');
      const offRenderer = new CanvasRenderer(offCanvas);

      offRenderer.render({
        ...state,
        scale: exportScale,
        selectedPhotoIndex: null,
        draggedPhotoIndex: null,
        hoverCellIndex: null
      });

      offCanvas.toBlob((blob) => resolve(blob), format, quality);
    });
  }
}
