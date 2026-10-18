/**
 * AESTHETIC COLLAGE STUDIO - APPLICATION CONTROLLER
 * Zero AI • 100% Deterministic Client-side JavaScript.
 * Supports up to 20 photos, custom aspect ratios, 100 distinct aesthetic styles,
 * touch-enabled mobile navigation, and Ultra-HD 4K export.
 */

import { AESTHETIC_STYLES, AESTHETIC_CATEGORIES } from './research/aesthetic-catalog.js';
import { LayoutEngine } from './engine/layout-engine.js';
import { CanvasRenderer } from './engine/canvas-renderer.js';

const MAX_PHOTOS = 20;

const ASPECT_RATIO_PRESETS = {
  '1:1': { w: 1200, h: 1200, label: '1:1 Square (Instagram / Album)' },
  '4:5': { w: 1200, h: 1500, label: '4:5 Portrait (Instagram Feed)' },
  '9:16': { w: 1080, h: 1920, label: '9:16 Story / Reel / TikTok' },
  '16:9': { w: 1920, h: 1080, label: '16:9 Landscape / Wallpaper' },
  '3:4': { w: 1200, h: 1600, label: '3:4 Classic Portrait' },
  '4:3': { w: 1600, h: 1200, label: '4:3 Classic Landscape' },
  '2:3': { w: 1200, h: 1800, label: '2:3 35mm Portrait Print' },
  '3:2': { w: 1800, h: 1200, label: '3:2 35mm Landscape' },
  '21:9': { w: 2100, h: 900, label: '21:9 Cinematic Ultra-Wide' },
  'A4': { w: 1240, h: 1754, label: 'A4 Document / Art Poster' }
};

class CollageStudioApp {
  constructor() {
    this.canvas = document.getElementById('collageCanvas');
    this.canvasWrapper = document.getElementById('canvasWrapper');
    this.renderer = new CanvasRenderer(this.canvas);

    // Initial state
    this.photos = [];
    this.cells = [];
    this.aspectRatio = '4:5';
    this.layoutType = 'auto';
    this.currentStyle = { ...AESTHETIC_STYLES[0] };
    this.selectedPhotoIndex = null;
    this.draggedPhotoIndex = null;
    this.hoverCellIndex = null;

    // Viewport Zoom
    this.viewportZoom = 1;

    // Interaction flags for canvas direct pan/drag
    this.isMouseDown = false;
    this.isPanning = false;
    this.dragStartPos = { x: 0, y: 0 };
    this.dragCellStartTransform = null;

    this.init();
  }

  async init() {
    this.bindDOM();
    this.bindTabs();
    this.bindCanvasInteractions();
    this.bindTouchInteractions();
    this.renderAestheticCatalogModal();
    this.renderCategoryPills();
    this.updateCanvasDimensions();

    // Automatically load 5 high-aesthetic sample photos on startup
    await this.loadSamplePhotos();
  }

  updateCanvasDimensions() {
    const preset = ASPECT_RATIO_PRESETS[this.aspectRatio] || ASPECT_RATIO_PRESETS['4:5'];
    this.canvasWidth = preset.w;
    this.canvasHeight = preset.h;
    this.recomputeAndRender();
  }

  recomputeAndRender() {
    const photoCount = Math.max(1, this.photos.length);

    this.cells = LayoutEngine.computeLayout(photoCount, {
      width: this.canvasWidth,
      height: this.canvasHeight,
      padding: this.currentStyle.padding !== undefined ? this.currentStyle.padding : 32,
      gap: this.currentStyle.gap !== undefined ? this.currentStyle.gap : 16,
      layoutType: this.layoutType,
      aspectRatio: this.aspectRatio
    });

    this.renderer.render({
      photos: this.photos,
      cells: this.cells,
      style: this.currentStyle,
      width: this.canvasWidth,
      height: this.canvasHeight,
      scale: 1,
      selectedPhotoIndex: this.selectedPhotoIndex,
      draggedPhotoIndex: this.draggedPhotoIndex,
      hoverCellIndex: this.hoverCellIndex
    });

    this.updateInspectorUI();
    this.updatePhotoStripUI();
  }

  // --- Photo Management (1 to 20 limit) ---

