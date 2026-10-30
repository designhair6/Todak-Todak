import React, { useState, useRef, useEffect } from 'react';
import { X, Heart, Calendar, Save, Trash2, Sparkles, BookOpen, Smile, Camera, Mic, Square, Play, Pause, RotateCcw, Volume2, Upload, AlertCircle } from 'lucide-react';
import { DailyMomDiary, Mission } from '../types';
import { playSfx } from '../utils/sound';

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
}) => {
  const [content, setContent] = useState(diary?.content || '');
  const [mood, setMood] = useState(diary?.mood || MOODS[0].emoji);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(diary?.photoUrl);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(diary?.audioUrl);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stop recording helper with safe cleanup
  const stopRecording = (save: boolean = true) => {
    // 1. Immediately clear the timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);

    // 2. Safely stop the MediaRecorder
    const recorder = mediaRecorderRef.current;
    if (recorder) {
      try {
        if (!save) {
          recorder.onstop = null;
        } else if (recorder.state === 'recording' && typeof recorder.requestData === 'function') {
          try {
            recorder.requestData();
          } catch {
            // Ignore requestData errors
          }
        }
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      } catch (err) {
        console.warn('Notice while stopping MediaRecorder:', err);
      } finally {
        mediaRecorderRef.current = null;
      }
    }

    // 3. Always stop all audio tracks so browser microphone turns off
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn('Notice while stopping tracks:', err);
      } finally {
        mediaStreamRef.current = null;
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

  // Handle direct audio file upload (fallback when mic is blocked in iframe/browser)
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
      }
    };
    reader.readAsDataURL(file);
  };

  // Start Voice Recording with friendly, non-crashing permission handling
  const startRecording = async () => {
    setMicPermissionError(null);

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
      setMicPermissionError('현재 환경에서 마이크 직접 녹음이 지원되지 않습니다. 아래 [음성 파일 올리기]로 목소리를 등록할 수 있습니다.');
      return;
    }

    try {
      playSfx('pop');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      // Detect supported mimeType for cross-browser / iOS Safari / Android support
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          mimeType = 'audio/aac';
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Release tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
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
            }
          };
          reader.readAsDataURL(audioBlob);
        }
      };

      // Collect data in 250ms chunks so data is ready whenever user stops
      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          if (next >= 60) {
            // Auto stop at 60 seconds
            setTimeout(() => stopRecording(true), 0);
          }
          return next;
        });
      }, 1000);
    } catch (err: any) {
      // Graceful error handling - avoid unhandled error logs in testers
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
          '마이크 사용 권한이 비활성화되어 있습니다. 브라우저 주소창 좌측의 자물쇠/설정 아이콘에서 마이크를 허용해주시거나, 아래 [음성 파일 올리기]로 목소리를 등록할 수 있습니다.'
        );
      } else {
        setMicPermissionError(
          '마이크 장치를 사용할 수 없습니다. 아래 [음성 파일 올리기]로 녹음된 파일을 등록해보세요.'
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
    const audio = new Audio(audioUrl);
    audioElementRef.current = audio;
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => setIsPlayingAudio(false);
    audio.play();
    setIsPlayingAudio(true);
  };

  const deleteAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setIsPlayingAudio(false);
    setAudioUrl(undefined);
    playSfx('erase');
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('일기 내용을 입력해주세요!');
      return;
    }

    playSfx('fan');
    onSaveDiary({
      day,
      date: diary?.date || new Date().toISOString().split('T')[0],
      content: content.trim(),
      mood,
      photoUrl,
      audioUrl,
      updatedAt: Date.now(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-left space-y-4 animate-pop max-h-[92vh] flex flex-col relative">
        <button
          onClick={() => {
            playSfx('tap');
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="border-b border-[#eedfc9] pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#c9502f] font-jua">
            <Heart className="w-3.5 h-3.5 fill-[#c9502f]" />
            <span>엄마의 30일 성장 일기장</span>
          </div>
          <h2 className="text-xl font-jua text-[#1b1917]">
            D+{day}일차 기록: {childName}와 함께
          </h2>
          <p className="text-xs text-[#8a8178] font-hand mt-0.5">
            오늘의 미션: <b>{mission.t}</b> ({mission.s})
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 overflow-y-auto flex-1 pr-1 font-body">
          {/* Mood Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#4a443e] block">오늘 엄마의 마음 표정</label>
            <div className="flex gap-2">
              {MOODS.map((m) => (
                <button
                  type="button"
                  key={m.label}
                  onClick={() => {
                    playSfx('tap');
                    setMood(m.emoji);
                  }}
                  className={`flex-1 p-2 rounded-xl text-center border transition-all ${
                    mood === m.emoji
                      ? 'bg-[#fdf3e4] border-[#c9502f] shadow-xs scale-105'
                      : 'bg-white border-[#e4dccf]'
                  }`}
                  title={m.label}
                >
                  <span className="text-xl block">{m.emoji}</span>
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
              오늘 가장 기억에 남는 아이의 말이나 표정
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="예) 오늘 카드를 보더니 '엄마 이거 기린 목처럼 꺾였어!' 하면서 활짝 웃었다. 조급해하지 말고 이렇게 매일 웃으며 놀아줘야지."
              rows={5}
              required
              maxLength={400}
              className="w-full p-3 rounded-2xl border-2 border-[#e4dccf] bg-white text-xs sm:text-sm text-[#1b1917] outline-none focus:border-[#c9502f] font-hand resize-none"
            />
            <div className="flex justify-between text-[11px] text-[#8a8178]">
              <span>한 달 뒤 예쁜 책자로 인쇄할 수 있어요!</span>
              <span>{content.length} / 400자</span>
            </div>
          </div>

          {/* Voice Recording Section (아이의 생생한 목소리 저장) */}
          <div className="space-y-1.5 p-3.5 bg-gradient-to-r from-[#fff7ed] to-[#fef3c7] rounded-2xl border border-[#fed7aa]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-jua text-[#9a3412] flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-[#ea580c]" />
                <span>아이 목소리 생생 녹음 (직접 들어보기)</span>
              </label>
              {audioUrl && !isRecording && (
                <span className="text-[10px] text-[#16a34a] font-jua bg-white px-2 py-0.5 rounded-full border border-[#bbf7d0]">
                  ✓ 녹음 완료
                </span>
              )}
            </div>

            {/* If currently recording */}
            {isRecording ? (
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border-2 border-[#ea580c] animate-pulse">
                <div className="flex items-center gap-2 text-xs font-jua text-[#ea580c]">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>녹음 중... {recordingSeconds}초 / 60초</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => stopRecording(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white font-jua text-xs flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    녹음 완료 ⏹️
                  </button>
                  <button
                    type="button"
                    onClick={() => stopRecording(false)}
                    className="px-2 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 font-jua text-xs flex items-center gap-0.5 transition-colors"
                    title="녹음 취소"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : audioUrl ? (
              /* If audio is recorded, show cute playback bar */
              <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-[#fed7aa] shadow-2xs">
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-jua transition-all ${
                    isPlayingAudio
                      ? 'bg-[#ea580c] text-white shadow-xs'
                      : 'bg-[#ffedd5] text-[#9a3412] hover:bg-[#fed7aa]'
                  }`}
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> 멈추기 ⏸️
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-[#9a3412]" /> 아이 목소리 듣기 ▶️
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-1.5 text-xs text-[#78350f] hover:text-[#ea580c] rounded-lg hover:bg-[#fff7ed] flex items-center gap-1 font-jua"
                    title="다시 녹음하기"
                  >
                    <RotateCcw className="w-3 h-3" /> 다시 녹음
                  </button>
                  <button
                    type="button"
                    onClick={deleteAudio}
                    className="p-1.5 text-xs text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
                    title="녹음 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* If no audio recorded yet */
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-full py-2.5 px-3 bg-white hover:bg-[#fff7ed] border border-[#fed7aa] rounded-xl text-xs font-jua text-[#c2410c] flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95"
                >
                  <Mic className="w-4 h-4 text-[#ea580c]" />
                  아이 목소리 녹음하기 (터치하여 시작)
                </button>

                {/* Direct audio file upload option */}
                <div className="text-center">
                  <label className="inline-flex items-center gap-1.5 text-[11px] text-[#9a3412] hover:text-[#ea580c] cursor-pointer font-hand py-0.5 px-2 rounded-lg hover:bg-white/60 transition-colors">
                    <Upload className="w-3 h-3 text-[#ea580c]" />
                    <span>또는 녹음된 음성 파일 올리기</span>
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

            {/* Mic Permission Guidance / In-App Notification (No alert, no unhandled error) */}
            {micPermissionError && (
              <div className="p-2.5 rounded-xl bg-[#fffbeb] border border-[#fde68a] text-[#92400e] text-[11px] font-hand space-y-1.5 animate-fadeIn">
                <div className="flex items-start justify-between gap-1">
                  <span className="flex items-center gap-1 font-jua text-[#78350f]">
                    <AlertCircle className="w-3.5 h-3.5 text-[#d97706] flex-none" />
                    마이크 권한 안내
                  </span>
                  <button
                    type="button"
                    onClick={() => setMicPermissionError(null)}
                    className="text-[#92400e] hover:text-[#78350f] font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
                <p className="leading-snug">{micPermissionError}</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#fcd34d] text-[#78350f] font-jua text-[10px] cursor-pointer hover:bg-[#fef3c7] transition-colors shadow-2xs">
                    <Upload className="w-3 h-3 text-[#d97706]" />
                    음성 파일 직접 올리기
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={startRecording}
                    className="px-2.5 py-1 rounded-lg bg-[#fef3c7] hover:bg-[#fde68a] text-[#78350f] font-jua text-[10px] transition-colors"
                  >
                    마이크 다시 시도
                  </button>
                </div>
              </div>
            )}

            <p className="text-[10px] text-[#78350f] font-hand">
              💡 아이가 글자를 소리 내어 읽거나 "엄마 사랑해!" 한마디를 남겨두면 평생 보물이 돼요!
            </p>
          </div>

          {/* Photo attachment (optional) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#4a443e] flex items-center justify-between">
              <span>오늘의 순간 사진 (선택)</span>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl(undefined)}
                  className="text-red-500 text-[11px] hover:underline"
                >
                  사진 삭제
                </button>
              )}
            </label>

            {photoUrl ? (
              <img
                src={photoUrl}
                alt="오늘의 사진"
                className="max-h-36 rounded-2xl mx-auto object-contain border border-[#e4dccf] bg-white"
              />
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-[#e4dccf] bg-[#faf8f5] hover:bg-[#f6f1e7] cursor-pointer text-xs font-jua text-[#8a8178] transition-colors">
                <Camera className="w-4 h-4 text-[#c9502f]" />
                스마트폰 사진 올리기
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-2">
            {diary && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('이 날의 일기를 삭제할까요?')) {
                    onDeleteDiary(day);
                    onClose();
                  }
                }}
                className="p-2.5 rounded-xl bg-white border border-[#e4dccf] text-red-500 hover:bg-red-50"
                title="삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-sm"
            >
              닫기
            </button>

            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm shadow-md flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
