/**
 * Paper Page — continuous-scroll PDF viewer.
 *
 * Differs from the resume viewer in two ways that matter: the paper is 16
 * pages rather than 1, and it is read rather than glanced at. So pages stack
 * in a scrolling column, and only the ones near the viewport hold a rendered
 * canvas — 16 letter-size canvases at retina density would cost hundreds of
 * megabytes and get evicted by mobile Safari mid-scroll.
 *
 * pdf.js is bundled rather than pulled from a CDN, matching the self-hosted
 * fonts. (resume.html still loads it from cdnjs.)
 */

import './style.css';
// The legacy build, not the modern one: pdf.js 5.x calls Math.sumPrecise, which
// only landed in Chrome 137 / Safari 18.4. On anything older the modern build
// throws mid-render, silently falls back to a substitute font, and drops every
// fi/ffi ligature in the paper. The legacy build ships the polyfills.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker';
import { initCursorAura } from './cursor-aura';
import { debounce } from './debounce';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, computeAvailableWidth, updateZoomDisplay, bindZoomKeys } from './pdf-viewer';

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

const PDF_URL = '/assets/global-pid-steering.pdf';

/** Pages this far (in page counts) outside the viewport keep their canvas. */
const RENDER_MARGIN = 1;
/** Cap the backing store so a zoomed-in page on a 3x display stays sane. */
const MAX_DPR = 2;

initCursorAura();

const viewport = document.getElementById('viewport') as HTMLElement;
const pageList = document.getElementById('pageList') as HTMLElement;
const loadingState = document.getElementById('loadingState') as HTMLElement;
const errorState = document.getElementById('errorState') as HTMLElement;
const zoomLevelDisplay = document.getElementById('zoomLevel') as HTMLElement;
const pageCounter = document.getElementById('pageCounter') as HTMLElement;
const zoomInBtn = document.getElementById('zoomInBtn') as HTMLButtonElement;
const zoomOutBtn = document.getElementById('zoomOutBtn') as HTMLButtonElement;

interface PageSlot {
  num: number;
  el: HTMLElement;
  canvas: HTMLCanvasElement;
  page: PDFPageProxy | null;
  task: RenderTask | null;
  /** Scale the current canvas contents were rendered at, or 0 if blank. */
  renderedAt: number;
}

let pdfDoc: PDFDocumentProxy | null = null;
let slots: PageSlot[] = [];
/** CSS-pixel scale that makes a page exactly fill the available width. */
let fitScale = 1;
/** User zoom, multiplied onto fitScale. 1.0 = fit to width. */
let zoom = 1;

const cssScale = () => fitScale * zoom;

async function init(): Promise<void> {
  try {
    pdfDoc = await pdfjsLib.getDocument(PDF_URL).promise;
    const first = await pdfDoc.getPage(1);
    computeFitScale(first);
    buildSlots(pdfDoc.numPages, first);

    loadingState.style.display = 'none';
    pageList.classList.add('is-visible');
    updateZoomDisplay(zoomLevelDisplay, zoom, zoomInBtn, zoomOutBtn);
    updatePageCounter();
    syncRenderWindow();
  } catch (error) {
    console.error('Error loading paper:', error);
    loadingState.style.display = 'none';
    errorState.style.display = 'flex';
  }
}

/** Width available to a page, minus the column padding in pid-steering.html. */
function availableWidth(): number {
  return computeAvailableWidth(viewport.clientWidth, 1100);
}

function computeFitScale(page: PDFPageProxy): void {
  const natural = page.getViewport({ scale: 1 });
  fitScale = availableWidth() / natural.width;
}

function buildSlots(numPages: number, first: PDFPageProxy): void {
  const natural = first.getViewport({ scale: 1 });
  const ratio = natural.height / natural.width;

  for (let num = 1; num <= numPages; num++) {
    const el = document.createElement('div');
    el.className =
      'pdf-page relative bg-white rounded border border-border ' +
      'shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden';
    el.dataset.page = String(num);

    const canvas = document.createElement('canvas');
    canvas.className = 'block w-full h-auto';
    // A fresh canvas defaults to a 300x150 backing store; zero it so an
    // unrendered page costs nothing until it scrolls into the window.
    canvas.width = 0;
    canvas.height = 0;
    el.appendChild(canvas);
    pageList.appendChild(el);

    slots.push({ num, el, canvas, page: num === 1 ? first : null, task: null, renderedAt: 0 });
  }

  // Placeholders need a height before anything is rendered, or every page
  // would sit at zero height and the whole document would count as "visible".
  applyPlaceholderSizes(ratio);
}

