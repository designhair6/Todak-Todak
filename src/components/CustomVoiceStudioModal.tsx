import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  ChevronRight,
  Mic,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import {
  CUSTOM_SPEAKERS,
  CUSTOM_VOICE_CATEGORIES,
  CustomVoiceCategoryId,
  CustomVoiceSpeaker,
  TOTAL_CUSTOM_VOICE_ITEMS,
  clearSpeakerClips,
  deleteCustomVoiceClip,
  getCustomVoiceClipUrl,
  getSpeakerMeta,
  saveCustomVoiceClip,
  useCustomVoicePackState,
} from '../utils/customVoicePack';
import { playSfx, speakKorean, stopAllSpeech } from '../utils/sound';
import { MicPermissionGuide } from './MicPermissionGuide';

interface CustomVoiceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName?: string;
}

const MAX_RECORD_MS = 2500;

export const CustomVoiceStudioModal: React.FC<CustomVoiceStudioModalProps> = ({
  isOpen,
  onClose,
  childName = '우리 아이',
}) => {
  const {
    enabled,
    activeSpeaker,
    getCountForSpeaker,
    hasClip,
    setEnabled,
    setActiveSpeaker,
  } = useCustomVoicePackState();

  const [categoryId, setCategoryId] = useState<CustomVoiceCategoryId>('cons');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordMs, setRecordMs] = useState(0);
  const [isPlayingClip, setIsPlayingClip] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordStartTimeRef = useRef<number>(0);

  const activeCategory = useMemo(
    () => CUSTOM_VOICE_CATEGORIES.find((c) => c.id === categoryId) || CUSTOM_VOICE_CATEGORIES[0],
    [categoryId]
  );

  const activeItems = activeCategory.items;
  const safeIndex = Math.min(selectedIndex, Math.max(0, activeItems.length - 1));
  const currentItem = activeItems[safeIndex];
  const speakerMeta = getSpeakerMeta(activeSpeaker);
  const currentClipUrl = currentItem ? getCustomVoiceClipUrl(activeSpeaker, currentItem.key) : null;
  const activeSpeakerCount = getCountForSpeaker(activeSpeaker);

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => {
      setStatusNotice((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  const stopPreviewAudio = () => {
    if (previewAudioRef.current) {
      try {
        previewAudioRef.current.onended = null;
        previewAudioRef.current.onerror = null;
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      } catch {}
      previewAudioRef.current = null;
    }
    setIsPlayingClip(false);
  };

  const playClipUrl = (url: string, onDone?: () => void) => {
    stopAllSpeech();
    stopPreviewAudio();
    try {
      const audio = new Audio(url);
      audio.volume = 1;
      previewAudioRef.current = audio;
      setIsPlayingClip(true);
      audio.onended = () => {
        if (previewAudioRef.current === audio) {
          previewAudioRef.current = null;
        }
        setIsPlayingClip(false);
        onDone?.();
      };
      audio.onerror = () => {
        if (previewAudioRef.current === audio) {
          previewAudioRef.current = null;
        }
        setIsPlayingClip(false);
      };
      audio.play().catch(() => {
        setIsPlayingClip(false);
      });
    } catch {
      setIsPlayingClip(false);
    }
  };

  const cleanupRecordingHandles = (discard: boolean) => {
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordMs(0);

    const recorder = mediaRecorderRef.current;
    if (recorder) {
      try {
        if (discard) {
          recorder.onstop = null;
          if (recorder.state === 'recording') {
            recorder.stop();
          }
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
          }
          mediaRecorderRef.current = null;
        } else if (recorder.state === 'recording') {
          recorder.stop();
        }
      } catch {}
    } else if (discard && mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      cleanupRecordingHandles(true);
      stopPreviewAudio();
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      setConfirmClearAll(false);
      setMicError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      cleanupRecordingHandles(true);
      stopPreviewAudio();
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    cleanupRecordingHandles(true);
    stopPreviewAudio();
    playSfx('tap');
    onClose();
  };

  const handleSelectCategory = (nextCat: CustomVoiceCategoryId) => {
    cleanupRecordingHandles(true);
    stopPreviewAudio();
    playSfx('tap');
    setCategoryId(nextCat);
    const catObj = CUSTOM_VOICE_CATEGORIES.find((c) => c.id === nextCat);
    if (catObj) {
      const firstUnrecorded = catObj.items.findIndex((it) => !hasClip(activeSpeaker, it.key));
      setSelectedIndex(firstUnrecorded >= 0 ? firstUnrecorded : 0);
    } else {
      setSelectedIndex(0);
    }
  };

  const handleSelectSpeaker = (sp: CustomVoiceSpeaker) => {
    cleanupRecordingHandles(true);
    stopPreviewAudio();
    playSfx('tap');
    setActiveSpeaker(sp);
    setConfirmClearAll(false);
  };

  const handleMoveNext = () => {
    cleanupRecordingHandles(true);
    stopPreviewAudio();
    playSfx('tap');
    if (safeIndex + 1 < activeItems.length) {
      setSelectedIndex(safeIndex + 1);
    } else {
      const catIdx = CUSTOM_VOICE_CATEGORIES.findIndex((c) => c.id === categoryId);
      const nextCat = CUSTOM_VOICE_CATEGORIES[(catIdx + 1) % CUSTOM_VOICE_CATEGORIES.length];
      setCategoryId(nextCat.id);
      setSelectedIndex(0);
    }
  };

  const startRecording = async () => {
    if (!currentItem) return;
    if (isRecording) {
      cleanupRecordingHandles(false);
      return;
    }

    // Stop any playing sound BEFORE opening mic so chimes/voices don't bleed into the recording
    stopAllSpeech();
    stopPreviewAudio();
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setMicError(null);
    chunksRef.current = [];

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setMicError('이 브라우저에서는 마이크 녹음을 사용할 수 없어요. 아래 기기별 허용 방법을 확인해 주세요.');
      return;
    }

    const targetSpeaker = activeSpeaker;
    const targetItem = currentItem;
    const targetIndex = safeIndex;
    const totalInCategory = activeItems.length;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        const candidates = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/aac',
          'audio/ogg',
        ];
        for (const c of candidates) {
          if (MediaRecorder.isTypeSupported(c)) {
            mimeType = c;
            break;
          }
        }
      }

      let recorder: MediaRecorder;
      try {
        recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      } catch {
        recorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        if (mediaStreamRef.current) {
          try {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          } catch {}
          mediaStreamRef.current = null;
        }
        mediaRecorderRef.current = null;

        if (chunksRef.current.length === 0) {
          showNotice('⚠️ 소리가 잘 안 들렸어요. 조금 더 크게 말하고 다시 눌러보세요!');
          return;
        }

        const actualType = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: actualType });
        const elapsedMs = Date.now() - recordStartTimeRef.current;

        const savedUrl = await saveCustomVoiceClip(
          targetSpeaker,
          targetItem.key,
          blob,
          elapsedMs
        );

        showNotice(`🎉 "${targetItem.display}" (${getSpeakerMeta(targetSpeaker).shortName}) 목소리 저장 완료!`);

        // Immediately play back the freshly recorded human voice so child/parent hears the result
        playClipUrl(savedUrl, () => {
          if (autoAdvance && targetIndex + 1 < totalInCategory) {
            advanceTimerRef.current = setTimeout(() => {
              setSelectedIndex(targetIndex + 1);
            }, 350);
          }
        });

        const newCount = getCountForSpeaker(targetSpeaker);
        if (newCount === 1 || newCount === 14 || newCount === 24 || newCount === TOTAL_CUSTOM_VOICE_ITEMS) {
          confetti({ particleCount: 36, spread: 60, origin: { y: 0.72 } });
        }
      };

      recordStartTimeRef.current = Date.now();
      recorder.start(100);
      setIsRecording(true);
      setRecordMs(0);

      tickTimerRef.current = setInterval(() => {
        const diff = Date.now() - recordStartTimeRef.current;
        setRecordMs(Math.min(MAX_RECORD_MS, diff));
      }, 60);

      autoStopTimerRef.current = setTimeout(() => {
        cleanupRecordingHandles(false);
      }, MAX_RECORD_MS);
    } catch {
      cleanupRecordingHandles(true);
      setMicError('마이크 권한이 차단되어 있어요. 아래 안내대로 허용 후 "마이크 다시 시도"를 눌러 주세요.');
    }
  };

  const handlePlayReferenceSound = () => {
    if (!currentItem || isRecording) return;
    stopPreviewAudio();
    const refTone =
      activeSpeaker === 'dad' ? 'dad' : activeSpeaker === 'mom' ? 'mom' : 'friend';
    speakKorean(currentItem.key, false, refTone, { bypassCustomVoice: true });
  };

  const handleDeleteCurrentClip = async () => {
    if (!currentItem) return;
    stopPreviewAudio();
    playSfx('erase');
    await deleteCustomVoiceClip(activeSpeaker, currentItem.key);
    showNotice(`"${currentItem.display}" 녹음을 지웠어요.`);
  };

  const handleClearSpeakerAll = async () => {
    if (!confirmClearAll) {
      setConfirmClearAll(true);
      return;
    }
    stopPreviewAudio();
    playSfx('erase');
    await clearSpeakerClips(activeSpeaker);
    setConfirmClearAll(false);
    showNotice(`${speakerMeta.shortName} 녹음을 모두 정리했어요.`);
  };

  const recordPct = Math.min(100, Math.round((recordMs / MAX_RECORD_MS) * 100));
  const cleanChildName = (childName || '').trim() || '우리 아이';

  return (
    <div
      className="fixed inset-0 z-[70] bg-stone-900/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg max-h-[92vh] bg-gradient-to-b from-[#FFFDF9] via-[#FFF9F2] to-[#FFF4E8] rounded-3xl border-2 border-[#F5DFC9] shadow-2xl flex flex-col overflow-hidden box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 pt-4 pb-3 border-b border-[#F2E3D2] bg-white/85 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xl">🎙️</span>
              <h2 className="font-jua text-lg sm:text-xl text-[#1b1917] truncate">
                우리 가족 목소리 녹음실
              </h2>
            </div>
            <p className="text-[11px] font-hand text-[#7a7066] mt-0.5 break-keep">
              로봇 AI 대신 {cleanChildName}·아빠·엄마의 진짜 목소리로 한글을 배워요!
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="relative z-30 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-[#FFF4EA] hover:bg-[#FDE6D2] border border-[#F0D5BC] text-[#5c534a] flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer"
            aria-label="닫기"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 space-y-3.5 scrollbar-thin scrollbar-thumb-orange-200">
          {/* Active Mode Priority Toggle */}
          <div className="bg-white rounded-2xl p-3 border border-[#EEDCC8] shadow-2xs flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-jua text-xs sm:text-sm text-[#1b1917] flex items-center gap-1.5 flex-wrap">
                <span>내 녹음 목소리 우선 사용</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF2EA] text-[#D95338] border border-[#F9D2C4] whitespace-nowrap">
                  {speakerMeta.emoji} {activeSpeakerCount}/{TOTAL_CUSTOM_VOICE_ITEMS}개 완료
                </span>
              </div>
              <p className="text-[11px] font-hand text-[#84796e] mt-0.5 break-keep">
                {enabled
                  ? activeSpeakerCount > 0
                    ? `진도표·퀴즈에서 녹음된 ${speakerMeta.shortName} 목소리가 먼저 나와요!`
                    : '아직 녹음된 글자가 없어요. 아래에서 1개만 녹음해도 바로 적용돼요!'
                  : '지금은 기본 안내 목소리가 나와요 (켜면 내 녹음 우선 재생)'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                playSfx('tap');
                setEnabled(!enabled);
              }}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl font-jua text-xs border transition-all active:scale-95 shrink-0 whitespace-nowrap ${
                enabled
                  ? 'bg-[#2B9362] text-white border-[#2B9362] shadow-xs'
                  : 'bg-[#F7F3ED] text-[#6e645b] border-[#E4D8C9]'
              }`}
            >
              {enabled ? '🔊 켜짐 ON' : '꺼짐 OFF'}
            </button>
          </div>

          {/* Speaker Selector (Child / Dad / Mom) */}
          <div className="grid grid-cols-3 gap-2">
            {CUSTOM_SPEAKERS.map((sp) => {
              const selected = activeSpeaker === sp.id;
              const cnt = getCountForSpeaker(sp.id);
              return (
                <button
                  type="button"
                  key={sp.id}
                  onClick={() => handleSelectSpeaker(sp.id)}
                  className={`min-h-[60px] p-2 rounded-2xl border text-center transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                    selected
                      ? 'bg-[#FFF0E8] border-[#E76F51] ring-2 ring-[#E76F51]/20 shadow-xs'
                      : 'bg-white border-[#ECE0D1] hover:border-[#E76F51]/50'
                  }`}
                >
                  <div className="flex items-center gap-1 font-jua text-xs sm:text-sm text-[#1b1917]">
                    <span>{sp.emoji}</span>
                    <span>{sp.shortName}</span>
                  </div>
                  <span
                    className={`text-[10px] font-jua px-2 py-0.5 rounded-full ${
                      cnt > 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {cnt}/{TOTAL_CUSTOM_VOICE_ITEMS}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Category Tabs */}
          <div className="grid grid-cols-4 gap-1.5 bg-[#F5EBDF] p-1 rounded-2xl">
            {CUSTOM_VOICE_CATEGORIES.map((cat) => {
              const catDone = cat.items.filter((it) => hasClip(activeSpeaker, it.key)).length;
              const active = categoryId === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`min-h-[44px] py-1.5 px-1 rounded-xl font-jua transition-all flex flex-col items-center justify-center leading-tight ${
                    active
                      ? 'bg-white text-[#D95338] shadow-xs'
                      : 'text-[#6e645b] hover:text-[#1b1917]'
                  }`}
                >
                  <span className="text-[11px] sm:text-xs whitespace-nowrap">
                    {cat.emoji} {cat.label.replace(' 14자', '').replace(' 10자', '').replace(' 10개', '')}
                  </span>
                  <span className="text-[10px] font-hand opacity-80">
                    {catDone}/{cat.items.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Toast Feedback */}
          {statusNotice && (
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-jua text-center animate-fadeIn">
              {statusNotice}
            </div>
          )}

          {/* Mic Permission Guide if blocked */}
          {micError && (
            <MicPermissionGuide
              errorMessage={micError}
              onRetry={startRecording}
              onClose={() => setMicError(null)}
            />
          )}

          {/* Spotlight Guided Recorder Card */}
          {currentItem && (
            <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#F3D8BE] shadow-sm space-y-3.5 text-center relative">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-jua text-[#84796e]">
                  {safeIndex + 1} / {activeItems.length}
                </span>
                {currentClipUrl ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-jua text-[11px]">
                    <Check className="w-3.5 h-3.5" /> {speakerMeta.shortName} 녹음 완료
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-jua text-[11px]">
                    아직 녹음 전
                  </span>
                )}
              </div>

              {/* Big Letter Display */}
              <div className="py-2">
                <div className="inline-flex flex-col items-center justify-center min-w-[116px] px-6 py-4 rounded-3xl bg-gradient-to-b from-[#FFF9F2] to-[#FFEFE2] border-2 border-[#F8D9BC] shadow-inner">
                  <span
                    className={`font-jua text-[#1b1917] leading-none ${
                      currentItem.display.length >= 2 ? 'text-4xl sm:text-5xl' : 'text-5xl sm:text-6xl'
                    }`}
                  >
                    {currentItem.display}
                  </span>
                  <span className="mt-2 font-jua text-sm text-[#D95338]">
                    “{currentItem.hint}”
                  </span>
                </div>
                <p className="mt-2.5 text-xs font-hand text-[#6e645b] break-keep">
                  {isRecording
                    ? `🎙️ 지금 바로 "${currentItem.hint}!" 하고 말씀해 주세요...`
                    : activeSpeaker === 'child'
                    ? `${cleanChildName}야, "${currentItem.hint}!" 하고 밝게 녹음해 볼까?`
                    : `${speakerMeta.shortName}가 아이에게 들려주듯 "${currentItem.hint}!" 하고 녹음해 주세요.`}
                </p>
              </div>

              {/* Recording Progress Bar */}
              {isRecording && (
                <div className="space-y-1">
                  <div className="h-2.5 w-full bg-rose-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#E76F51] transition-all duration-75"
                      style={{ width: `${recordPct}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-jua text-rose-600">
                    녹음 중 {(recordMs / 1000).toFixed(1)}초 / 2.5초 (끝나면 자동 저장)
                  </div>
                </div>
              )}

              {/* Primary Record Button */}
              <button
                type="button"
                onClick={startRecording}
                className={`w-full min-h-[54px] py-3 px-4 rounded-2xl font-jua text-base shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                    : 'bg-gradient-to-r from-[#FF7B54] to-[#E76F51] hover:from-[#f06b44] hover:to-[#d95d3f] text-white'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-5 h-5 fill-current" />
                    <span>말하기 끝! 바로 저장하기</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span>{currentClipUrl ? '다시 녹음하기 (2.5초)' : '눌러서 녹음하기 (2.5초)'}</span>
                  </>
                )}
              </button>

              {/* Secondary Controls Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={handlePlayReferenceSound}
                  className="min-h-[42px] px-2.5 py-2 rounded-xl bg-[#FDF5EC] hover:bg-[#FCE8D2] border border-[#F3D8BA] text-[#7A5117] font-jua text-xs flex items-center justify-center gap-1 disabled:opacity-50 active:scale-95 transition-all"
                >
                  <Volume2 className="w-3.5 h-3.5 shrink-0" />
                  <span>따라할 소리</span>
                </button>

                <button
                  type="button"
                  disabled={!currentClipUrl || isRecording}
                  onClick={() => currentClipUrl && playClipUrl(currentClipUrl)}
                  className={`min-h-[42px] px-2.5 py-2 rounded-xl border font-jua text-xs flex items-center justify-center gap-1 active:scale-95 transition-all ${
                    currentClipUrl
                      ? isPlayingClip
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-stone-50 text-stone-300 border-stone-200 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 shrink-0 fill-current" />
                  <span>{isPlayingClip ? '재생 중...' : '내 녹음 듣기'}</span>
                </button>

                <button
                  type="button"
                  disabled={!currentClipUrl || isRecording}
                  onClick={handleDeleteCurrentClip}
                  className={`min-h-[42px] px-2.5 py-2 rounded-xl border font-jua text-xs flex items-center justify-center gap-1 active:scale-95 transition-all ${
                    currentClipUrl
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-stone-50 text-stone-300 border-stone-200 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>지우기</span>
                </button>

                <button
                  type="button"
                  disabled={isRecording}
                  onClick={handleMoveNext}
                  className="min-h-[42px] px-2.5 py-2 rounded-xl bg-[#FFFDF9] hover:bg-[#F7EFE5] border border-[#E5D7C6] text-[#4A423A] font-jua text-xs flex items-center justify-center gap-1 disabled:opacity-50 active:scale-95 transition-all"
                >
                  <span>다음 글자</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>

              {/* Auto-advance preference */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F5ECE0] text-[11px]">
                <label className="inline-flex items-center gap-1.5 font-hand text-[#6e645b] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={(e) => setAutoAdvance(e.target.checked)}
                    className="rounded border-orange-300 text-[#E76F51] focus:ring-[#E76F51]"
                  />
                  <span>녹음 후 자동으로 다음 글자 넘어가기</span>
                </label>

                {activeSpeakerCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSpeakerAll}
                    className={`px-2 py-1 rounded-lg font-jua text-[10px] border transition-all ${
                      confirmClearAll
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-stone-500 border-stone-200 hover:text-rose-600'
                    }`}
                  >
                    {confirmClearAll ? '정말 모두 지울까요?' : `${speakerMeta.shortName} 전체 비우기`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Selection Grid for Active Category */}
          <div className="bg-white rounded-3xl p-3.5 border border-[#EEDCC8] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-jua text-[#1b1917] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#E76F51]" />
                {activeCategory.label} 목록 (눌러서 바로 선택)
              </span>
              <span className="font-hand text-[11px] text-[#84796e]">{activeCategory.guide}</span>
            </div>

            <div
              className={`grid gap-1.5 ${
                categoryId === 'word' ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-5 sm:grid-cols-7'
              }`}
            >
              {activeItems.map((item, idx) => {
                const recorded = hasClip(activeSpeaker, item.key);
                const isSelected = idx === safeIndex;
                return (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => {
                      cleanupRecordingHandles(true);
                      stopPreviewAudio();
                      playSfx('tap');
                      setSelectedIndex(idx);
                      const clipUrl = getCustomVoiceClipUrl(activeSpeaker, item.key);
                      if (clipUrl) {
                        playClipUrl(clipUrl);
                      }
                    }}
                    className={`min-h-[48px] py-1.5 px-1 rounded-2xl border font-jua transition-all active:scale-95 relative flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#FFF0E8] border-[#E76F51] text-[#D95338] ring-2 ring-[#E76F51]/25 shadow-xs'
                        : recorded
                        ? 'bg-emerald-50/70 border-emerald-200 text-[#1b1917]'
                        : 'bg-[#FAF7F2] border-[#ECE0D1] text-[#5c534a] hover:border-[#E76F51]/40'
                    }`}
                  >
                    <span className={categoryId === 'word' ? 'text-sm' : 'text-lg leading-none'}>
                      {item.display}
                    </span>
                    {categoryId !== 'word' && item.hint !== item.display && (
                      <span className="text-[9px] font-hand text-[#8a8178] mt-0.5">
                        {item.hint}
                      </span>
                    )}
                    {recorded && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center shadow-2xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 bg-white/90 border-t border-[#F2E3D2] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-hand text-[#7a7066]">
            <RotateCcw className="w-3.5 h-3.5 text-[#E76F51] shrink-0" />
            <span>녹음은 이 기기에 안전하게 저장돼요</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[42px] px-5 py-2 rounded-2xl bg-[#1b1917] hover:bg-[#332f2b] text-white font-jua text-sm active:scale-95 transition-all shrink-0"
          >
            적용하고 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
