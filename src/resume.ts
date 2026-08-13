/**
 * Resume Page — PDF Viewer with Zoom Controls
 */

import './style.css';
import { debounce } from './debounce';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, computeAvailableWidth, updateZoomDisplay, bindZoomKeys } from './pdf-viewer';

declare const pdfjsLib: {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(url: string): { promise: Promise<PDFDocument> };
};

interface PDFDocument {
  getPage(num: number): Promise<PDFPage>;
}

interface RenderTask {
  promise: Promise<void>;
  cancel(): void;
}

interface PDFPage {
  getViewport(params: { scale: number }): PDFViewport;
  render(params: { canvasContext: CanvasRenderingContext2D; viewport: PDFViewport }): RenderTask;
}

interface PDFViewport {
  width: number;
  height: number;
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
/** In-flight render, cancelled before a new one starts to avoid pdf.js
    rejecting concurrent render() calls on the same canvas. */
let renderTask: RenderTask | null = null;
/** Don't blow the resume up past this on a wide monitor. */
const MAX_FIT_SCALE = 2.0;

// DOM Elements
const canvas = document.getElementById('pdfCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const loadingState = document.getElementById('loadingState')!;
const errorState = document.getElementById('errorState')!;
const canvasContainer = document.getElementById('canvasContainer')!;
const zoomLevelDisplay = document.getElementById('zoomLevel')!;
const zoomInBtn = document.getElementById('zoomInBtn') as HTMLButtonElement;
const zoomOutBtn = document.getElementById('zoomOutBtn') as HTMLButtonElement;

async function loadPDF(): Promise<void> {
  try {
    pdfDoc = await pdfjsLib.getDocument('/assets/hank_sha_resume.pdf').promise;
    loadingState.style.display = 'none';
    canvasContainer.classList.add('is-visible');
    await renderPage(true);
    updateZoomDisplay(zoomLevelDisplay, zoom, zoomInBtn, zoomOutBtn);
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
  // 1224px is what the old fixed 200% produced for a letter page, so desktop
  // renders exactly as it did before; only narrow screens actually refit.
  const available = computeAvailableWidth(canvasContainer.parentElement!.clientWidth, 1224);
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

  renderTask?.cancel();
  const task = page.render({ canvasContext: ctx, viewport });
  renderTask = task;
  try {
    await task.promise;
  } catch {
    // A cancelled render is the normal outcome of rapid zoom clicks.
  } finally {
    if (renderTask === task) renderTask = null;
  }
}

function zoomIn(): void {
  if (zoom < MAX_ZOOM) {
    zoom = Math.min(zoom + ZOOM_STEP, MAX_ZOOM);
    updateZoomDisplay(zoomLevelDisplay, zoom, zoomInBtn, zoomOutBtn);
    renderPage();
  }
}

function zoomOut(): void {
  if (zoom > MIN_ZOOM) {
    zoom = Math.max(zoom - ZOOM_STEP, MIN_ZOOM);
    updateZoomDisplay(zoomLevelDisplay, zoom, zoomInBtn, zoomOutBtn);
    renderPage();
  }
}

zoomInBtn.addEventListener('click', zoomIn);
zoomOutBtn.addEventListener('click', zoomOut);

// Refit on rotate/resize so the page keeps filling the new width.
window.addEventListener(
  'resize',
  debounce(() => {
    if (pdfDoc) renderPage(true);
  }, 150),
);

bindZoomKeys(zoomIn, zoomOut);

loadPDF();
