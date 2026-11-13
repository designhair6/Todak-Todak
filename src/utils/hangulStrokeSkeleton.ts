export interface StrokePolyline {
  points: [number, number][];
}

export interface StrokeCircle {
  cx: number;
  cy: number;
  r: number;
}

export interface SyllableStrokeGeometry {
  strokes: StrokePolyline[];
  circles: StrokeCircle[];
}

const CHO_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

const JUNG_LIST = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ',
];

const JONG_LIST = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

const COMPOUND_JONG_SPLIT: Record<string, [string, string]> = {
  ㄳ: ['ㄱ', 'ㅅ'],
  ㄵ: ['ㄴ', 'ㅈ'],
  ㄶ: ['ㄴ', 'ㅎ'],
  ㄺ: ['ㄹ', 'ㄱ'],
  ㄻ: ['ㄹ', 'ㅁ'],
  ㄼ: ['ㄹ', 'ㅂ'],
  ㄽ: ['ㄹ', 'ㅅ'],
  ㄾ: ['ㄹ', 'ㅌ'],
  ㄿ: ['ㄹ', 'ㅍ'],
  ㅀ: ['ㄹ', 'ㅎ'],
  ㅄ: ['ㅂ', 'ㅅ'],
};

const VERTICAL_VOWELS = new Set(['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅣ']);
const HORIZONTAL_VOWELS = new Set(['ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ']);
const COMPOUND_VOWEL_PARTS: Record<string, [string, string]> = {
  ㅘ: ['ㅗ', 'ㅏ'],
  ㅙ: ['ㅗ', 'ㅐ'],
  ㅚ: ['ㅗ', 'ㅣ'],
  ㅝ: ['ㅜ', 'ㅓ'],
  ㅞ: ['ㅜ', 'ㅔ'],
  ㅟ: ['ㅜ', 'ㅣ'],
  ㅢ: ['ㅡ', 'ㅣ'],
};

