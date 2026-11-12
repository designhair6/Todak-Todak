import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Monitor,
  Laptop,
  Smartphone,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Wand2,
} from 'lucide-react';

interface MicPermissionGuideProps {
  onRetry?: () => void;
  onGenerateSample?: () => void;
  sampleButtonText?: string;
  onClose?: () => void;
  errorMessage?: string | null;
  className?: string;
}

type DeviceTab = 'windows' | 'mac' | 'mobile';

export const MicPermissionGuide: React.FC<MicPermissionGuideProps> = ({
  onRetry,
  onGenerateSample,
  sampleButtonText = '⚡ 테스트용 목소리 생성 (권한 불필요)',
  onClose,
  errorMessage,
  className = '',
}) => {
  const [selectedTab, setSelectedTab] = useState<DeviceTab>('windows');

  // Detect user operating system / device
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod|android/i.test(ua)) {
      setSelectedTab('mobile');
    } else if (/macintosh|mac os x/i.test(ua)) {
      setSelectedTab('mac');
    } else {
      setSelectedTab('windows');
    }
  }, []);

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl bg-[#fffbeb] border-2 border-[#fde68a] text-[#78350f] text-xs font-body space-y-3 animate-fadeIn shadow-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 font-jua text-sm text-[#92400e]">
          <AlertCircle className="w-4 h-4 text-[#d97706] shrink-0" />
          <span>기기별 마이크 허용 안내 (윈도우 · 맥북 · 스마트폰 앱)</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[#92400e] hover:text-[#78350f] font-bold px-2 py-0.5 rounded-md hover:bg-[#fde68a]/60 active:scale-95 transition-all"
            aria-label="닫기"
          >
            ✕
          </button>
        )}
      </div>

      {/* Error message notice if provided */}
      {errorMessage && (
        <p className="leading-relaxed font-hand text-xs text-[#9a3412] bg-white/70 p-2 rounded-xl border border-[#fde68a]/70">
          {errorMessage}
        </p>
      )}

      {/* Device Selection Tabs (Windows, Mac, Mobile App) */}
      <div className="flex rounded-xl bg-amber-100/70 p-1 gap-1 font-jua text-xs">
        <button
          type="button"
          onClick={() => setSelectedTab('windows')}
          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            selectedTab === 'windows'
              ? 'bg-white text-[#9a3412] shadow-xs font-bold border border-amber-300'
              : 'text-[#92400e] hover:bg-white/50'
          }`}
        >
          <Monitor className="w-3.5 h-3.5 shrink-0" />
          <span>🪟 윈도우 PC</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('mac')}
          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            selectedTab === 'mac'
              ? 'bg-white text-[#9a3412] shadow-xs font-bold border border-amber-300'
              : 'text-[#92400e] hover:bg-white/50'
          }`}
        >
          <Laptop className="w-3.5 h-3.5 shrink-0" />
          <span>🍎 맥북(Mac)</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('mobile')}
          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            selectedTab === 'mobile'
              ? 'bg-white text-[#9a3412] shadow-xs font-bold border border-amber-300'
              : 'text-[#92400e] hover:bg-white/50'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span>📱 스마트폰·앱</span>
        </button>
      </div>

      {/* Tab Content 1: Windows (윈도우) */}
      {selectedTab === 'windows' && (
        <div className="bg-white/90 p-3 rounded-xl border border-[#fde68a] space-y-2 text-[11px] leading-relaxed animate-fadeIn">
          <div className="font-bold font-jua text-xs text-[#9a3412] flex items-center gap-1">
            <span>💻 윈도우(Windows 10 / 11) 마이크 설정 2단계:</span>
          </div>
          <div className="space-y-1.5 font-body text-[#78350f]">
            <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-200/50">
              <span className="font-bold text-[#9a3412] block mb-0.5">
                ① 윈도우 시스템 설정 (가장 흔한 차단 원인):
              </span>
              <p className="font-hand text-[11px] text-[#854d0e]">
                윈도우 시작(⊞) ➔ <b>[설정 ⚙️]</b> ➔ <b>[개인 정보 및 보안]</b> (또는 개인 정보) ➔ <b>[마이크]</b> 메뉴로 들어갑니다.
              </p>
              <p className="font-hand text-[11px] text-[#854d0e] mt-1">
                👉 <b>'앱에서 마이크에 액세스하도록 허용'</b>을 <b>[켬]</b>으로 켜고, 아래 목록에서 <b>'데스크톱 앱(Chrome, Edge 등)이 마이크에 액세스하는 것을 허용'</b>도 <b>[켬]</b>으로 설정해주세요.
              </p>
            </div>

            <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-200/50">
              <span className="font-bold text-[#9a3412] block mb-0.5">
                ② 인터넷 브라우저 주소창 허용:
              </span>
              <p className="font-hand text-[11px] text-[#854d0e]">
                인터넷 주소창 맨 왼쪽의 <b>자물쇠(또는 사이트 설정 아이콘)</b> 클릭 ➔ <b>마이크: [허용]</b>으로 변경 후 <b>새로고침(F5)</b> 해주세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Mac (맥북) */}
      {selectedTab === 'mac' && (
        <div className="bg-white/90 p-3 rounded-xl border border-[#fde68a] space-y-2 text-[11px] leading-relaxed animate-fadeIn">
          <div className="font-bold font-jua text-xs text-[#9a3412] flex items-center gap-1">
            <span>🍏 맥북(macOS) 마이크 설정 2단계:</span>
          </div>
          <div className="space-y-1.5 font-body text-[#78350f]">
            <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-200/50">
              <span className="font-bold text-[#9a3412] block mb-0.5">
                ① 맥북 시스템 설정:
              </span>
              <p className="font-hand text-[11px] text-[#854d0e]">
                화면 왼쪽 맨 위 <b>(사과 마크) ➔ [시스템 설정]</b> (또는 시스템 환경설정) ➔ <b>[개인정보 보호 및 보안] ➔ [마이크]</b>로 이동합니다.
              </p>
              <p className="font-hand text-[11px] text-[#854d0e] mt-1">
                👉 현재 사용 중인 브라우저(<b>Chrome, Safari, Whale 등</b>)의 스위치를 <b>[허용(켬)]</b>으로 켜주세요.
              </p>
            </div>

            <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-200/50">
              <span className="font-bold text-[#9a3412] block mb-0.5">
                ② 브라우저 주소창 허용:
              </span>
              <p className="font-hand text-[11px] text-[#854d0e]">
                주소창 왼쪽의 <b>자물쇠 아이콘</b> 클릭 ➔ <b>마이크: [허용]</b> 선택 후 <b>새로고침(⌘ + R)</b> 해주세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Mobile & App (스마트폰 & 모바일 앱) */}
      {selectedTab === 'mobile' && (
        <div className="bg-white/90 p-3 rounded-xl border border-[#fde68a] space-y-2 text-[11px] leading-relaxed animate-fadeIn">
          <div className="font-bold font-jua text-xs text-[#9a3412] flex items-center gap-1">
            <span>📱 스마트폰 &amp; 태블릿 &amp; 모바일 앱 설정:</span>
          </div>
          <div className="space-y-1.5 font-body text-[#78350f]">
            {/* Galaxy / Android */}
            <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-200/50">
              <span className="font-bold text-[#9a3412] block mb-0.5">
                🤖 갤럭시 / 안드로이드 폰 (Chrome · 삼성인터넷 · 앱):
              </span>
              <p className="font-hand text-[11px] text-[#854d0e]">
                스마트폰 <b>[설정 ⚙️] ➔ [애플리케이션] ➔ [Chrome]</b> (또는 사용 중인 브라우저/토닥한글 앱) ➔ <b>[권한] ➔ [마이크] ➔ [앱 사용 중에만 허용]</b>으로 체크해주세요.
              </p>
              <p className="font-hand text-[11px] text-[#854d0e] mt-1">
                👉 또는 크롬 주소창 왼쪽 <b>자물쇠 아이콘 ➔ [권한] ➔ [마이크 허용]</b>
              </p>
            </div>

            {/* iPhone / iPad */}
            <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-200/50">
              <span className="font-bold text-[#9a3412] block mb-0.5">
                🍎 아이폰 / 아이패드 (iOS Safari · 웹앱):
              </span>
              <p className="font-hand text-[11px] text-[#854d0e]">
                아이폰 <b>[설정 ⚙️] ➔ [Safari]</b> (또는 설치된 토닥한글 앱) ➔ 화면 하단 <b>[마이크] ➔ [허용]</b> 선택.
              </p>
              <p className="font-hand text-[11px] text-[#854d0e] mt-1">
                👉 사파리 주소창 왼쪽 <b>'가(aA)' 아이콘 ➔ [웹사이트 설정] ➔ [마이크: 허용]</b>으로도 설정 가능합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Helpful Tip for Preview iFrame / Quick Test */}
      <div className="text-[11px] font-hand text-amber-800 bg-amber-100/40 p-2 rounded-xl flex items-start gap-1.5 leading-snug">
        <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
        <span>
          <b>미리보기/보안 환경 팁:</b> 에디터나 카카오톡 인앱 브라우저 등 보안이 엄격한 환경에서는 마이크가 제한될 수 있습니다. 아래 <b>[{sampleButtonText.replace(/ \(.*\)/, '')}]</b> 버튼을 누르면 마이크 권한 없이도 100% 정상 작동을 체험해보실 수 있습니다!
        </span>
      </div>

      {/* Action Buttons: Sample Voice & Retry */}
      <div className="flex flex-col sm:flex-row items-center gap-2 pt-0.5 font-jua">
        {onGenerateSample && (
          <button
            type="button"
            onClick={onGenerateSample}
            className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{sampleButtonText}</span>
          </button>
        )}

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full sm:w-auto py-2 px-3 rounded-xl bg-white border border-[#fcd34d] text-[#78350f] text-xs hover:bg-[#fef3c7] active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3 h-3 text-[#d97706]" />
            <span>마이크 다시 시도 🎙️</span>
          </button>
        )}
      </div>
    </div>
  );
};
