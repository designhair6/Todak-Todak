import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Mic,
  Square,
  Play,
  Pause,
  Volume2,
  Sparkles,
  Heart,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Upload,
  Wand2,
  MessageCircle,
} from 'lucide-react';
import { playSfx, speakKorean } from '../utils/sound';
import {
  getParentVoiceMission,
  saveParentVoiceMission,
  ParentVoiceMissionConfig,
  PRESET_SCRIPTS,
  generateParentPraiseSample,
  playParentPraiseVoice,
} from '../utils/parentVoiceHelper';
import { MicPermissionGuide } from './MicPermissionGuide';

interface ParentVoiceMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName?: string;
  currentLetter?: string;
}

export const ParentVoiceMissionModal: React.FC<ParentVoiceMissionModalProps> = ({
  isOpen,
  onClose,
  childName = '시아',
  currentLetter = '시',
}) => {
  const [config, setConfig] = useState<ParentVoiceMissionConfig>(() =>
    getParentVoiceMission()
  );

  const [scriptInput, setScriptInput] = useState(config.recordingScript);
  const [fallbackInput, setFallbackInput] = useState(config.fallbackTTS);
  const [guideTextInput, setGuideTextInput] = useState(config.guideText);

  // Recording state (5-second limit)
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync when modal opens
  useEffect(() => {
    if (isOpen) {
      const saved = getParentVoiceMission();
      setConfig(saved);
      setScriptInput(saved.recordingScript);
      setFallbackInput(saved.fallbackTTS);
      setGuideTextInput(saved.guideText);
      setIsRecording(false);
      setIsPlayingRecorded(false);
      setRecordSeconds(0);
      setMicError(null);
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  // Stop recording with 5-second automatic limit
  const stopRecording = (save: boolean = true) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);

    const recorder = mediaRecorderRef.current;
    if (recorder) {
      try {
        if (!save) {
          recorder.onstop = null;
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
          }
          mediaRecorderRef.current = null;
        } else if (recorder.state === 'recording') {
          recorder.stop();
        }
      } catch (err) {
        console.warn('Error stopping MediaRecorder:', err);
      }
    }
  };

  // Clean up on close/unmount
  useEffect(() => {
    return () => {
      stopRecording(false);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  // Start 5-second voice recording
  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setMicError(
        '현재 브라우저에서 마이크 녹음이 지원되지 않습니다. 아래 기기별 안내를 확인하거나 샘플 목소리를 사용해 주세요.'
      );
      return;
    }

    try {
      playSfx('tap');
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
        for (const t of candidates) {
          if (MediaRecorder.isTypeSupported(t)) {
            mimeType = t;
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

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (mediaStreamRef.current) {
          try {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          } catch {}
          mediaStreamRef.current = null;
        }

        if (audioChunksRef.current.length > 0) {
          const actualType = recorder.mimeType || mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: actualType });
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              const url = reader.result as string;
              const updated = {
                ...config,
                audioUrl: url,
                recordingScript: scriptInput,
                fallbackTTS: fallbackInput,
                guideText: guideTextInput,
                recordedAt: new Date().toLocaleDateString('ko-KR'),
                enabled: true,
              };
              setConfig(updated);
              saveParentVoiceMission(updated);
              playSfx('fan');
              confetti({ particleCount: 40, spread: 60 });
              showToast('🎉 엄마/아빠 목소리가 저장되었습니다!');
            }
          };
          reader.readAsDataURL(audioBlob);
        } else {
          showToast('⚠️ 녹음된 소리가 없습니다. 다시 시도해 주세요.');
        }
        mediaRecorderRef.current = null;
      };

      recorder.start(200);
      setIsRecording(true);
      setRecordSeconds(0);

      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setRecordSeconds(elapsed);
        if (elapsed >= 5) {
          stopRecording(true);
        }
      }, 1000);
    } catch (err: any) {
      setIsRecording(false);
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        mediaStreamRef.current = null;
      }
      console.warn('Microphone permission or hardware error:', err);
      setMicError(
        '마이크 권한이 꺼져 있습니다. 아래 안내에 따라 마이크를 허용하거나 샘플 목소리를 사용해 보세요.'
      );
    }
  };

  // Play/Pause recorded voice
  const togglePlayRecorded = () => {
    if (!config.audioUrl) return;

    if (isPlayingRecorded) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      setIsPlayingRecorded(false);
      return;
    }

    try {
      playSfx('tap');
      const audio = new Audio(config.audioUrl);
      audioPlayerRef.current = audio;
      setIsPlayingRecorded(true);

      audio.onended = () => {
        setIsPlayingRecorded(false);
        audioPlayerRef.current = null;
      };
      audio.onerror = () => {
        setIsPlayingRecorded(false);
        audioPlayerRef.current = null;
        showToast('음원 재생 중 오류가 발생했습니다.');
      };
      audio.play();
    } catch {
      setIsPlayingRecorded(false);
    }
  };

  // Test simulation of praise
  const testPraisePlayback = () => {
    playParentPraiseVoice({
      childName,
      letter: currentLetter,
      onEnd: () => showToast('✨ 아이가 문제를 맞히면 이렇게 칭찬 소리가 재생됩니다!'),
    });
  };

  // Test fallback TTS voice
  const testFallbackVoice = () => {
    playSfx('fan');
    speakKorean(fallbackInput || '정답이에요! 참 잘했어요!');
  };

  // Generate instant audio sample for mic-less testing
  const handleGenerateSample = async () => {
    try {
      playSfx('pop');
      const sampleUrl = await generateParentPraiseSample('엄마');
      const updated = {
        ...config,
        audioUrl: sampleUrl,
        recordingScript: scriptInput,
        fallbackTTS: fallbackInput,
        guideText: guideTextInput,
        recordedAt: new Date().toLocaleDateString('ko-KR') + ' (샘플)',
        enabled: true,
      };
      setConfig(updated);
      saveParentVoiceMission(updated);
      playSfx('fan');
      confetti({ particleCount: 30, spread: 60 });
      showToast('🪄 테스트용 칭찬 목소리 샘플이 즉시 등록되었습니다!');
    } catch {
      showToast('샘플 생성에 실패했습니다.');
    }
  };

  // File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    playSfx('pop');
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        const updated = {
          ...config,
          audioUrl: reader.result as string,
          recordingScript: scriptInput,
          fallbackTTS: fallbackInput,
          guideText: guideTextInput,
          recordedAt: new Date().toLocaleDateString('ko-KR'),
          enabled: true,
        };
        setConfig(updated);
        saveParentVoiceMission(updated);
        playSfx('fan');
        confetti({ particleCount: 35, spread: 60 });
        showToast('📁 오디오 파일이 칭찬 목소리로 등록되었습니다!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove recorded audio
  const handleRemoveAudio = () => {
    playSfx('erase');
    const updated = {
      ...config,
      audioUrl: undefined,
      recordedAt: undefined,
    };
    setConfig(updated);
    saveParentVoiceMission(updated);
    showToast('등록된 목소리가 삭제되어 기본 음성(TTS)으로 대체됩니다.');
  };

  // Apply script preset
  const applyPresetScript = (template: string) => {
    playSfx('tap');
    const text = template
      .replace('{name}', childName)
      .replace('{letter}', currentLetter);
    setScriptInput(text);
  };

  // Save text settings
  const handleSaveSettings = () => {
    playSfx('pop');
    const updated = {
      ...config,
      guideText: guideTextInput.trim() || config.guideText,
      recordingScript: scriptInput.trim() || config.recordingScript,
      fallbackTTS: fallbackInput.trim() || '정답이에요! 참 잘했어요!',
    };
    setConfig(updated);
    saveParentVoiceMission(updated);
    showToast('설정이 안전하게 저장되었습니다!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn font-body">
      <div className="bg-[#fffdfa] border-2 border-[#eedfc9] rounded-3xl w-full max-w-lg box-border overflow-hidden shadow-2xl p-4 sm:p-6 text-left space-y-3.5 animate-pop max-h-[92vh] flex flex-col relative">
        {/* Modal Top Header */}
        <div className="flex items-start justify-between gap-2 border-b border-[#f0ebe1] pb-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#c9502f] to-[#ea580c] text-white flex items-center justify-center shadow-xs shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-jua text-base sm:text-lg text-[#1b1917] break-keep leading-tight">
                엄마/아빠 칭찬 목소리
              </h2>
              <p className="text-xs text-[#8a8178] font-hand mt-0.5 break-keep">
                정답을 맞히면 부모님 목소리가 바로 나와요!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playSfx('tap');
              onClose();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              playSfx('tap');
              onClose();
            }}
            className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] hover:bg-[#f6f1e7] transition-all shrink-0 cursor-pointer active:scale-95"
            aria-label="닫기"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast notice */}
        {notice && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-jua flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="break-keep">{notice}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="space-y-3.5 overflow-y-auto overflow-x-hidden flex-1 box-border scrollbar-thin">
          {/* Script to read during recording */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#eedfc9] space-y-2.5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <label className="text-xs font-bold text-[#1b1917] font-jua flex items-center gap-1">
                <span>🎙️</span>
                <span>따라 읽을 칭찬 대본</span>
              </label>
              <span className="text-[11px] text-[#8a8178] font-hand">
                아래 글을 소리 내어 읽어주세요
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#fdf6ee] to-[#fffbf7] border-2 border-dashed border-[#e8c5b0] text-center">
              <p className="font-jua text-sm sm:text-base text-[#c9502f] leading-snug break-keep">
                "{scriptInput}"
              </p>
            </div>

            {/* Quick preset script chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[11px] text-[#8a8178] font-hand shrink-0">추천 대본:</span>
              {PRESET_SCRIPTS.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPresetScript(tmpl)}
                  className="min-h-[34px] px-2.5 py-1 rounded-xl bg-[#faf8f5] hover:bg-[#f3ece0] text-xs font-jua text-[#8a5d3b] border border-[#e8d5be] transition-colors active:scale-95 whitespace-nowrap"
                >
                  대본 {idx + 1}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={scriptInput}
              onChange={(e) => setScriptInput(e.target.value)}
              placeholder="직접 녹음할 칭찬 문구를 적어주세요"
              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#e4dccf] bg-white text-xs sm:text-sm font-jua outline-none focus:border-[#c9502f]"
            />
          </div>

          {/* 5-second Recording Control Center */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#eedfc9] space-y-3 shadow-xs text-center">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-jua text-[#1b1917]">
                ⏱️ 5초 칭찬 녹음
              </span>
              <span className="text-xs font-bold font-mono text-[#c9502f]">
                {isRecording ? `${5 - recordSeconds}초 남음` : '최대 5초'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-[#f0ebe1] overflow-hidden">
              <div
                className="h-full bg-[#c9502f] transition-all duration-300"
                style={{
                  width: isRecording ? `${(recordSeconds / 5) * 100}%` : config.audioUrl ? '100%' : '0%',
                }}
              />
            </div>

            {/* Big Mic / Stop Button */}
            <div className="py-1 flex items-center justify-center">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-full min-h-[52px] px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#c9502f] to-[#ea580c] hover:from-[#b54122] hover:to-[#d04a05] text-white font-jua text-base flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <Mic className="w-5 h-5 shrink-0" />
                  <span>5초 녹음 시작하기</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => stopRecording(true)}
                  className="w-full min-h-[52px] px-5 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-jua text-base flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <Square className="w-5 h-5 fill-current shrink-0" />
                  <span>녹음 끝내기 ({recordSeconds}s)</span>
                </button>
              )}
            </div>

            {micError && (
              <MicPermissionGuide
                errorMessage={micError}
                onClose={() => setMicError(null)}
                onGenerateSample={handleGenerateSample}
                sampleButtonText="⚡ 테스트용 샘플 목소리 생성"
                onRetry={() => {
                  setMicError(null);
                  startRecording();
                }}
              />
            )}

            {/* Recorded Audio Status & Actions */}
            {config.audioUrl ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-900 font-jua">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>녹음 완료 ({config.recordedAt})</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={togglePlayRecorded}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-jua text-xs flex items-center gap-1 shadow-2xs active:scale-95 whitespace-nowrap"
                  >
                    {isPlayingRecorded ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isPlayingRecorded ? '멈춤' : '들어보기'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveAudio}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 font-jua text-xs active:scale-95 whitespace-nowrap"
                    title="녹음 삭제"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8a8178] font-hand break-keep">
                녹음 전에는 다정한 엄마 목소리로 칭찬해 드려요.
              </p>
            )}

            {/* Quick alternative buttons */}
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={handleGenerateSample}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#fdf3e4] hover:bg-[#fae7ce] text-[#c9502f] border border-[#f5b8a6] text-xs font-jua flex items-center gap-1 active:scale-95 whitespace-nowrap"
              >
                <Wand2 className="w-3.5 h-3.5 shrink-0" />
                <span>샘플 목소리 만들기</span>
              </button>

              <label className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#faf8f5] hover:bg-[#f3ece0] text-stone-700 border border-stone-300 text-xs font-jua flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap">
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span>파일 올리기</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Fallback TTS configuration */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#eedfc9] space-y-2 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#1b1917] font-jua flex items-center gap-1">
                <span>🔊</span>
                <span>기본 칭찬 문구</span>
              </label>
              <button
                type="button"
                onClick={testFallbackVoice}
                className="min-h-[36px] px-2.5 rounded-lg bg-[#fff5f2] text-xs text-[#c9502f] font-jua flex items-center gap-1 whitespace-nowrap"
              >
                <Volume2 className="w-3.5 h-3.5" />
                소리 듣기
              </button>
            </div>
            <input
              type="text"
              value={fallbackInput}
              onChange={(e) => setFallbackInput(e.target.value)}
              placeholder="예: 정답이에요! 참 잘했어요!"
              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#e4dccf] bg-white text-xs sm:text-sm font-jua outline-none focus:border-[#c9502f]"
            />
          </div>

          {/* Test Simulation Button */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-wrap items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <span className="font-jua text-xs sm:text-sm text-amber-950 block">
                🎯 칭찬 소리 미리듣기
              </span>
              <span className="text-[11px] text-amber-800 font-hand break-keep">
                정답 시 재생되는 소리를 확인해요
              </span>
            </div>
            <button
              type="button"
              onClick={testPraisePlayback}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-jua text-xs shadow-xs active:scale-95 shrink-0 transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>재생 테스트</span>
            </button>
          </div>
        </div>

        {/* Modal Bottom Buttons */}
        <div className="pt-3 border-t border-[#f0ebe1] flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveSettings}
            className="flex-1 min-h-[48px] px-3 py-2.5 rounded-xl bg-white border border-[#e4dccf] hover:bg-[#faf8f5] text-[#1b1917] font-jua text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 whitespace-nowrap"
          >
            <Save className="w-4 h-4 text-[#c9502f]" />
            <span>저장</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSfx('fan');
              handleSaveSettings();
              onClose();
            }}
            className="flex-[1.5] min-h-[48px] px-4 py-2.5 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-xs sm:text-sm shadow-sm active:scale-95 transition-all whitespace-nowrap"
          >
            완료하고 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