function addConsonantStrokes(
  jamo: string,
  x: number,
  y: number,
  w: number,
  h: number,
  out: SyllableStrokeGeometry
): void {
  const x1 = x;
  const x2 = x + w;
  const xm = x + w / 2;
  const y1 = y;
  const y2 = y + h;
  const ym = y + h / 2;

  switch (jamo) {
    case 'ㄱ':
      out.strokes.push({ points: [[x1, y1], [x2, y1], [x2, y2]] });
      break;
    case 'ㄲ': {
      const gap = w * 0.14;
      const subW = (w - gap) / 2;
      addConsonantStrokes('ㄱ', x1, y1, subW, h, out);
      addConsonantStrokes('ㄱ', x1 + subW + gap, y1, subW, h, out);
      break;
    }
    case 'ㄴ':
      out.strokes.push({ points: [[x1, y1], [x1, y2], [x2, y2]] });
      break;
    case 'ㄷ':
      out.strokes.push({ points: [[x1, y1], [x2, y1]] });
      out.strokes.push({ points: [[x1, y1], [x1, y2], [x2, y2]] });
      break;
    case 'ㄸ': {
      const gap = w * 0.14;
      const subW = (w - gap) / 2;
      addConsonantStrokes('ㄷ', x1, y1, subW, h, out);
      addConsonantStrokes('ㄷ', x1 + subW + gap, y1, subW, h, out);
      break;
    }
    case 'ㄹ':
      out.strokes.push({ points: [[x1, y1], [x2, y1], [x2, ym]] });
      out.strokes.push({ points: [[x1, ym], [x2, ym]] });
      out.strokes.push({ points: [[x1, ym], [x1, y2], [x2, y2]] });
      break;
    case 'ㅁ':
      out.strokes.push({ points: [[x1, y1], [x1, y2]] });
      out.strokes.push({ points: [[x1, y1], [x2, y1], [x2, y2]] });
      out.strokes.push({ points: [[x1, y2], [x2, y2]] });
      break;
    case 'ㅂ':
      out.strokes.push({ points: [[x1, y1], [x1, y2]] });
      out.strokes.push({ points: [[x2, y1], [x2, y2]] });
      out.strokes.push({ points: [[x1, ym], [x2, ym]] });
      out.strokes.push({ points: [[x1, y2], [x2, y2]] });
      break;
    case 'ㅃ': {
      const gap = w * 0.14;
      const subW = (w - gap) / 2;
      addConsonantStrokes('ㅂ', x1, y1, subW, h, out);
      addConsonantStrokes('ㅂ', x1 + subW + gap, y1, subW, h, out);
      break;
    }
    case 'ㅅ':
      out.strokes.push({ points: [[xm, y1], [x1, y2]] });
      out.strokes.push({ points: [[xm, y1], [x2, y2]] });
      break;
    case 'ㅆ': {
      const gap = w * 0.12;
      const subW = (w - gap) / 2;
      addConsonantStrokes('ㅅ', x1, y1, subW, h, out);
      addConsonantStrokes('ㅅ', x1 + subW + gap, y1, subW, h, out);
      break;
    }
    case 'ㅇ':
      out.circles.push({ cx: xm, cy: ym, r: Math.min(w, h) * 0.45 });
      break;
    case 'ㅈ':
      out.strokes.push({ points: [[x1, y1], [x2, y1]] });
      out.strokes.push({ points: [[xm, y1], [x1, y2]] });
      out.strokes.push({ points: [[xm, y1], [x2, y2]] });
      break;
    case 'ㅉ': {
      const gap = w * 0.12;
      const subW = (w - gap) / 2;
      addConsonantStrokes('ㅈ', x1, y1, subW, h, out);
      addConsonantStrokes('ㅈ', x1 + subW + gap, y1, subW, h, out);
      break;
    }
    case 'ㅊ':
      out.strokes.push({ points: [[xm - w * 0.18, y1], [xm + w * 0.18, y1]] });
      out.strokes.push({ points: [[x1, y1 + h * 0.24], [x2, y1 + h * 0.24]] });
      out.strokes.push({ points: [[xm, y1 + h * 0.24], [x1, y2]] });
      out.strokes.push({ points: [[xm, y1 + h * 0.24], [x2, y2]] });
      break;
    case 'ㅋ':
      out.strokes.push({ points: [[x1, y1], [x2, y1], [x2, y2]] });
      out.strokes.push({ points: [[x1, ym], [x2, ym]] });
      break;
    case 'ㅌ':
      out.strokes.push({ points: [[x1, y1], [x2, y1]] });
      out.strokes.push({ points: [[x1, ym], [x2, ym]] });
      out.strokes.push({ points: [[x1, y1], [x1, y2], [x2, y2]] });
      break;
    case 'ㅍ':
      out.strokes.push({ points: [[x1, y1], [x2, y1]] });
      out.strokes.push({ points: [[x1 + w * 0.27, y1], [x1 + w * 0.27, y2]] });
      out.strokes.push({ points: [[x2 - w * 0.27, y1], [x2 - w * 0.27, y2]] });
      out.strokes.push({ points: [[x1, y2], [x2, y2]] });
      break;
    case 'ㅎ': {
      const cy = y1 + h * 0.67;
      const r = Math.min(w * 0.36, h * 0.29);
      out.strokes.push({ points: [[xm - w * 0.18, y1], [xm + w * 0.18, y1]] });
      out.strokes.push({ points: [[x1, y1 + h * 0.24], [x2, y1 + h * 0.24]] });
      out.circles.push({ cx: xm, cy, r });
      break;
    }
    default:
      break;
  }
}