  async addPhotos(files) {
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_PHOTOS - this.photos.length;
    if (remainingSlots <= 0) {
      this.showToast('Maximum photo limit (20) reached.', 'warning');
      return;
    }

    const filesToLoad = Array.from(files).slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      this.showToast(`Limit reached: added only first ${remainingSlots} photos.`, 'info');
    }

    for (const file of filesToLoad) {
      if (!file.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(file);
      const img = await this.loadImage(url);
      this.photos.push({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        url,
        image: img,
        transform: {
          zoom: 1,
          panX: 0,
          panY: 0,
          rotation: 0,
          flipH: false,
          flipV: false
        }
      });
    }

    this.recomputeAndRender();
    this.showToast(`${this.photos.length} / ${MAX_PHOTOS} photos loaded`, 'success');
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  removePhoto(index) {
    if (index >= 0 && index < this.photos.length) {
      if (this.photos[index].url && this.photos[index].url.startsWith('blob:')) {
        URL.revokeObjectURL(this.photos[index].url);
      }
      this.photos.splice(index, 1);
      if (this.selectedPhotoIndex === index) {
        this.selectedPhotoIndex = null;
      } else if (this.selectedPhotoIndex > index) {
        this.selectedPhotoIndex--;
      }
      this.recomputeAndRender();
      this.showToast(`Photo removed (${this.photos.length}/${MAX_PHOTOS})`, 'info');
    }
  }

  // Sample Photos Generator (Procedural High-Aesthetic Scenes)
  async loadSamplePhotos() {
    const samplePalettes = [
      { bg: '#E07A5F', fg: '#F4F1DE', title: 'Golden Hour' },
      { bg: '#3D405B', fg: '#F2CC8F', title: 'Midnight Studio' },
      { bg: '#81B29A', fg: '#3D405B', title: 'Botanical Flora' },
      { bg: '#F2CC8F', fg: '#E07A5F', title: 'Vintage Sunset' },
      { bg: '#4A5568', fg: '#CBD5E1', title: 'Archival Monochrome' }
    ];

    const sampleImages = [];
    for (let i = 0; i < 5; i++) {
      const p = samplePalettes[i];
      const c = document.createElement('canvas');
      c.width = 800;
      c.height = 1000;
      const ctx = c.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 800, 1000);
      grad.addColorStop(0, p.bg);
      grad.addColorStop(1, '#1A202C');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 1000);

      ctx.fillStyle = p.fg;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(400, 500, 240, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(400, 500, 160, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.font = 'bold 36px "Space Grotesk", sans-serif';
      ctx.fillText(p.title.toUpperCase(), 400, 480);
      ctx.font = '300 22px "Cormorant Garamond", serif';
      ctx.fillText(`Aesthetic Series No. 0${i + 1}`, 400, 530);

      const url = c.toDataURL('image/jpeg', 0.9);
      const img = await this.loadImage(url);
      sampleImages.push({
        id: 'sample-' + i,
        name: `Sample Photo ${i + 1}`,
        url,
        image: img,
        transform: { zoom: 1, panX: 0, panY: 0, rotation: 0, flipH: false, flipV: false }
      });
    }

    this.photos = sampleImages;
    this.recomputeAndRender();
  }

  // --- Aesthetic Style Application ---

  applyStyle(styleObj) {
    this.currentStyle = { ...styleObj };
    if (styleObj.aspectRatio && ASPECT_RATIO_PRESETS[styleObj.aspectRatio]) {
      this.aspectRatio = styleObj.aspectRatio;
      const preset = ASPECT_RATIO_PRESETS[this.aspectRatio];
      this.canvasWidth = preset.w;
      this.canvasHeight = preset.h;
      const ratioSelect = document.getElementById('aspectRatioSelect');
      if (ratioSelect) ratioSelect.value = this.aspectRatio;
    }
    this.syncControlsWithStyle();
    this.recomputeAndRender();
    this.showToast(`Applied: "${styleObj.name}"`, 'success');
  }

  syncControlsWithStyle() {
    const s = this.currentStyle;
    const gapSlider = document.getElementById('gapSlider');
    const radiusSlider = document.getElementById('radiusSlider');
    const paddingSlider = document.getElementById('paddingSlider');
    const grainSlider = document.getElementById('grainSlider');
    const bgColorInput = document.getElementById('bgColorInput');
    const captionInput = document.getElementById('captionInput');
    const tapeToggle = document.getElementById('tapeToggle');
    const dateStampToggle = document.getElementById('dateStampToggle');
    const frameStyleSelect = document.getElementById('frameStyleSelect');

    if (gapSlider && s.gap !== undefined) gapSlider.value = s.gap;
    if (radiusSlider && s.radius !== undefined) radiusSlider.value = s.radius;
    if (paddingSlider && s.padding !== undefined) paddingSlider.value = s.padding;
    if (grainSlider && s.grain !== undefined) grainSlider.value = s.grain;
    if (bgColorInput && s.background) bgColorInput.value = s.background.startsWith('#') ? s.background : '#FAF9F6';
    if (captionInput) captionInput.value = s.caption || '';
    if (tapeToggle) tapeToggle.checked = !!s.tape;
    if (dateStampToggle) dateStampToggle.checked = !!s.dateStamp;
    if (frameStyleSelect && s.frameStyle) frameStyleSelect.value = s.frameStyle;

    this.updateSliderValueLabels();
  }

  updateSliderValueLabels() {
    ['gap', 'radius', 'padding', 'grain'].forEach(key => {
      const slider = document.getElementById(`${key}Slider`);
      const valLabel = document.getElementById(`${key}Val`);
      if (slider && valLabel) valLabel.textContent = `${slider.value}${key === 'grain' ? '%' : 'px'}`;
    });
  }

  // --- Tab & Mobile Navigation ---

  bindTabs() {
    const switchTab = (tabId) => {
      // Sidebar desktop tabs
      document.querySelectorAll('.sidebar-tab').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('border-indigo-500', isActive);
        btn.classList.toggle('text-indigo-400', isActive);
        btn.classList.toggle('border-transparent', !isActive);
        btn.classList.toggle('text-zinc-400', !isActive);
      });

      // Mobile bottom nav buttons
      document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('text-indigo-400', isActive);
        btn.classList.toggle('text-zinc-400', !isActive);
      });

      // Tab panels
      document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
      const activePanel = document.getElementById(`tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
      if (activePanel) activePanel.classList.remove('hidden');

      // On mobile: show sidebar if clicked from bottom nav
      const sidebar = document.getElementById('studioSidebar');
      if (sidebar && window.innerWidth < 768) {
        sidebar.classList.remove('hidden');
      }
    };

    document.querySelectorAll('.sidebar-tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    const openCatalogFromTab = document.getElementById('openCatalogFromTabBtn');
    if (openCatalogFromTab) {
      openCatalogFromTab.addEventListener('click', () => {
        const modal = document.getElementById('libraryModal');
        if (modal) modal.classList.remove('hidden');
      });
    }
  }

  // --- UI Bindings & Event Listeners ---

  bindDOM() {
    // File upload
    const fileInput = document.getElementById('photoFileInput');
    const uploadDropzone = document.getElementById('uploadDropzone');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this.addPhotos(e.target.files);
        fileInput.value = '';
      });
    }

    if (uploadDropzone) {
      uploadDropzone.addEventListener('click', () => fileInput.click());
      uploadDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadDropzone.classList.add('border-indigo-500');
      });
      uploadDropzone.addEventListener('dragleave', () => {
        uploadDropzone.classList.remove('border-indigo-500');
      });
      uploadDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadDropzone.classList.remove('border-indigo-500');
        this.addPhotos(e.dataTransfer.files);
      });
    }

    // Demo button
    const loadDemoBtn = document.getElementById('loadDemoBtn');
    if (loadDemoBtn) {
      loadDemoBtn.addEventListener('click', () => this.loadSamplePhotos());
    }

    // Clear all
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('Clear all uploaded photos?')) {
          this.photos = [];
          this.selectedPhotoIndex = null;
          this.recomputeAndRender();
        }
      });
    }

    // Ratio selector
    const aspectRatioSelect = document.getElementById('aspectRatioSelect');
    if (aspectRatioSelect) {
      aspectRatioSelect.addEventListener('change', (e) => {
        this.aspectRatio = e.target.value;
        this.updateCanvasDimensions();
      });
    }

    // Layout selector
    const layoutTypeSelect = document.getElementById('layoutTypeSelect');
    if (layoutTypeSelect) {
      layoutTypeSelect.addEventListener('change', (e) => {
        this.layoutType = e.target.value;
        this.recomputeAndRender();
      });
    }

    // Frame style selector
    const frameStyleSelect = document.getElementById('frameStyleSelect');
    if (frameStyleSelect) {
      frameStyleSelect.addEventListener('change', (e) => {
        this.currentStyle.frameStyle = e.target.value;
        this.recomputeAndRender();
      });
    }

    // Sliders
    ['gap', 'radius', 'padding', 'grain'].forEach(key => {
      const slider = document.getElementById(`${key}Slider`);
      if (slider) {
        slider.addEventListener('input', (e) => {
          this.currentStyle[key] = parseInt(e.target.value, 10);
          this.updateSliderValueLabels();
          this.recomputeAndRender();
        });
      }
    });

    // Background color
    const bgColorInput = document.getElementById('bgColorInput');
    if (bgColorInput) {
      bgColorInput.addEventListener('input', (e) => {
        this.currentStyle.background = e.target.value;
        this.recomputeAndRender();
      });
    }

    // Swatches
    document.querySelectorAll('.palette-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        if (color) {
          this.currentStyle.background = color;
          if (bgColorInput) bgColorInput.value = color;
          this.recomputeAndRender();
        }
      });
    });

    // Caption
    const captionInput = document.getElementById('captionInput');
    if (captionInput) {
      captionInput.addEventListener('input', (e) => {
        this.currentStyle.caption = e.target.value;
        this.recomputeAndRender();
      });
    }

    // Toggles
    const tapeToggle = document.getElementById('tapeToggle');
    if (tapeToggle) {
      tapeToggle.addEventListener('change', (e) => {
        this.currentStyle.tape = e.target.checked;
        this.recomputeAndRender();
      });
    }

    const dateStampToggle = document.getElementById('dateStampToggle');
    if (dateStampToggle) {
      dateStampToggle.addEventListener('change', (e) => {
        this.currentStyle.dateStamp = e.target.checked;
        this.recomputeAndRender();
      });
    }

    // Canvas Zoom Toolbar
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomFitBtn = document.getElementById('zoomFitBtn');
    const zoomPercent = document.getElementById('canvasZoomPercent');

    if (zoomInBtn && zoomOutBtn && zoomFitBtn && this.canvasWrapper) {
      const updateZoom = (z) => {
        this.viewportZoom = Math.max(0.4, Math.min(2.5, z));
        this.canvasWrapper.style.transform = `scale(${this.viewportZoom})`;
        if (zoomPercent) zoomPercent.textContent = `${Math.round(this.viewportZoom * 100)}%`;
      };

      zoomInBtn.addEventListener('click', () => updateZoom(this.viewportZoom + 0.15));
      zoomOutBtn.addEventListener('click', () => updateZoom(this.viewportZoom - 0.15));
      zoomFitBtn.addEventListener('click', () => {
        this.viewportZoom = 1;
        this.canvasWrapper.style.transform = 'scale(1)';
        if (zoomPercent) zoomPercent.textContent = 'Fit';
      });
    }

    // Inspector controls
    this.bindInspectorControls();

    // Export Controls
    this.bindExportControls();

    // 100 Styles Modal Triggers
    const openLibraryBtn = document.getElementById('openLibraryBtn');
    const libraryModal = document.getElementById('libraryModal');
    const closeLibraryBtn = document.getElementById('closeLibraryBtn');

    if (openLibraryBtn && libraryModal) {
      openLibraryBtn.addEventListener('click', () => libraryModal.classList.remove('hidden'));
    }
    if (closeLibraryBtn && libraryModal) {
      closeLibraryBtn.addEventListener('click', () => libraryModal.classList.add('hidden'));
    }

    window.addEventListener('click', (e) => {
      if (e.target === libraryModal) libraryModal.classList.add('hidden');
      const exportModal = document.getElementById('exportModal');
      if (e.target === exportModal) exportModal.classList.add('hidden');
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.selectedPhotoIndex = null;
        this.recomputeAndRender();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.selectedPhotoIndex !== null && document.activeElement.tagName !== 'INPUT') {
          this.removePhoto(this.selectedPhotoIndex);
        }
      }
    });
  }

  // --- Canvas Mouse & Touch Interactions ---

  bindCanvasInteractions() {
    const canvas = this.canvas;

    const getCanvasCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = this.canvasWidth / rect.width;
      const scaleY = this.canvasHeight / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    const findCellIndexAt = (coords) => {
      for (let i = this.cells.length - 1; i >= 0; i--) {
        const c = this.cells[i];
        if (coords.x >= c.x && coords.x <= c.x + c.width && coords.y >= c.y && coords.y <= c.y + c.height) {
          return i;
        }
      }
      return null;
    };

    canvas.addEventListener('mousedown', (e) => {
      const coords = getCanvasCoords(e);
      const clickedCellIndex = findCellIndexAt(coords);

      if (clickedCellIndex !== null) {
        this.selectedPhotoIndex = clickedCellIndex;
        this.isMouseDown = true;
        this.dragStartPos = coords;

        const photo = this.photos[clickedCellIndex];
        if (photo) {
          this.dragCellStartTransform = { ...photo.transform };
        }
      } else {
        this.selectedPhotoIndex = null;
      }
      this.recomputeAndRender();
    });

    canvas.addEventListener('mousemove', (e) => {
      const coords = getCanvasCoords(e);

      if (!this.isMouseDown) {
        const hoverIdx = findCellIndexAt(coords);
        if (hoverIdx !== this.hoverCellIndex) {
          this.hoverCellIndex = hoverIdx;
          this.recomputeAndRender();
        }
        return;
      }

      if (this.selectedPhotoIndex !== null && this.photos[this.selectedPhotoIndex]) {
        this.isPanning = true;
        const cell = this.cells[this.selectedPhotoIndex];
        const dx = coords.x - this.dragStartPos.x;
        const dy = coords.y - this.dragStartPos.y;

        const photo = this.photos[this.selectedPhotoIndex];
        const initial = this.dragCellStartTransform || { panX: 0, panY: 0 };
        photo.transform.panX = initial.panX + (dx / cell.width) * 100;
        photo.transform.panY = initial.panY + (dy / cell.height) * 100;

        this.recomputeAndRender();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      this.isPanning = false;
      this.dragCellStartTransform = null;
    });

    canvas.addEventListener('wheel', (e) => {
      const coords = getCanvasCoords(e);
      const cellIdx = findCellIndexAt(coords);
      if (cellIdx !== null && this.photos[cellIdx]) {
        e.preventDefault();
        const photo = this.photos[cellIdx];
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        photo.transform.zoom = Math.max(0.3, Math.min(3.5, (photo.transform.zoom || 1) + delta));
        this.selectedPhotoIndex = cellIdx;
        this.recomputeAndRender();
      }
    }, { passive: false });
  }

  // Touch handlers for mobile
  bindTouchInteractions() {
    const canvas = this.canvas;

    const getTouchCoords = (e) => {
      const touch = e.touches[0] || e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = this.canvasWidth / rect.width;
      const scaleY = this.canvasHeight / rect.height;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    };

    const findCellIndexAt = (coords) => {
      for (let i = this.cells.length - 1; i >= 0; i--) {
        const c = this.cells[i];
        if (coords.x >= c.x && coords.x <= c.x + c.width && coords.y >= c.y && coords.y <= c.y + c.height) {
          return i;
        }
      }
      return null;
    };

    canvas.addEventListener('touchstart', (e) => {
      const coords = getTouchCoords(e);
      const clickedCellIndex = findCellIndexAt(coords);

      if (clickedCellIndex !== null) {
        this.selectedPhotoIndex = clickedCellIndex;
        this.isMouseDown = true;
        this.dragStartPos = coords;

        const photo = this.photos[clickedCellIndex];
        if (photo) {
          this.dragCellStartTransform = { ...photo.transform };
        }
      } else {
        this.selectedPhotoIndex = null;
      }
      this.recomputeAndRender();
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (!this.isMouseDown || this.selectedPhotoIndex === null) return;
      e.preventDefault();

      const coords = getTouchCoords(e);
      const cell = this.cells[this.selectedPhotoIndex];
      const dx = coords.x - this.dragStartPos.x;
      const dy = coords.y - this.dragStartPos.y;

      const photo = this.photos[this.selectedPhotoIndex];
      const initial = this.dragCellStartTransform || { panX: 0, panY: 0 };
      photo.transform.panX = initial.panX + (dx / cell.width) * 100;
      photo.transform.panY = initial.panY + (dy / cell.height) * 100;

      this.recomputeAndRender();
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      this.isMouseDown = false;
      this.dragCellStartTransform = null;
    });
  }

  // --- Selected Photo Inspector ---

  bindInspectorControls() {
    const zoomSlider = document.getElementById('photoZoomSlider');
    const rotateBtn = document.getElementById('rotatePhotoBtn');
    const flipHBtn = document.getElementById('flipHPhotoBtn');
    const flipVBtn = document.getElementById('flipVPhotoBtn');
    const deleteBtn = document.getElementById('deletePhotoBtn');

    if (zoomSlider) {
      zoomSlider.addEventListener('input', (e) => {
        if (this.selectedPhotoIndex !== null && this.photos[this.selectedPhotoIndex]) {
          this.photos[this.selectedPhotoIndex].transform.zoom = parseFloat(e.target.value);
          this.recomputeAndRender();
        }
      });
    }

    if (rotateBtn) {
      rotateBtn.addEventListener('click', () => {
        if (this.selectedPhotoIndex !== null && this.photos[this.selectedPhotoIndex]) {
          const t = this.photos[this.selectedPhotoIndex].transform;
          t.rotation = ((t.rotation || 0) + 90) % 360;
          this.recomputeAndRender();
        }
      });
    }

    if (flipHBtn) {
      flipHBtn.addEventListener('click', () => {
        if (this.selectedPhotoIndex !== null && this.photos[this.selectedPhotoIndex]) {
          const t = this.photos[this.selectedPhotoIndex].transform;
          t.flipH = !t.flipH;
          this.recomputeAndRender();
        }
      });
    }

    if (flipVBtn) {
      flipVBtn.addEventListener('click', () => {
        if (this.selectedPhotoIndex !== null && this.photos[this.selectedPhotoIndex]) {
          const t = this.photos[this.selectedPhotoIndex].transform;
          t.flipV = !t.flipV;
          this.recomputeAndRender();
        }
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (this.selectedPhotoIndex !== null) {
          this.removePhoto(this.selectedPhotoIndex);
        }
      });
    }
  }

  updateInspectorUI() {
    const inspectorCard = document.getElementById('photoInspectorCard');
    const photoZoomSlider = document.getElementById('photoZoomSlider');
    const photoZoomVal = document.getElementById('photoZoomVal');
    const inspectorTitle = document.getElementById('inspectorTitle');

    if (!inspectorCard) return;

    if (this.selectedPhotoIndex !== null && this.photos[this.selectedPhotoIndex]) {
      inspectorCard.classList.remove('opacity-40', 'pointer-events-none');
      const photo = this.photos[this.selectedPhotoIndex];
      const zoom = photo.transform.zoom || 1;
      if (photoZoomSlider) photoZoomSlider.value = zoom;
      if (photoZoomVal) photoZoomVal.textContent = `${Math.round(zoom * 100)}%`;
      if (inspectorTitle) inspectorTitle.textContent = `Photo ${this.selectedPhotoIndex + 1} Selected`;
    } else {
      inspectorCard.classList.add('opacity-40', 'pointer-events-none');
      if (inspectorTitle) inspectorTitle.textContent = 'No Photo Selected';
    }
  }

  updatePhotoStripUI() {
    const container = document.getElementById('photoThumbnailStrip');
    const badge = document.getElementById('photoCountBadge');
    if (badge) badge.textContent = `${this.photos.length} / ${MAX_PHOTOS}`;

    if (!container) return;
    container.innerHTML = '';

    this.photos.forEach((photo, idx) => {
      const item = document.createElement('div');
      item.className = `relative w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-150 flex-shrink-0 group ${
        this.selectedPhotoIndex === idx ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-500/40' : 'border-zinc-700 hover:border-zinc-500'
      }`;

      item.innerHTML = `
        <img src="${photo.url}" class="w-full h-full object-cover pointer-events-none" alt="thumb">
        <span class="absolute bottom-0 left-0 bg-black/80 text-[10px] text-white px-1.5 rounded-tr font-mono">${idx + 1}</span>
        <button class="absolute top-0 right-0 bg-rose-600/90 hover:bg-rose-600 text-white w-4 h-4 flex items-center justify-center text-[10px] rounded-bl opacity-0 group-hover:opacity-100 transition-opacity" title="Remove">✕</button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
          this.removePhoto(idx);
        } else {
          this.selectedPhotoIndex = idx;
          this.recomputeAndRender();
        }
      });

      container.appendChild(item);
    });
  }

  // --- 100 Aesthetic Style Reference Library Modal ---

  renderAestheticCatalogModal() {
    const grid = document.getElementById('libraryGrid');
    const searchInput = document.getElementById('librarySearchInput');
    if (!grid) return;

    const renderItems = (filterCategory = 'all', searchQuery = '') => {
      grid.innerHTML = '';

      const filtered = AESTHETIC_STYLES.filter(style => {
        const matchesCategory = filterCategory === 'all' || style.category === filterCategory;
        const matchesQuery = !searchQuery ||
          style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          style.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          style.mood.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesQuery;
      });

      filtered.forEach(style => {
        const card = document.createElement('div');
        card.className = 'bg-zinc-900/90 border border-zinc-800 hover:border-indigo-500/60 rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between group';

        card.innerHTML = `
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300">#${style.id}</span>
              <span class="text-[11px] text-indigo-400 uppercase tracking-wider font-semibold">${style.category}</span>
            </div>
            <h4 class="text-white font-semibold text-base mb-1 group-hover:text-indigo-400 transition-colors">${style.name}</h4>
            <p class="text-xs text-zinc-400 leading-relaxed mb-3">${style.description}</p>
          </div>
          <div class="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <span class="text-[11px] text-zinc-500 italic truncate max-w-[170px]">${style.mood}</span>
            <button class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-xl font-medium transition-all shadow-md shadow-indigo-600/20">Apply</button>
          </div>
        `;

        card.addEventListener('click', () => {
          this.applyStyle(style);
          const modal = document.getElementById('libraryModal');
          if (modal) modal.classList.add('hidden');
        });

        grid.appendChild(card);
      });
    };

    renderItems('all');

    const modalPillContainer = document.getElementById('modalCategoryPills');
    if (modalPillContainer) {
      modalPillContainer.innerHTML = `
        <button class="modal-cat-pill active text-xs px-3 py-1 rounded-full bg-indigo-600 text-white font-medium transition-colors whitespace-nowrap" data-cat="all">All (100)</button>
      `;
      AESTHETIC_CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'modal-cat-pill text-xs px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors whitespace-nowrap';
        btn.dataset.cat = cat.id;
        btn.textContent = `${cat.name} (${cat.count})`;
        btn.addEventListener('click', () => {
          document.querySelectorAll('.modal-cat-pill').forEach(b => {
            b.classList.remove('active', 'bg-indigo-600', 'text-white');
            b.classList.add('bg-zinc-800', 'text-zinc-300');
          });
          btn.classList.add('active', 'bg-indigo-600', 'text-white');
          btn.classList.remove('bg-zinc-800', 'text-zinc-300');
          renderItems(cat.id, searchInput ? searchInput.value : '');
        });
        modalPillContainer.appendChild(btn);
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const activePill = document.querySelector('.modal-cat-pill.active');
        const cat = activePill ? activePill.dataset.cat : 'all';
        renderItems(cat, e.target.value);
      });
    }
  }

  renderCategoryPills() {
    const container = document.getElementById('quickStylePills');
    if (!container) return;

    const popularStyles = [
      AESTHETIC_STYLES[0],  // Vogue Monograph
      AESTHETIC_STYLES[1],  // Kinfolk Serenity
      AESTHETIC_STYLES[10], // 90s Polaroid Stack
      AESTHETIC_STYLES[11], // 35mm Filmstrip
      AESTHETIC_STYLES[20], // Washi Tape Grid
      AESTHETIC_STYLES[23], // Torn Kraft Paper
      AESTHETIC_STYLES[28], // Corkboard Studio
      AESTHETIC_STYLES[30], // Apple Bento
      AESTHETIC_STYLES[40], // Instagram Carousel
      AESTHETIC_STYLES[43], // Cyberpunk Neon
      AESTHETIC_STYLES[44], // Pastel Marshmallow
      AESTHETIC_STYLES[90]  // Botanical Herbarium
    ];

    popularStyles.forEach(style => {
      const btn = document.createElement('button');
      btn.className = 'text-xs text-left px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 hover:border-indigo-500/50 transition-all truncate flex items-center justify-between group';
      btn.innerHTML = `<span class="truncate group-hover:text-indigo-400 font-medium">${style.name}</span><span class="text-[10px] text-zinc-500 font-mono ml-2">#${style.id}</span>`;
      btn.addEventListener('click', () => this.applyStyle(style));
      container.appendChild(btn);
    });
  }

  // --- High-Resolution Export Engine ---

  bindExportControls() {
    const exportOpenBtn = document.getElementById('exportOpenBtn');
    const exportModal = document.getElementById('exportModal');
    const closeExportBtn = document.getElementById('closeExportBtn');
    const downloadActionBtn = document.getElementById('downloadActionBtn');
    const copyClipboardBtn = document.getElementById('copyClipboardBtn');

    if (exportOpenBtn && exportModal) {
      exportOpenBtn.addEventListener('click', () => exportModal.classList.remove('hidden'));
    }

    if (closeExportBtn && exportModal) {
      closeExportBtn.addEventListener('click', () => exportModal.classList.add('hidden'));
    }

    if (downloadActionBtn) {
      downloadActionBtn.addEventListener('click', async () => {
        const scaleSelect = document.getElementById('exportScaleSelect');
        const formatSelect = document.getElementById('exportFormatSelect');

        const scale = scaleSelect ? parseInt(scaleSelect.value, 10) : 2;
        const format = formatSelect ? formatSelect.value : 'image/png';
        const ext = format === 'image/jpeg' ? 'jpg' : 'png';

        downloadActionBtn.disabled = true;
        downloadActionBtn.textContent = 'Rendering 4K Canvas...';

        try {
          const blob = await this.renderer.exportToBlob({
            photos: this.photos,
            cells: this.cells,
            style: this.currentStyle,
            width: this.canvasWidth,
            height: this.canvasHeight
          }, scale, format, 0.95);

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `aesthetic-collage-${Date.now()}.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          this.showToast('High-resolution export downloaded successfully!', 'success');
          exportModal.classList.add('hidden');
        } catch (err) {
          console.error(err);
          this.showToast('Export failed. Please check browser permissions.', 'error');
        } finally {
          downloadActionBtn.disabled = false;
          downloadActionBtn.textContent = 'Download High-Res Image';
        }
      });
    }

    if (copyClipboardBtn) {
      copyClipboardBtn.addEventListener('click', async () => {
        try {
          copyClipboardBtn.disabled = true;
          copyClipboardBtn.textContent = 'Copying to Clipboard...';

          const blob = await this.renderer.exportToBlob({
            photos: this.photos,
            cells: this.cells,
            style: this.currentStyle,
            width: this.canvasWidth,
            height: this.canvasHeight
          }, 2, 'image/png', 0.95);

          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);

          this.showToast('Copied to Clipboard!', 'success');
        } catch (err) {
          console.error(err);
          this.showToast('Could not copy to clipboard (Browser security restricted).', 'warning');
        } finally {
          copyClipboardBtn.disabled = false;
          copyClipboardBtn.textContent = 'Copy Image to Clipboard';
        }
      });
    }
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `fixed bottom-6 right-6 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold z-50 transition-all duration-300 transform translate-y-0 opacity-100 ${
      type === 'success' ? 'bg-emerald-600 text-white' :
      type === 'warning' ? 'bg-amber-600 text-white' :
      type === 'error' ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-white border border-zinc-700'
    }`;

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-4');
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new CollageStudioApp();
});
