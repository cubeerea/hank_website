/**
 * Résumé viewer — one PDF page, fit to the column, with zoom.
 *
 * Shared by every /resume/<variant> page; the file it loads comes from the
 * page's own `data-pdf`, so adding a variant is a new HTML file and a
 * manifest entry, not a change here. See src/resume-variants.ts.
 *
 * pdf.js is bundled rather than pulled from cdnjs. The CDN copy was a
 * blocking <head> script, so on a network that blocks CDNs — a corporate
 * proxy, say, which is exactly where a recruiter opens this — the viewer
 * fell straight to its error state with nothing to explain why. It also
 * broke the site's own no-third-party-request rule, which the self-hosted
 * fonts and album art already keep.
 */

import './style.css';
// The legacy build, not the modern one: pdf.js 5.x calls Math.sumPrecise,
// which only landed in Chrome 137 / Safari 18.4. Same reasoning as
// pid-steering.ts, which already bundles it this way.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker';
import { debounce } from './debounce';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, computeAvailableWidth, updateZoomDisplay, bindZoomKeys } from './pdf-viewer';

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

// State
let pdfDoc: PDFDocumentProxy | null = null;
/** CSS-pixel scale at which the page exactly fills the column. */
let fitScale = 1;
/** User zoom on top of the fit. 1.0 = fits the width. */
let zoom = 1;
/** In-flight render, cancelled before a new one starts to avoid pdf.js
    rejecting concurrent render() calls on the same canvas. */
let renderTask: RenderTask | null = null;
/** Don't blow the résumé up past this on a wide monitor. */
const MAX_FIT_SCALE = 2.0;

// DOM
const canvas = document.getElementById('pdfCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const loadingState = document.getElementById('loadingState')!;
const errorState = document.getElementById('errorState')!;
const canvasContainer = document.getElementById('canvasContainer')!;
const zoomLevelDisplay = document.getElementById('zoomLevel')!;
const zoomInBtn = document.getElementById('zoomInBtn') as HTMLButtonElement;
const zoomOutBtn = document.getElementById('zoomOutBtn') as HTMLButtonElement;

const PDF_URL = document.body.dataset.pdf;

async function loadPDF(): Promise<void> {
  if (!PDF_URL) {
    // A viewer page with no data-pdf is a wiring mistake, not a user error.
    console.error('resume viewer: page is missing data-pdf');
    loadingState.classList.remove('is-shown');
    errorState.classList.add('is-shown');
    return;
  }

  try {
    pdfDoc = await pdfjsLib.getDocument(PDF_URL).promise;
    loadingState.classList.remove('is-shown');
    canvasContainer.classList.add('is-visible');
    await renderPage(true);
    updateZoomDisplay(zoomLevelDisplay, zoom, zoomInBtn, zoomOutBtn);
  } catch (error) {
    console.error('Error loading PDF:', error);
    loadingState.classList.remove('is-shown');
    errorState.classList.add('is-shown');
  }
}

/**
 * Width the page has to fill, minus the column padding. Without this the
 * viewer opened at a fixed 200%, which on a phone meant landing on a résumé
 * where not one full line was on screen.
 */
function computeFitScale(page: PDFPageProxy): void {
  // 1224px is what the old fixed 200% produced for a letter page, so desktop
  // renders as it did before; only narrow screens actually refit.
  const stage = canvasContainer.parentElement!;
  const available = computeAvailableWidth(stage.clientWidth, 1224);
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
  const task = page.render({ canvas, canvasContext: ctx, viewport });
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
