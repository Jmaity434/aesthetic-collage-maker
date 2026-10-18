/**
 * ADVANCED HIGH-PERFORMANCE DETERMINISTIC CANVAS 2D RENDERER
 * 100% Deterministic Graphics & Geometry (Zero AI).
 * Features:
 * - Distinct Procedural Backgrounds: Linen, Kraft paper, Parchment, Corkboard, Moleskine Dot-Grid, Blueprint, Iridescent Gradients.
 * - Distinct Foreground Frame Treatments: Deckled Torn Paper, Scalloped Postage Stamp, 35mm Film Sprockets, Polaroid Chins, Museum Passepartout, Super 8 Apertures, Cyber HUD brackets.
 * - Decorative Accents: 3D Cork Pushpins, Fibrous Washi Tape, 7-Segment Digital Date Stamps, High-Fashion Editorial Typography.
 * - Ultra-HD 4K Crisp Export Engine.
 */

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.noiseCanvasCache = null;
    this.lastNoiseLevel = -1;
    this.textureCanvasCache = {};
  }

  /**
   * Main render loop
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

    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(scale, scale);

    // 1. Render Unique Procedural Background Texture
    this.drawBackground(ctx, style, width, height);

    // 2. Render Foreground Photo Cells
    cells.forEach((cell, idx) => {
      const photo = photos[idx];
      const isSelected = selectedPhotoIndex === idx;
      const isHovered = hoverCellIndex === idx;
      const isDragging = draggedPhotoIndex === idx;

      this.drawCell(ctx, cell, photo, style, idx, { isSelected, isHovered, isDragging });
    });

    // 3. Filmstrip Sprockets & Perforations
    if (style.filmsprockets || style.frameStyle === 'filmstrip') {
      this.drawFilmSprockets(ctx, cells, style, width, height);
    }

    // 4. Washi Tape Accents
    if (style.tape) {
      this.drawWashiTapes(ctx, cells, style);
    }

    // 5. 3D Pushpins (for Corkboard / Scrapbook)
    if (style.pushpins || style.bgTexture === 'cork') {
      this.drawPushpins(ctx, cells);
    }

    // 6. Vintage Camera Date Stamp
    if (style.dateStamp) {
      this.drawDateStamp(ctx, style, width, height);
    }

    // 7. Editorial Headline Typography
    if (style.caption) {
      this.drawEditorialText(ctx, style, width, height);
    }

    // 8. Procedural Film Grain Overlay
    if (style.grain && style.grain > 0) {
      this.drawFilmGrain(ctx, style.grain, width, height);
    }

    ctx.restore();
  }

  /**
   * Distinct Background Engine (Color, Gradient, Linen, Kraft, Cork, Blueprint, Dot Grid)
   */
  drawBackground(ctx, style, w, h) {
    const bg = style.background || '#FAF9F6';
    const texture = style.bgTexture || 'clean';

    if (bg.startsWith('linear-gradient')) {
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

    // Render Procedural Textures
    switch (texture) {
      case 'linen':
        this.drawLinenWeave(ctx, w, h);
        break;
      case 'kraft':
        this.drawKraftFibers(ctx, w, h);
        break;
      case 'cork':
        this.drawCorkTexture(ctx, w, h);
        break;
      case 'parchment':
        this.drawParchmentVignette(ctx, w, h);
        break;
      case 'dotgrid':
        this.drawDotGrid(ctx, w, h);
        break;
      case 'blueprint':
        this.drawBlueprintGrid(ctx, w, h);
        break;
      default:
        break;
    }
  }

  /**
   * Procedural Linen Weave Texture
   */
  drawLinenWeave(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.035)';
    ctx.lineWidth = 1;
    const step = 8;
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

    // Secondary diagonal weave
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    for (let i = -h; i < w + h; i += step * 2) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
    }
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Procedural Kraft Paper Texture with organic fiber flecks
   */
  drawKraftFibers(ctx, w, h) {
    ctx.save();
    // Warm mottled tone
    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Fiber specks
    ctx.fillStyle = 'rgba(101, 67, 33, 0.08)';
    for (let i = 0; i < 300; i++) {
      const rx = (i * 997) % w;
      const ry = (i * 733) % h;
      const rlen = 2 + (i % 5);
      ctx.fillRect(rx, ry, rlen, 1);
    }
    ctx.restore();
  }

  /**
   * Procedural Corkboard Texture
   */
  drawCorkTexture(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(74, 44, 21, 0.07)';
    for (let i = 0; i < 400; i++) {
      const cx = (i * 1237) % w;
      const cy = (i * 883) % h;
      const rad = 2 + (i % 6);
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    // Deep vignette
    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.75);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  /**
   * Antique Parchment Vignette
   */
  drawParchmentVignette(ctx, w, h) {
    ctx.save();
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.75);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(92, 64, 51, 0.22)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  /**
   * Moleskine Dot Grid
   */
  drawDotGrid(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(120, 113, 108, 0.25)';
    const step = 28;
    for (let x = 14; x < w; x += step) {
      for (let y = 14; y < h; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /**
   * Architectural Blueprint Grid
   */
  drawBlueprintGrid(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
    ctx.lineWidth = 1;
    const step = 32;

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

    // Major coordinate grid lines every 4 steps
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    for (let x = 0; x < w; x += step * 4) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += step * 4) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draws individual photo cell with distinctive framing
   */
  drawCell(ctx, cell, photo, style, index, flags) {
    ctx.save();
    const { x, y, width: w, height: h, rotation = 0 } = cell;
    const { isSelected, isHovered, isDragging } = flags;
    const frameStyle = style.frameStyle || 'clean';
    const isPolaroid = frameStyle === 'polaroid' || cell.isPolaroid;
    const radius = isPolaroid ? 2 : Math.min(style.radius !== undefined ? style.radius : 6, w / 2, h / 2);

    // Apply rotation around center of cell
    const cx = x + w / 2;
    const cy = y + h / 2;
    if (rotation !== 0) {
      ctx.translate(cx, cy);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    if (isDragging) {
      ctx.globalAlpha = 0.45;
    }

    // Drop shadow
    if (isPolaroid || frameStyle === 'floating-shadow' || frameStyle === 'torn' || rotation !== 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 7;
    }

    let photoX = x;
    let photoY = y;
    let photoW = w;
    let photoH = h;

    // --- Distinct Framing Modes ---
    if (isPolaroid) {
      // Classic Polaroid: Card mount with extended bottom chin
      const marginH = Math.max(8, Math.round(w * 0.07));
      const marginTop = Math.max(8, Math.round(w * 0.07));
      const chinBottom = Math.max(26, Math.round(h * 0.22));

      ctx.fillStyle = '#FFFFFF';
      this.drawRoundedRect(ctx, x, y, w, h, 3);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      photoX = x + marginH;
      photoY = y + marginTop;
      photoW = w - marginH * 2;
      photoH = h - marginTop - chinBottom;

      // Inner hairline border
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      this.drawRoundedRect(ctx, photoX, photoY, photoW, photoH, 1);
      ctx.stroke();

    } else if (frameStyle === 'stamp') {
      // Scalloped perforated postage stamp frame
      ctx.fillStyle = '#FFFDF9';
      this.drawScallopedStamp(ctx, x, y, w, h, 6);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      const margin = 12;
      photoX = x + margin;
      photoY = y + margin;
      photoW = w - margin * 2;
      photoH = h - margin * 2;

    } else if (frameStyle === 'torn') {
      // Deckled torn paper frame
      ctx.fillStyle = '#F5EFE6';
      this.drawDeckledTornRect(ctx, x, y, w, h);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      const margin = 10;
      photoX = x + margin;
      photoY = y + margin;
      photoW = w - margin * 2;
      photoH = h - margin * 2;

    } else if (frameStyle === 'passepartout') {
      // Museum bevel matting with double hairline inlays
      const mat = Math.max(14, Math.round(Math.min(w, h) * 0.1));
      ctx.fillStyle = '#FFFFFF';
      this.drawRoundedRect(ctx, x, y, w, h, radius);
      ctx.fill();

      photoX = x + mat;
      photoY = y + mat;
      photoW = w - mat * 2;
      photoH = h - mat * 2;

      // Double hairline museum inlay
      ctx.strokeStyle = style.borderColor || '#D4D4D8';
      ctx.lineWidth = 1;
      ctx.strokeRect(photoX - 4, photoY - 4, photoW + 8, photoH + 8);
      ctx.strokeRect(photoX, photoY, photoW, photoH);

    } else if (frameStyle === 'super8') {
      // Curved Super 8 projection aperture bezel
      ctx.fillStyle = '#0F0F11';
      this.drawRoundedRect(ctx, x, y, w, h, 18);
      ctx.fill();

      const pad = 8;
      photoX = x + pad;
      photoY = y + pad;
      photoW = w - pad * 2;
      photoH = h - pad * 2;

    } else if (frameStyle === 'cyber') {
      // Cyberpunk HUD technical brackets
      ctx.strokeStyle = style.borderColor || '#38BDF8';
      ctx.lineWidth = 1.5;
      this.drawCyberBrackets(ctx, x, y, w, h);

    } else if (style.borderWidth && style.borderWidth > 0) {
      ctx.strokeStyle = style.borderColor || '#18181B';
      ctx.lineWidth = style.borderWidth;
      this.drawRoundedRect(ctx, x, y, w, h, radius);
      ctx.stroke();
    }

    ctx.shadowColor = 'transparent';

    // Clip & Draw Photo Image
    if (photo && photo.image) {
      ctx.save();
      const clipRadius = isPolaroid ? 1 : frameStyle === 'super8' ? 14 : radius;
      this.drawRoundedRect(ctx, photoX, photoY, photoW, photoH, clipRadius);
      ctx.clip();

      this.drawImageWithTransform(ctx, photo.image, photoX, photoY, photoW, photoH, photo.transform || {});
      ctx.restore();

    } else {
      // Placeholder Cell
      ctx.fillStyle = style.background === '#FFFFFF' ? '#F4F4F5' : 'rgba(255, 255, 255, 0.08)';
      this.drawRoundedRect(ctx, photoX, photoY, photoW, photoH, radius);
      ctx.fill();

      ctx.fillStyle = style.textColor || 'rgba(161, 161, 170, 0.6)';
      ctx.font = '500 13px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`SLOT ${index + 1}`, photoX + photoW / 2, photoY + photoH / 2);
    }

    // Interactive outline indicator
    if (isSelected) {
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 3;
      this.drawRoundedRect(ctx, x - 2, y - 2, w + 4, h + 4, radius + 2);
      ctx.stroke();

      // Corner anchor handles
      ctx.fillStyle = '#6366F1';
      ctx.fillRect(x - 5, y - 5, 10, 10);
      ctx.fillRect(x + w - 5, y - 5, 10, 10);
      ctx.fillRect(x - 5, y + h - 5, 10, 10);
      ctx.fillRect(x + w - 5, y + h - 5, 10, 10);
    } else if (isHovered) {
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.lineWidth = 2;
      this.drawRoundedRect(ctx, x, y, w, h, radius);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Scalloped Postage Stamp Border
   */
  drawScallopedStamp(ctx, x, y, w, h, notchRadius = 5) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    // Draw notches around all 4 edges
    const step = notchRadius * 3;
    // Top & Bottom
    for (let curX = x + notchRadius * 2; curX < x + w - notchRadius; curX += step) {
      ctx.arc(curX, y, notchRadius, 0, Math.PI, false);
      ctx.arc(curX, y + h, notchRadius, Math.PI, 0, false);
    }
    // Left & Right
    for (let curY = y + notchRadius * 2; curY < y + h - notchRadius; curY += step) {
      ctx.arc(x, curY, notchRadius, -Math.PI / 2, Math.PI / 2, false);
      ctx.arc(x + w, curY, notchRadius, Math.PI / 2, -Math.PI / 2, false);
    }
    ctx.closePath();
  }

  /**
   * Deckled Torn Paper Irregular Edge
   */
  drawDeckledTornRect(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, y);

    const stepsX = Math.max(10, Math.floor(w / 8));
    const stepsY = Math.max(10, Math.floor(h / 8));

    // Top edge
    for (let i = 0; i <= stepsX; i++) {
      const px = x + (w / stepsX) * i;
      const py = y + ((i % 3 === 0) ? -2 : (i % 2 === 0 ? 1.5 : -1));
      ctx.lineTo(px, py);
    }

    // Right edge
    for (let i = 0; i <= stepsY; i++) {
      const px = x + w + ((i % 3 === 0) ? 2 : (i % 2 === 0 ? -1.5 : 1));
      const py = y + (h / stepsY) * i;
      ctx.lineTo(px, py);
    }

    // Bottom edge
    for (let i = stepsX; i >= 0; i--) {
      const px = x + (w / stepsX) * i;
      const py = y + h + ((i % 3 === 0) ? 2 : (i % 2 === 0 ? -1.5 : 1));
      ctx.lineTo(px, py);
    }

    // Left edge
    for (let i = stepsY; i >= 0; i--) {
      const px = x + ((i % 3 === 0) ? -2 : (i % 2 === 0 ? 1.5 : -1));
      const py = y + (h / stepsY) * i;
      ctx.lineTo(px, py);
    }

    ctx.closePath();
  }

  /**
   * Cyber HUD Tech Brackets
   */
  drawCyberBrackets(ctx, x, y, w, h) {
    const len = Math.min(20, w * 0.2);
    ctx.beginPath();
    // Top-Left
    ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
    // Top-Right
    ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
    // Bottom-Left
    ctx.moveTo(x, y + h - len); ctx.lineTo(x, y + h); ctx.lineTo(x + len, y + h);
    // Bottom-Right
    ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len);
    ctx.stroke();

    // Small corner crosshair
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillRect(x + w - 8, y + 6, 2, 2);
  }

  /**
   * Draws realistic 3D Pushpins on corkboard
   */
  drawPushpins(ctx, cells) {
    ctx.save();
    const pinColors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'];

    cells.forEach((cell, idx) => {
      const pinX = cell.x + cell.width / 2;
      const pinY = cell.y + 4;
      const color = pinColors[idx % pinColors.length];

      // Drop shadow for pin
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 4;

      // Pin head
      ctx.beginPath();
      ctx.arc(pinX, pinY, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Specular 3D highlight
      ctx.shadowColor = 'transparent';
      ctx.beginPath();
      ctx.arc(pinX - 2, pinY - 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
    });

    ctx.restore();
  }

  /**
   * Image Transformation & Pan/Zoom
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

    const scaleFactor = Math.max(w / imgW, h / imgH) * Math.max(0.2, zoom);
    const drawW = imgW * scaleFactor;
    const drawH = imgH * scaleFactor;

    ctx.save();
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.translate(cx, cy);

    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    if (rotation !== 0) {
      ctx.rotate((rotation * Math.PI) / 180);
    }

    const posX = -drawW / 2 + (panX / 100) * w;
    const posY = -drawH / 2 + (panY / 100) * h;

    ctx.drawImage(img, posX, posY, drawW, drawH);
    ctx.restore();
  }

  /**
   * 35mm Continuous Filmstrip Sprockets & Perforations
   */
  drawFilmSprockets(ctx, cells, style, canvasW, canvasH) {
    ctx.save();
    ctx.fillStyle = '#FFFFFF';

    cells.forEach((cell, idx) => {
      const sprockW = 8;
      const sprockH = 12;
      const gap = 16;
      const count = Math.floor(cell.width / (sprockW + gap));

      for (let i = 0; i < count; i++) {
        const sx = cell.x + 8 + i * (sprockW + gap);
        this.drawRoundedRect(ctx, sx, cell.y - 14, sprockW, sprockH, 2);
        ctx.fill();
        this.drawRoundedRect(ctx, sx, cell.y + cell.height + 2, sprockW, sprockH, 2);
        ctx.fill();
      }

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 9px "Space Grotesk", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`KODAK 400 • ${20 + idx}A`, cell.x + 10, cell.y - 18);
      ctx.fillStyle = '#FFFFFF';
    });

    ctx.restore();
  }

  /**
   * Authentic Fibrous Washi Tape Accents
   */
  drawWashiTapes(ctx, cells, style) {
    ctx.save();
    const tapeColor = style.tapeColor || 'rgba(245, 158, 11, 0.7)';

    cells.forEach((cell, idx) => {
      const tapeW = 44;
      const tapeH = 16;

      ctx.save();
      ctx.translate(cell.x + 12, cell.y + 6);
      ctx.rotate(-0.35);
      this.drawTornTape(ctx, -tapeW / 2, -tapeH / 2, tapeW, tapeH, tapeColor);
      ctx.restore();

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
   * Torn tape strip with jagged ends
   */
  drawTornTape(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);

    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const stepY = y + (h / steps) * i;
      const jag = (i % 2 === 0 ? 3 : -2);
      ctx.lineTo(x + w + jag, stepY);
    }

    ctx.lineTo(x, y + h);

    for (let i = steps; i >= 0; i--) {
      const stepY = y + (h / steps) * i;
      const jag = (i % 2 === 0 ? -3 : 2);
      ctx.lineTo(x + jag, stepY);
    }

    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /**
   * Vintage 7-segment digital camera date stamp
   */
  drawDateStamp(ctx, style, w, h) {
    ctx.save();
    const dateText = style.caption && style.caption.startsWith("'") ? style.caption : "'26 10 18";
    const color = style.dateStampColor || '#FF6B00';

    ctx.font = 'bold 20px "VT323", monospace';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(dateText, w - 28, h - 22);
    ctx.restore();
  }

  /**
   * Editorial Headline Typography
   */
  drawEditorialText(ctx, style, w, h) {
    if (style.dateStamp && style.caption && style.caption.startsWith("'")) return;

    ctx.save();
    const textColor = style.textColor || (style.background === '#FFFFFF' || style.background === '#FAF9F6' ? '#18181B' : '#F4F4F5');
    const fontFamily = style.fontFamily || "'Cormorant Garamond', serif";

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = `600 18px ${fontFamily}`;
    ctx.letterSpacing = '3px';
    ctx.fillText(style.caption, w / 2, h - 14);
    ctx.restore();
  }

  /**
   * Fast Procedural Monochromatic Film Grain
   */
  drawFilmGrain(ctx, intensity, w, h) {
    const grainAlpha = Math.min(0.35, (intensity / 100) * 0.35);

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

    const pattern = ctx.createPattern(this.noiseCanvasCache, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
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
   * Ultra-HD Export Engine (1x, 2x, 4x)
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
