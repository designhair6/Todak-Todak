import React, { useRef, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Pencil,
  Eraser,
  RotateCcw,
  Sparkles,
  Volume2,
  Download,
  Share2,
  Trash2,
  Image as ImageIcon,
  Edit2,
  Check,
  X,
  MoreHorizontal,
  FolderInput,
} from 'lucide-react';
import { CRAYON_PALETTE, DOODLE_STAMPS, TRACING_ITEMS } from '../../data/hangulData';
import { SavedDoodle, TracingCategory, TracingItem } from '../../types';
import { playSfx, speakKorean } from '../../utils/sound';

interface DoodleBoardTabProps {
  onShareToCommunity: (doodleDataUrl: string, title: string) => void;
  onRewardExp: (amount: number) => void;
  childName: string;
}

export const DoodleBoardTab: React.FC<DoodleBoardTabProps> = ({
  onShareToCommunity,
  onRewardExp,
  childName,
}) => {
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'crayon' | 'rainbow' | 'eraser' | 'stamp'>('crayon');
  const [selectedColor, setSelectedColor] = useState(CRAYON_PALETTE[0].color);
  const [selectedStamp, setSelectedStamp] = useState(DOODLE_STAMPS[0]);
  const [brushSize, setBrushSize] = useState(16);
  const [rainbowHue, setRainbowHue] = useState(0);

  // Tracing vs Free mode
  const [mode, setMode] = useState<'tracing' | 'free'>('tracing');
  const effectiveChildName = childName || '시아';
  const [tracingCategory, setTracingCategory] = useState<TracingCategory>('name');
  const [currentTracing, setCurrentTracing] = useState<TracingItem>(() => ({
    id: 'child_name_tracing',
    category: 'name',
    label: effectiveChildName,
    soundText: `${effectiveChildName}! 멋진 내 이름!`,
    phonetic: effectiveChildName,
    meaning: '세상에서 가장 소중한 내 이름',
    emoji: '👧',
    strokesHint: '1번 칸부터 순서대로 이름을 써봐요!',
  }));
  const [customWordInput, setCustomWordInput] = useState('티라노');

  // Focus Play Routine Timer (5분, 10분, 20분, 30분 모래시계)
  const [timerMinutes, setTimerMinutes] = useState<number>(10);
  const [timerSeconds, setTimerSeconds] = useState(600); // default 10 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerCelebration, setTimerCelebration] = useState(false);

  const selectTimerPreset = (mins: number) => {
    playSfx('tap');
    setIsTimerRunning(false);
    setTimerMinutes(mins);
    setTimerSeconds(mins * 60);
    setTimerCelebration(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setTimerCelebration(true);
            playSfx('fan');
            confetti({ particleCount: 50, spread: 80 });
            speakKorean(`와아! ${childName}야 오늘 ${timerMinutes}분 한글놀이 성공했어! 정말 대단해!`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds, childName, timerMinutes]);

  // Gallery
  const [savedDoodles, setSavedDoodles] = useState<SavedDoodle[]>(() => {
    try {
      const data = localStorage.getItem('hangul_saved_doodles');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });
  const [showGallery, setShowGallery] = useState(true);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [editingDoodle, setEditingDoodle] = useState<{ id: string; title: string } | null>(null);
  const [deleteDoodleTarget, setDeleteDoodleTarget] = useState<SavedDoodle | null>(null);
  const [galleryMenuId, setGalleryMenuId] = useState<string | null>(null);
  const [brokenDoodleIds, setBrokenDoodleIds] = useState<Record<string, boolean>>({});

  const handleDeleteDoodle = (id: string) => {
    const updated = savedDoodles.filter((d) => d.id !== id);
    setSavedDoodles(updated);
    try {
      localStorage.setItem('hangul_saved_doodles', JSON.stringify(updated));
    } catch {}
    setDeleteDoodleTarget(null);
    setGalleryMenuId(null);
    playSfx('erase');
  };

  const handleSaveEditTitle = () => {
    if (!editingDoodle) return;
    const updated = savedDoodles.map((d) =>
      d.id === editingDoodle.id ? { ...d, title: editingDoodle.title.trim() || '한글 그림' } : d
    );
    setSavedDoodles(updated);
    try {
      localStorage.setItem('hangul_saved_doodles', JSON.stringify(updated));
    } catch {}
    setEditingDoodle(null);
    setGalleryMenuId(null);
    playSfx('pop');
  };

  const handleLoadOntoCanvas = (doodle: SavedDoodle) => {
    if (!doodle || !doodle.dataUrl) {
      playSfx('erase');
      setSaveNotice('불러올 그림 데이터가 비어 있어요.');
      setTimeout(() => setSaveNotice(null), 3000);
      return;
    }

    if (!drawCanvasRef.current) {
      setSaveNotice('도화지를 준비 중이에요. 잠시 후 다시 눌러주세요!');
      setTimeout(() => setSaveNotice(null), 2500);
      return;
    }

    if (drawCanvasRef.current.width === 0 || drawCanvasRef.current.height === 0) {
      setupCanvases();
    }

    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas || drawCanvas.width === 0 || drawCanvas.height === 0) return;

    const finalizeCanvasLoad = () => {
      saveHistoryState();
      playSfx('fan');
      confetti({ particleCount: 25, spread: 60 });
      setSaveNotice(`'${doodle.title}' 그림을 도화지로 불러왔어요! 🎨`);
      setTimeout(() => setSaveNotice(null), 3000);
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const rawData = doodle.dataUrl.trim();

    // Support optional JSON stroke data if stored in stroke format
    if (rawData.startsWith('[') || rawData.startsWith('{')) {
      try {
        const parsed = JSON.parse(rawData);
        const strokes = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.strokes) ? parsed.strokes : [];
        const ctx = drawCanvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;

        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

        strokes.forEach((stroke: { color?: string; width?: number; points?: Array<{ x: number; y: number } | [number, number]> }) => {
          const pts = stroke?.points;
          if (!Array.isArray(pts) || pts.length === 0) return;
          ctx.beginPath();
          ctx.strokeStyle = stroke.color || selectedColor;
          ctx.lineWidth = stroke.width || brushSize;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          pts.forEach((pt, idx) => {
            const px = Array.isArray(pt) ? pt[0] : pt.x;
            const py = Array.isArray(pt) ? pt[1] : pt.y;
            if (typeof px !== 'number' || typeof py !== 'number') return;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
        });
        ctx.restore();
        finalizeCanvasLoad();
        return;
      } catch {
        // Fall through to error handling below if malformed JSON
        playSfx('erase');
        setSaveNotice('저장된 그림 형식을 읽지 못했어요.');
        setTimeout(() => setSaveNotice(null), 3000);
        return;
      }
    }

    // Standard Base64 / Data URL image rendering with DPR-safe transform & aspect fit
    const img = new Image();
    img.onload = () => {
      const liveCanvas = drawCanvasRef.current;
      if (!liveCanvas || liveCanvas.width === 0 || liveCanvas.height === 0) return;
      const liveCtx = liveCanvas.getContext('2d');
      if (!liveCtx) return;

      const dpr = window.devicePixelRatio || 1;
      liveCtx.save();
      liveCtx.setTransform(1, 0, 0, 1, 0, 0);
      liveCtx.globalCompositeOperation = 'source-over';
      liveCtx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);

      const imgAspect =
        img.naturalWidth > 0 && img.naturalHeight > 0
          ? img.naturalWidth / img.naturalHeight
          : liveCanvas.width / liveCanvas.height;
      const canvasAspect = liveCanvas.width / liveCanvas.height;

      let drawW = liveCanvas.width;
      let drawH = liveCanvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (Math.abs(imgAspect - canvasAspect) > 0.02) {
        if (imgAspect > canvasAspect) {
          drawW = liveCanvas.width;
          drawH = liveCanvas.width / imgAspect;
          offsetY = (liveCanvas.height - drawH) / 2;
        } else {
          drawH = liveCanvas.height;
          drawW = liveCanvas.height * imgAspect;
          offsetX = (liveCanvas.width - drawW) / 2;
        }
        liveCtx.fillStyle = '#ffffff';
        liveCtx.fillRect(0, 0, liveCanvas.width, liveCanvas.height);
      }

      liveCtx.drawImage(img, offsetX, offsetY, drawW, drawH);
      liveCtx.restore();

      liveCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      liveCtx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';

      finalizeCanvasLoad();
    };
    img.onerror = () => {
      playSfx('erase');
      setSaveNotice('그림 이미지를 불러오지 못했어요. 다시 시도해주세요.');
      setTimeout(() => setSaveNotice(null), 3000);
    };
    img.src = rawData;
  };

  // Canvas history for undo (draw canvas only)
  const [history, setHistory] = useState<ImageData[]>([]);

  // Filter tracing items by category
  const filteredTracingItems = TRACING_ITEMS.filter((item) => item.category === tracingCategory);

  const drawBackgroundLayer = (bgCtx: CanvasRenderingContext2D, width: number, height: number) => {
    bgCtx.fillStyle = '#ffffff';
    bgCtx.fillRect(0, 0, width, height);

    if (mode === 'tracing' && currentTracing) {
      drawTracingGuide(bgCtx, width, height, currentTracing);
    } else {
      drawFreeGrid(bgCtx, width, height);
    }
  };

  // Initialize or resize both canvases
  useEffect(() => {
    setupCanvases();
  }, [mode, currentTracing]);

  // Redraw background guide cleanly when fonts finish loading or container resizes
  useEffect(() => {
    let cancelled = false;
    const redrawBgOnly = () => {
      if (cancelled) return;
      const bgCanvas = bgCanvasRef.current;
      const container = containerRef.current;
      if (!bgCanvas || !container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);
      if (Math.abs(bgCanvas.width - targetW) > 2 || Math.abs(bgCanvas.height - targetH) > 2) {
        setupCanvases();
        return;
      }
      const bgCtx = bgCanvas.getContext('2d');
      if (!bgCtx) return;
      bgCtx.resetTransform();
      bgCtx.scale(dpr, dpr);
      drawBackgroundLayer(bgCtx, rect.width, rect.height);
    };

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(redrawBgOnly).catch(() => {});
    }

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      redrawBgOnly();
    });
    ro.observe(container);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [mode, currentTracing]);

  const setupCanvases = () => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    const container = containerRef.current;
    if (!bgCanvas || !drawCanvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    // Set physical resolution
    bgCanvas.width = Math.round(width * dpr);
    bgCanvas.height = Math.round(height * dpr);
    drawCanvas.width = Math.round(width * dpr);
    drawCanvas.height = Math.round(height * dpr);

    // Scale contexts
    const bgCtx = bgCanvas.getContext('2d');
    const drawCtx = drawCanvas.getContext('2d');
    if (!bgCtx || !drawCtx) return;

    bgCtx.resetTransform();
    bgCtx.scale(dpr, dpr);
    drawCtx.resetTransform();
    drawCtx.scale(dpr, dpr);

    // Draw background layer
    drawBackgroundLayer(bgCtx, width, height);

    // Clear draw canvas (transparent)
    drawCtx.clearRect(0, 0, width, height);

    // Reset history with blank state
    const blank = drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
    setHistory([blank]);
  };



  // Draw numbered badge circle with text on the guideline canvas (Proportional, high-contrast, kid-friendly)
  const drawStrokeNumberBadge = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    num: string,
    arrow: string,
    radius: number = 13
  ) => {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 1.5;

    const r = radius;

    // Red-orange circular badge
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Number text
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(r * 0.96)}px 'Jua', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(num, x, y + 0.5);

    // Direction arrow in small attached indicator bubble
    if (arrow) {
      const ar = Math.max(8, Math.round(r * 0.68));
      const offset = r + ar + 2;
      let arrowX = x + offset;
      let arrowY = y;
      if (arrow === '↓') {
        arrowX = x;
        arrowY = y + offset;
      } else if (arrow === '↙') {
        arrowX = x - Math.round(offset * 0.72);
        arrowY = y + Math.round(offset * 0.72);
      } else if (arrow === '↘') {
        arrowX = x + Math.round(offset * 0.72);
        arrowY = y + Math.round(offset * 0.72);
      } else if (arrow === '⟲') {
        arrowX = x;
        arrowY = y + offset;
      }

      ctx.beginPath();
      ctx.arc(arrowX, arrowY, ar, 0, Math.PI * 2);
      ctx.fillStyle = '#fff1f2';
      ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = '#dc2626';
      ctx.stroke();

      ctx.fillStyle = '#dc2626';
      ctx.font = `bold ${Math.round(ar * 1.05)}px 'Jua', sans-serif`;
      ctx.fillText(arrow, arrowX, arrowY + 0.5);
    }
    ctx.restore();
  };

  // Single Letter Center-line Skeleton Definition (Real single lines, NO double-border maze)
  interface SkeletonStroke {
    points: [number, number][];
  }
  interface SkeletonCircle {
    cx: number;
    cy: number;
    r: number;
    badge?: { num: string; arrow: string };
  }
  interface LetterSkeleton {
    strokes: SkeletonStroke[];
    circles?: SkeletonCircle[];
    badges: { x: number; y: number; num: string; arrow: string }[];
  }

  const getLetterSkeleton = (
    label: string,
    cx: number,
    cy: number,
    size: number
  ): LetterSkeleton | null => {
    const w = size * 0.44;
    const h = size * 0.44;
    const x1 = cx - w;
    const x2 = cx + w;
    const y1 = cy - h;
    const y2 = cy + h;
    const xm = cx;
    const ym = cy;

    switch (label) {
      case 'ㄱ':
        return {
          strokes: [{ points: [[x1, y1], [x2, y1], [x2, y2]] }],
          badges: [
            { x: x1, y: y1, num: '1', arrow: '➔' },
            { x: x2, y: y1 + 4, num: '2', arrow: '↓' },
          ],
        };
      case 'ㄴ':
        return {
          strokes: [{ points: [[x1, y1], [x1, y2], [x2, y2]] }],
          badges: [
            { x: x1, y: y1, num: '1', arrow: '↓' },
            { x: x1 + 4, y: y2, num: '2', arrow: '➔' },
          ],
        };
      case 'ㄷ':
        return {
          strokes: [
            // 1획: 위 가로선 (왼쪽 -> 오른쪽)
            { points: [[x1, y1], [x2, y1]] },
            // 2획: 위 가로선의 왼쪽 끝 [x1, y1]에서 바로 연결되어 아래로 내려와 바닥 오른쪽으로 꺾임! (빈틈 없이 100% 붙어있는 완전한 디귿)
            { points: [[x1, y1], [x1, y2], [x2, y2]] },
          ],
          badges: [
            { x: x1, y: y1, num: '1', arrow: '➔' },
            { x: x1, y: y1 + (y2 - y1) * 0.42, num: '2', arrow: '↓' },
          ],
        };
      case 'ㄹ':
        return {
          strokes: [
            // 1획: 기역 모양 (위 가로 -> 가운데 높이까지 아래로 꺾임)
            { points: [[x1, y1], [x2, y1], [x2, ym]] },
            // 2획: 가운데 가로선 (왼쪽에서 오른쪽으로, 1획의 끝점 [x2, ym]과 완전히 만남)
            { points: [[x1, ym], [x2, ym]] },
            // 3획: 2획의 시작점 [x1, ym]에서 연결되어 아래로 내려와 바닥 오른쪽으로 꺾임
            { points: [[x1, ym], [x1, y2], [x2, y2]] },
          ],
          badges: [
            { x: x1, y: y1, num: '1', arrow: '➔' },
            { x: x1, y: ym, num: '2', arrow: '➔' },
            { x: x1, y: ym + (y2 - ym) * 0.45, num: '3', arrow: '↓' },
          ],
        };
      case 'ㅁ':
        return {
          strokes: [
            { points: [[x1, y1], [x1, y2]] },
            { points: [[x1, y1], [x2, y1], [x2, y2]] },
            { points: [[x1, y2], [x2, y2]] },
          ],
          badges: [
            { x: x1, y: y1, num: '1', arrow: '↓' },
            { x: x1 + 10, y: y1, num: '2', arrow: '⤷' },
            { x: x1 + 10, y: y2, num: '3', arrow: '➔' },
          ],
        };
      case 'ㅂ':
        return {
          strokes: [
            { points: [[x1, y1], [x1, y2]] },
            { points: [[x2, y1], [x2, y2]] },
            { points: [[x1, ym], [x2, ym]] },
            { points: [[x1, y2], [x2, y2]] },
          ],
          badges: [
            { x: x1, y: y1, num: '1', arrow: '↓' },
            { x: x2, y: y1, num: '2', arrow: '↓' },
            { x: x1 + 8, y: ym, num: '3', arrow: '➔' },
            { x: x1 + 8, y: y2, num: '4', arrow: '➔' },
          ],
        };
      case 'ㅅ':
        return {
          strokes: [
            // 1획: 꼭짓점에서 왼쪽 아래 다리
            { points: [[xm, y1], [x1, y2]] },
            // 2획: 꼭짓점에서 오른쪽 아래 다리 (꼭짓점 [xm, y1]에서 완전히 만나 텐트 완성)
            { points: [[xm, y1], [x2, y2]] },
          ],
          badges: [
            { x: xm - 10, y: y1 + (y2 - y1) * 0.15, num: '1', arrow: '↙' },
            { x: xm + 14, y: y1 + (y2 - y1) * 0.22, num: '2', arrow: '↘' },
          ],
        };
      case 'ㅇ':
        return {
          strokes: [],
          circles: [
            { cx: xm, cy: ym, r: w * 0.8, badge: { num: '1', arrow: '⟲' } },
          ],
          badges: [{ x: xm, y: ym - w * 0.8, num: '1', arrow: '⟲' }],
        };
      case 'ㅈ':
        return {
          strokes: [
            { points: [[x1, y1], [x2, y1]] },
            { points: [[xm, y1], [x1, y2]] },
            { points: [[xm, y1], [x2, y2]] },
          ],
          badges: [
            { x: x1, y: y1, num: '1', arrow: '➔' },
            { x: xm - 12, y: y1 + (y2 - y1) * 0.35, num: '2', arrow: '↙' },
            { x: xm + 12, y: y1 + (y2 - y1) * 0.35, num: '3', arrow: '↘' },
          ],
        };
      case 'ㅊ':
        return {
          strokes: [
            { points: [[xm - w * 0.25, y1 - h * 0.22], [xm + w * 0.25, y1 - h * 0.22]] },
            { points: [[x1, y1], [x2, y1]] },
            { points: [[xm, y1], [x1, y2]] },
            { points: [[xm, y1], [x2, y2]] },
          ],
          badges: [
            { x: xm - w * 0.25, y: y1 - h * 0.22, num: '1', arrow: '➔' },
            { x: x1, y: y1, num: '2', arrow: '➔' },
            { x: xm - 12, y: y1 + (y2 - y1) * 0.35, num: '3', arrow: '↙' },
            { x: xm + 12, y: y1 + (y2 - y1) * 0.35, num: '4', arrow: '↘' },
          ],
        };
      case 'ㅋ':
        return {
          strokes: [
            { points: [[x1, y1], [x2, y1], [x2, y2]] },
            { points: [[x1, ym], [x2, ym]] },
          ],
          badges: [
            { x: x1, y: y1, num: '1', arrow: '➔' },
            { x: x1, y: ym, num: '2', arrow: '➔' },
          ],
        };
      case 'ㅌ':
        return {
          strokes: [
            // 1획: 위 가로선
            { points: [[x1, y1], [x2, y1]] },
            // 2획: 가운데 가로선
            { points: [[x1, ym], [x2, ym]] },
            // 3획: 디귿처럼 위 가로선 [x1, y1]에서 시작하여 아래로 내려와 바닥으로 꺾임 (완전히 연결된 티읕)
            { points: [[x1, y1], [x1, y2], [x2, y2]] },
          ],
          badges: [
            { x: x1, y: y1, num: '1', arrow: '➔' },
            { x: x1, y: ym, num: '2', arrow: '➔' },
            { x: x1, y: ym + (y2 - ym) * 0.5, num: '3', arrow: '↓' },
          ],
        };
      case 'ㅍ':
        return {
          strokes: [
            { points: [[x1, y1], [x2, y1]] },
            { points: [[x1 + w * 0.55, y1], [x1 + w * 0.55, y2]] },
            { points: [[x2 - w * 0.55, y1], [x2 - w * 0.55, y2]] },
            { points: [[x1, y2], [x2, y2]] },
          ],
          badges: [
            { x: x1, y: y1, num: '1', arrow: '➔' },
            { x: x1 + w * 0.55, y: ym - h * 0.1, num: '2', arrow: '↓' },
            { x: x2 - w * 0.55, y: ym - h * 0.1, num: '3', arrow: '↓' },
            { x: x1, y: y2, num: '4', arrow: '➔' },
          ],
        };
      case 'ㅎ':
        return {
          strokes: [
            { points: [[xm - w * 0.28, y1 - h * 0.22], [xm + w * 0.28, y1 - h * 0.22]] },
            { points: [[x1, y1], [x2, y1]] },
          ],
          circles: [
            { cx: xm, cy: ym + h * 0.28, r: w * 0.56 },
          ],
          badges: [
            { x: xm - w * 0.28, y: y1 - h * 0.22, num: '1', arrow: '➔' },
            { x: x1, y: y1, num: '2', arrow: '➔' },
            { x: xm, y: ym - h * 0.02, num: '3', arrow: '⟲' },
          ],
        };
      case 'ㅏ':
        return {
          strokes: [
            { points: [[xm - w * 0.25, y1], [xm - w * 0.25, y2]] },
            { points: [[xm - w * 0.25, ym], [xm + w * 0.55, ym]] },
          ],
          badges: [
            { x: xm - w * 0.25, y: y1, num: '1', arrow: '↓' },
            { x: xm - w * 0.25 + 6, y: ym, num: '2', arrow: '➔' },
          ],
        };
      case 'ㅑ':
        return {
          strokes: [
            { points: [[xm - w * 0.25, y1], [xm - w * 0.25, y2]] },
            { points: [[xm - w * 0.25, ym - h * 0.25], [xm + w * 0.55, ym - h * 0.25]] },
            { points: [[xm - w * 0.25, ym + h * 0.25], [xm + w * 0.55, ym + h * 0.25]] },
          ],
          badges: [
            { x: xm - w * 0.25, y: y1, num: '1', arrow: '↓' },
            { x: xm - w * 0.25 + 6, y: ym - h * 0.25, num: '2', arrow: '➔' },
            { x: xm - w * 0.25 + 6, y: ym + h * 0.25, num: '3', arrow: '➔' },
          ],
        };
      case 'ㅓ':
        return {
          strokes: [
            { points: [[xm - w * 0.55, ym], [xm + w * 0.25, ym]] },
            { points: [[xm + w * 0.25, y1], [xm + w * 0.25, y2]] },
          ],
          badges: [
            { x: xm - w * 0.55, y: ym, num: '1', arrow: '➔' },
            { x: xm + w * 0.25, y: y1, num: '2', arrow: '↓' },
          ],
        };
      case 'ㅕ':
        return {
          strokes: [
            { points: [[xm - w * 0.55, ym - h * 0.25], [xm + w * 0.25, ym - h * 0.25]] },
            { points: [[xm - w * 0.55, ym + h * 0.25], [xm + w * 0.25, ym + h * 0.25]] },
            { points: [[xm + w * 0.25, y1], [xm + w * 0.25, y2]] },
          ],
          badges: [
            { x: xm - w * 0.55, y: ym - h * 0.25, num: '1', arrow: '➔' },
            { x: xm - w * 0.55, y: ym + h * 0.25, num: '2', arrow: '➔' },
            { x: xm + w * 0.25, y: y1, num: '3', arrow: '↓' },
          ],
        };
      case 'ㅗ':
        return {
          strokes: [
            { points: [[xm, ym - h * 0.55], [xm, ym + h * 0.2]] },
            { points: [[x1, ym + h * 0.2], [x2, ym + h * 0.2]] },
          ],
          badges: [
            { x: xm, y: ym - h * 0.55, num: '1', arrow: '↓' },
            { x: x1, y: ym + h * 0.2, num: '2', arrow: '➔' },
          ],
        };
      case 'ㅜ':
        return {
          strokes: [
            { points: [[x1, ym - h * 0.2], [x2, ym - h * 0.2]] },
            { points: [[xm, ym - h * 0.2], [xm, ym + h * 0.55]] },
          ],
          badges: [
            { x: x1, y: ym - h * 0.2, num: '1', arrow: '➔' },
            { x: xm, y: ym - h * 0.2 + 6, num: '2', arrow: '↓' },
          ],
        };
      case 'ㅡ':
        return {
          strokes: [{ points: [[x1, ym], [x2, ym]] }],
          badges: [{ x: x1, y: ym, num: '1', arrow: '➔' }],
        };
      case 'ㅣ':
        return {
          strokes: [{ points: [[xm, y1], [xm, y2]] }],
          badges: [{ x: xm, y: y1, num: '1', arrow: '↓' }],
        };
      case 'ㄲ': {
        const sw = w * 0.42;
        const leftCx = xm - sw * 1.1;
        const rightCx = xm + sw * 1.1;
        return {
          strokes: [
            { points: [[leftCx - sw, y1], [leftCx + sw, y1], [leftCx + sw, y2]] },
            { points: [[rightCx - sw, y1], [rightCx + sw, y1], [rightCx + sw, y2]] },
          ],
          badges: [
            { x: leftCx - sw, y: y1, num: '1', arrow: '➔' },
            { x: rightCx - sw, y: y1, num: '2', arrow: '➔' },
          ],
        };
      }
      case 'ㄸ': {
        const sw = w * 0.42;
        const leftCx = xm - sw * 1.1;
        const rightCx = xm + sw * 1.1;
        return {
          strokes: [
            { points: [[leftCx - sw, y1], [leftCx + sw, y1]] },
            { points: [[leftCx - sw, y1], [leftCx - sw, y2], [leftCx + sw, y2]] },
            { points: [[rightCx - sw, y1], [rightCx + sw, y1]] },
            { points: [[rightCx - sw, y1], [rightCx - sw, y2], [rightCx + sw, y2]] },
          ],
          badges: [
            { x: leftCx - sw, y: y1, num: '1', arrow: '➔' },
            { x: rightCx - sw, y: y1, num: '2', arrow: '➔' },
          ],
        };
      }
      case 'ㅃ': {
        const sw = w * 0.42;
        const leftCx = xm - sw * 1.1;
        const rightCx = xm + sw * 1.1;
        return {
          strokes: [
            { points: [[leftCx - sw, y1], [leftCx - sw, y2]] },
            { points: [[leftCx + sw, y1], [leftCx + sw, y2]] },
            { points: [[leftCx - sw, ym], [leftCx + sw, ym]] },
            { points: [[leftCx - sw, y2], [leftCx + sw, y2]] },
            { points: [[rightCx - sw, y1], [rightCx - sw, y2]] },
            { points: [[rightCx + sw, y1], [rightCx + sw, y2]] },
            { points: [[rightCx - sw, ym], [rightCx + sw, ym]] },
            { points: [[rightCx - sw, y2], [rightCx + sw, y2]] },
          ],
          badges: [
            { x: leftCx - sw, y: y1, num: '1', arrow: '↓' },
            { x: rightCx - sw, y: y1, num: '2', arrow: '↓' },
          ],
        };
      }
      case 'ㅆ': {
        const sw = w * 0.42;
        const leftCx = xm - sw * 1.1;
        const rightCx = xm + sw * 1.1;
        return {
          strokes: [
            { points: [[leftCx, y1], [leftCx - sw, y2]] },
            { points: [[leftCx, y1], [leftCx + sw, y2]] },
            { points: [[rightCx, y1], [rightCx - sw, y2]] },
            { points: [[rightCx, y1], [rightCx + sw, y2]] },
          ],
          badges: [
            { x: leftCx - 6, y: y1 + 4, num: '1', arrow: '↙' },
            { x: rightCx - 6, y: y1 + 4, num: '2', arrow: '↙' },
          ],
        };
      }
      case 'ㅉ': {
        const sw = w * 0.42;
        const leftCx = xm - sw * 1.1;
        const rightCx = xm + sw * 1.1;
        return {
          strokes: [
            { points: [[leftCx - sw, y1], [leftCx + sw, y1]] },
            { points: [[leftCx, y1], [leftCx - sw, y2]] },
            { points: [[leftCx, y1], [leftCx + sw, y2]] },
            { points: [[rightCx - sw, y1], [rightCx + sw, y1]] },
            { points: [[rightCx, y1], [rightCx - sw, y2]] },
            { points: [[rightCx, y1], [rightCx + sw, y2]] },
          ],
          badges: [
            { x: leftCx - sw, y: y1, num: '1', arrow: '➔' },
            { x: rightCx - sw, y: y1, num: '2', arrow: '➔' },
          ],
        };
      }
      case 'ㅐ':
        return {
          strokes: [
            { points: [[xm - w * 0.35, y1], [xm - w * 0.35, y2]] },
            { points: [[xm - w * 0.35, ym], [xm + w * 0.35, ym]] },
            { points: [[xm + w * 0.35, y1], [xm + w * 0.35, y2]] },
          ],
          badges: [
            { x: xm - w * 0.35, y: y1, num: '1', arrow: '↓' },
            { x: xm - w * 0.35 + 6, y: ym, num: '2', arrow: '➔' },
            { x: xm + w * 0.35, y: y1, num: '3', arrow: '↓' },
          ],
        };
      case 'ㅔ':
        return {
          strokes: [
            { points: [[xm - w * 0.45, ym], [xm - w * 0.05, ym]] },
            { points: [[xm - w * 0.05, y1], [xm - w * 0.05, y2]] },
            { points: [[xm + w * 0.45, y1], [xm + w * 0.45, y2]] },
          ],
          badges: [
            { x: xm - w * 0.45, y: ym, num: '1', arrow: '➔' },
            { x: xm - w * 0.05, y: y1, num: '2', arrow: '↓' },
            { x: xm + w * 0.45, y: y1, num: '3', arrow: '↓' },
          ],
        };
      case 'ㅘ':
        return {
          strokes: [
            { points: [[xm - w * 0.35, ym - h * 0.5], [xm - w * 0.35, ym + h * 0.15]] },
            { points: [[x1, ym + h * 0.15], [xm + w * 0.1, ym + h * 0.15]] },
            { points: [[xm + w * 0.4, y1], [xm + w * 0.4, y2]] },
            { points: [[xm + w * 0.4, ym], [xm + w * 0.85, ym]] },
          ],
          badges: [
            { x: xm - w * 0.35, y: ym - h * 0.5, num: '1', arrow: '↓' },
            { x: x1, y: ym + h * 0.15, num: '2', arrow: '➔' },
            { x: xm + w * 0.4, y: y1, num: '3', arrow: '↓' },
          ],
        };
      case 'ㅝ':
        return {
          strokes: [
            { points: [[x1, ym - h * 0.15], [xm + w * 0.1, ym - h * 0.15]] },
            { points: [[xm - w * 0.35, ym - h * 0.15], [xm - w * 0.35, ym + h * 0.5]] },
            { points: [[xm + w * 0.05, ym], [xm + w * 0.4, ym]] },
            { points: [[xm + w * 0.4, y1], [xm + w * 0.4, y2]] },
          ],
          badges: [
            { x: x1, y: ym - h * 0.15, num: '1', arrow: '➔' },
            { x: xm - w * 0.35, y: ym - h * 0.15 + 6, num: '2', arrow: '↓' },
            { x: xm + w * 0.05, y: ym, num: '3', arrow: '➔' },
            { x: xm + w * 0.4, y: y1, num: '4', arrow: '↓' },
          ],
        };
      case 'ㅟ':
        return {
          strokes: [
            { points: [[x1, ym - h * 0.15], [xm + w * 0.1, ym - h * 0.15]] },
            { points: [[xm - w * 0.35, ym - h * 0.15], [xm - w * 0.35, ym + h * 0.5]] },
            { points: [[xm + w * 0.4, y1], [xm + w * 0.4, y2]] },
          ],
          badges: [
            { x: x1, y: ym - h * 0.15, num: '1', arrow: '➔' },
            { x: xm - w * 0.35, y: ym - h * 0.15 + 6, num: '2', arrow: '↓' },
            { x: xm + w * 0.4, y: y1, num: '3', arrow: '↓' },
          ],
        };
      case 'ㅢ':
        return {
          strokes: [
            { points: [[x1, ym + h * 0.15], [xm + w * 0.15, ym + h * 0.15]] },
            { points: [[xm + w * 0.45, y1], [xm + w * 0.45, y2]] },
          ],
          badges: [
            { x: x1, y: ym + h * 0.15, num: '1', arrow: '➔' },
            { x: xm + w * 0.45, y: y1, num: '2', arrow: '↓' },
          ],
        };
      case 'ㅚ':
        return {
          strokes: [
            { points: [[xm - w * 0.3, ym - h * 0.5], [xm - w * 0.3, ym + h * 0.15]] },
            { points: [[x1, ym + h * 0.15], [xm + w * 0.12, ym + h * 0.15]] },
            { points: [[xm + w * 0.42, y1], [xm + w * 0.42, y2]] },
          ],
          badges: [
            { x: xm - w * 0.3, y: ym - h * 0.5, num: '1', arrow: '↓' },
            { x: x1, y: ym + h * 0.15, num: '2', arrow: '➔' },
            { x: xm + w * 0.42, y: y1, num: '3', arrow: '↓' },
          ],
        };
      default:
        return null;
    }
  };

  // Draw clean rounded manuscript card helper
  const drawManuscriptCard = (
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    boxSize: number
  ) => {
    const radius = Math.min(22, Math.max(12, boxSize * 0.08));
    ctx.save();
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(bx, by, boxSize, boxSize, radius);
    } else {
      ctx.rect(bx, by, boxSize, boxSize);
    }
    ctx.fillStyle = '#fffcf8';
    ctx.fill();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#ead9c6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Delicate pastel dashed crosshairs inside card
    const inset = Math.max(12, boxSize * 0.07);
    const cx = bx + boxSize / 2;
    const cy = by + boxSize / 2;
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = '#efe2d3';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(cx, by + inset);
    ctx.lineTo(cx, by + boxSize - inset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + inset, cy);
    ctx.lineTo(bx + boxSize - inset, cy);
    ctx.stroke();
    ctx.restore();
  };

  // Draw background cross line and letter guide (Layer 1) - High-readability kid-friendly workbook style
  const drawTracingGuide = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    item: TracingItem
  ) => {
    ctx.save();

    const outerPad = Math.max(10, Math.round(Math.min(width, height) * 0.032));
    const maxSquare = Math.min(width - outerPad * 2, height - outerPad * 2, 480);
    const skeleton =
      item.label.length === 1
        ? getLetterSkeleton(item.label, width / 2, height / 2, maxSquare * 0.68)
        : null;

    if (skeleton) {
      // 1. Single Letter Skeleton Mode: Spacious manuscript card + wide finger track + crisp round dots
      const boxSize = maxSquare;
      const bx = (width - boxSize) / 2;
      const by = (height - boxSize) / 2;

      drawManuscriptCard(ctx, bx, by, boxSize);

      // Pass A: Soft pastel finger corridor (generous width for tiny fingers)
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(244, 162, 97, 0.22)';
      ctx.lineWidth = Math.max(28, Math.min(42, boxSize * 0.125));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      skeleton.strokes.forEach((strk) => {
        if (strk.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(strk.points[0][0], strk.points[0][1]);
        for (let i = 1; i < strk.points.length; i++) {
          ctx.lineTo(strk.points[i][0], strk.points[i][1]);
        }
        ctx.stroke();
      });

      if (skeleton.circles) {
        skeleton.circles.forEach((c) => {
          ctx.beginPath();
          ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
          ctx.stroke();
        });
      }

      // Pass B: Crisp, well-spaced circular dots along stroke centerline
      const dotGap = Math.max(14, Math.round(boxSize * 0.056));
      ctx.setLineDash([0.6, dotGap]);
      ctx.strokeStyle = '#c9502f';
      ctx.lineWidth = Math.max(5, Math.min(7, boxSize * 0.02));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      skeleton.strokes.forEach((strk) => {
        if (strk.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(strk.points[0][0], strk.points[0][1]);
        for (let i = 1; i < strk.points.length; i++) {
          ctx.lineTo(strk.points[i][0], strk.points[i][1]);
        }
        ctx.stroke();
      });

      if (skeleton.circles) {
        skeleton.circles.forEach((c) => {
          ctx.beginPath();
          ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
          ctx.stroke();
        });
      }

      // Pass C: Numbered stroke badges scaled safely inside card bounds
      const badgeRadius = Math.max(11, Math.min(14, Math.round(boxSize * 0.044)));
      skeleton.badges.forEach((b) => {
        drawStrokeNumberBadge(ctx, b.x, b.y, b.num, b.arrow, badgeRadius);
      });
    } else if (item.label.length >= 2) {
      // 2. Multi-character Word Mode (e.g. "시아", "나비", "호랑이", "토마토")
      const chars = Array.from(item.label);
      const count = chars.length;
      const sidePad = Math.max(10, Math.round(width * 0.03));
      const vertPad = Math.max(12, Math.round(height * 0.035));
      const cols = count >= 5 ? 3 : 2;
      const rows = Math.ceil(count / cols);
      const gap = count === 2 ? 12 : 10;

      const maxBoxW = (width - sidePad * 2 - (cols - 1) * gap) / cols;
      const maxBoxH = (height - vertPad * 2 - (rows - 1) * gap) / rows;
      const boxSize = Math.min(maxBoxW, maxBoxH, count === 2 ? 236 : count <= 4 ? 196 : 145);

      const gridTotalH = rows * boxSize + (rows - 1) * gap;
      const gridStartY = (height - gridTotalH) / 2;

      chars.forEach((char, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const itemsInThisRow = row === rows - 1 && count % cols !== 0 ? count % cols : cols;
        const rowW = itemsInThisRow * boxSize + (itemsInThisRow - 1) * gap;
        const rowStartX = (width - rowW) / 2;

        const bx = rowStartX + col * (boxSize + gap);
        const by = gridStartY + row * (boxSize + gap);
        const charCx = bx + boxSize / 2;
        const charCy = by + boxSize / 2;

        drawManuscriptCard(ctx, bx, by, boxSize);

        // Rounded, uniform-stroke kid workbook font ('Jua') so every jamo & batchim is razor-sharp
        const charFontSize = Math.round(boxSize * 0.64);
        ctx.font = `400 ${charFontSize}px 'Jua', 'Pretendard', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const glyphY = charCy + boxSize * 0.045;

        // 1. Clear warm-terracotta workbook base silhouette (instantly readable at a glance)
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(198, 118, 86, 0.27)';
        ctx.fillText(char, charCx, glyphY);

        // 2. Clean, evenly dashed tracing contour (zero blurry dot blobs!)
        const dashLen = Math.max(4, Number((boxSize * 0.032).toFixed(1)));
        ctx.setLineDash([dashLen, dashLen]);
        ctx.strokeStyle = 'rgba(186, 78, 46, 0.68)';
        ctx.lineWidth = Math.max(1.4, Math.min(2.2, boxSize * 0.011));
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeText(char, charCx, glyphY);

        // Compact top-left order badge tucked neatly away from character strokes
        ctx.save();
        const r = Math.min(11, Math.max(9, Math.round(boxSize * 0.068)));
        const badgeX = bx + r + 5;
        const badgeY = by + r + 5;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, r, 0, Math.PI * 2);
        ctx.fillStyle = '#e76f51';
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(r * 1.1)}px 'Jua', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(idx + 1), badgeX, badgeY + 0.5);
        ctx.restore();
      });
    } else {
      // 3. Single syllable with batchim / fallback character (e.g. '곰', '꿈')
      const boxSize = maxSquare;
      const bx = (width - boxSize) / 2;
      const by = (height - boxSize) / 2;

      drawManuscriptCard(ctx, bx, by, boxSize);

      const fontSize = Math.round(boxSize * 0.68);
      ctx.font = `400 ${fontSize}px 'Jua', 'Pretendard', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const glyphY = height / 2 + boxSize * 0.035;

      // Clear warm-terracotta base fill
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(198, 118, 86, 0.27)';
      ctx.fillText(item.label, width / 2, glyphY);

      // Clean dashed guide border
      const dashLen = Math.max(6, Number((boxSize * 0.03).toFixed(1)));
      ctx.setLineDash([dashLen, dashLen]);
      ctx.strokeStyle = 'rgba(186, 78, 46, 0.68)';
      ctx.lineWidth = Math.max(1.8, Math.min(2.6, boxSize * 0.009));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeText(item.label, width / 2, glyphY);

      drawStrokeNumberBadge(ctx, bx + 22, by + 22, '1', '➔', 12);
    }

    ctx.restore();
  };

  const drawFreeGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    // Warm doodle paper background with cute dotted border
    ctx.strokeStyle = '#f4ede2';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (let y = 40; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(15, y);
      ctx.lineTo(width - 15, y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const saveHistoryState = () => {
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
    setHistory((prev) => [...prev.slice(-12), imgData]);
  };

  const undoLastStroke = () => {
    if (history.length <= 1) return;
    playSfx('erase');
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;

    const newHistory = history.slice(0, -1);
    const prevState = newHistory[newHistory.length - 1];
    ctx.putImageData(prevState, 0, 0);
    setHistory(newHistory);
  };

  // Clear ONLY user's drawing layer, keeping guideline background untouched!
  const clearDrawLayer = () => {
    playSfx('erase');
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    const blank = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
    setHistory([blank]);
  };

  // Drawing event handlers
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return { x: 0, y: 0 };
    const rect = drawCanvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);

    if (tool === 'stamp') {
      stampOnCanvas(x, y);
      return;
    }

    setIsDrawing(true);
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;

    // KEY FIX: If eraser, use 'destination-out' to clear user strokes without erasing background guide!
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2.5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = brushSize;
      if (tool === 'rainbow') {
        ctx.strokeStyle = `hsl(${rainbowHue}, 90%, 50%)`;
      } else {
        ctx.strokeStyle = selectedColor;
      }
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool === 'stamp') return;
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'rainbow') {
      ctx.strokeStyle = `hsl(${rainbowHue}, 90%, 50%)`;
      setRainbowHue((prev) => (prev + 6) % 360);
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistoryState();
      playSfx('draw');
    }
  };

  const stampOnCanvas = (x: number, y: number) => {
    playSfx('pop');
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.font = `${brushSize * 2.8}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(selectedStamp, x, y);
    ctx.restore();

    saveHistoryState();
  };

  // Merge background + drawing layers into single exportable image
  const getMergedDataUrl = (): string => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!bgCanvas || !drawCanvas) return '';

    const offscreen = document.createElement('canvas');
    offscreen.width = bgCanvas.width;
    offscreen.height = bgCanvas.height;
    const oCtx = offscreen.getContext('2d');
    if (!oCtx) return '';

    // Draw background then drawing layer
    oCtx.drawImage(bgCanvas, 0, 0);
    oCtx.drawImage(drawCanvas, 0, 0);
    return offscreen.toDataURL('image/png');
  };

  // Save drawing to local child gallery & Trigger actual device PNG download
  const saveToGallery = () => {
    const dataUrl = getMergedDataUrl();
    if (!dataUrl) return;

    playSfx('fan');
    confetti({ particleCount: 35, spread: 65 });
    onRewardExp(5); // Pet reward!

    const fileName = `${childName || '우리_아이'}_한글놀이_${Date.now()}.png`;

    // 1) Actual Mobile & PC Gallery File Download
    try {
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn('Device download triggered via dataUrl:', err);
    }

    // 2) Save in-app collection
    const newDoodle: SavedDoodle = {
      id: 'doodle-' + Date.now(),
      title:
        mode === 'tracing'
          ? `${currentTracing.label} 따라쓰기`
          : `${childName || '아이'}의 자유 낙서`,
      dataUrl,
      createdAt: Date.now(),
      author: childName || '우리 아이',
    };

    const updated = [newDoodle, ...savedDoodles];
    setSavedDoodles(updated);
    try {
      localStorage.setItem('hangul_saved_doodles', JSON.stringify(updated));
    } catch {}

    setSaveNotice(`🎉 '${newDoodle.title}'이 기기 사진첩과 앱 내 갤러리에 저장되었습니다! (EXP +5 획득 ✨)`);
    setTimeout(() => {
      setSaveNotice(null);
    }, 4000);
  };

  // Share to community
  const handleShare = () => {
    const dataUrl = getMergedDataUrl();
    if (!dataUrl) return;

    playSfx('pop');
    onRewardExp(5); // Pet reward!
    const title =
      mode === 'tracing'
        ? `[따라쓰기] 우리 아이가 그린 "${currentTracing.label}" 자랑해요!`
        : `[자유낙서] 아이가 직접 그린 알록달록 그림이에요!`;
    onShareToCommunity(dataUrl, title);
  };

  return (
    <div className="w-full max-w-md mx-auto px-3 sm:px-4 pt-4 pb-8 space-y-4 box-border overflow-x-hidden">
      {/* Save Notification Toast */}
      {saveNotice && (
        <div className="p-3 rounded-2xl bg-[#f0f9ed] border-2 border-[#a3e635] text-[#1e6a34] font-jua text-xs sm:text-sm flex items-center justify-between shadow-md animate-pop">
          <div className="flex items-center gap-2">
            <span className="text-base">📸</span>
            <span>{saveNotice}</span>
          </div>
          <button
            onClick={() => setSaveNotice(null)}
            className="text-xs text-[#237d3d] hover:font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fdf3e4] border border-[#f3dfc6] text-xs font-bold text-[#c9502f] font-jua">
          <Sparkles className="w-3.5 h-3.5" />
          손가락으로 쓱쓱! 낙서보드
        </div>
        <h1 className="text-xl sm:text-2xl font-jua text-[#1b1917] break-keep">
          그려보고, 따라 쓰고, 자랑해요!
        </h1>
        <p className="text-xs text-[#8a8178] font-hand break-keep">
          지우개로 지워도 글자 점선은 지워지지 않아요
        </p>
      </div>

      {/* Focus Play Routine Timer with 5/10/20/30 Preset Buttons */}
      <div className="w-full max-w-full box-border overflow-hidden bg-gradient-to-r from-[#fff7ed] to-[#fef3c7] p-3.5 rounded-3xl border border-[#fed7aa] shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">⏳</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-jua text-xs sm:text-sm text-[#9a3412]">
                <span>모래시계</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white text-[#ea580c] font-bold whitespace-nowrap">
                  {timerMinutes}분
                </span>
              </div>
              <p className="text-[11px] text-[#78350f] font-hand break-keep">
                집중 시간을 골라보세요
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-jua text-base sm:text-lg text-[#c2410c] px-3 py-1 bg-white rounded-xl border border-[#fed7aa] shadow-2xs font-mono">
              {Math.floor(timerSeconds / 60)}:
              {(timerSeconds % 60).toString().padStart(2, '0')}
            </span>
            <button
              onClick={() => {
                playSfx('tap');
                setIsTimerRunning(!isTimerRunning);
              }}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl font-jua text-xs shadow-xs transition-all active:scale-95 whitespace-nowrap ${
                isTimerRunning
                  ? 'bg-[#ea580c] text-white hover:bg-[#c2410c]'
                  : 'bg-white text-[#ea580c] border border-[#fed7aa] hover:bg-[#fff7ed]'
              }`}
            >
              {isTimerRunning ? '일시정지 ⏸️' : '시작 ▶️'}
            </button>
          </div>
        </div>

        {/* 5, 10, 20, 30 min Presets */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-[#fed7aa]/60">
          <span className="text-[11px] font-jua text-[#9a3412] flex-none">시간:</span>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {[5, 10, 20, 30].map((mins) => (
              <button
                key={mins}
                onClick={() => selectTimerPreset(mins)}
                className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-jua transition-all active:scale-95 ${
                  timerMinutes === mins
                    ? 'bg-[#c9502f] text-white shadow-2xs'
                    : 'bg-white/85 text-[#78350f] hover:bg-white border border-[#fed7aa]'
                }`}
              >
                {mins}분
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mode Switcher: 한글 따라쓰기 vs 자유 낙서장 */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#f0ebe1] rounded-2xl">
        <button
          onClick={() => {
            playSfx('tap');
            setMode('tracing');
          }}
          className={`py-2 px-3 rounded-xl font-jua text-sm transition-all flex items-center justify-center gap-1.5 ${
            mode === 'tracing'
              ? 'bg-white text-[#c9502f] shadow-xs'
              : 'text-[#8a8178] hover:text-[#1b1917]'
          }`}
        >
          <Pencil className="w-4 h-4" />
          한글 따라쓰기
        </button>
        <button
          onClick={() => {
            playSfx('tap');
            setMode('free');
          }}
          className={`py-2 px-3 rounded-xl font-jua text-sm transition-all flex items-center justify-center gap-1.5 ${
            mode === 'free'
              ? 'bg-white text-[#c9502f] shadow-xs'
              : 'text-[#8a8178] hover:text-[#1b1917]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          자유 도화지
        </button>
      </div>

      {/* If Tracing mode: Streamlined, kid-friendly category tabs */}
      {mode === 'tracing' && (
        <div className="w-full max-w-full box-border overflow-hidden bg-white p-3 sm:p-3.5 rounded-3xl border border-[#e4dccf] shadow-xs space-y-2.5">
          {/* Streamlined Category Filter Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'name', label: `👧 내 이름 (${effectiveChildName})`, emoji: '✨' },
              { id: 'consonant', label: '자음 (14자)', emoji: '🔤' },
              { id: 'vowel', label: '모음 (10자)', emoji: '🅰️' },
              { id: 'double', label: '쌍자음 (5자)', emoji: '🪶' },
              { id: 'animal', label: '동물 낱말', emoji: '🦁' },
              { id: 'food', label: '과일·음식', emoji: '🍎' },
              { id: 'custom', label: '직접 입력', emoji: '✏️' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  playSfx('tap');
                  setTracingCategory(cat.id as TracingCategory);
                  if (cat.id === 'name') {
                    setCurrentTracing({
                      id: 'child_name_tracing',
                      category: 'name',
                      label: effectiveChildName,
                      soundText: `${effectiveChildName}! 멋진 내 이름!`,
                      phonetic: effectiveChildName,
                      meaning: '세상에서 가장 소중한 내 이름',
                      emoji: '👧',
                      strokesHint: '1번 칸부터 순서대로 이름을 써봐요!',
                    });
                  } else if (cat.id === 'custom') {
                    setCurrentTracing({
                      id: 'custom_word',
                      category: 'custom',
                      label: customWordInput || '티라노',
                      soundText: customWordInput || '티라노',
                      phonetic: customWordInput || '티라노',
                      meaning: '내가 쓴 낱말',
                      emoji: '⭐',
                    });
                  } else {
                    const firstOfCat = TRACING_ITEMS.find((it) => it.category === cat.id);
                    if (firstOfCat) {
                      setCurrentTracing(firstOfCat);
                    }
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-jua shrink-0 transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap ${
                  tracingCategory === cat.id
                    ? 'bg-[#c9502f] text-white shadow-xs'
                    : 'bg-[#faf8f5] text-[#8a8178] border border-[#e4dccf] hover:text-[#1b1917]'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Special UI 1: Child Name Writing (내 이름 쓰기) */}
          {tracingCategory === 'name' ? (
            <div className="bg-[#fef9f5] p-3 rounded-2xl border border-[#eedfc9] space-y-2 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-[#c9502f]/10 text-[#c9502f] flex items-center justify-center font-bold text-base shrink-0">
                    👧
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-jua text-sm text-[#1b1917] truncate">
                      우리 아이 이름: <span className="text-[#c9502f] font-bold">'{currentTracing.label}'</span> 따라쓰기
                    </h4>
                    <p className="text-[11px] text-[#8a8178] font-hand">
                      원고지의 ①, ② 번호 순서에 맞춰 손가락으로 이름을 써보세요!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playSfx('pop');
                    speakKorean(`${currentTracing.label}! 사랑하는 우리 ${currentTracing.label}!`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#c9502f] text-white font-jua text-xs flex items-center gap-1 shadow-xs active:scale-95 shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>이름 소리 듣기</span>
                </button>
              </div>

              {/* Quick Name Chips or Edit Input */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[#f2ece2]">
                <span className="text-[11px] text-[#8a8178] font-hand shrink-0">다른 이름 연습:</span>
                {['시아', '하은', '민준', '서준', '도윤'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      playSfx('tap');
                      setCurrentTracing({
                        id: 'child_name_tracing',
                        category: 'name',
                        label: preset,
                        soundText: `${preset}! 멋진 이름!`,
                        phonetic: preset,
                        meaning: '이름 따라쓰기',
                        emoji: '👧',
                        strokesHint: '1번 칸부터 천천히 따라 써요!',
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-jua border transition-all active:scale-95 ${
                      currentTracing.label === preset
                        ? 'bg-[#c9502f] text-white border-[#c9502f]'
                        : 'bg-white text-[#4a443e] border-[#eedfc9]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          ) : tracingCategory === 'custom' ? (
            /* Special UI 2: Custom Word Input */
            <div className="bg-[#fdf9f4] p-3 rounded-2xl border border-[#eedfc9] space-y-2 animate-fadeIn">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customWordInput}
                  onChange={(e) => {
                    const text = e.target.value.slice(0, 6);
                    setCustomWordInput(text);
                    if (text.trim()) {
                      setCurrentTracing({
                        id: 'custom_word',
                        category: 'custom',
                        label: text,
                        soundText: text,
                        phonetic: text,
                        meaning: '내가 쓴 낱말',
                        emoji: '⭐',
                      });
                    }
                  }}
                  placeholder="예: 공룡, 사랑해, 토마토"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-[#e4dccf] bg-white text-xs sm:text-sm font-jua outline-none focus:border-[#c9502f]"
                />
                <button
                  type="button"
                  onClick={() => {
                    playSfx('pop');
                    speakKorean(customWordInput || '글자');
                  }}
                  className="px-3 py-2 rounded-xl bg-[#c9502f] text-white font-jua text-xs flex items-center gap-1 shadow-xs shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5" /> 소리 듣기
                </button>
              </div>
            </div>
          ) : (
            /* General Letter Carousel (자음, 모음, 낱말 등) */
            <>
              <div className="flex items-center justify-between gap-1 pt-0.5">
                <span className="text-xs font-bold text-[#8a8178] font-jua">
                  👇 따라 쓸 글자를 골라보세요:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playSfx('pop');
                    speakKorean(currentTracing.soundText);
                  }}
                  className="flex items-center gap-1 text-xs text-[#c9502f] bg-[#fdf3e4] hover:bg-[#fce9d0] px-3 py-1 rounded-full font-jua shadow-2xs active:scale-95 shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>'{currentTracing.label}' 소리 듣기</span>
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto px-1 py-1.5 scrollbar-thin">
                {filteredTracingItems.map((item) => {
                  const isSelected = currentTracing.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        playSfx('pop');
                        setCurrentTracing(item);
                        speakKorean(item.soundText);
                      }}
                      className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl min-w-[64px] sm:min-w-[72px] shrink-0 transition-all flex flex-col items-center justify-center gap-0.5 border-2 active:scale-95 ${
                        isSelected
                          ? 'bg-[#c9502f] text-white border-[#c9502f] shadow-md ring-2 ring-[#c9502f]/25'
                          : 'bg-[#faf8f5] text-[#1b1917] border-[#e4dccf] hover:border-[#c9502f]/50'
                      }`}
                    >
                      <span className="text-xl sm:text-2xl leading-none">{item.emoji}</span>
                      <span className={`text-lg sm:text-xl font-bold font-jua leading-tight ${isSelected ? 'text-white' : 'text-[#1b1917]'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Stroke hint Bar */}
          {currentTracing.strokesHint && (
            <div className="bg-[#fffbf2] border border-[#f3dfc2] rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="font-jua text-xs text-[#c9502f] shrink-0">획순:</span>
                <span className="font-jua text-xs text-[#78350f] truncate">
                  {currentTracing.strokesHint}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playSfx('tap');
                  speakKorean(currentTracing.soundText);
                }}
                className="flex items-center gap-1 text-[11px] text-[#c9502f] bg-white hover:bg-orange-50 px-2.5 py-1 rounded-lg border border-[#eedfc9] font-jua shadow-2xs active:scale-95 shrink-0"
              >
                <Volume2 className="w-3 h-3" />
                <span>듣기</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sticky One-Stop Floating Toolbar: Actions + Tools + Brush Sizes + Full 14-Color/Stamp Palette */}
      <div className="sticky top-1 z-30 w-full max-w-full box-border overflow-hidden bg-[#fdfaf5]/95 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border-2 border-[#e4dccf] shadow-md space-y-2">
        {/* Row 1: Active Letter Badge & Undo / Clear / Save / Share */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="px-2.5 py-1 rounded-xl bg-white border border-[#eedfc9] text-xs font-jua text-[#1b1917] flex items-center gap-1 shadow-2xs whitespace-nowrap">
            {mode === 'tracing' ? `✏️ 따라 쓰기 · ${currentTracing.label}` : '🎨 자유 낙서장'}
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={undoLastStroke}
              className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white hover:bg-[#f6f1e7] border border-[#e4dccf] text-[#4a443e] font-jua text-xs flex items-center gap-1 shadow-2xs active:scale-95 whitespace-nowrap"
              title="한 획 뒤로"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#8a8178]" />
              <span>취소</span>
            </button>
            <button
              type="button"
              onClick={clearDrawLayer}
              className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white hover:bg-red-50 border border-[#e4dccf] hover:border-red-200 text-red-600 font-jua text-xs flex items-center gap-1 shadow-2xs active:scale-95 whitespace-nowrap"
              title="내가 그린 선만 지우기"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>지우기</span>
            </button>
            <button
              type="button"
              onClick={saveToGallery}
              className="min-h-[36px] px-2.5 py-1 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-xs flex items-center gap-1 shadow-2xs active:scale-95 whitespace-nowrap"
              title="갤러리에 저장"
            >
              <Download className="w-3.5 h-3.5" />
              <span>저장</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="min-h-[36px] px-2.5 py-1 rounded-xl bg-[#ea580c] hover:bg-[#d94e08] text-white font-jua text-xs flex items-center gap-1 shadow-2xs active:scale-95 whitespace-nowrap"
              title="커뮤니티 자랑"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>자랑</span>
            </button>
          </div>
        </div>

        {/* Row 2: Drawing Tools (펜 / 무지개 / 지우개 / 스탬프) + Brush Sizes */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-[#eedfc9]">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => {
                playSfx('tap');
                setTool('crayon');
              }}
              className={`min-h-[36px] px-2.5 py-1 rounded-xl font-jua text-xs border transition-colors active:scale-95 whitespace-nowrap flex items-center gap-1 ${
                tool === 'crayon'
                  ? 'bg-[#1b1917] text-white border-[#1b1917] shadow-2xs'
                  : 'bg-white text-[#4a443e] border-[#e4dccf] hover:bg-[#f6f1e7]'
              }`}
              title="크레파스 펜"
            >
              <span>🖍️</span>
              <span>펜</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setTool('rainbow');
              }}
              className={`min-h-[36px] px-2.5 py-1 rounded-xl font-jua text-xs border transition-colors active:scale-95 whitespace-nowrap flex items-center gap-1 ${
                tool === 'rainbow'
                  ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white border-purple-500 shadow-2xs'
                  : 'bg-white text-[#4a443e] border-[#e4dccf] hover:bg-[#f6f1e7]'
              }`}
              title="무지개펜"
            >
              <span>🌈</span>
              <span>무지개</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('tap');
                setTool('eraser');
              }}
              className={`min-h-[36px] px-2.5 py-1 rounded-xl font-jua text-xs border transition-colors active:scale-95 whitespace-nowrap flex items-center gap-1 ${
                tool === 'eraser'
                  ? 'bg-[#c9502f] text-white border-[#c9502f] shadow-2xs'
                  : 'bg-white text-[#4a443e] border-[#e4dccf] hover:bg-[#f6f1e7]'
              }`}
              title="내가 그린 선만 지워요"
            >
              <Eraser className="w-3.5 h-3.5 shrink-0" />
              <span>지우개</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setTool('stamp');
              }}
              className={`min-h-[36px] px-2.5 py-1 rounded-xl font-jua text-xs border transition-colors active:scale-95 whitespace-nowrap flex items-center gap-1 ${
                tool === 'stamp'
                  ? 'bg-[#f2c14e] text-[#1b1917] border-[#e2ae32] shadow-2xs'
                  : 'bg-white text-[#4a443e] border-[#e4dccf] hover:bg-[#f6f1e7]'
              }`}
              title="예쁜 도장 스탬프"
            >
              <span>⭐</span>
              <span>스탬프</span>
            </button>
          </div>

          {/* Brush Thickness Selector */}
          <div className="flex items-center gap-1 pl-1.5 border-l border-[#e4dccf]">
            <span className="text-[10px] font-jua text-[#8a8178] hidden sm:inline mr-0.5">굵기</span>
            {[10, 18, 26].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => {
                  playSfx('tap');
                  setBrushSize(sz);
                }}
                title={`선 굵기 ${sz}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors active:scale-90 shrink-0 ${
                  brushSize === sz
                    ? 'border-[#c9502f] bg-[#fff5f2] shadow-2xs'
                    : 'border-[#e4dccf] bg-white hover:bg-[#f6f1e7]'
                }`}
              >
                <span
                  className="rounded-full bg-[#1b1917]"
                  style={{ width: Math.max(5, sz / 2.2), height: Math.max(5, sz / 2.2) }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Full Unified Color Palette (All 14 Colors) or Stamps Picker */}
        <div className="pt-2 border-t border-[#eedfc9]">
          {tool === 'stamp' ? (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
              {DOODLE_STAMPS.map((stamp) => {
                const isSelected = selectedStamp === stamp;
                return (
                  <button
                    key={stamp}
                    type="button"
                    onClick={() => {
                      playSfx('pop');
                      setSelectedStamp(stamp);
                    }}
                    className={`w-9 h-9 sm:w-10 sm:h-10 text-xl rounded-xl border-2 transition-transform shrink-0 flex items-center justify-center active:scale-90 ${
                      isSelected
                        ? 'bg-[#fdf3e4] border-[#c9502f] shadow-xs scale-105'
                        : 'bg-white border-[#e4dccf] hover:bg-[#f6f1e7]'
                    }`}
                    title={`${stamp} 스탬프`}
                  >
                    {stamp}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="grid grid-cols-7 sm:flex sm:flex-wrap sm:items-center sm:justify-center gap-1.5 sm:gap-2 justify-items-center py-0.5">
                {CRAYON_PALETTE.map((c) => {
                  const isSelected = tool === 'crayon' && selectedColor === c.color;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        playSfx('tap');
                        setTool('crayon');
                        setSelectedColor(c.color);
                      }}
                      aria-label={c.name}
                      title={`${c.name} 크레파스`}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0 transition-transform active:scale-90 flex items-center justify-center ${
                        isSelected
                          ? 'ring-2 ring-[#c9502f] ring-offset-2 ring-offset-[#fdfaf5] scale-110 shadow-md'
                          : 'border border-black/15 opacity-95 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.color }}
                    >
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {tool === 'rainbow' && (
                <p className="text-[11px] font-jua text-center text-purple-700 bg-purple-50/80 border border-purple-200 rounded-xl py-1 px-2">
                  🌈 무지개펜 사용 중! 캔버스에 그리면 색깔이 알록달록 변해요 (색상 칩을 누르면 단색 펜으로 전환)
                </p>
              )}
              {tool === 'eraser' && (
                <p className="text-[11px] font-jua text-center text-[#c9502f] bg-[#fff5f2] border border-[#fbd8ce] rounded-xl py-1 px-2">
                  🧼 지우개 사용 중! 내가 그린 선만 지워지고 글자 점선은 남아요
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Immersive Large Layered Canvas Container (Expanded Width & Height for Mobile Kids) */}
      <div className="w-full max-w-full box-border bg-[#fdfaf5] p-2 sm:p-3 rounded-3xl border-2 border-[#e4dccf] shadow-sm">
        <div
          ref={containerRef}
          className="relative bg-white rounded-2xl border border-[#f0e6d8] overflow-hidden w-full h-[430px] sm:h-[490px] md:h-[520px]"
        >
          {/* Layer 1: Background Guideline Canvas */}
          <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

          {/* Layer 2: Drawing Layer */}
          <canvas
            ref={drawCanvasRef}
            onMouseDown={startDrawing}
            onMouseMove={drawMove}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={drawMove}
            onTouchEnd={stopDrawing}
            className="absolute inset-0 w-full h-full cursor-crosshair block touch-none"
          />
        </div>
      </div>


      {/* Prominent Action Buttons: Save to Gallery & Share to Community */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={saveToGallery}
          className="min-h-[52px] flex items-center justify-center gap-2 py-3.5 px-3 rounded-2xl bg-white border-2 border-[#e4dccf] font-jua text-sm sm:text-base text-[#1b1917] hover:bg-[#f6f1e7] shadow-sm active:scale-95 transition-all whitespace-nowrap"
        >
          <Download className="w-4 h-4 text-[#c9502f] shrink-0" />
          <span>갤러리에 저장</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="min-h-[52px] flex items-center justify-center gap-2 py-3.5 px-3 rounded-2xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm sm:text-base shadow-md active:scale-95 transition-all whitespace-nowrap"
        >
          <Share2 className="w-4 h-4 shrink-0" />
          <span>자랑하기 💖</span>
        </button>
      </div>

      {/* Simplified Image-Centric Child Gallery Drawer */}
      {savedDoodles.length > 0 && (
        <div className="w-full max-w-full box-border overflow-hidden bg-white rounded-3xl p-4 sm:p-5 border border-[#e4dccf] shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ImageIcon className="w-4 h-4 text-[#c9502f] shrink-0" />
              <h3 className="font-jua text-sm sm:text-base text-[#1b1917] truncate">
                {childName || '아이'}의 한글 그림 갤러리
                <span className="text-[#8a8178] font-normal ml-1.5 tabular-nums">({savedDoodles.length}장)</span>
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                playSfx('tap');
                setShowGallery(!showGallery);
              }}
              className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs text-[#c9502f] font-jua hover:bg-[#fdf3e4] transition-colors whitespace-nowrap shrink-0"
            >
              {showGallery ? '접기 ▲' : '보기 ▼'}
            </button>
          </div>

          {showGallery && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {savedDoodles.map((doodle) => {
                const isMenuOpen = galleryMenuId === doodle.id;
                const isBroken = brokenDoodleIds[doodle.id];

                return (
                  <div
                    key={doodle.id}
                    className="bg-[#fcfaf6] rounded-2xl border border-[#e4dccf] overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col box-border"
                  >
                    {/* Image-First Tap Target: Tap artwork directly to load onto canvas */}
                    <button
                      type="button"
                      onClick={() => handleLoadOntoCanvas(doodle)}
                      className="w-full aspect-4/3 bg-white relative overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9502f]"
                      title="그림을 터치하면 위 도화지로 바로 불러와요"
                    >
                      {!isBroken ? (
                        <img
                          src={doodle.dataUrl}
                          alt={doodle.title}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setBrokenDoodleIds((prev) => ({ ...prev, [doodle.id]: true }))
                          }
                          className="w-full h-full object-contain p-1 transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-95"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#fdf8f0] to-[#f6ede0] text-[#8a8178] p-2">
                          <ImageIcon className="w-6 h-6 text-[#c9502f]/60" />
                          <span className="text-[11px] font-jua truncate max-w-full">{doodle.title}</span>
                        </div>
                      )}
                    </button>

                    {/* Clean Single-Line Title + Quiet Overflow Trigger */}
                    <div className="px-2.5 pt-2 pb-1.5 flex items-center justify-between gap-1 border-t border-[#f2ebe0]">
                      <button
                        type="button"
                        onClick={() => handleLoadOntoCanvas(doodle)}
                        className="text-xs font-jua text-[#1b1917] hover:text-[#c9502f] truncate text-left flex-1 transition-colors"
                        title={doodle.title}
                      >
                        {doodle.title}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playSfx('tap');
                          setGalleryMenuId(isMenuOpen ? null : doodle.id);
                        }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] hover:bg-[#f0e9dc] transition-colors shrink-0"
                        aria-label="그림 관리 메뉴"
                        title="이름 수정 또는 삭제"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Unified Compact Bottom Action Bar (or Edit/Delete Swap) */}
                    {isMenuOpen ? (
                      <div className="px-1.5 pb-2 pt-1 flex items-center gap-1 border-t border-[#f2ebe0] bg-[#f8f3ea]">
                        <button
                          type="button"
                          onClick={() => {
                            playSfx('tap');
                            setEditingDoodle({ id: doodle.id, title: doodle.title });
                          }}
                          className="flex-1 min-h-[38px] px-1.5 rounded-full bg-white border border-[#e4dccf] text-[10px] sm:text-[11px] font-jua text-[#4a443e] hover:text-[#c9502f] flex items-center justify-center gap-1 active:scale-95 transition-all whitespace-nowrap"
                        >
                          <Edit2 className="w-3 h-3 shrink-0" />
                          <span>수정</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playSfx('tap');
                            setDeleteDoodleTarget(doodle);
                          }}
                          className="flex-1 min-h-[38px] px-1.5 rounded-full bg-white border border-red-200 text-[10px] sm:text-[11px] font-jua text-red-500 hover:bg-red-50 flex items-center justify-center gap-1 active:scale-95 transition-all whitespace-nowrap"
                        >
                          <Trash2 className="w-3 h-3 shrink-0" />
                          <span>삭제</span>
                        </button>
                      </div>
                    ) : (
                      <div className="px-1.5 pb-2 pt-0.5 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleLoadOntoCanvas(doodle)}
                          className="flex-1 min-h-[38px] px-1.5 rounded-full bg-white border border-[#e4dccf] text-[10px] sm:text-[11px] font-jua text-[#4a443e] hover:border-[#c9502f]/40 hover:text-[#c9502f] flex items-center justify-center gap-0.5 sm:gap-1 active:scale-95 transition-all whitespace-nowrap shadow-2xs"
                          title="도화지로 불러와서 덧그리기"
                        >
                          <FolderInput className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#c9502f] shrink-0" />
                          <span>불러오기</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playSfx('pop');
                            onShareToCommunity(doodle.dataUrl, doodle.title);
                          }}
                          className="flex-1 min-h-[38px] px-1.5 rounded-full bg-[#fdf3e4] border border-[#f5d7b5] text-[10px] sm:text-[11px] font-jua text-[#c9502f] hover:bg-[#fae2c1] flex items-center justify-center gap-0.5 sm:gap-1 active:scale-95 transition-all whitespace-nowrap"
                          title="우리 아이 작품 커뮤니티에 자랑하기"
                        >
                          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                          <span>자랑하기</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Rename Doodle Title Modal */}
      {editingDoodle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-xs box-border overflow-hidden shadow-2xl p-5 text-center space-y-3.5 animate-pop relative">
            <h3 className="font-jua text-base text-[#1b1917]">그림 제목 수정</h3>
            <input
              type="text"
              value={editingDoodle.title}
              onChange={(e) => setEditingDoodle({ ...editingDoodle, title: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#e4dccf] bg-white font-jua text-center"
              placeholder="그림 제목"
              maxLength={20}
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditingDoodle(null)}
                className="w-1/2 py-2 rounded-xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-xs hover:bg-[#faf8f5]"
              >
                취소
              </button>
              <button
                onClick={handleSaveEditTitle}
                className="w-1/2 py-2 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-xs shadow-md"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Doodle Confirmation Modal */}
      {deleteDoodleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-xs box-border overflow-hidden shadow-2xl p-5 text-center space-y-3.5 animate-pop relative">
            <div className="w-11 h-11 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto text-xl">
              🗑️
            </div>
            <div>
              <h3 className="font-jua text-base text-[#1b1917]">그림을 삭제할까요?</h3>
              <p className="text-xs text-[#8a8178] font-hand mt-0.5">
                '{deleteDoodleTarget.title}' 그림이 갤러리에서 삭제됩니다.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeleteDoodleTarget(null)}
                className="w-1/2 py-2 rounded-xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-xs hover:bg-[#faf8f5]"
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteDoodle(deleteDoodleTarget.id)}
                className="w-1/2 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-jua text-xs shadow-md"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