function applyPlaceholderSizes(ratio: number): void {
  const w = availableWidth() * zoom;
  slots.forEach((slot) => {
    slot.el.style.width = `${w}px`;
    if (!slot.renderedAt) slot.el.style.height = `${w * ratio}px`;
  });
}

async function renderSlot(slot: PageSlot): Promise<void> {
  if (!pdfDoc) return;
  const scale = cssScale();
  if (slot.renderedAt === scale) return;

  slot.task?.cancel();
  slot.task = null;

  if (!slot.page) slot.page = await pdfDoc.getPage(slot.num);

  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const view = slot.page.getViewport({ scale: scale * dpr });
  const ctx = slot.canvas.getContext('2d');
  if (!ctx) return;

  slot.canvas.width = view.width;
  slot.canvas.height = view.height;
  slot.el.style.width = `${view.width / dpr}px`;
  slot.el.style.height = `${view.height / dpr}px`;

  const task = slot.page.render({ canvas: slot.canvas, canvasContext: ctx, viewport: view });
  slot.task = task;

  try {
    await task.promise;
    slot.renderedAt = scale;
  } catch {
    // A cancelled render is the normal outcome of zooming or scrolling away.
    slot.renderedAt = 0;
  } finally {
    if (slot.task === task) slot.task = null;
  }
}

function releaseSlot(slot: PageSlot): void {
  if (!slot.renderedAt && !slot.task) return;
  slot.task?.cancel();
  slot.task = null;
  // Keep the box the same size so releasing a page never shifts the scroll
  // position of the pages below it.
  slot.el.style.height = `${slot.canvas.height / Math.min(window.devicePixelRatio || 1, MAX_DPR)}px`;
  slot.canvas.width = 0;
  slot.canvas.height = 0;
  slot.renderedAt = 0;
}

/** Which page occupies the middle of the viewport right now. */
function currentPageIndex(): number {
  const mid = viewport.scrollTop + viewport.clientHeight / 2;
  let best = 0;
  let bestDist = Infinity;
  slots.forEach((slot, i) => {
    const top = slot.el.offsetTop;
    const center = top + slot.el.offsetHeight / 2;
    const dist = Math.abs(center - mid);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return best;
}

function syncRenderWindow(): void {
  const center = currentPageIndex();
  slots.forEach((slot, i) => {
    if (Math.abs(i - center) <= RENDER_MARGIN) {
      void renderSlot(slot);
    } else {
      releaseSlot(slot);
    }
  });
}

function updatePageCounter(): void {
  if (!pdfDoc) return;
  pageCounter.textContent = `${currentPageIndex() + 1} / ${pdfDoc.numPages}`;
}

function setZoom(next: number): void {
  const clamped = Math.min(Math.max(next, MIN_ZOOM), MAX_ZOOM);
  if (clamped === zoom) return;

  // Keep the page you were reading under the cursor instead of jumping to the
  // top, which is what a naive re-render does.
  const anchor = currentPageIndex();
  const before = viewport.scrollTop - slots[anchor].el.offsetTop;
  const ratio = clamped / zoom;

  zoom = clamped;
  slots.forEach((slot) => {
    slot.renderedAt = 0;
  });
  updateZoomDisplay(zoomLevelDisplay, zoom, zoomInBtn, zoomOutBtn);
  syncRenderWindow();

  requestAnimationFrame(() => {
    viewport.scrollTop = slots[anchor].el.offsetTop + before * ratio;
  });
}

// rAF-throttled: scroll fires far more often than we need to re-evaluate.
let scrollQueued = false;
viewport.addEventListener(
  'scroll',
  () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      updatePageCounter();
      syncRenderWindow();
    });
  },
  { passive: true }
);

zoomInBtn.addEventListener('click', () => setZoom(zoom + ZOOM_STEP));
zoomOutBtn.addEventListener('click', () => setZoom(zoom - ZOOM_STEP));

bindZoomKeys(
  () => setZoom(zoom + ZOOM_STEP),
  () => setZoom(zoom - ZOOM_STEP),
);

window.addEventListener(
  'resize',
  debounce(async () => {
    if (!pdfDoc) return;
    const first = slots[0].page ?? (await pdfDoc.getPage(1));
    computeFitScale(first);
    slots.forEach((slot) => {
      slot.renderedAt = 0;
    });
    syncRenderWindow();
  }, 150),
);

init();
