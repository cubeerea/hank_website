/**
 * Resume Page — PDF Viewer with Zoom Controls
 */

import './style.css';

declare const pdfjsLib: {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(url: string): { promise: Promise<PDFDocument> };
};

interface PDFDocument {
  getPage(num: number): Promise<PDFPage>;
}

interface PDFPage {
  getViewport(params: { scale: number }): PDFViewport;
  render(params: { canvasContext: CanvasRenderingContext2D; viewport: PDFViewport }): { promise: Promise<void> };
}

interface PDFViewport {
  width: number;
  height: number;
}

// Cursor Aura
const aura = document.getElementById('cursor-aura');
if (aura) {
  window.addEventListener('mousemove', (e: MouseEvent) => {
    aura.style.setProperty('--x', `${e.clientX}px`);
    aura.style.setProperty('--y', `${e.clientY}px`);
  });
}

// PDF.js Configuration
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// State
let pdfDoc: PDFDocument | null = null;
/** CSS-pixel scale at which the page exactly fills the column. */
let fitScale = 1;
/** User zoom on top of the fit. 1.0 = fits the width. */
let zoom = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.25;
/** Don't blow the resume up past this on a wide monitor. */
const MAX_FIT_SCALE = 2.0;

// DOM Elements
const canvas = document.getElementById('pdfCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const loadingState = document.getElementById('loadingState')!;
const errorState = document.getElementById('errorState')!;
const canvasContainer = document.getElementById('canvasContainer')!;
const zoomLevelDisplay = document.getElementById('zoomLevel')!;

async function loadPDF(): Promise<void> {
  try {
    pdfDoc = await pdfjsLib.getDocument('/assets/hank_sha_resume.pdf').promise;
    loadingState.style.display = 'none';
    canvasContainer.classList.add('is-visible');
    await renderPage(true);
  } catch (error) {
    console.error('Error loading PDF:', error);
    loadingState.style.display = 'none';
    errorState.style.display = 'flex';
  }
}

/**
 * Width the page has to fill, minus the column padding in resume.html. Without
 * this the viewer opened at a fixed 200%, which on a phone meant landing on a
 * resume where not one full line was on screen.
 */
function computeFitScale(page: PDFPage): void {
  const gutter = window.innerWidth <= 480 ? 16 : 48;
  // 1224px is what the old fixed 200% produced for a letter page, so desktop
  // renders exactly as it did before; only narrow screens actually refit.
  const available = Math.min(canvasContainer.parentElement!.clientWidth - gutter, 1224);
  const natural = page.getViewport({ scale: 1 });
  fitScale = Math.min(available / natural.width, MAX_FIT_SCALE);
}

async function renderPage(refit = false): Promise<void> {
  if (!pdfDoc) return;

  const page = await pdfDoc.getPage(1);
  if (refit) computeFitScale(page);

  const dpr = window.devicePixelRatio || 1;
  const viewport = page.getViewport({ scale: fitScale * zoom * dpr });

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${viewport.width / dpr}px`;
  canvas.style.height = `${viewport.height / dpr}px`;

  await page.render({ canvasContext: ctx, viewport }).promise;
  updateZoomDisplay();
}

function updateZoomDisplay(): void {
  zoomLevelDisplay.textContent = `${Math.round(zoom * 100)}%`;
}

function zoomIn(): void {
  if (zoom < MAX_ZOOM) {
    zoom = Math.min(zoom + ZOOM_STEP, MAX_ZOOM);
    renderPage();
  }
}

function zoomOut(): void {
  if (zoom > MIN_ZOOM) {
    zoom = Math.max(zoom - ZOOM_STEP, MIN_ZOOM);
    renderPage();
  }
}

// Expose zoom functions for button onclick handlers
(window as unknown as Record<string, unknown>).zoomIn = zoomIn;
(window as unknown as Record<string, unknown>).zoomOut = zoomOut;

// Handle window resize
let resizeTimeout: ReturnType<typeof setTimeout>;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Refit on rotate/resize so the page keeps filling the new width.
    if (pdfDoc) renderPage(true);
  }, 150);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === '+' || e.key === '=') {
    e.preventDefault();
    zoomIn();
  } else if (e.key === '-') {
    e.preventDefault();
    zoomOut();
  }
});

loadPDF();
