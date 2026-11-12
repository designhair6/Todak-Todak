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

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError(
        '이 브라우저에서는 마이크 접근이 제한되어 있습니다. 아래 [샘플 목소리 생성] 또는 [오디오 파일 올리기]를 이용해주세요.'
      );
      return;
    }

    try {
      playSfx('tap');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
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
            showToast('🎉 엄마/아빠 목소리가 성공적으로 저장되었습니다!');
          }
        };
        reader.readAsDataURL(audioBlob);

        // Stop stream
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordSeconds(0);

      // 5-second countdown timer
      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setRecordSeconds(elapsed);
        if (elapsed >= 5) {
          stopRecording(true);
        }
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone permission or hardware error:', err);
      setMicError(
        '마이크 권한이 비활성화되어 있습니다. 아래 윈도우/맥/스마트폰 설정에 따라 마이크를 [허용]하시거나, [샘플 목소리 생성]을 이용해주세요!'
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
      <div className="bg-[#fffdfa] border-2 border-[#eedfc9] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-5 sm:p-6 text-left space-y-4 animate-pop max-h-[92vh] flex flex-col relative">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-[#f0ebe1] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#c9502f] to-[#ea580c] text-white flex items-center justify-center shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-jua text-base sm:text-lg text-[#1b1917] flex items-center gap-1.5">
                <span>엄마/아빠 목소리 칭찬 미션</span>
                <span className="text-[10px] font-jua px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  💖 부모 음성 칭찬
                </span>
              </h2>
              <p className="text-[11px] text-[#8a8178] font-hand">
                아이가 글자를 맞히면 엄마 아빠의 다정한 목소리가 바로 나와요!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playSfx('tap');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] hover:bg-[#f6f1e7] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toast notice */}
        {notice && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-jua flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1 scrollbar-thin">
          {/* Guide Text Banner */}
          <div className="p-3.5 rounded-2xl bg-[#fff8ed] border border-[#f5dd9f] space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#b45309] font-jua">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>미션 안내 (guideText)</span>
            </div>
            <p className="text-xs sm:text-sm text-[#78350f] font-jua leading-relaxed">
              "{guideTextInput}"
            </p>
          </div>

          {/* Script to read during recording */}
          <div className="p-4 rounded-2xl bg-white border border-[#eedfc9] space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1b1917] font-jua flex items-center gap-1">
                <span>🎙️</span>
                <span>녹음 대본 (recordingScript):</span>
              </label>
              <span className="text-[10px] text-[#8a8178] font-hand">
                녹음 버튼을 누르고 아래 글을 읽어주세요
              </span>
            </div>

            {/* Script Display Quote Box */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#fdf6ee] to-[#fffbf7] border-2 border-dashed border-[#e8c5b0] text-center">
              <p className="font-jua text-sm sm:text-base text-[#c9502f] leading-snug">
                "{scriptInput}"
              </p>
            </div>

            {/* Quick preset script chips */}
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              <span className="text-[10px] text-[#8a8178] font-hand">대본 추천:</span>
              {PRESET_SCRIPTS.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPresetScript(tmpl)}
                  className="px-2 py-0.5 rounded-lg bg-[#faf8f5] hover:bg-[#f3ece0] text-[10px] font-jua text-[#8a5d3b] border border-[#e8d5be] transition-colors active:scale-95"
                >
                  대본 {idx + 1}
                </button>
              ))}
            </div>

            {/* Editable Script Input */}
            <div>
              <input
                type="text"
                value={scriptInput}
                onChange={(e) => setScriptInput(e.target.value)}
                placeholder="직접 녹음할 칭찬 대본을 적어주세요"
                className="w-full px-3 py-2 rounded-xl border border-[#e4dccf] bg-white text-xs font-jua outline-none focus:border-[#c9502f]"
              />
            </div>
          </div>

          {/* 5-second Recording Control Center */}
          <div className="p-4 rounded-2xl bg-white border border-[#eedfc9] space-y-3 shadow-xs text-center">
            <div className="flex items-center justify-between">
              <span className="text-xs font-jua text-[#1b1917]">
                ⏱️ 5초 칭찬 목소리 녹음하기
              </span>
              <span className="text-xs font-bold font-mono text-[#c9502f]">
                {isRecording ? `${5 - recordSeconds}초 남음` : '최대 5초'}
              </span>
            </div>

            {/* Progress Bar (5 seconds) */}
            <div className="w-full h-2 rounded-full bg-[#f0ebe1] overflow-hidden">
              <div
                className="h-full bg-[#c9502f] transition-all duration-300"
                style={{
                  width: isRecording ? `${(recordSeconds / 5) * 100}%` : config.audioUrl ? '100%' : '0%',
                }}
              />
            </div>

            {/* Big Mic / Stop Button */}
            <div className="py-2 flex items-center justify-center gap-3">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#c9502f] to-[#ea580c] hover:from-[#b54122] hover:to-[#d04a05] text-white font-jua text-sm sm:text-base flex items-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <Mic className="w-5 h-5 animate-pulse" />
                  <span>5초 녹음 시작하기</span>
                </button>
              ) : (
                <button
                  onClick={() => stopRecording(true)}
                  className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-jua text-sm sm:text-base flex items-center gap-2 shadow-md animate-pulse active:scale-95 transition-all"
                >
                  <Square className="w-5 h-5 fill-current" />
                  <span>녹음 완료하기 ({recordSeconds}s)</span>
                </button>
              )}
            </div>

            {micError && (
              <MicPermissionGuide
                errorMessage={micError}
                onClose={() => setMicError(null)}
                onGenerateSample={handleGenerateSample}
                sampleButtonText="⚡ 테스트용 샘플 목소리 즉시 생성"
                onRetry={() => {
                  setMicError(null);
                  startRecording();
                }}
              />
            )}

            {/* Recorded Audio Status & Actions */}
            {config.audioUrl ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-jua">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>녹음 완료 ({config.recordedAt})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={togglePlayRecorded}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-jua text-xs flex items-center gap-1 shadow-2xs active:scale-95"
                  >
                    {isPlayingRecorded ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isPlayingRecorded ? '멈춤' : '들어보기'}</span>
                  </button>
                  <button
                    onClick={handleRemoveAudio}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 font-jua text-xs active:scale-95"
                    title="녹음 삭제"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-[#8a8178] font-hand">
                아직 엄마/아빠 목소리가 녹음되지 않았습니다. 녹음 전에는 기본 칭찬 음성이 재생됩니다.
              </div>
            )}

            {/* Quick alternative buttons (Sample or file upload) */}
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={handleGenerateSample}
                className="px-3 py-1.5 rounded-xl bg-[#fdf3e4] hover:bg-[#fae7ce] text-[#c9502f] border border-[#f5b8a6] text-[11px] font-jua flex items-center gap-1 active:scale-95"
              >
                <Wand2 className="w-3 h-3" />
                <span>테스트용 샘플 목소리 즉시 생성</span>
              </button>

              <label className="px-3 py-1.5 rounded-xl bg-[#faf8f5] hover:bg-[#f3ece0] text-stone-700 border border-stone-300 text-[11px] font-jua flex items-center gap-1 cursor-pointer active:scale-95">
                <Upload className="w-3 h-3" />
                <span>오디오 파일 올리기</span>
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1b1917] font-jua flex items-center gap-1">
                <span>🤖</span>
                <span>기본 대체 음성 (fallbackTTS):</span>
              </label>
              <button
                onClick={testFallbackVoice}
                className="text-xs text-[#c9502f] hover:underline font-jua flex items-center gap-0.5"
              >
                <Volume2 className="w-3.5 h-3.5" />
                소리 테스트
              </button>
            </div>
            <p className="text-[11px] text-[#8a8178] font-hand">
              엄마/아빠 녹음이 없을 때 앱이 친절하게 대신 칭찬해주는 한국어 음성입니다.
            </p>
            <input
              type="text"
              value={fallbackInput}
              onChange={(e) => setFallbackInput(e.target.value)}
              placeholder="예: 정답이에요! 참 잘했어요!"
              className="w-full px-3 py-2 rounded-xl border border-[#e4dccf] bg-white text-xs font-jua outline-none focus:border-[#c9502f]"
            />
          </div>

          {/* Test Simulation Button */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between gap-2">
            <div>
              <span className="font-jua text-xs text-amber-950 block">
                🎯 아이 문제 정답 시뮬레이션
              </span>
              <span className="text-[10px] text-amber-800 font-hand">
                아이가 글자를 맞혔을 때 실제 재생되는 사운드를 확인하세요
              </span>
            </div>
            <button
              onClick={testPraisePlayback}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-jua text-xs shadow-xs active:scale-95 shrink-0 transition-all flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>칭찬 재생 테스트</span>
            </button>
          </div>
        </div>

        {/* Modal Bottom Buttons */}
        <div className="pt-3 border-t border-[#f0ebe1] flex items-center justify-between gap-2">
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#e4dccf] hover:bg-[#faf8f5] text-[#1b1917] font-jua text-xs flex items-center gap-1 shadow-2xs active:scale-95"
          >
            <Save className="w-3.5 h-3.5 text-[#c9502f]" />
            <span>대본/문구 저장</span>
          </button>

          <button
            onClick={() => {
              playSfx('fan');
              handleSaveSettings();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-xs shadow-sm active:scale-95 transition-all"
          >
            설정 완료 &amp; 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