function addVowelStrokes(
  jamo: string,
  x: number,
  y: number,
  w: number,
  h: number,
  out: SyllableStrokeGeometry
): void {
  const x1 = x;
  const x2 = x + w;
  const xm = x + w / 2;
  const y1 = y;
  const y2 = y + h;
  const ym = y + h / 2;

  switch (jamo) {
    case 'ㅣ':
      out.strokes.push({ points: [[xm, y1], [xm, y2]] });
      break;
    case 'ㅏ': {
      const vx = x1 + w * 0.22;
      out.strokes.push({ points: [[vx, y1], [vx, y2]] });
      out.strokes.push({ points: [[vx, ym], [x2, ym]] });
      break;
    }
    case 'ㅑ': {
      const vx = x1 + w * 0.22;
      out.strokes.push({ points: [[vx, y1], [vx, y2]] });
      out.strokes.push({ points: [[vx, ym - h * 0.17], [x2, ym - h * 0.17]] });
      out.strokes.push({ points: [[vx, ym + h * 0.17], [x2, ym + h * 0.17]] });
      break;
    }
    case 'ㅓ': {
      const vx = x2 - w * 0.22;
      out.strokes.push({ points: [[x1, ym], [vx, ym]] });
      out.strokes.push({ points: [[vx, y1], [vx, y2]] });
      break;
    }
    case 'ㅕ': {
      const vx = x2 - w * 0.22;
      out.strokes.push({ points: [[x1, ym - h * 0.17], [vx, ym - h * 0.17]] });
      out.strokes.push({ points: [[x1, ym + h * 0.17], [vx, ym + h * 0.17]] });
      out.strokes.push({ points: [[vx, y1], [vx, y2]] });
      break;
    }
    case 'ㅐ':
      out.strokes.push({ points: [[x1, y1], [x1, y2]] });
      out.strokes.push({ points: [[x1, ym], [x2, ym]] });
      out.strokes.push({ points: [[x2, y1], [x2, y2]] });
      break;
    case 'ㅒ':
      out.strokes.push({ points: [[x1, y1], [x1, y2]] });
      out.strokes.push({ points: [[x1, ym - h * 0.16], [x2, ym - h * 0.16]] });
      out.strokes.push({ points: [[x1, ym + h * 0.16], [x2, ym + h * 0.16]] });
      out.strokes.push({ points: [[x2, y1], [x2, y2]] });
      break;
    case 'ㅔ':
      out.strokes.push({ points: [[x1, ym], [xm, ym]] });
      out.strokes.push({ points: [[xm, y1], [xm, y2]] });
      out.strokes.push({ points: [[x2, y1], [x2, y2]] });
      break;
    case 'ㅖ':
      out.strokes.push({ points: [[x1, ym - h * 0.16], [xm, ym - h * 0.16]] });
      out.strokes.push({ points: [[x1, ym + h * 0.16], [xm, ym + h * 0.16]] });
      out.strokes.push({ points: [[xm, y1], [xm, y2]] });
      out.strokes.push({ points: [[x2, y1], [x2, y2]] });
      break;
    case 'ㅡ':
      out.strokes.push({ points: [[x1, ym], [x2, ym]] });
      break;
    case 'ㅗ': {
      const hy = y2 - h * 0.18;
      out.strokes.push({ points: [[xm, y1], [xm, hy]] });
      out.strokes.push({ points: [[x1, hy], [x2, hy]] });
      break;
    }
    case 'ㅛ': {
      const hy = y2 - h * 0.18;
      out.strokes.push({ points: [[xm - w * 0.18, y1], [xm - w * 0.18, hy]] });
      out.strokes.push({ points: [[xm + w * 0.18, y1], [xm + w * 0.18, hy]] });
      out.strokes.push({ points: [[x1, hy], [x2, hy]] });
      break;
    }
    case 'ㅜ': {
      const hy = y1 + h * 0.18;
      out.strokes.push({ points: [[x1, hy], [x2, hy]] });
      out.strokes.push({ points: [[xm, hy], [xm, y2]] });
      break;
    }
    case 'ㅠ': {
      const hy = y1 + h * 0.18;
      out.strokes.push({ points: [[x1, hy], [x2, hy]] });
      out.strokes.push({ points: [[xm - w * 0.18, hy], [xm - w * 0.18, y2]] });
      out.strokes.push({ points: [[xm + w * 0.18, hy], [xm + w * 0.18, y2]] });
      break;
    }
    default:
      break;
  }
}

/**
 * Computes clean single-centerline Hangul strokes for any modern Hangul syllable (가~힣)
 * inside a bounding rectangle (x, y, w, h). Returns null for non-Hangul characters.
 */
