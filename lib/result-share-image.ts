export const RESULT_SHARE_IMAGE_WIDTH = 1080;
export const RESULT_SHARE_IMAGE_HEIGHT = 1350;

export interface ResultShareMetric {
  label: string;
  value: string;
  emphasis?: boolean;
}

export interface ResultShareImageSummary {
  toolName: string;
  resultLabel: string;
  primaryAmount: string;
  metrics: readonly [ResultShareMetric, ResultShareMetric, ResultShareMetric];
  methodTitle: string;
  methodDetail: string;
  noticeTitle: string;
  noticeDetail: string;
  actionLabel: string;
  scopeNote?: string;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + r, y, r);
  context.closePath();
}

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: string,
): void {
  roundedRect(context, x, y, width, height, radius);
  context.fillStyle = color;
  context.fill();
}

function fitText(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  startingSize: number,
  weight = 700,
  minimumSize = 20,
): void {
  let size = startingSize;
  while (size > minimumSize) {
    context.font = `${weight} ${size}px Kanit, sans-serif`;
    if (context.measureText(value).width <= maxWidth) break;
    size -= 2;
  }
  context.font = `${weight} ${Math.max(size, minimumSize)}px Kanit, sans-serif`;
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('ไม่สามารถโหลดองค์ประกอบของภาพสรุปได้'));
    image.src = source;
  });
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('ไม่สามารถสร้างไฟล์ภาพ PNG ได้')), 'image/png');
  });
}

export async function renderResultShareImage(
  summary: Readonly<ResultShareImageSummary>,
  logoPath: string,
  lineQrPath: string,
): Promise<Blob> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    throw new Error('การสร้างภาพสรุปทำได้เฉพาะในเบราว์เซอร์');
  }

  await document.fonts?.ready;
  const [logo, lineQr] = await Promise.all([loadImage(logoPath), loadImage(lineQrPath)]);
  const canvas = document.createElement('canvas');
  canvas.width = RESULT_SHARE_IMAGE_WIDTH;
  canvas.height = RESULT_SHARE_IMAGE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('เบราว์เซอร์นี้ไม่รองรับการสร้างภาพสรุป');

  const background = '#352727';
  const dark = '#2d2222';
  const panel = '#403030';
  const panelAlt = '#493b35';
  const ink = '#faf8f8';
  const muted = '#b8aaaa';
  const border = '#5b4848';
  const gold = '#dcc786';

  context.fillStyle = background;
  context.fillRect(0, 0, RESULT_SHARE_IMAGE_WIDTH, RESULT_SHARE_IMAGE_HEIGHT);
  context.fillStyle = dark;
  context.fillRect(0, 0, RESULT_SHARE_IMAGE_WIDTH, 174);
  context.fillStyle = gold;
  context.fillRect(0, 164, RESULT_SHARE_IMAGE_WIDTH, 10);
  context.drawImage(logo, 68, 48, 248, 72);
  context.fillStyle = muted;
  context.font = '500 24px Kanit, sans-serif';
  context.fillText(summary.toolName, 68, 145);

  context.fillStyle = ink;
  fitText(context, summary.resultLabel, 944, 42, 700, 28);
  context.fillText(summary.resultLabel, 68, 274);
  context.fillStyle = gold;
  fitText(context, summary.primaryAmount, 944, 82, 700, 48);
  context.fillText(summary.primaryAmount, 68, 382);

  summary.metrics.forEach((metric, index) => {
    const y = 438 + index * 116;
    fillRoundedRect(context, 68, y, 944, 94, 18, index === 2 ? panelAlt : panel);
    context.strokeStyle = border;
    context.lineWidth = 1;
    roundedRect(context, 68, y, 944, 94, 18);
    context.stroke();
    context.fillStyle = muted;
    fitText(context, metric.label, 610, 25, 500, 18);
    context.fillText(metric.label, 96, y + 38);
    context.fillStyle = metric.emphasis ? gold : ink;
    context.textAlign = 'right';
    fitText(context, metric.value, 350, 34, 700, 22);
    context.fillText(metric.value, 980, y + 65);
    context.textAlign = 'left';
  });

  fillRoundedRect(context, 68, 810, 944, 158, 22, panel);
  context.fillStyle = ink;
  fitText(context, summary.methodTitle, 872, 30, 700, 22);
  context.fillText(summary.methodTitle, 96, 862);
  context.fillStyle = muted;
  fitText(context, summary.methodDetail, 872, 24, 400, 17);
  context.fillText(summary.methodDetail, 96, 916);

  fillRoundedRect(context, 68, 1018, 944, 260, 22, dark);
  context.fillStyle = gold;
  fitText(context, summary.noticeTitle, 630, 25, 600, 18);
  context.fillText(summary.noticeTitle, 96, 1072);
  context.fillStyle = ink;
  fitText(context, summary.noticeDetail, 630, 23, 500, 17);
  context.fillText(summary.noticeDetail, 96, 1115);
  context.fillStyle = gold;
  fitText(context, summary.actionLabel, 630, 25, 600, 18);
  context.fillText(summary.actionLabel, 96, 1190);
  if (summary.scopeNote) {
    context.fillStyle = muted;
    fitText(context, summary.scopeNote, 630, 18, 400, 14);
    context.fillText(summary.scopeNote, 96, 1230);
  }
  context.drawImage(lineQr, 826, 1062, 144, 144);

  return canvasToPng(canvas);
}
