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
  const [tracingCategory, setTracingCategory] = useState<TracingCategory>('consonant');
  const [currentTracing, setCurrentTracing] = useState<TracingItem>(TRACING_ITEMS[0]);
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
  const [showGallery, setShowGallery] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [editingDoodle, setEditingDoodle] = useState<{ id: string; title: string } | null>(null);
  const [deleteDoodleTarget, setDeleteDoodleTarget] = useState<SavedDoodle | null>(null);

  const handleDeleteDoodle = (id: string) => {
    const updated = savedDoodles.filter((d) => d.id !== id);
    setSavedDoodles(updated);
    localStorage.setItem('hangul_saved_doodles', JSON.stringify(updated));
    setDeleteDoodleTarget(null);
    playSfx('erase');
  };

  const handleSaveEditTitle = () => {
    if (!editingDoodle) return;
    const updated = savedDoodles.map((d) =>
      d.id === editingDoodle.id ? { ...d, title: editingDoodle.title.trim() || '한글 그림' } : d
    );
    setSavedDoodles(updated);
    localStorage.setItem('hangul_saved_doodles', JSON.stringify(updated));
    setEditingDoodle(null);
    playSfx('pop');
  };

  const handleLoadOntoCanvas = (doodle: SavedDoodle) => {
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      ctx.drawImage(img, 0, 0, drawCanvas.width, drawCanvas.height);
      playSfx('fan');
      confetti({ particleCount: 30, spread: 60 });
      setSaveNotice(`'${doodle.title}' 그림을 도화지로 불러왔어요! 🎨`);
      setTimeout(() => setSaveNotice(null), 3000);
    };
    img.src = doodle.dataUrl;
  };

  // Canvas history for undo (draw canvas only)
  const [history, setHistory] = useState<ImageData[]>([]);

  // Filter tracing items by category
  const filteredTracingItems = TRACING_ITEMS.filter((item) => item.category === tracingCategory);

  // Initialize or resize both canvases
  useEffect(() => {
    setupCanvases();
  }, [mode, currentTracing]);

  const setupCanvases = () => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    const container = containerRef.current;
    if (!bgCanvas || !drawCanvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    // Set physical resolution
    bgCanvas.width = width * dpr;
    bgCanvas.height = height * dpr;
    drawCanvas.width = width * dpr;
    drawCanvas.height = height * dpr;

    // Scale contexts
    const bgCtx = bgCanvas.getContext('2d');
    const drawCtx = drawCanvas.getContext('2d');
    if (!bgCtx || !drawCtx) return;

    bgCtx.resetTransform();
    bgCtx.scale(dpr, dpr);
    drawCtx.resetTransform();
    drawCtx.scale(dpr, dpr);

    // Draw background layer
    bgCtx.fillStyle = '#ffffff';
    bgCtx.fillRect(0, 0, width, height);

    if (mode === 'tracing' && currentTracing) {
      drawTracingGuide(bgCtx, width, height, currentTracing);
    } else {
      drawFreeGrid(bgCtx, width, height);
    }

    // Clear draw canvas (transparent)
    drawCtx.clearRect(0, 0, width, height);

    // Reset history with blank state
    const blank = drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
    setHistory([blank]);
  };

  // Draw background cross line and faint letter guide (Layer 1)
  const drawTracingGuide = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    item: TracingItem
  ) => {
    ctx.save();
    // Soft grid line
    ctx.strokeStyle = '#f2ebe0';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);

    ctx.beginPath();
    ctx.moveTo(width / 2, 20);
    ctx.lineTo(width / 2, height - 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(20, height / 2);
    ctx.lineTo(width - 20, height / 2);
    ctx.stroke();

    // Large faint outline letter in peach-gray
    ctx.setLineDash([]);
    ctx.fillStyle = '#f6eae2';
    ctx.strokeStyle = '#dfc4b4';
    ctx.lineWidth = 2.5;

    const fontSize = item.label.length > 2 ? 80 : item.label.length === 2 ? 115 : 175;
    ctx.font = `bold ${fontSize}px 'Jua', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const yPos = height / 2 + 8;
    ctx.fillText(item.label, width / 2, yPos);
    ctx.strokeText(item.label, width / 2, yPos);

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
    onRewardExp(15); // Pet reward!

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

    setSaveNotice(`🎉 '${newDoodle.title}'이 기기 사진첩과 앱 내 갤러리에 저장되었습니다! (EXP +15 획득 ✨)`);
    setTimeout(() => {
      setSaveNotice(null);
    }, 4000);
  };

  // Share to community
  const handleShare = () => {
    const dataUrl = getMergedDataUrl();
    if (!dataUrl) return;

    playSfx('pop');
    onRewardExp(20); // Pet reward!
    const title =
      mode === 'tracing'
        ? `[따라쓰기] 우리 아이가 그린 "${currentTracing.label}" 자랑해요!`
        : `[자유낙서] 아이가 직접 그린 알록달록 그림이에요!`;
    onShareToCommunity(dataUrl, title);
  };

  return (
    <div className="p-4 sm:p-5 max-w-xl mx-auto space-y-3 pb-32 sm:pb-36">
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
          손가락으로 쓱쓱! 신나는 낙서보드
        </div>
        <h1 className="text-2xl sm:text-3xl font-jua text-[#1b1917]">
          그려보고, 따라 쓰고, 자랑해요!
        </h1>
        <p className="text-xs text-[#8a8178] font-hand">
          지우개로 지워도 글자 모양은 그대로 남아있어요! 마음껏 그려보세요.
        </p>
      </div>

      {/* Focus Play Routine Timer with 5/10/20/30 Preset Buttons */}
      <div className="bg-gradient-to-r from-[#fff7ed] to-[#fef3c7] p-3.5 rounded-3xl border border-[#fed7aa] shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl animate-pulse">⏳</span>
            <div>
              <div className="flex items-center gap-1.5 font-jua text-xs text-[#9a3412]">
                <span>한글놀이 모래시계</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white text-[#ea580c] font-bold">
                  {timerMinutes}분 목표
                </span>
              </div>
              <p className="text-[11px] text-[#78350f] font-hand">
                아이의 집중력에 맞게 시간을 골라보세요!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-jua text-lg text-[#c2410c] px-3 py-1 bg-white rounded-xl border border-[#fed7aa] shadow-2xs font-mono">
              {Math.floor(timerSeconds / 60)}:
              {(timerSeconds % 60).toString().padStart(2, '0')}
            </span>
            <button
              onClick={() => {
                playSfx('tap');
                setIsTimerRunning(!isTimerRunning);
              }}
              className={`px-3 py-1.5 rounded-xl font-jua text-xs shadow-xs transition-all active:scale-95 ${
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
        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-[#fed7aa]/60">
          <span className="text-[11px] font-jua text-[#9a3412] flex-none">시간 선택:</span>
          <div className="flex gap-1.5 flex-1 justify-end">
            {[5, 10, 20, 30].map((mins) => (
              <button
                key={mins}
                onClick={() => selectTimerPreset(mins)}
                className={`px-2.5 py-1 rounded-xl text-xs font-jua transition-all ${
                  timerMinutes === mins
                    ? 'bg-[#c9502f] text-white shadow-2xs'
                    : 'bg-white/80 text-[#78350f] hover:bg-white border border-[#fed7aa]'
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

      {/* If Tracing mode: 8 Categories + Custom Word Input + Carousel */}
      {mode === 'tracing' && (
        <div className="bg-white p-3.5 rounded-3xl border border-[#e4dccf] shadow-xs space-y-3">
          {/* Tracing Category Filter Tabs (8 Categories) */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'consonant', label: '자음 (14자)', emoji: '🔤' },
              { id: 'double', label: '쌍자음 (5자)', emoji: '🪶' },
              { id: 'vowel', label: '모음 (10자)', emoji: '🅰️' },
              { id: 'complex_vowel', label: '복합모음 (6자)', emoji: '🧩' },
              { id: 'animal', label: '동물 (10종)', emoji: '🦁' },
              { id: 'food', label: '과일·채소', emoji: '🍎' },
              { id: 'family', label: '가족·일상', emoji: '💖' },
              { id: 'custom', label: '⭐️ 친구·공룡 이름 쓰기', emoji: '🦖' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  playSfx('tap');
                  setTracingCategory(cat.id as TracingCategory);
                  if (cat.id === 'custom') {
                    const customItem: TracingItem = {
                      id: 'custom_word',
                      category: 'custom',
                      label: customWordInput || '티라노',
                      soundText: customWordInput || '티라노',
                      phonetic: customWordInput || '티라노',
                      meaning: '아이가 좋아하는 특별한 낱말',
                      emoji: '🦖',
                    };
                    setCurrentTracing(customItem);
                  } else {
                    const firstOfCat = TRACING_ITEMS.find((it) => it.category === cat.id);
                    if (firstOfCat) {
                      setCurrentTracing(firstOfCat);
                    }
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-jua flex-none transition-all flex items-center gap-1 ${
                  tracingCategory === cat.id
                    ? 'bg-[#c9502f] text-white shadow-xs'
                    : 'bg-[#faf8f5] text-[#8a8178] border border-[#e4dccf]'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Custom Word Input Box if 'custom' is active */}
          {tracingCategory === 'custom' ? (
            <div className="bg-[#fdf9f4] p-3 rounded-2xl border border-[#eedfc9] space-y-2">
              <label className="block text-xs font-jua text-[#1b1917]">
                🦖 아이 이름, 유치원 친구 이름, 좋아하는 공룡을 입력하세요:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customWordInput}
                  onChange={(e) => {
                    const text = e.target.value.slice(0, 8);
                    setCustomWordInput(text);
                    if (text.trim()) {
                      setCurrentTracing({
                        id: 'custom_word',
                        category: 'custom',
                        label: text,
                        soundText: text,
                        phonetic: text,
                        meaning: '아이가 좋아하는 특별한 낱말',
                        emoji: '⭐',
                      });
                    }
                  }}
                  placeholder="예: 티라노, 시아, 민준, 사랑해"
                  className="flex-1 px-3 py-2 rounded-xl border border-[#e4dccf] bg-white text-sm font-jua outline-none focus:border-[#c9502f]"
                />
                <button
                  onClick={() => {
                    playSfx('pop');
                    speakKorean(customWordInput);
                  }}
                  className="px-3 py-2 rounded-xl bg-[#c9502f] text-white font-jua text-xs flex items-center gap-1 shadow-xs"
                >
                  <Volume2 className="w-3.5 h-3.5" /> 소리 듣기
                </button>
              </div>
              <p className="text-[11px] text-[#8a8178] font-hand">
                💡 입력한 글자가 아래 칠판에 큰 점선 가이드로 바로 나타납니다!
              </p>
            </div>
          ) : (
            <>
              {/* Letter & Word Carousel */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-[#8a8178] font-jua">따라 그릴 글자 터치</span>
                <button
                  onClick={() => {
                    speakKorean(`${currentTracing.soundText}! ${currentTracing.meaning || ''}`);
                  }}
                  className="flex items-center gap-1.5 text-xs text-[#c9502f] bg-[#fdf3e4] hover:bg-[#fce9d0] px-3 py-1 rounded-full font-jua shadow-2xs active:scale-95"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  부드러운 소리 듣기
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1.5">
                {filteredTracingItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      playSfx('pop');
                      setCurrentTracing(item);
                      speakKorean(item.soundText);
                    }}
                    className={`px-3 py-2 rounded-2xl text-sm font-jua flex-none transition-all flex items-center gap-1.5 border ${
                      currentTracing.id === item.id
                        ? 'bg-[#c9502f] text-white border-[#c9502f] shadow-md scale-105'
                        : 'bg-[#faf8f5] text-[#1b1917] border-[#e4dccf] hover:border-[#c9502f]/40'
                    }`}
                  >
                    <span className="text-base">{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Stroke hint */}
          {currentTracing.strokesHint && (
            <div className="text-[11px] text-[#4a443e] font-hand bg-[#fdfaf5] p-2.5 rounded-xl border border-[#eedfc9] flex items-center gap-1.5">
              <span className="text-base">💡</span>
              <span>
                <b>쓰기 순서:</b> {currentTracing.strokesHint}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Layered Canvas Container (Compact & responsive to prevent bottom cutting off) */}
      <div
        ref={containerRef}
        className="relative bg-white rounded-3xl border-2 border-[#e4dccf] overflow-hidden shadow-sm aspect-16/9 w-full max-h-[220px] sm:max-h-[250px]"
      >
        {/* Layer 1: Background Guideline Canvas (Static & protected from eraser) */}
        <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Layer 2: Drawing Layer (Transparent overlay for kid's drawing) */}
        <canvas
          ref={drawCanvasRef}
          onMouseDown={startDrawing}
          onMouseMove={drawMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={drawMove}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair block"
        />

        {/* Canvas floating quick tools (Undo, Clear, Quick Save, Quick Share) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-2xl border border-[#e4dccf] shadow-sm z-10">
          <button
            onClick={undoLastStroke}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] hover:bg-[#f6f1e7] transition-colors"
            title="한 획 뒤로 (실행취소)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={clearDrawLayer}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-[#8a8178] hover:text-[#c9502f] hover:bg-[#f6f1e7] transition-colors"
            title="내가 그린 선만 지우기 (가이드 글자는 유지돼요!)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-[#e4dccf] mx-0.5" />
          <button
            onClick={saveToGallery}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-[#c9502f] hover:bg-[#fff5f2] transition-colors"
            title="갤러리에 저장"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleShare}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-[#ea580c] hover:bg-[#fff7ed] transition-colors"
            title="커뮤니티 자랑"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tool Palette: Crayon, Rainbow, Eraser, Stamps */}
      <div className="bg-white p-3.5 rounded-3xl border border-[#e4dccf] shadow-xs space-y-3">
        {/* Tool Mode selector & Thickness */}
        <div className="flex items-center justify-between gap-2 border-b border-[#f0ebe1] pb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                playSfx('tap');
                setTool('crayon');
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-jua text-xs transition-all ${
                tool === 'crayon'
                  ? 'bg-[#1b1917] text-white shadow-xs'
                  : 'bg-[#f6f1e7] text-[#8a8178]'
              }`}
            >
              🖍️ 크레파스
            </button>
            <button
              onClick={() => {
                playSfx('pop');
                setTool('rainbow');
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-jua text-xs transition-all ${
                tool === 'rainbow'
                  ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-xs'
                  : 'bg-[#f6f1e7] text-[#8a8178]'
              }`}
            >
              🌈 무지개펜
            </button>
            <button
              onClick={() => {
                playSfx('tap');
                setTool('eraser');
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-jua text-xs transition-all ${
                tool === 'eraser'
                  ? 'bg-[#c9502f] text-white shadow-xs'
                  : 'bg-[#f6f1e7] text-[#8a8178]'
              }`}
              title="내가 그린 선만 깔끔하게 지워요"
            >
              <Eraser className="w-3.5 h-3.5" /> 안심 지우개
            </button>
            <button
              onClick={() => {
                playSfx('pop');
                setTool('stamp');
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-jua text-xs transition-all ${
                tool === 'stamp'
                  ? 'bg-[#f2c14e] text-[#1b1917] shadow-xs'
                  : 'bg-[#f6f1e7] text-[#8a8178]'
              }`}
            >
              ⭐ 스탬프
            </button>
          </div>

          {/* Brush Thickness selector */}
          <div className="flex items-center gap-1.5 flex-none">
            {[10, 18, 26].map((sz) => (
              <button
                key={sz}
                onClick={() => {
                  playSfx('tap');
                  setBrushSize(sz);
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                  brushSize === sz
                    ? 'border-[#c9502f] bg-[#fff5f2] scale-110'
                    : 'border-[#e4dccf] bg-[#faf8f5]'
                }`}
                title={`선 굵기 ${sz}`}
              >
                <span
                  className="rounded-full bg-[#1b1917]"
                  style={{ width: sz / 2.8, height: sz / 2.8 }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Crayon Colors Palette (14 Sweet Colors) */}
        {tool === 'crayon' && (
          <div className="flex items-center gap-2 overflow-x-auto py-2 px-1">
            {CRAYON_PALETTE.map((c) => {
              const isSelected = selectedColor === c.color;
              return (
                <button
                  key={c.name}
                  onClick={() => {
                    playSfx('tap');
                    setSelectedColor(c.color);
                  }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-none transition-all relative ${
                    isSelected
                      ? 'scale-115 ring-3 ring-[#c9502f] ring-offset-2 ring-offset-white shadow-xs z-10'
                      : 'hover:scale-105 border border-black/10'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              );
            })}
          </div>
        )}

        {/* Sticker Stamps Palette */}
        {tool === 'stamp' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-hand text-[#8a8178] flex-none">도화지에 콕 터치하세요:</span>
            {DOODLE_STAMPS.map((stamp) => (
              <button
                key={stamp}
                onClick={() => {
                  playSfx('pop');
                  setSelectedStamp(stamp);
                }}
                className={`text-xl p-1.5 rounded-xl transition-transform flex-none ${
                  selectedStamp === stamp
                    ? 'bg-[#fdf3e4] border border-[#f3dfc6] scale-125'
                    : 'hover:scale-110'
                }`}
              >
                {stamp}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Prominent Action Buttons: Save to Gallery & Share to Community */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={saveToGallery}
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-white border-2 border-[#e4dccf] font-jua text-sm sm:text-base text-[#1b1917] hover:bg-[#f6f1e7] shadow-sm active:scale-95 transition-all"
        >
          <Download className="w-4.5 h-4.5 text-[#c9502f]" />
          내 갤러리에 저장
        </button>

        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm sm:text-base shadow-md active:scale-95 transition-all"
        >
          <Share2 className="w-4.5 h-4.5" />
          커뮤니티에 자랑하기 💖
        </button>
      </div>

      {/* Child's Saved Gallery Drawer */}
      {savedDoodles.length > 0 && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e4dccf] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#c9502f]" />
              <h3 className="font-jua text-sm text-[#1b1917]">
                {childName || '아이'}의 한글 그림 갤러리 ({savedDoodles.length}장)
              </h3>
            </div>
            <button
              onClick={() => setShowGallery(!showGallery)}
              className="text-xs text-[#c9502f] font-jua hover:underline"
            >
              {showGallery ? '접기 ▲' : '모두 보기 ▼'}
            </button>
          </div>

          {showGallery && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {savedDoodles.map((doodle) => (
                <div
                  key={doodle.id}
                  className="bg-[#faf8f5] p-2.5 rounded-2xl border border-[#e4dccf] space-y-2 text-center relative group"
                >
                  <img
                    src={doodle.dataUrl}
                    alt={doodle.title}
                    className="w-full aspect-4/3 object-contain rounded-xl bg-white border border-[#eee6db]"
                  />
                  <div className="flex items-center justify-between gap-1 px-1">
                    <p className="text-xs font-jua text-[#1b1917] truncate flex-1 text-left" title={doodle.title}>
                      {doodle.title}
                    </p>
                    <button
                      onClick={() => {
                        playSfx('tap');
                        setEditingDoodle({ id: doodle.id, title: doodle.title });
                      }}
                      className="p-1 rounded-lg hover:bg-white text-[#8a8178] hover:text-[#c9502f] transition-colors"
                      title="제목 수정"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        playSfx('tap');
                        setDeleteDoodleTarget(doodle);
                      }}
                      className="p-1 rounded-lg hover:bg-white text-[#8a8178] hover:text-red-500 transition-colors"
                      title="그림 삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1 pt-0.5">
                    <button
                      onClick={() => handleLoadOntoCanvas(doodle)}
                      className="py-1 px-1.5 rounded-xl bg-white border border-[#e4dccf] text-[10px] font-jua text-[#4a443e] hover:bg-[#f6f1e7] transition-all"
                      title="도화지로 불러와서 덧그리기"
                    >
                      🎨 불러오기
                    </button>
                    <button
                      onClick={() => onShareToCommunity(doodle.dataUrl, doodle.title)}
                      className="py-1 px-1.5 rounded-xl bg-[#fdf3e4] border border-[#f5d7b5] text-[10px] font-jua text-[#c9502f] hover:bg-[#fae2c1] transition-all flex items-center justify-center gap-0.5"
                    >
                      <Share2 className="w-2.5 h-2.5" /> 자랑하기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rename Doodle Title Modal */}
      {editingDoodle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl p-5 text-center space-y-3.5 animate-pop relative">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl p-5 text-center space-y-3.5 animate-pop relative">
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
