import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Heart,
  Calendar,
  Save,
  Trash2,
  Sparkles,
  BookOpen,
  Smile,
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Wand2,
} from 'lucide-react';
import { DailyMomDiary, Mission } from '../types';
import { playSfx } from '../utils/sound';
import { generateCuteVoiceSample } from '../utils/audioRecordHelper';
import { MicPermissionGuide } from './MicPermissionGuide';

interface DailyDiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: number;
  mission: Mission;
  diary?: DailyMomDiary;
  onSaveDiary: (diary: DailyMomDiary) => void;
  onDeleteDiary: (day: number) => void;
  onOpenPrintBook: () => void;
  childName: string;
  initialTab?: 'voice' | 'diary';
}

const MOODS = [
  { emoji: '🥹', label: '가슴 뭉클' },
  { emoji: '😊', label: '뿌듯해요' },
  { emoji: '🤣', label: '빵 터짐' },
  { emoji: '👏', label: '대견해요' },
  { emoji: '❤️', label: '사랑 듬뿍' },
  { emoji: '💡', label: '새로운 발견' },
];

export const DailyDiaryModal: React.FC<DailyDiaryModalProps> = ({
  isOpen,
  onClose,
  day,
  mission,
  diary,
  onSaveDiary,
  onDeleteDiary,
  onOpenPrintBook,
  childName,
  initialTab = 'voice',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'voice' | 'diary'>(initialTab);
  const [content, setContent] = useState(diary?.content || '');
  const [mood, setMood] = useState(diary?.mood || MOODS[0].emoji);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(diary?.photoUrl);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(diary?.audioUrl);

  // Sync state when day or diary changes
  useEffect(() => {
    setContent(diary?.content || '');
    setMood(diary?.mood || MOODS[0].emoji);
    setPhotoUrl(diary?.photoUrl);
    setAudioUrl(diary?.audioUrl);
    setActiveSubTab(initialTab);
    setIsRecording(false);
    setIsPlayingAudio(false);
    setRecordingSeconds(0);
    setMicPermissionError(null);
  }, [day, diary, initialTab]);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stop recording helper with safe, asynchronous cleanup
  const stopRecording = (save: boolean = true) => {
    // 1. Immediately clear the timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);

    // 2. Stop the MediaRecorder cleanly and let onstop handle track cleanup
    const recorder = mediaRecorderRef.current;
    if (recorder) {
      try {
        if (!save) {
          recorder.onstop = null;
          // Stop stream tracks immediately if cancelling
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
          }
          mediaRecorderRef.current = null;
        } else if (recorder.state === 'recording') {
          recorder.stop();
        }
      } catch (err) {
        console.warn('Notice while stopping MediaRecorder:', err);
      }
    }
  };

  // Cleanup on unmount or when modal is closed
  useEffect(() => {
    return () => {
      stopRecording(false);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setVoiceNotice(msg);
    setTimeout(() => setVoiceNotice(null), 3000);
  };

  // Direct audio file upload
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    playSfx('pop');
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setAudioUrl(reader.result as string);
        setMicPermissionError(null);
        playSfx('fan');
        showToast('음성 파일이 성공적으로 등록되었습니다! ▶️ 아이 목소리 듣기로 확인해보세요.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate synthetic test child voice (100% works in any browser/iframe!)
  const handleGenerateTestVoice = async () => {
    try {
      playSfx('pop');
      showToast('아이 목소리 샘플을 생성하고 있습니다...');
      const sampleUrl = await generateCuteVoiceSample(childName || '아이');
      setAudioUrl(sampleUrl);
      setMicPermissionError(null);
      playSfx('fan');
      showToast('🎉 테스트용 아이 목소리 음성이 생성되었습니다! 아래 [아이 목소리 듣기]를 눌러보세요.');
    } catch (err) {
      console.warn('Voice synthesis error', err);
    }
  };

  // Start Voice Recording with robust cross-browser MediaRecorder handling
  const startRecording = async () => {
    setMicPermissionError(null);
    setVoiceNotice(null);

    // If already recording, stop first
    if (isRecording) {
      stopRecording(false);
    }

    // Check mediaDevices support
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setMicPermissionError(
        '현재 브라우저/미리보기 환경에서 마이크 직접 녹음이 지원되지 않습니다. 아래 [⚡ 테스트용 아이 목소리 생성] 또는 [음성 파일 올리기]를 이용해보세요!'
      );
      return;
    }

    try {
      playSfx('pop');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      // Detect supported mimeType safely
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        const types = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/aac',
          'audio/ogg',
        ];
        for (const t of types) {
          if (MediaRecorder.isTypeSupported(t)) {
            mimeType = t;
            break;
          }
        }
      }

      let recorder: MediaRecorder;
      try {
        recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      } catch (constructErr) {
        recorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Safely stop all stream tracks after recorder completes
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
              setAudioUrl(reader.result as string);
              setMicPermissionError(null);
              playSfx('fan');
              showToast('🎉 녹음이 완료되었습니다! [아이 목소리 듣기]로 확인 후 저장하세요.');
            }
          };
          reader.readAsDataURL(audioBlob);
        } else {
          showToast('⚠️ 녹음된 음성 데이터가 없습니다. 다시 시도해주세요.');
        }
        mediaRecorderRef.current = null;
      };

      // Collect data periodically
      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          if (next >= 60) {
            setTimeout(() => stopRecording(true), 0);
          }
          return next;
        });
      }, 1000);
    } catch (err: any) {
      setIsRecording(false);
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        mediaStreamRef.current = null;
      }

      const errString = String(err?.name || err?.message || '');
      const isPermissionDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        errString.toLowerCase().includes('permission') ||
        errString.toLowerCase().includes('denied');

      if (isPermissionDenied) {
        setMicPermissionError(
          '마이크 권한이 비활성화되어 있습니다. 아래 윈도우/맥/스마트폰 안내에 따라 마이크를 [허용]하시거나, [⚡ 테스트용 아이 목소리 생성]으로 바로 체험해보실 수 있습니다.'
        );
      } else {
        setMicPermissionError(
          '마이크 장치에 접근할 수 없습니다. 아래 기기별 마이크 설정 안내를 확인하시거나 [⚡ 테스트용 아이 목소리 생성] 또는 [음성 파일 올리기]를 이용해보세요!'
        );
      }
    }
  };

  // Play Recorded Voice
  const togglePlayAudio = () => {
    if (!audioUrl) return;

    if (isPlayingAudio && audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    playSfx('tap');
    try {
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play().catch(() => setIsPlayingAudio(false));
      setIsPlayingAudio(true);
    } catch {
      setIsPlayingAudio(false);
    }
  };

  const deleteAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setIsPlayingAudio(false);
    setAudioUrl(undefined);
    playSfx('erase');
    showToast('녹음이 삭제되었습니다.');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Quick Direct Voice Save (Allows saving voice note separately without mandatory long diary text!)
  const handleSaveVoiceOnly = () => {
    if (!audioUrl) {
      showToast('⚠️ 먼저 아이 목소리를 녹음하거나 생성해주세요.');
      return;
    }

    playSfx('fan');
    const autoContent = content.trim() || `${childName || '우리 아이'}의 생생한 한글 목소리 녹음 🎙️ ("${mission.t}")`;

    onSaveDiary({
      day,
      date: diary?.date || new Date().toISOString().split('T')[0],
      content: autoContent,
      mood: mood || '❤️',
      photoUrl,
      audioUrl,
      updatedAt: Date.now(),
    });

    onClose();
  };

  // Full Diary Save Form Handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // If audio or photo exists, content is optional with friendly default
    const finalContent =
      content.trim() ||
      (audioUrl
        ? `${childName || '우리 아이'}의 한글 목소리 녹음 기록 🎙️`
        : photoUrl
        ? `${childName || '우리 아이'}의 한글 학습 순간 사진 📸`
        : '');

    if (!finalContent) {
      showToast('⚠️ 일기 내용을 입력하거나 아이 목소리를 녹음해주세요!');
      return;
    }

    playSfx('fan');
    onSaveDiary({
      day,
      date: diary?.date || new Date().toISOString().split('T')[0],
      content: finalContent,
      mood,
      photoUrl,
      audioUrl,
      updatedAt: Date.now(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-md box-border overflow-hidden shadow-2xl p-4 sm:p-6 text-left space-y-3.5 animate-pop max-h-[92vh] flex flex-col relative font-body">
        
        {/* Close Button */}
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
          className="absolute top-3 right-3 z-30 w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] transition-all shadow-2xs active:scale-95 cursor-pointer"
          aria-label="닫기"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-[#eedfc9] pb-2.5 pr-11">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#c9502f] font-jua">
            <Heart className="w-3.5 h-3.5 fill-[#c9502f] shrink-0" />
            <span>성장 일기 &amp; 목소리 기록</span>
          </div>
          <h2 className="text-lg sm:text-xl font-jua text-[#1b1917] mt-0.5 break-keep">
            D+{day}일차 · {childName || '우리 아이'}
          </h2>
          <p className="text-xs text-[#8a8178] font-hand mt-0.5 break-keep">
            오늘 미션: <b>{mission.t}</b>
          </p>
        </div>

        {/* 2 Top Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#f0e8dc] rounded-2xl gap-1 font-jua text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => {
              playSfx('tap');
              setActiveSubTab('voice');
            }}
            className={`min-h-[44px] py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'voice'
                ? 'bg-white text-[#ea580c] shadow-xs font-bold'
                : 'text-[#8a8178] hover:text-[#1b1917]'
            }`}
          >
            <Mic className="w-4 h-4 text-[#ea580c] shrink-0" />
            <span>목소리 녹음</span>
            {audioUrl && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />}
          </button>
          <button
            type="button"
            onClick={() => {
              playSfx('tap');
              setActiveSubTab('diary');
            }}
            className={`min-h-[44px] py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'diary'
                ? 'bg-white text-[#c9502f] shadow-xs font-bold'
                : 'text-[#8a8178] hover:text-[#1b1917]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#c9502f] shrink-0" />
            <span>엄마 일기</span>
            {content && <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />}
          </button>
        </div>

        {/* In-App Toast Notification */}
        {voiceNotice && (
          <div className="p-2.5 rounded-xl bg-[#1b1917] text-white text-xs font-jua flex items-center gap-1.5 animate-fadeIn shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>{voiceNotice}</span>
          </div>
        )}

        {/* TAB 1: Voice Recording Dedicated Section */}
        {activeSubTab === 'voice' ? (
          <div className="space-y-3.5 overflow-y-auto overflow-x-hidden flex-1 box-border font-body">
            <div className="p-4 bg-gradient-to-br from-[#fff7ed] via-[#fef3c7] to-[#fffaf0] rounded-2xl border border-[#fed7aa] space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-jua text-sm text-[#9a3412] flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-[#ea580c] shrink-0" />
                  <span>{childName || '아이'}의 목소리 간직하기</span>
                </span>
                {audioUrl && !isRecording && (
                  <span className="text-[11px] text-[#16a34a] font-jua bg-white px-2.5 py-0.5 rounded-full border border-[#bbf7d0] whitespace-nowrap">
                    ✓ 저장 가능
                  </span>
                )}
              </div>

              <p className="text-xs text-[#78350f] font-hand leading-relaxed break-keep">
                <b>"{mission.t}"</b> 발음하는 아이 목소리를 녹음해 보세요.
              </p>

              {/* RECORDING IN PROGRESS STATE */}
              {isRecording ? (
                <div className="p-4 bg-white rounded-2xl border-2 border-[#ea580c] shadow-sm space-y-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm font-jua text-[#ea580c]">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                    <span>녹음 중 · <b>{recordingSeconds}초</b> / 60초</span>
                  </div>

                  {/* Audio Waveform Animation */}
                  <div className="flex items-center justify-center gap-1 py-1 text-[#ea580c]">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>▂</span>
                    <span className="animate-bounce" style={{ animationDelay: '100ms' }}>▃</span>
                    <span className="animate-bounce" style={{ animationDelay: '200ms' }}>▅</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>▆</span>
                    <span className="animate-bounce" style={{ animationDelay: '400ms' }}>▇</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>▆</span>
                    <span className="animate-bounce" style={{ animationDelay: '200ms' }}>▅</span>
                    <span className="animate-bounce" style={{ animationDelay: '100ms' }}>▃</span>
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>▂</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => stopRecording(true)}
                      className="min-h-[44px] py-2.5 px-5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-jua text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>녹음 끝내기</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => stopRecording(false)}
                      className="min-h-[44px] py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-jua text-xs transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : audioUrl ? (
                /* AUDIO RECORDED: PLAYBACK & DIRECT SAVE BAR */
                <div className="p-3.5 bg-white rounded-2xl border-2 border-[#fed7aa] shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={togglePlayAudio}
                      className={`min-h-[44px] flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-jua text-sm shadow-xs transition-all active:scale-95 whitespace-nowrap ${
                        isPlayingAudio
                          ? 'bg-[#ea580c] text-white'
                          : 'bg-[#ffedd5] hover:bg-[#fed7aa] text-[#9a3412]'
                      }`}
                    >
                      {isPlayingAudio ? (
                        <>
                          <Pause className="w-4 h-4 shrink-0" />
                          <span>멈추기</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-[#9a3412] shrink-0" />
                          <span>목소리 듣기</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={startRecording}
                        className="min-h-[44px] px-3 rounded-xl border border-[#fed7aa] hover:bg-[#fff7ed] text-[#9a3412] font-jua text-xs flex items-center gap-1 transition-colors whitespace-nowrap"
                        title="다시 녹음하기"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>재녹음</span>
                      </button>
                      <button
                        type="button"
                        onClick={deleteAudio}
                        className="w-11 h-11 flex items-center justify-center text-stone-400 hover:text-red-500 rounded-xl border border-stone-200 transition-colors"
                        title="녹음 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Immediate Direct Voice Save Button */}
                  <button
                    type="button"
                    onClick={handleSaveVoiceOnly}
                    className="w-full min-h-[48px] py-3 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>목소리 바로 저장하기</span>
                  </button>
                </div>
              ) : (
                /* NO AUDIO RECORDED YET */
                <div className="space-y-2.5 pt-1">
                  {/* Primary Record Button */}
                  <button
                    type="button"
                    onClick={startRecording}
                    className="w-full min-h-[52px] py-3.5 px-4 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-2xl font-jua text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <Mic className="w-5 h-5 text-white shrink-0" />
                    <span>녹음 시작하기</span>
                  </button>

                  {/* Sample Voice Generation Button */}
                  <button
                    type="button"
                    onClick={handleGenerateTestVoice}
                    className="w-full min-h-[44px] py-2.5 px-3 bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 rounded-xl font-jua text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>테스트용 샘플 목소리 만들기</span>
                  </button>

                  {/* Upload Audio File Option */}
                  <div className="text-center pt-0.5">
                    <label className="inline-flex min-h-[40px] items-center gap-1.5 text-xs text-[#9a3412] hover:text-[#ea580c] cursor-pointer font-hand py-1.5 px-3 rounded-xl hover:bg-white/80 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
                      <span>음성 파일 올리기 (.mp3, .m4a, .wav)</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Mic Permission Guidance Notification (Windows, Mac, Mobile App) */}
              {micPermissionError && (
                <MicPermissionGuide
                  errorMessage={micPermissionError}
                  onClose={() => setMicPermissionError(null)}
                  onGenerateSample={handleGenerateTestVoice}
                  sampleButtonText="⚡ 테스트용 아이 목소리 생성 (권한 불필요)"
                  onRetry={startRecording}
                />
              )}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setActiveSubTab('diary')}
                className="text-xs text-[#8a8178] hover:text-[#c9502f] font-jua underline underline-offset-4"
              >
                엄마의 성장 일기 및 사진도 함께 적을까요? 👉
              </button>
            </div>
          </div>
        ) : (
          /* TAB 2: Diary & Photo Form Section */
          <form onSubmit={handleSave} className="space-y-3.5 overflow-y-auto overflow-x-hidden flex-1 box-border font-body">
            {/* Mood Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4a443e] block">오늘 엄마의 기분</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {MOODS.map((m) => (
                  <button
                    type="button"
                    key={m.label}
                    onClick={() => {
                      playSfx('tap');
                      setMood(m.emoji);
                    }}
                    className={`min-h-[52px] p-1.5 rounded-xl text-center border transition-all ${
                      mood === m.emoji
                        ? 'bg-[#fdf3e4] border-[#c9502f] shadow-xs ring-2 ring-[#c9502f]/20'
                        : 'bg-white border-[#e4dccf]'
                    }`}
                    title={m.label}
                  >
                    <span className="text-lg block">{m.emoji}</span>
                    <span className="text-[10px] font-hand text-[#8a8178] block truncate">
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Diary Textarea */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4a443e] block">
                기억에 남는 한마디
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="예) 오늘 카드를 보더니 '기린 목 같다!' 하며 활짝 웃었어요."
                rows={4}
                maxLength={400}
                className="w-full p-3 rounded-2xl border-2 border-[#e4dccf] bg-white text-xs sm:text-sm text-[#1b1917] outline-none focus:border-[#c9502f] font-hand resize-none"
              />
              <div className="flex justify-between text-[11px] text-[#8a8178]">
                <span>A4 일기장으로 인쇄할 수 있어요</span>
                <span>{content.length} / 400</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex gap-2">
              {diary && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-12 min-h-[48px] rounded-xl bg-white border border-[#e4dccf] text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center shrink-0"
                  title="일기 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[48px] py-3 rounded-xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-sm"
              >
                닫기
              </button>

              <button
                type="submit"
                className="flex-1 min-h-[48px] py-3 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Save className="w-4 h-4" />
                저장하기
              </button>
            </div>
          </form>
        )}

        {/* In-App Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl p-5 border-2 border-[#eedfc9] shadow-2xl max-w-xs w-full box-border overflow-hidden text-center space-y-3">
              <Trash2 className="w-10 h-10 text-red-500 mx-auto" />
              <h4 className="font-jua text-base text-[#1b1917]">D+{day}일차 일기와 녹음을 삭제할까요?</h4>
              <p className="text-xs text-[#8a8178] font-hand">삭제된 내용은 복구할 수 없습니다.</p>
              <div className="flex gap-2 pt-1 font-jua text-xs">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    playSfx('erase');
                    onDeleteDiary(day);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                >
                  삭제하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
