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
let scale = 2.0;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const SCALE_STEP = 0.25;

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
    await renderPage();
  } catch (error) {
    console.error('Error loading PDF:', error);
    loadingState.style.display = 'none';
    errorState.style.display = 'flex';
  }
}

async function renderPage(): Promise<void> {
  if (!pdfDoc) return;

  const page = await pdfDoc.getPage(1);
  const viewport = page.getViewport({ scale: scale * window.devicePixelRatio });

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${viewport.width / window.devicePixelRatio}px`;
  canvas.style.height = `${viewport.height / window.devicePixelRatio}px`;

  await page.render({ canvasContext: ctx, viewport }).promise;
  updateZoomDisplay();
}

function updateZoomDisplay(): void {
  zoomLevelDisplay.textContent = `${Math.round(scale * 100)}%`;
}

function zoomIn(): void {
  if (scale < MAX_SCALE) {
    scale = Math.min(scale + SCALE_STEP, MAX_SCALE);
    renderPage();
  }
}

function zoomOut(): void {
  if (scale > MIN_SCALE) {
    scale = Math.max(scale - SCALE_STEP, MIN_SCALE);
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
    if (pdfDoc) renderPage();
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