export function getHangulSyllableGeometry(
  char: string,
  x: number,
  y: number,
  w: number,
  h: number
): SyllableStrokeGeometry | null {
  if (!char) return null;
  const code = char.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return null;

  const idx = code - 0xac00;
  const choIdx = Math.floor(idx / (21 * 28));
  const jungIdx = Math.floor((idx % (21 * 28)) / 28);
  const jongIdx = idx % 28;

  const cho = CHO_LIST[choIdx];
  const jung = JUNG_LIST[jungIdx];
  const jong = JONG_LIST[jongIdx];

  const out: SyllableStrokeGeometry = { strokes: [], circles: [] };
  const hasJong = jong.length > 0;

  if (VERTICAL_VOWELS.has(jung)) {
    const bodyH = hasJong ? h * 0.56 : h;
    addConsonantStrokes(cho, x, y + bodyH * 0.06, w * 0.54, bodyH * 0.88, out);
    addVowelStrokes(jung, x + w * 0.64, y, w * 0.34, bodyH, out);
  } else if (HORIZONTAL_VOWELS.has(jung)) {
    const choH = hasJong ? h * 0.37 : h * 0.54;
    const jungY = hasJong ? y + h * 0.41 : y + h * 0.60;
    const jungH = hasJong ? h * 0.21 : h * 0.36;
    addConsonantStrokes(cho, x + w * 0.14, y, w * 0.72, choH, out);
    addVowelStrokes(jung, x + w * 0.02, jungY, w * 0.96, jungH, out);
  } else {
    // Mixed L-wrap vowel (ㅘ, ㅙ, ㅚ, ㅝ, ㅞ, ㅟ, ㅢ)
    const [hVowel, vVowel] = COMPOUND_VOWEL_PARTS[jung] || ['ㅗ', 'ㅏ'];
    const bodyH = hasJong ? h * 0.60 : h;
    addConsonantStrokes(cho, x + w * 0.03, y + bodyH * 0.03, w * 0.50, bodyH * 0.50, out);
    addVowelStrokes(hVowel, x, y + bodyH * 0.58, w * 0.60, bodyH * 0.36, out);
    addVowelStrokes(vVowel, x + w * 0.66, y, w * 0.32, bodyH, out);
  }

  if (hasJong) {
    const jy = y + h * 0.66;
    const jh = h * 0.34;
    const split = COMPOUND_JONG_SPLIT[jong];
    if (split) {
      const subW = w * 0.34;
      addConsonantStrokes(split[0], x + w * 0.10, jy, subW, jh, out);
      addConsonantStrokes(split[1], x + w * 0.56, jy, subW, jh, out);
    } else {
      addConsonantStrokes(jong, x + w * 0.16, jy, w * 0.68, jh, out);
    }
  }

  return out;
}

/**
 * Draws crisp, evenly spaced round circular dots along strokes and circles
 * with zero blurry double-contour blobs or dropped corners.
 */
export function drawCircularDottedGeometry(
  ctx: CanvasRenderingContext2D,
  geom: SyllableStrokeGeometry,
  options: {
    trackColor: string;
    trackWidth: number;
    dotColor: string;
    dotRadius: number;
    dotSpacing: number;
  }
): void {
  const { trackColor, trackWidth, dotColor, dotRadius, dotSpacing } = options;

  // 1. Soft pastel finger corridor (gives kids unmistakable full stroke silhouette)
  ctx.save();
  ctx.setLineDash([]);
  ctx.strokeStyle = trackColor;
  ctx.lineWidth = trackWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  geom.strokes.forEach((strk) => {
    if (strk.points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(strk.points[0][0], strk.points[0][1]);
    for (let i = 1; i < strk.points.length; i++) {
      ctx.lineTo(strk.points[i][0], strk.points[i][1]);
    }
    ctx.stroke();
  });

  geom.circles.forEach((c) => {
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();

  // 2. Bold, crisp evenly-spaced circular dots along every stroke centerline
  ctx.save();
  ctx.fillStyle = dotColor;

  const drawDot = (dx: number, dy: number) => {
    ctx.beginPath();
    ctx.arc(dx, dy, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  };

  geom.strokes.forEach((strk) => {
    const pts = strk.points;
    if (pts.length < 2) return;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const len = Math.hypot(bx - ax, by - ay);
      if (len < 0.5) continue;
      const steps = Math.max(1, Math.round(len / dotSpacing));
      const startIdx = i === 0 ? 0 : 1; // avoid double-drawing shared vertex
      for (let s = startIdx; s <= steps; s++) {
        const t = s / steps;
        drawDot(ax + (bx - ax) * t, ay + (by - ay) * t);
      }
    }
  });

  geom.circles.forEach((c) => {
    const circumference = 2 * Math.PI * c.r;
    const steps = Math.max(8, Math.round(circumference / dotSpacing));
    for (let s = 0; s < steps; s++) {
      const angle = (s / steps) * Math.PI * 2;
      drawDot(c.cx + Math.cos(angle) * c.r, c.cy + Math.sin(angle) * c.r);
    }
  });

  ctx.restore();
}
