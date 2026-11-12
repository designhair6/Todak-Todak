import React, { useState } from 'react';
import { X, Heart, Sparkles, Check, Crown, AlertCircle, Mic, Volume2 } from 'lucide-react';
import { FRIENDS, THEMES, WISHES } from '../data/hangulData';
import { AnimalFriend, BoardTheme, StickerBoardState } from '../types';
import { playSfx, speakKorean, getVoiceTone, setVoiceTone, VOICE_TONES, VoiceTone } from '../utils/sound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardState: StickerBoardState;
  onSave: (name: string, childAge: string, friendId: string, themeId: string, wish: string, msg: string) => void;
  onOpenAdmin?: () => void;
  onOpenPrint?: () => void;
  onOpenSoundBlend?: () => void;
  onOpenParentVoice?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  boardState,
  onSave,
  onOpenAdmin,
  onOpenPrint,
  onOpenSoundBlend,
  onOpenParentVoice,
}) => {
  const [name, setName] = useState(boardState.name || '시아');
  const [childAge, setChildAge] = useState(boardState.childAge || '5세');
  const [voiceTone, setVoiceToneState] = useState<VoiceTone>(getVoiceTone);
  const [selectedFriend, setSelectedFriend] = useState(boardState.friend || 'bear');
  const [selectedTheme, setSelectedTheme] = useState(boardState.theme || 'home');
  const [selectedWish, setSelectedWish] = useState(boardState.wish || WISHES[0]);
  const [customWish, setCustomWish] = useState('');
  const [msg, setMsg] = useState(boardState.msg || '30일 동안 정말 멋졌어! 엄마가 꼭 들어줄게!');

  // Customizable Member Account Information
  const [initialStoredId] = useState(() => {
    try {
      return localStorage.getItem('hangul_user_id') || 'sia_mom';
    } catch {
      return 'sia_mom';
    }
  });

  const [userId, setUserId] = useState(initialStoredId);

  const [userNickname, setUserNickname] = useState(() => {
    try {
      return localStorage.getItem('hangul_user_nickname') || `${boardState.name || '시아'}맘`;
    } catch {
      return '시아맘';
    }
  });

  const [userEmail, setUserEmail] = useState(() => {
    try {
      return localStorage.getItem('hangul_user_email') || 'designhair6@gmail.com';
    } catch {
      return 'designhair6@gmail.com';
    }
  });

  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [copiedIdNotice, setCopiedIdNotice] = useState(false);
  const [idCheckPopup, setIdCheckPopup] = useState<{
    type: 'success' | 'duplicate' | 'error';
    title: string;
    message: string;
    testedId?: string;
  } | null>(null);

  // Helper: Get all registered or reserved IDs to prevent collision
  const getReservedOrTakenIds = (): string[] => {
    const reserved = ['admin', 'administrator', 'root', 'system', '관리자', '운영자'];
    let list: string[] = [];
    try {
      const stored = localStorage.getItem('hangul_admin_members');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          list = parsed.map((m: any) => String(m.id || '').trim().toLowerCase());
        }
      }
    } catch {}
    if (list.length === 0) {
      list = ['siwoo_mom_01', 'minjun_mom_02', 'yuna_home_03', 'siwoo_mom', 'minjun_mom', 'yuna_home'];
    }
    return [...new Set([...reserved, ...list])];
  };

  const isIdDuplicated = (candidate: string): boolean => {
    const trimmed = candidate.trim().toLowerCase();
    if (!trimmed) return false;
    // If user keeps their own originally stored ID, it's not a collision against themselves
    if (trimmed === initialStoredId.trim().toLowerCase()) return false;
    const takenList = getReservedOrTakenIds();
    return takenList.includes(trimmed);
  };

  const handleCheckDuplicateClick = () => {
    const trimmed = userId.trim();
    if (!trimmed || trimmed.length < 3) {
      playSfx('pop');
      setIdCheckPopup({
        type: 'error',
        title: '아이디 확인 필요',
        message: '영문과 숫자를 조합하여 3~18자로 입력해주세요.',
      });
      return;
    }
    if (isIdDuplicated(trimmed)) {
      playSfx('erase');
      setIdCheckPopup({
        type: 'duplicate',
        testedId: trimmed,
        title: '이미 사용 중인 아이디입니다!',
        message: '다른 회원이 이미 사용 중인 아이디입니다.\n다른 아이디를 입력하시거나 아래의 [랜덤 추천 ID]를 받아보세요!',
      });
    } else {
      playSfx('fan');
      setIdCheckPopup({
        type: 'success',
        testedId: trimmed,
        title: '사용 가능한 멋진 아이디입니다!',
        message: '다른 회원과 겹치지 않아 안전하게 사용할 수 있습니다.\n이 아이디로 프로필을 저장해보세요!',
      });
    }
  };

  const handleToggleEditAccount = () => {
    if (isEditingAccount) {
      const candidate = userId.trim();
      if (!candidate || candidate.length < 3) {
        playSfx('pop');
        setIdCheckPopup({
          type: 'error',
          title: '아이디 확인 필요',
          message: '아이디를 3자 이상의 영문 또는 숫자로 입력해주세요!',
        });
        return;
      }
      if (isIdDuplicated(candidate)) {
        playSfx('erase');
        setIdCheckPopup({
          type: 'duplicate',
          testedId: candidate,
          title: '이미 사용 중인 아이디입니다!',
          message: '다른 회원이 이미 사용 중인 아이디입니다.\n다른 아이디로 변경해주세요.',
        });
        return;
      }
      playSfx('tap');
      setIsEditingAccount(false);
    } else {
      setIsEditingAccount(true);
    }
  };

  const handleGenerateSafeRandomId = () => {
    let attempt = 0;
    let genId = '';
    const base = (name.trim() ? name.trim().toLowerCase().replace(/[^a-z0-9]/g, '') : 'hangul') || 'user';
    do {
      genId = `${base}_${Math.floor(100 + Math.random() * 900)}`;
      attempt++;
    } while (isIdDuplicated(genId) && attempt < 30);
    setUserId(genId);
    playSfx('tap');
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalWish = customWish.trim() || selectedWish;
    const finalUserId = userId.trim() || 'sia_mom';
    const finalNickname = userNickname.trim() || `${name.trim() || '아이'}맘`;
    const finalEmail = userEmail.trim() || 'designhair6@gmail.com';

    // Duplicate check validation
    if (isIdDuplicated(finalUserId)) {
      playSfx('erase');
      setIdCheckPopup({
        type: 'duplicate',
        testedId: finalUserId,
        title: '아이디 중복 안내',
        message: '다른 회원이 이미 사용 중인 아이디입니다.\n다른 아이디로 변경 후 다시 저장해주세요.',
      });
      setIsEditingAccount(true);
      return;
    }

    if (finalUserId.length < 3) {
      playSfx('pop');
      setIdCheckPopup({
        type: 'error',
        title: '아이디 입력 필요',
        message: '회원 아이디를 3자 이상의 영문 또는 숫자로 입력해주세요!',
      });
      setIsEditingAccount(true);
      return;
    }

    playSfx('fan');

    try {
      localStorage.setItem('hangul_user_id', finalUserId);
      localStorage.setItem('hangul_user_nickname', finalNickname);
      localStorage.setItem('hangul_user_email', finalEmail);

      // Sync user profile update into hangul_admin_members immediately
      const stored = localStorage.getItem('hangul_admin_members');
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const updatedList = list.map((m: any) => {
            if (
              m.id.toLowerCase() === initialStoredId.toLowerCase() ||
              m.id.toLowerCase() === 'sia_mom' ||
              m.name.includes('🌟')
            ) {
              return {
                ...m,
                id: finalUserId,
                name: `${finalNickname} (🌟 내 접속 계정)`,
                email: finalEmail,
              };
            }
            return m;
          });
          localStorage.setItem('hangul_admin_members', JSON.stringify(updatedList));
        }
      }
    } catch {}

    onSave(name.trim() || '우리 아이', childAge, selectedFriend, selectedTheme, finalWish, msg.trim());
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
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#fdf3e4] text-[#c9502f] text-xs font-jua mb-1">
            아이와 함께 맞춰봐요!
          </div>
          <h2 className="text-xl font-jua text-[#1b1917]">아이 프로필 &amp; 약속 설정</h2>
          <p className="text-xs text-[#8a8178] font-body">
            5세부터 7세까지 우리 아이 연령과 관심사에 딱 맞게 조절해요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 font-body">
          {/* Member Account ID Card (Editable & Clearly Explained) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF9EE] via-[#FFF6EB] to-[#FFF1DF] border-2 border-[#F6D8A6] space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-jua text-[#8a5d1b] flex items-center gap-1.5">
                <span>👤</span>
                <span>내 회원 계정 정보 (고유 ID)</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleToggleEditAccount}
                  className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white text-[#c9502f] font-jua border border-[#fed7aa] hover:bg-[#fff7ed] transition-all cursor-pointer shadow-2xs"
                >
                  {isEditingAccount ? '확인' : '✏️ 아이디 변경'}
                </button>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-[#b45309] font-jua">
                  현재 접속 중
                </span>
              </div>
            </div>

            {isEditingAccount ? (
              <div className="space-y-2.5 bg-white p-3 rounded-xl border border-[#eedfc9] animate-fadeIn">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[11px] font-jua text-[#4a443e]">
                      내 고유 회원 ID (영문/숫자)
                    </label>
                    <span className="text-[10px] text-[#8a8178] font-mono">
                      {userId.trim().length}/18자
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                      placeholder="예) sia_mom, minjun2026"
                      maxLength={18}
                      className={`flex-1 px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border bg-[#faf8f5] text-[#1b1917] outline-none transition-colors ${
                        isIdDuplicated(userId.trim())
                          ? 'border-red-500 bg-red-50/50 focus:border-red-600'
                          : userId.trim().length >= 3
                          ? 'border-emerald-500 focus:border-emerald-600'
                          : 'border-[#e4dccf] focus:border-[#c9502f]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleCheckDuplicateClick}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-[#8a5d1b] text-[10px] font-jua rounded-lg border border-[#f6d8a6] shrink-0 active:scale-95 transition-transform cursor-pointer"
                    >
                      중복 확인
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateSafeRandomId}
                      className="px-2 py-1 bg-[#fdf3e4] hover:bg-[#fae7ce] text-[#c9502f] text-[10px] font-jua rounded-lg border border-[#f5d7b5] shrink-0 active:scale-95 transition-transform cursor-pointer"
                    >
                      랜덤 생성
                    </button>
                  </div>

                  {/* Live Duplication & Validation Feedback */}
                  <div className="mt-1.5">
                    {isIdDuplicated(userId.trim()) ? (
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-jua animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>이미 다른 회원이 사용 중인 아이디입니다! 다른 아이디를 입력해주세요.</span>
                      </div>
                    ) : userId.trim().length >= 3 ? (
                      <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-jua animate-fadeIn">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>사용 가능한 아이디입니다! (중복 없음)</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-[#8a8178] font-body">
                        다른 회원과 겹치지 않는 3~18자의 영문/숫자 아이디를 입력해주세요.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-jua text-[#4a443e] block mb-0.5">
                      회원 닉네임
                    </label>
                    <input
                      type="text"
                      value={userNickname}
                      onChange={(e) => setUserNickname(e.target.value)}
                      placeholder="예) 시아맘, 민준맘"
                      maxLength={10}
                      className="w-full px-2.5 py-1.5 text-xs font-jua rounded-lg border border-[#e4dccf] bg-white text-[#1b1917] outline-none focus:border-[#c9502f]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-jua text-[#4a443e] block mb-0.5">
                      등록 이메일
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#e4dccf] bg-white text-[#1b1917] outline-none focus:border-[#c9502f]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white/95 p-2.5 rounded-xl border border-[#eedfc9]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#c9502f] bg-[#fff5f2] px-2 py-0.5 rounded-md border border-[#fbd4c7]">
                      {userId}
                    </span>
                    <span className="text-xs text-[#1b1917] font-jua">({userNickname})</span>
                  </div>
                  <p className="text-[11px] text-[#78716c] font-body mt-0.5">{userEmail}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playSfx('pop');
                    try {
                      navigator.clipboard?.writeText(userId);
                    } catch {}
                    setCopiedIdNotice(true);
                    setTimeout(() => setCopiedIdNotice(false), 2000);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-jua border active:scale-95 transition-all shrink-0 cursor-pointer ${
                    copiedIdNotice
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-[#fdf3e4] hover:bg-[#fbe7ce] text-[#c9502f] border-[#f5d7b5]'
                  }`}
                >
                  {copiedIdNotice ? '✓ 복사완료!' : 'ID 복사'}
                </button>
              </div>
            )}

            {/* Clear Explanation of How to Use the Member ID */}
            <div className="p-2.5 rounded-xl bg-white/85 border border-[#eedfc9] space-y-1 text-[11px] font-body text-[#78350f] leading-relaxed">
              <div className="font-bold font-jua text-[#b45309] flex items-center gap-1">
                <span>💡</span>
                <span>회원 ID 사용법 &amp; 안내</span>
              </div>
              <p>• <b>내 고유 ID</b>: 이 기기에서 사용하는 회원님의 전용 아이디입니다. 원하는 이름으로 자유롭게 변경하여 사용하실 수 있습니다.</p>
              <p>• <b>결제 승인 시</b>: 무통장 입금 후 위 회원 ID(<b>{userId}</b>)를 관리자에게 알려주시면 계정을 찾아 즉시 구독을 승인해 드립니다.</p>
              <p>• <b>글자 열매 / 선물 지급</b>: 이벤트 당첨이나 보너스 선물 지급 시 위 회원 ID로 포인트가 충전됩니다.</p>
            </div>
          </div>

          {/* 1. Child Name & Age (5세, 6세, 7세) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1b1917] block">
                아이 이름 / 별명
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예) 시아, 민준이"
                maxLength={8}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#e4dccf] text-sm text-[#1b1917] font-jua focus:border-[#c9502f] outline-none bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1b1917] block">
                아이 나이 (5~7세)
              </label>
              <div className="grid grid-cols-3 gap-1">
                {['5세', '6세', '7세'].map((age) => (
                  <button
                    type="button"
                    key={age}
                    onClick={() => {
                      playSfx('tap');
                      setChildAge(age);
                    }}
                    className={`py-2 rounded-xl text-xs font-jua border transition-all ${
                      childAge === age
                        ? 'bg-[#c9502f] text-white border-[#c9502f] shadow-xs'
                        : 'bg-white text-[#4a443e] border-[#e4dccf]'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Voice Tone Selector (다정한 엄마, 친근한 아빠 등 목소리 톤) */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-[#fffaf5] border border-[#f3dfc2]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1b1917] font-jua flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#c9502f]" />
                <span>한글 읽어주는 목소리 톤 선택</span>
              </label>
              <span className="text-[10px] text-[#c9502f] font-hand font-bold">부드러운 음성</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {VOICE_TONES.map((vt) => (
                <button
                  type="button"
                  key={vt.id}
                  onClick={() => {
                    playSfx('tap');
                    setVoiceToneState(vt.id);
                    setVoiceTone(vt.id);
                    speakKorean(`${name || '시아'}야 안녕! 오늘도 한글놀이 같이 하자!`, false, vt.id);
                  }}
                  className={`p-2 rounded-xl border text-left transition-all flex items-start gap-1.5 active:scale-95 ${
                    voiceTone === vt.id
                      ? 'border-[#c9502f] bg-[#fff5f2] shadow-xs ring-2 ring-[#c9502f]/20'
                      : 'border-[#eedfc9] bg-white hover:bg-[#fcfaf7]'
                  }`}
                >
                  <span className="text-xl flex-none">{vt.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <span className="font-jua text-xs text-[#1b1917] block leading-tight">
                      {vt.name}
                    </span>
                    <span className="text-[10px] text-[#8a8178] font-hand leading-tight block truncate">
                      {vt.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#8a8178] font-hand text-right pt-0.5">
              💡 버튼을 누르면 해당 목소리로 즉시 미리듣기가 재생됩니다.
            </p>
          </div>

          {/* 2. Companion Animal Friend */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1917] block">
              2. 함께 모험할 다마고치 동물 친구
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FRIENDS.map((f) => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => {
                    playSfx('pop');
                    setSelectedFriend(f.id);
                  }}
                  className={`p-2 rounded-2xl border text-center transition-all ${
                    selectedFriend === f.id
                      ? 'border-[#c9502f] bg-[#fff5f2] shadow-xs scale-105'
                      : 'border-[#e4dccf] bg-white hover:border-[#c9502f]/40'
                  }`}
                >
                  <span className="text-2xl block">{f.e}</span>
                  <span className="text-xs font-jua text-[#1b1917] mt-0.5 block">
                    {f.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Sticker Board Theme */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1917] block">
              3. 스티커 보드 모험 테마
            </label>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => {
                    playSfx('tap');
                    setSelectedTheme(t.id);
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    selectedTheme === t.id
                      ? 'border-[#c9502f] bg-[#fff5f2] shadow-xs'
                      : 'border-[#e4dccf] bg-white hover:border-[#c9502f]/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-base mb-0.5">
                    {t.pack.slice(0, 3).join('')}
                  </div>
                  <span className="font-jua text-xs text-[#1b1917] block">{t.name}</span>
                  <span className="text-[10px] text-[#8a8178] font-hand">{t.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Child's Wish when 30 are done */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1917] block">
              4. 30칸 다 채우면 엄마가 들어줄 소원
            </label>
            <div className="flex flex-wrap gap-1.5">
              {WISHES.map((w, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    playSfx('tap');
                    setSelectedWish(w);
                    setCustomWish('');
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-hand border transition-all ${
                    selectedWish === w && !customWish
                      ? 'bg-[#1b1917] text-white border-[#1b1917]'
                      : 'bg-white text-[#4a443e] border-[#e4dccf]'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customWish}
              onChange={(e) => setCustomWish(e.target.value)}
              placeholder="직접 쓰기 (예: 알라딘 요술램프 사기)"
              maxLength={25}
              className="w-full px-3 py-2 rounded-xl border border-[#e4dccf] text-xs bg-white text-[#1b1917] focus:border-[#c9502f] outline-none"
            />
          </div>

          {/* 5. Mom's message */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1b1917] block">
              5. 소원권에 들어갈 엄마의 약속 한마디
            </label>
            <input
              type="text"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              maxLength={35}
              required
              className="w-full px-3 py-2 rounded-xl border border-[#e4dccf] text-xs bg-white text-[#1b1917] focus:border-[#c9502f] outline-none"
            />
          </div>

          {/* Quick Shortcuts: Print Center & Sound Blend */}
          {(onOpenPrint || onOpenSoundBlend) && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {onOpenPrint && (
                <button
                  type="button"
                  onClick={() => {
                    playSfx('tap');
                    onClose();
                    onOpenPrint();
                  }}
                  className="p-2.5 rounded-xl bg-white border border-[#e4dccf] hover:bg-[#faf8f5] text-left flex items-center gap-2 transition-all active:scale-95"
                >
                  <span className="text-lg">🖨️</span>
                  <div>
                    <span className="font-jua text-xs text-[#1b1917] block">학습지·상장 출력</span>
                    <span className="text-[10px] text-[#8a8178] font-hand">A4 인쇄 도안</span>
                  </div>
                </button>
              )}

              {onOpenSoundBlend && (
                <button
                  type="button"
                  onClick={() => {
                    playSfx('pop');
                    onClose();
                    onOpenSoundBlend();
                  }}
                  className="p-2.5 rounded-xl bg-[#fff5f2] border border-[#fcd5cb] hover:bg-[#ffece6] text-left flex items-center gap-2 transition-all active:scale-95"
                >
                  <span className="text-lg">🧩</span>
                  <div>
                    <span className="font-jua text-xs text-[#c9502f] block">소리합체 놀이방</span>
                    <span className="text-[10px] text-[#8a8178] font-hand">자음+모음 결합</span>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Parent Voice Mission Shortcut */}
          {onOpenParentVoice && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center flex-none shadow-2xs">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-jua text-xs text-rose-950">엄마/아빠 칭찬 목소리 미션 (5초)</p>
                  <p className="text-[10px] text-rose-800 font-hand">정답 맞출 때마다 부모님 육성 칭찬 자동 재생</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playSfx('pop');
                  onClose();
                  onOpenParentVoice();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-jua text-[11px] shadow-2xs flex-none transition-all active:scale-95"
              >
                5초 녹음 🎙️
              </button>
            </div>
          )}

          {/* 6. Admin Entry for Creator */}
          {onOpenAdmin && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-none">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-jua text-xs text-amber-950">서비스 관리자 콘솔 (대표님 전용)</p>
                  <p className="text-[10px] text-amber-800 font-hand">30일 체험일수 조절, 커뮤니티 검수, 백업</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playSfx('pop');
                  onClose();
                  onOpenAdmin();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-jua text-[11px] shadow-2xs flex-none"
              >
                관리자 열기 👑
              </button>
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-sm"
            >
              닫기
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm shadow-md"
            >
              설정 저장하기 ✨
            </button>
          </div>
        </form>
      </div>

      {/* In-App Modal Dialog for Duplicate Check & Alerts (Bypasses iframe alert blocking) */}
      {idCheckPopup && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-3 border-[#eedfc9] rounded-3xl p-5 max-w-xs w-full shadow-2xl text-center space-y-3.5 animate-pop relative">
            <button
              type="button"
              onClick={() => {
                playSfx('tap');
                setIdCheckPopup(null);
              }}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white border border-[#eedfc9] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div
              className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center text-2xl shadow-inner ${
                idCheckPopup.type === 'success'
                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                  : idCheckPopup.type === 'duplicate'
                  ? 'bg-red-100 text-red-600 border-2 border-red-300'
                  : 'bg-amber-100 text-amber-700 border-2 border-amber-300'
              }`}
            >
              {idCheckPopup.type === 'success' ? '🎉' : idCheckPopup.type === 'duplicate' ? '🚫' : '⚠️'}
            </div>

            <div className="space-y-1.5">
              <h4 className="font-jua text-base text-[#1b1917]">{idCheckPopup.title}</h4>
              {idCheckPopup.testedId && (
                <div className="inline-block px-2.5 py-0.5 rounded-lg bg-stone-100 font-mono text-xs font-bold text-[#c9502f] border border-stone-200">
                  ID: {idCheckPopup.testedId}
                </div>
              )}
              <p className="text-xs text-[#5D534A] font-body whitespace-pre-line leading-relaxed">
                {idCheckPopup.message}
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              {idCheckPopup.type === 'duplicate' && (
                <button
                  type="button"
                  onClick={() => {
                    handleGenerateSafeRandomId();
                    setIdCheckPopup(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#fdf3e4] hover:bg-[#fae7ce] text-[#c9502f] font-jua text-xs border border-[#f5d7b5] active:scale-95 transition-transform cursor-pointer"
                >
                  랜덤 추천 ID 받기
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  playSfx('tap');
                  setIdCheckPopup(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-white font-jua text-xs shadow-md active:scale-95 transition-transform cursor-pointer ${
                  idCheckPopup.type === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#c9502f] hover:bg-[#b84324]'
                }`}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
