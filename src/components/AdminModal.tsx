import React, { useState } from 'react';
import {
  X,
  Shield,
  Key,
  Crown,
  Database,
  RefreshCw,
  Sparkles,
  Check,
  Download,
  Trash2,
  Heart,
  Gift,
  Smartphone,
  CreditCard,
  Pin,
  Lock,
  Unlock,
  Info,
  Users,
  Plus,
  Search,
} from 'lucide-react';
import { CommunityPost, PetGrowthState, StageId, StickerBoardState } from '../types';
import { playSfx } from '../utils/sound';
import { verifyAdminPin, updateAdminPin, setStoredAdminActive } from '../utils/adminAuth';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onSetIsAdmin: (status: boolean) => void;
  trialDaysLeft: number;
  onUpdateTrialDays: (days: number) => void;
  isSubscribed?: boolean;
  onUpdateSubscribed?: (status: boolean) => void;
  boardState: StickerBoardState;
  onUpdateBoardState: (updater: (prev: StickerBoardState) => StickerBoardState) => void;
  petState: PetGrowthState;
  onUpdatePetState: (updater: (prev: PetGrowthState) => PetGrowthState) => void;
  communityPosts: CommunityPost[];
  onDeletePost: (postId: string) => void;
  onTogglePinPost: (postId: string) => void;
  completedDaysCount: number;
  diaryCount: number;
  onResetAllData: () => void;
  onUnlockAllStages?: () => void;
  onResetStageLocks?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  onSetIsAdmin,
  trialDaysLeft,
  onUpdateTrialDays,
  isSubscribed = false,
  onUpdateSubscribed,
  boardState,
  onUpdateBoardState,
  petState,
  onUpdatePetState,
  communityPosts,
  onDeletePost,
  onTogglePinPost,
  completedDaysCount,
  diaryCount,
  onResetAllData,
  onUnlockAllStages,
  onResetStageLocks,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'trial' | 'community' | 'security' | 'cheats' | 'guide'>('members');
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Admin PIN change state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState('');
  const [pinChangeError, setPinChangeError] = useState('');

  // Member Accounts Directory (State & LocalStorage)
  const [members, setMembers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    tier: 'free' | 'monthly' | 'yearly' | 'vip';
    trialDaysLeft: number;
    berries: number;
    hearts: number;
    joinedAt: string;
    notes?: string;
    payments: Array<{
      id: string;
      date: string;
      item: string;
      amount: number;
      method: string;
      status: '완료' | '대기' | '취소';
    }>;
  }>>(() => {
    try {
      const stored = localStorage.getItem('hangul_admin_members');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'sia_mom',
        name: '시아맘 (대표 / 현재 접속 계정)',
        email: 'designhair6@gmail.com',
        tier: 'monthly',
        trialDaysLeft: 30,
        berries: 20,
        hearts: 5,
        joinedAt: '2026-10-20',
        notes: '현재 접속 중인 사용자 대표 계정',
        payments: [
          { id: 'pay-001', date: '2026-10-24 14:20', item: '웹 직접결제 월간 정기구독', amount: 3900, method: '계좌이체 / 승인완료', status: '완료' },
        ],
      },
      {
        id: 'siwoo_mom',
        name: '시우맘',
        email: 'siwoo_mom@naver.com',
        tier: 'free',
        trialDaysLeft: 14,
        berries: 20,
        hearts: 4,
        joinedAt: '2026-10-22',
        notes: '커뮤니티 D+8 후기 작성자',
        payments: [],
      },
      {
        id: 'minjun_mom',
        name: '민준맘',
        email: 'minjun_house@kakao.com',
        tier: 'yearly',
        trialDaysLeft: 365,
        berries: 40,
        hearts: 10,
        joinedAt: '2026-10-21',
        notes: '연간 패스 사전 결제 회원',
        payments: [
          { id: 'pay-002', date: '2026-10-21 09:15', item: '연간 프리미엄 패스', amount: 29000, method: '카카오페이', status: '완료' },
        ],
      },
      {
        id: 'yuna_home',
        name: '윤아맘',
        email: 'yuna_family@gmail.com',
        tier: 'vip',
        trialDaysLeft: 9999,
        berries: 100,
        hearts: 20,
        joinedAt: '2026-10-23',
        notes: '평생 VIP 마스터 회원',
        payments: [
          { id: 'pay-003', date: '2026-10-23 18:40', item: 'VIP 평생 무제한 회원권', amount: 49000, method: '신용카드', status: '완료' },
        ],
      },
    ];
  });

  const [selectedMemberId, setSelectedMemberId] = useState<string>('sia_mom');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [memberActionNotice, setMemberActionNotice] = useState<string | null>(null);

  // Manual Web Billing Entry Modal
  const [showManualPayModal, setShowManualPayModal] = useState(false);
  const [manualPayItem, setManualPayItem] = useState('웹 직접결제 월간 정기구독 (3,900원)');
  const [manualPayAmount, setManualPayAmount] = useState('3900');
  const [manualPayMethod, setManualPayMethod] = useState('계좌이체 / 입금확인');

  const saveMembers = (updated: typeof members) => {
    setMembers(updated);
    try {
      localStorage.setItem('hangul_admin_members', JSON.stringify(updated));
    } catch {}
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];

  // Grant Berries (+20)
  const handleGrantBerries = (amount: number = 20) => {
    playSfx('pop');
    const updated = members.map((m) => {
      if (m.id === selectedMemberId) {
        return { ...m, berries: m.berries + amount };
      }
      return m;
    });
    saveMembers(updated);
    if (selectedMemberId === 'sia_mom') {
      onUpdatePetState((prev) => ({ ...prev, berriesCount: (prev.berriesCount || 0) + amount }));
    }
    setMemberActionNotice(`🎉 [${selectedMember.name}] 님에게 글자 열매 +${amount}개가 부여되었습니다!`);
    setTimeout(() => setMemberActionNotice(null), 3000);
  };

  // Grant Hearts (+5)
  const handleGrantHearts = (amount: number = 5) => {
    playSfx('fan');
    const updated = members.map((m) => {
      if (m.id === selectedMemberId) {
        return { ...m, hearts: m.hearts + amount };
      }
      return m;
    });
    saveMembers(updated);
    if (selectedMemberId === 'sia_mom') {
      onUpdatePetState((prev) => ({ ...prev, heartsCount: (prev.heartsCount || 0) + amount }));
    }
    setMemberActionNotice(`💖 [${selectedMember.name}] 님에게 사랑의 하트 +${amount}개가 부여되었습니다!`);
    setTimeout(() => setMemberActionNotice(null), 3000);
  };

  // Grant Trial Days (+30)
  const handleGrantTrialDays = (days: number = 30) => {
    playSfx('fan');
    const updated = members.map((m) => {
      if (m.id === selectedMemberId) {
        return { ...m, trialDaysLeft: m.trialDaysLeft + days };
      }
      return m;
    });
    saveMembers(updated);
    if (selectedMemberId === 'sia_mom') {
      onUpdateTrialDays(trialDaysLeft + days);
    }
    setMemberActionNotice(`⏳ [${selectedMember.name}] 님에게 체험 기간 +${days}일이 연장되었습니다!`);
    setTimeout(() => setMemberActionNotice(null), 3000);
  };

  // Grant Web Subscription Tier
  const handleSetSubscriptionTier = (tier: 'free' | 'monthly' | 'yearly' | 'vip') => {
    playSfx('fan');
    const updated = members.map((m) => {
      if (m.id === selectedMemberId) {
        return {
          ...m,
          tier,
          trialDaysLeft: tier === 'vip' ? 9999 : tier === 'yearly' ? 365 : tier === 'monthly' ? 30 : m.trialDaysLeft,
        };
      }
      return m;
    });
    saveMembers(updated);
    if (selectedMemberId === 'sia_mom') {
      if (onUpdateSubscribed) onUpdateSubscribed(tier !== 'free');
      if (tier === 'vip') onUpdateTrialDays(9999);
      else if (tier === 'yearly') onUpdateTrialDays(365);
      else if (tier === 'monthly') onUpdateTrialDays(30);
    }
    const tierName = tier === 'monthly' ? '월간 정기구독 (3,900원)' : tier === 'yearly' ? '연간 프리미엄 패스' : tier === 'vip' ? '평생 VIP 마스터' : '기본 무료 체험판';
    setMemberActionNotice(`👑 [${selectedMember.name}] 님의 이용 등급이 '${tierName}'(으)로 변경되었습니다!`);
    setTimeout(() => setMemberActionNotice(null), 3000);
  };

  // Add Manual Payment Record
  const handleAddManualPayment = (e: React.FormEvent) => {
    e.preventDefault();
    playSfx('fan');
    const newPay = {
      id: 'pay-' + Date.now(),
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      item: manualPayItem,
      amount: Number(manualPayAmount) || 0,
      method: manualPayMethod,
      status: '완료' as const,
    };
    const updated = members.map((m) => {
      if (m.id === selectedMemberId) {
        return {
          ...m,
          tier: (manualPayItem.includes('연간') ? 'yearly' : manualPayItem.includes('VIP') ? 'vip' : 'monthly') as any,
          payments: [newPay, ...m.payments],
        };
      }
      return m;
    });
    saveMembers(updated);
    if (selectedMemberId === 'sia_mom' && onUpdateSubscribed) {
      onUpdateSubscribed(true);
    }
    setShowManualPayModal(false);
    setMemberActionNotice(`💳 [${selectedMember.name}] 님의 ${manualPayItem} 결제가 승인 처리되었습니다!`);
    setTimeout(() => setMemberActionNotice(null), 3000);
  };

  // Add New Member
  const handleAddNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberId.trim() || !newMemberName.trim()) {
      alert('아이디와 회원명을 입력해주세요!');
      return;
    }
    if (members.some((m) => m.id === newMemberId.trim())) {
      alert('이미 존재하는 회원 아이디입니다!');
      return;
    }
    playSfx('pop');
    const newMem = {
      id: newMemberId.trim(),
      name: newMemberName.trim(),
      email: newMemberEmail.trim() || `${newMemberId.trim()}@user.com`,
      tier: 'free' as const,
      trialDaysLeft: 30,
      berries: 20,
      hearts: 3,
      joinedAt: new Date().toISOString().slice(0, 10),
      notes: '신규 가입 회원',
      payments: [],
    };
    const updated = [newMem, ...members];
    saveMembers(updated);
    setSelectedMemberId(newMem.id);
    setNewMemberId('');
    setNewMemberName('');
    setNewMemberEmail('');
    setShowAddMemberModal(false);
    setMemberActionNotice(`✨ 새 회원 [${newMem.name} (${newMem.id})]이 추가되었습니다!`);
    setTimeout(() => setMemberActionNotice(null), 3000);
  };

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPin(pinInput)) {
      playSfx('fan');
      onSetIsAdmin(true);
      setStoredAdminActive(true);
      setAuthError(false);
      setPinInput('');
    } else {
      playSfx('pop');
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    playSfx('tap');
    onSetIsAdmin(false);
    setStoredAdminActive(false);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeSuccess('');
    setPinChangeError('');

    if (!verifyAdminPin(currentPinInput)) {
      playSfx('pop');
      setPinChangeError('현재 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!newPinInput || newPinInput.trim().length < 4) {
      playSfx('pop');
      setPinChangeError('새 비밀번호는 4자리 이상이어야 합니다.');
      return;
    }

    if (newPinInput.trim() !== confirmPinInput.trim()) {
      playSfx('pop');
      setPinChangeError('새 비밀번호와 확인 입력이 일치하지 않습니다.');
      return;
    }

    const ok = updateAdminPin(newPinInput.trim());
    if (ok) {
      playSfx('fan');
      setPinChangeSuccess('관리자 비밀번호가 안전하게 변경되었습니다!');
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
    } else {
      setPinChangeError('비밀번호 변경 처리 중 오류가 발생했습니다.');
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        boardState,
        petState,
        trialDaysLeft,
        communityPosts,
        storageDump: { ...localStorage },
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todak-hangul-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      playSfx('fan');
    } catch {
      alert('백업 파일 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#fcfaf7] border-2 border-[#e4dccf] rounded-3xl w-full max-w-xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col relative text-left">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#eedfc9] bg-gradient-to-r from-[#2B231D] to-[#1C1613] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4A261] text-white flex items-center justify-center shadow-xs">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-jua text-white">
                  토닥한글 서비스 관리자 콘솔
                </h2>
                {isAdmin ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1">
                    <Check className="w-3 h-3" /> 관리자 인증됨
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/80 text-white flex items-center gap-1">
                    <Lock className="w-3 h-3" /> 인증 필요
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-100/70 font-hand">
                대표님 전용 관리 페이지 (체험 기간, 커뮤니티 검수, 수익화 가이드)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-jua transition-colors"
                title="관리자 세션 로그아웃"
              >
                로그아웃
              </button>
            )}
            <button
              onClick={() => {
                playSfx('tap');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* If NOT Admin: Display Secure Login Gate Screen Only */}
        {!isAdmin ? (
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg animate-pop">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-jua text-xs border border-amber-300">
                🔒 대표 관리자 전용 인증
              </span>
              <h3 className="font-jua text-xl sm:text-2xl text-[#1b1917]">
                관리자 비밀번호를 입력해주세요
              </h3>
              <p className="text-xs text-[#7D736A] font-hand max-w-sm leading-relaxed">
                관리자 인증을 완료하셔야 서비스 대시보드, 30일 체험 및 결제 설정, 커뮤니티 검수 권한을 조회하고 이용하실 수 있습니다.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-3 pt-2">
              <div className="space-y-1 text-left">
                <label className="text-xs font-jua text-stone-700 block">관리자 비밀번호</label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setAuthError(false);
                  }}
                  autoFocus
                  required
                  placeholder="비밀번호 입력"
                  maxLength={16}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-stone-300 font-jua text-sm bg-white outline-none focus:border-amber-600 tracking-widest text-center shadow-xs"
                />
              </div>

              {authError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-jua flex items-center justify-center gap-1.5">
                  <span>⚠️ 비밀번호가 올바르지 않습니다. 다시 확인해주세요.</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    playSfx('tap');
                    onClose();
                  }}
                  className="w-1/3 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-jua text-sm transition-all"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-jua text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Crown className="w-4 h-4 fill-amber-300 text-amber-200" />
                  관리자 로그인 및 콘솔 열기
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Tab Navigation (Visible ONLY after login) */}
            <div className="flex border-b border-[#eedfc9] bg-[#f5efe6] overflow-x-auto px-2 pt-2 gap-1 text-xs font-jua flex-none">
              <button
                onClick={() => setActiveTab('members')}
                className={`px-3 py-2 rounded-t-xl transition-all flex items-center gap-1.5 flex-none ${
                  activeTab === 'members'
                    ? 'bg-[#fcfaf7] text-[#c9502f] border-t-2 border-x border-[#eedfc9] -mb-[1px] font-bold'
                    : 'text-[#7D736A] hover:text-[#1b1917]'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> 회원 & 웹결제/선물
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-2 rounded-t-xl transition-all flex items-center gap-1.5 flex-none ${
                  activeTab === 'overview'
                    ? 'bg-[#fcfaf7] text-[#c9502f] border-t-2 border-x border-[#eedfc9] -mb-[1px] font-bold'
                    : 'text-[#7D736A] hover:text-[#1b1917]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> 대시보드
              </button>
              <button
                onClick={() => setActiveTab('trial')}
                className={`px-3 py-2 rounded-t-xl transition-all flex items-center gap-1.5 flex-none ${
                  activeTab === 'trial'
                    ? 'bg-[#fcfaf7] text-[#c9502f] border-t-2 border-x border-[#eedfc9] -mb-[1px] font-bold'
                    : 'text-[#7D736A] hover:text-[#1b1917]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> 30일 체험 & 결제
              </button>
              <button
                onClick={() => setActiveTab('community')}
                className={`px-3 py-2 rounded-t-xl transition-all flex items-center gap-1.5 flex-none ${
                  activeTab === 'community'
                    ? 'bg-[#fcfaf7] text-[#c9502f] border-t-2 border-x border-[#eedfc9] -mb-[1px] font-bold'
                    : 'text-[#7D736A] hover:text-[#1b1917]'
                }`}
              >
                <Gift className="w-3.5 h-3.5" /> 커뮤니티 ({communityPosts.length})
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-3 py-2 rounded-t-xl transition-all flex items-center gap-1.5 flex-none ${
                  activeTab === 'security'
                    ? 'bg-[#fcfaf7] text-[#c9502f] border-t-2 border-x border-[#eedfc9] -mb-[1px] font-bold'
                    : 'text-[#7D736A] hover:text-[#1b1917]'
                }`}
              >
                <Key className="w-3.5 h-3.5" /> 비밀번호 변경
              </button>
              <button
                onClick={() => setActiveTab('cheats')}
                className={`px-3 py-2 rounded-t-xl transition-all flex items-center gap-1.5 flex-none ${
                  activeTab === 'cheats'
                    ? 'bg-[#fcfaf7] text-[#c9502f] border-t-2 border-x border-[#eedfc9] -mb-[1px] font-bold'
                    : 'text-[#7D736A] hover:text-[#1b1917]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> 빠른 검수 치트
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 font-body">
          {/* TAB: MEMBERS & WEB BILLING & GIFTS */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {/* Action notice toast */}
              {memberActionNotice && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-jua animate-pop shadow-xs">
                  {memberActionNotice}
                </div>
              )}

              {/* Header Guide */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <h3 className="font-jua text-sm text-[#1b1917] flex items-center gap-1.5">
                    <span>👥</span>
                    아이디별 구독·선물 부여 & 웹 직접 결제 관리
                  </h3>
                  <p className="text-[11px] text-[#7D736A] font-hand mt-0.5">
                    앱스토어 등록 전에도 사이트에서 직접 결제받고, 아이디별로 선물과 구독을 부여합니다.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white text-xs font-jua shadow-xs flex items-center gap-1 flex-none active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> 새 회원 ID 등록
                </button>
              </div>

              {/* Member Selection Chips / Search */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-[#8a8178] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="회원 아이디, 이름, 이메일 검색..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#eedfc9] bg-white text-xs font-body outline-none focus:border-[#c9502f]"
                    />
                  </div>
                  <span className="text-xs text-[#8a8178] font-jua flex-none">
                    총 {members.length}명
                  </span>
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {members
                    .filter(
                      (m) =>
                        !memberSearchQuery ||
                        m.id.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                        m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                        m.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
                    )
                    .map((m) => {
                      const isSelected = m.id === selectedMemberId;
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            playSfx('tap');
                            setSelectedMemberId(m.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-jua flex-none transition-all flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-[#c9502f] text-white border-[#c9502f] shadow-xs scale-102'
                              : 'bg-white text-[#4a443e] border-[#eedfc9] hover:border-[#c9502f]/40'
                          }`}
                        >
                          <span>{m.id === 'sia_mom' ? '👑' : '👤'}</span>
                          <span>{m.name.split(' ')[0]}</span>
                          <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-[#7D736A]'}`}>
                            {m.id}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Selected Member Detail & Action Card */}
              <div className="bg-white rounded-2xl p-4 border-2 border-[#eedfc9] shadow-xs space-y-3.5">
                {/* Member Profile Banner */}
                <div className="flex items-start justify-between border-b border-[#f0ebe1] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-jua text-base text-[#1b1917]">{selectedMember.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fdf3e4] text-[#c9502f] border border-[#eedfc9]">
                        ID: {selectedMember.id}
                      </span>
                      {selectedMember.id === 'sia_mom' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          현재 사용 중인 대표 계정 ✨
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8a8178] font-hand mt-0.5">
                      이메일: {selectedMember.email} · 가입일: {selectedMember.joinedAt}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-jua block">
                      현재 등급:{' '}
                      <b className="text-[#c9502f]">
                        {selectedMember.tier === 'monthly'
                          ? '월간 정기구독 💳'
                          : selectedMember.tier === 'yearly'
                          ? '연간 프리미엄 패스 💎'
                          : selectedMember.tier === 'vip'
                          ? 'VIP 평생회원 👑'
                          : '무료 체험판 ⏳'}
                      </b>
                    </span>
                    <span className="text-[11px] text-[#7D736A] font-hand">
                      {selectedMember.tier === 'vip' ? '무제한 이용' : `체험 잔여 ${selectedMember.trialDaysLeft}일`}
                    </span>
                  </div>
                </div>

                {/* Balance Pills */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-jua">
                  <div className="p-2.5 rounded-xl bg-[#f6edfd] border border-[#e0c4f7] text-[#6b21a8]">
                    <span className="block text-[10px] text-[#6b21a8]/70 font-hand">보유 글자열매</span>
                    <span className="text-base font-bold">🍇 {selectedMember.berries}개</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#fff0f3] border border-[#fbcfe8] text-[#be185d]">
                    <span className="block text-[10px] text-[#be185d]/70 font-hand">보유 하트</span>
                    <span className="text-base font-bold">💖 {selectedMember.hearts}개</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#eef7ed] border border-[#c6e9c0] text-[#2d6a2f]">
                    <span className="block text-[10px] text-[#2d6a2f]/70 font-hand">이용 잔여일</span>
                    <span className="text-base font-bold">⏳ {selectedMember.trialDaysLeft}일</span>
                  </div>
                </div>

                {/* Section A: 아이디별 선물 부여 */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-jua text-[#1b1917] flex items-center gap-1">
                    <span>🎁</span>
                    <span>[{selectedMember.name}] 님에게 특별 선물 지급</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-jua">
                    <button
                      onClick={() => handleGrantBerries(20)}
                      className="py-2.5 px-2 rounded-xl bg-[#fcf8ff] border border-[#d8b4fe] hover:bg-[#f3e8ff] text-[#6b21a8] transition-all active:scale-95 shadow-2xs"
                    >
                      🍇 글자열매 +20개
                    </button>
                    <button
                      onClick={() => handleGrantHearts(5)}
                      className="py-2.5 px-2 rounded-xl bg-[#fff5f7] border border-[#fbcfe8] hover:bg-[#ffe4e6] text-[#be185d] transition-all active:scale-95 shadow-2xs"
                    >
                      💖 하트 +5개
                    </button>
                    <button
                      onClick={() => handleGrantTrialDays(30)}
                      className="py-2.5 px-2 rounded-xl bg-[#f0f9ed] border border-[#bbf7d0] hover:bg-[#dcfce7] text-[#15803d] transition-all active:scale-95 shadow-2xs"
                    >
                      ⏳ 30일 무료 연장
                    </button>
                  </div>
                </div>

                {/* Section B: 웹 직접 결제 & 등급 관리 */}
                <div className="space-y-2 pt-2 border-t border-[#f0ebe1]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-jua text-[#1b1917] flex items-center gap-1">
                      <span>💳</span>
                      <span>웹 직접 결제 & 이용 등급 변경 (앱스토어 승인 불필요)</span>
                    </label>
                    <button
                      onClick={() => setShowManualPayModal(true)}
                      className="text-[11px] font-jua text-[#c9502f] hover:underline flex items-center gap-0.5"
                    >
                      <span>+ 결제 영수증 등록</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-jua">
                    <button
                      onClick={() => handleSetSubscriptionTier('monthly')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        selectedMember.tier === 'monthly'
                          ? 'bg-[#c9502f] text-white border-[#c9502f] shadow-xs'
                          : 'bg-white border-[#eedfc9] text-[#1b1917] hover:bg-[#faf8f5]'
                      }`}
                    >
                      <span className="block text-sm">💳</span>
                      <span className="block font-bold">월간 구독</span>
                      <span className="text-[10px] scale-90 opacity-80 block">월 3,900원</span>
                    </button>

                    <button
                      onClick={() => handleSetSubscriptionTier('yearly')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        selectedMember.tier === 'yearly'
                          ? 'bg-[#c9502f] text-white border-[#c9502f] shadow-xs'
                          : 'bg-white border-[#eedfc9] text-[#1b1917] hover:bg-[#faf8f5]'
                      }`}
                    >
                      <span className="block text-sm">💎</span>
                      <span className="block font-bold">연간 패스</span>
                      <span className="text-[10px] scale-90 opacity-80 block">연 29,000원</span>
                    </button>

                    <button
                      onClick={() => handleSetSubscriptionTier('vip')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        selectedMember.tier === 'vip'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-white border-[#eedfc9] text-[#1b1917] hover:bg-[#faf8f5]'
                      }`}
                    >
                      <span className="block text-sm">👑</span>
                      <span className="block font-bold">VIP 평생</span>
                      <span className="text-[10px] scale-90 opacity-80 block">무제한 이용</span>
                    </button>

                    <button
                      onClick={() => handleSetSubscriptionTier('free')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        selectedMember.tier === 'free'
                          ? 'bg-stone-600 text-white border-stone-700 shadow-xs'
                          : 'bg-white border-[#eedfc9] text-[#8a8178] hover:bg-[#faf8f5]'
                      }`}
                    >
                      <span className="block text-sm">⏳</span>
                      <span className="block font-bold">체험판 전환</span>
                      <span className="text-[10px] scale-90 opacity-80 block">구독 해지</span>
                    </button>
                  </div>
                </div>

                {/* Section C: 웹 결제 장부 내역 */}
                <div className="space-y-1.5 pt-2 border-t border-[#f0ebe1]">
                  <h5 className="text-xs font-jua text-[#1b1917]">
                    🧾 [{selectedMember.name}] 님의 웹 결제 내역 ({selectedMember.payments.length}건)
                  </h5>
                  {selectedMember.payments.length === 0 ? (
                    <div className="p-3 rounded-xl bg-[#faf8f5] border border-[#e4dccf] text-center text-xs text-[#8a8178] font-hand">
                      아직 등록된 결제 내역이 없습니다. 부모님이 계좌이체나 카드로 입금 시 우측 상단 [+ 결제 영수증 등록]을 눌러 활성화하세요.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {selectedMember.payments.map((pay) => (
                        <div
                          key={pay.id}
                          className="p-2.5 rounded-xl bg-[#faf8f5] border border-[#e4dccf] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-jua text-[#1b1917] block">{pay.item}</span>
                            <span className="text-[10px] text-[#8a8178] font-hand">
                              {pay.date} · {pay.method}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-jua text-[#c9502f] block">{pay.amount.toLocaleString()}원</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-jua">
                              {pay.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Active Admin Status Card */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                    👑
                  </div>
                  <div>
                    <h4 className="font-jua text-xs sm:text-sm text-emerald-950">
                      대표님 관리자 모드가 활성화되어 있습니다
                    </h4>
                    <p className="text-[11px] text-emerald-700 font-hand">
                      커뮤니티 글/댓글 프리패스 삭제, 공지 고정, 30일 체험일수 및 비밀번호 수정 가능
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveTab('security')}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-jua hover:bg-amber-200 flex items-center gap-1 active:scale-95"
                  >
                    <Key className="w-3 h-3" /> 비밀번호 변경
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-[11px] font-jua hover:bg-emerald-100 active:scale-95 shadow-2xs"
                    title="일반 사용자 화면으로 즉시 전환"
                  >
                    👤 일반 모드로 전환
                  </button>
                </div>
              </div>

              {/* Mode Visual Distinction Explanatory Note */}
              {isAdmin && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs text-amber-950 font-hand flex items-start gap-2 shadow-2xs">
                  <span className="text-base flex-none">👑</span>
                  <div>
                    <span className="font-bold font-jua block text-amber-900">
                      [안내] 관리자 모드와 일반 모드 구분 방식
                    </span>
                    관리자 권한이 켜져 있을 때는 앱 상단에 <b>황금색 ADMIN ON 배너</b>와 <b>헤더의 관리자 ON 배지</b>가 표시되어 검수 모드임을 바로 알 수 있습니다. 일반 사용자에게는 배너가 전혀 보이지 않는 깨끗한 화면이 제공됩니다.
                  </div>
                </div>
              )}

              {/* Service Health & Current Data Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-3 rounded-2xl border border-[#eedfc9] text-center shadow-2xs">
                  <span className="text-[10px] text-[#7D736A] font-jua block">30일 무료 체험</span>
                  <span className="text-lg font-jua text-[#c9502f]">D-{trialDaysLeft}</span>
                  <span className="text-[9px] text-[#8a8178] block">일 남음</span>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-[#eedfc9] text-center shadow-2xs">
                  <span className="text-[10px] text-[#7D736A] font-jua block">칭찬 스티커판</span>
                  <span className="text-lg font-jua text-amber-600">
                    {boardState.stickers.length}/30
                  </span>
                  <span className="text-[9px] text-[#8a8178] block">
                    {boardState.stamped ? '🏆 완주 도장 찍힘' : '진행 중'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-[#eedfc9] text-center shadow-2xs">
                  <span className="text-[10px] text-[#7D736A] font-jua block">다마고치 캐릭터</span>
                  <span className="text-lg font-jua text-emerald-600">Lv.{petState.level}</span>
                  <span className="text-[9px] text-[#8a8178] block">열매 {petState.berriesCount}개</span>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-[#eedfc9] text-center shadow-2xs">
                  <span className="text-[10px] text-[#7D736A] font-jua block">엄마의 성장일기</span>
                  <span className="text-lg font-jua text-indigo-600">{diaryCount}편</span>
                  <span className="text-[9px] text-[#8a8178] block">녹음/사진 보관</span>
                </div>
              </div>

              {/* Data Backup & Reset */}
              <div className="bg-white p-4 rounded-2xl border border-[#eedfc9] space-y-3">
                <h4 className="font-jua text-xs sm:text-sm text-[#1b1917] flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#c9502f]" /> 데이터 백업 및 테스트 리셋
                </h4>
                <p className="text-xs text-[#7D736A] font-hand">
                  현재 로컬스토리지에 저장된 일기, 음성파일, 커뮤니티 글을 안전하게 JSON 파일로 백업할 수 있습니다.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleExportBackup}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#fdf3e4] hover:bg-[#fae7ce] text-[#c9502f] border border-[#f5b8a6] text-xs font-jua"
                  >
                    <Download className="w-3.5 h-3.5" /> 데이터 전체 JSON 백업 다운로드
                  </button>

                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          '정말로 모든 로컬 데이터를 초기화하시겠습니까? (신규 사용자 첫 진입 상태 테스트용)'
                        )
                      ) {
                        onResetAllData();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-jua ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 전체 데이터 초기화 (신규 유저 테스트)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SECURITY & PIN MANAGEMENT */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF9EE] to-[#FFF3DF] border border-[#F6D8A6] space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-jua text-sm sm:text-base text-amber-950">
                      관리자 권한 비밀번호 변경 및 보안 관리
                    </h3>
                    <p className="text-xs text-amber-800 font-hand">
                      대표님만 아는 비밀번호로 자유롭게 변경하고 안전하게 보호하세요.
                    </p>
                  </div>
                </div>

                {!isAdmin ? (
                  <div className="p-3.5 rounded-xl bg-white/90 border border-amber-200 text-xs space-y-2">
                    <p className="text-amber-900 font-jua">
                      비밀번호를 변경하려면 먼저 관리자 인증을 완료해주세요.
                    </p>
                    <form onSubmit={handleLogin} className="flex gap-2">
                      <input
                        type="password"
                        value={pinInput}
                        onChange={(e) => {
                          setPinInput(e.target.value);
                          setAuthError(false);
                        }}
                        placeholder="현재 비밀번호 입력"
                        maxLength={12}
                        className="px-3 py-2 rounded-xl border border-amber-300 bg-white font-jua text-xs flex-1 outline-none focus:border-amber-500 tracking-wider"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-jua text-xs shadow-xs"
                      >
                        관리자 인증
                      </button>
                    </form>
                    {authError && (
                      <p className="text-[11px] text-red-600 font-jua">
                        비밀번호가 올바르지 않습니다.
                      </p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="p-4 rounded-xl bg-white border border-amber-200 space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-jua text-stone-700 block">현재 관리자 비밀번호</label>
                      <input
                        type="password"
                        value={currentPinInput}
                        onChange={(e) => {
                          setCurrentPinInput(e.target.value);
                          setPinChangeError('');
                        }}
                        required
                        placeholder="현재 사용 중인 비밀번호"
                        maxLength={12}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-jua text-xs bg-stone-50 outline-none focus:border-amber-600 focus:bg-white tracking-widest"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-jua text-stone-700 block">새로운 관리자 비밀번호 (4자리 이상)</label>
                      <input
                        type="password"
                        value={newPinInput}
                        onChange={(e) => {
                          setNewPinInput(e.target.value);
                          setPinChangeError('');
                        }}
                        required
                        placeholder="새로 사용할 비밀번호 (숫자 또는 영문 4~12자리)"
                        maxLength={12}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-jua text-xs bg-stone-50 outline-none focus:border-amber-600 focus:bg-white tracking-widest"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-jua text-stone-700 block">새 비밀번호 확인</label>
                      <input
                        type="password"
                        value={confirmPinInput}
                        onChange={(e) => {
                          setConfirmPinInput(e.target.value);
                          setPinChangeError('');
                        }}
                        required
                        placeholder="새 비밀번호 다시 입력"
                        maxLength={12}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-jua text-xs bg-stone-50 outline-none focus:border-amber-600 focus:bg-white tracking-widest"
                      />
                    </div>

                    {pinChangeError && (
                      <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] font-jua">
                        ⚠️ {pinChangeError}
                      </div>
                    )}

                    {pinChangeSuccess && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-jua flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{pinChangeSuccess}</span>
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] text-stone-500 font-hand">
                        🔒 변경된 비밀번호는 즉시 안전하게 적용됩니다.
                      </span>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-jua text-xs shadow-xs transition-transform active:scale-95"
                      >
                        비밀번호 변경 및 저장 🔒
                      </button>
                    </div>
                  </form>
                )}

                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 font-hand space-y-1">
                  <p className="font-bold font-jua">🛡️ 대표님 보안 수칙 안내</p>
                  <p>• 관리자 비밀번호는 일반 사용자 화면 및 안내문 어디에도 노출되지 않도록 철저히 비공개 처리되었습니다.</p>
                  <p>• 비밀번호를 잊지 않도록 대표님만의 안전한 메모장에 별도로 보관해주세요.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRIAL & MONETIZATION */}
          {activeTab === 'trial' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF1ED] to-[#FFE8E1] border border-[#FCD5CB] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#E76F51] bg-white px-2 py-0.5 rounded-full font-jua">
                      수익화 & 과금 모델 제어
                    </span>
                    <h3 className="text-base font-jua text-[#2D2825] mt-1">
                      30일 무료 체험 및 결제 잠금(Paywall)
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-jua ${isSubscribed ? 'text-emerald-600' : trialDaysLeft <= 0 ? 'text-red-600' : 'text-[#E76F51]'}`}>
                      {isSubscribed ? '구독완료' : `D-${trialDaysLeft}`}
                    </span>
                    <p className="text-[10px] text-[#7D736A]">
                      {isSubscribed ? '결제 활성 상태' : trialDaysLeft <= 0 ? '🔒 체험 만료(잠금)' : '무료 체험 진행 중'}
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-jua ${
                  isSubscribed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : trialDaysLeft <= 0
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-white border-[#eedfc9] text-stone-700'
                }`}>
                  <div className="flex items-center gap-2">
                    {isSubscribed ? (
                      <span className="text-emerald-600 font-bold">💳 유료 정기 구독 활성화됨 (모든 기능 무제한 이용 중)</span>
                    ) : trialDaysLeft <= 0 ? (
                      <span className="text-red-600 font-bold animate-pulse">🔒 30일 무료 체험 만료: 결제 전까지 앱 사용 차단(잠금 상태)</span>
                    ) : (
                      <span>🎁 30일 무료 체험 중 ({trialDaysLeft}일 남음)</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#5D534A] font-hand">
                  유저가 30일 체험 후 잔여일이 0일이 되면 결제 잠금(Paywall)이 작동하여 결제 전까지 앱 사용이 제한됩니다.
                  대표님께서 시연 및 테스트를 위해 아래 버튼으로 즉시 체험 만료 잠금이나 결제 완료 상태를 테스트하실 수 있습니다.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => {
                      playSfx('pop');
                      onUpdateTrialDays(0);
                      if (onUpdateSubscribed) onUpdateSubscribed(false);
                      const updated = members.map((m) =>
                        m.id === 'sia_mom' ? { ...m, tier: 'free' as const, trialDaysLeft: 0 } : m
                      );
                      saveMembers(updated);
                      onClose();
                    }}
                    className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-jua shadow-2xs flex items-center gap-1 active:scale-95 transition-transform"
                    title="0일 만료 시 나타나는 결제 잠금 화면을 즉시 확인합니다"
                  >
                    🔒 D-0 만료 & 결제 잠금 즉시 테스트
                  </button>
                  <button
                    onClick={() => {
                      playSfx('pop');
                      onUpdateTrialDays(30);
                      onUpdateSubscribed?.(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-orange-50 border border-[#FCD5CB] text-xs font-jua text-[#E76F51] shadow-2xs active:scale-95 transition-transform"
                  >
                    🎁 30일 무료 체험으로 리셋
                  </button>
                  <button
                    onClick={() => {
                      playSfx('fan');
                      onUpdateSubscribed?.(!isSubscribed);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-jua shadow-2xs active:scale-95 transition-transform flex items-center gap-1 ${
                      isSubscribed
                        ? 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isSubscribed ? '❌ 구독 해제(미결제 상태로 복귀)' : '💳 결제 완료(구독 활성) 상태로 변경'}
                  </button>
                  <button
                    onClick={() => {
                      playSfx('fan');
                      onUpdateTrialDays(999);
                      onUpdateSubscribed?.(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-jua shadow-2xs"
                  >
                    👑 무제한 VIP 모드 (D-999)
                  </button>
                </div>
              </div>

              {/* Business Pricing Plan Overview */}
              <div className="bg-white p-4 rounded-2xl border border-[#eedfc9] space-y-3">
                <h4 className="font-jua text-xs sm:text-sm text-[#1b1917]">
                  💰 기획된 3단계 구독 요금제 (대표님 기획 반영)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                    <span className="font-jua text-emerald-800 block">1. 30일 무료 체험</span>
                    <p className="font-bold text-base text-emerald-700">0원</p>
                    <p className="text-[11px] text-[#7D736A] font-hand">
                      자음/모음/일기/스티커 전 기능 30일간 무료 제공
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-[#FCD5CB] bg-[#FFF5F2] space-y-1 relative">
                    <span className="absolute -top-2 right-2 bg-[#E76F51] text-white text-[9px] px-1.5 py-0.5 rounded-full font-jua">
                      BEST
                    </span>
                    <span className="font-jua text-[#E76F51] block">2. 월간 정기구독</span>
                    <p className="font-bold text-base text-[#E76F51]">월 4,900원</p>
                    <p className="text-[11px] text-[#7D736A] font-hand">
                      커뮤니티 선물 추첨 응모권 + AI 발음 무제한
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-1">
                    <span className="font-jua text-indigo-800 block">3. 1년 패스 (평생소장)</span>
                    <p className="font-bold text-base text-indigo-700">39,000원</p>
                    <p className="text-[11px] text-[#7D736A] font-hand">
                      원목 교구 교환권 할인 혜택 + 6~10단계 평생 무료
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMMUNITY MODERATION */}
          {activeTab === 'community' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-jua text-sm text-[#1b1917]">
                    커뮤니티 게시글 직접 관리 ({communityPosts.length}개)
                  </h3>
                  <p className="text-xs text-[#7D736A] font-hand">
                    관리자는 비밀번호 입력 없이 즉시 불량 글/댓글을 삭제하거나 대표 공지로 상단 고정할 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {communityPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 rounded-xl bg-white border border-[#eedfc9] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {post.pinned && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-jua flex items-center gap-0.5">
                            <Pin className="w-3 h-3 text-amber-700" /> 공지 고정됨
                          </span>
                        )}
                        <span className="font-bold text-[#1b1917] truncate">{post.title}</span>
                        <span className="text-[#8a8178] text-[10px]">by {post.author}</span>
                      </div>
                      <p className="text-[#5D534A] text-[11px] font-hand line-clamp-1 mt-0.5">
                        {post.content}
                      </p>
                      <span className="text-[10px] text-[#8a8178]">
                        댓글 {post.comments.length}개 · 좋아요 {post.likes}개
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-none">
                      <button
                        onClick={() => {
                          playSfx('pop');
                          onTogglePinPost(post.id);
                        }}
                        className={`p-1.5 rounded-lg border text-[11px] font-jua transition-colors ${
                          post.pinned
                            ? 'bg-amber-100 border-amber-300 text-amber-800'
                            : 'bg-white border-[#e4dccf] text-[#7D736A] hover:bg-amber-50'
                        }`}
                        title="공지 고정 / 해제"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`[${post.title}] 게시글을 관리자 권한으로 영구 삭제할까요?`)) {
                            playSfx('erase');
                            onDeletePost(post.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-colors"
                        title="관리자 즉시 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CHEATS & INSPECTION */}
          {activeTab === 'cheats' && (
            <div className="space-y-3">
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs">
                <span className="font-jua text-amber-900 block flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-amber-700" /> 대표님 & 개발자 검수 치트 버튼
                </span>
                <p className="text-amber-800 font-hand mt-0.5">
                  상장 출력, 다마고치 진화, 스티커 도안을 일일이 30일 동안 누르지 않고도 즉시 검수할 수 있는 편리한 도구입니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* 30-Day Sticker Complete Cheat */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#eedfc9] space-y-2">
                  <h4 className="font-jua text-[#1b1917] flex items-center gap-1">
                    🏅 칭찬 스티커 30칸 즉시 완주
                  </h4>
                  <p className="text-[11px] text-[#7D736A] font-hand">
                    스티커 30칸을 채우고 '엄마 완주 도장'을 찍어 상장 출력 및 소원권을 테스트합니다.
                  </p>
                  <button
                    onClick={() => {
                      playSfx('fan');
                      onUpdateBoardState((prev) => {
                        const mockStickers = Array.from({ length: 30 }).map((_, i) => ({
                          d: `2026-10-${String(i + 1).padStart(2, '0')}`,
                          e: ['⭐', '🌸', '👑', '🐣', '🌈', '🍭'][i % 6],
                          rare: i % 5 === 0,
                          r: ((i * 7) % 30) - 15,
                        }));
                        return {
                          ...prev,
                          stickers: mockStickers,
                          stamped: true,
                          doneDate: new Date().toISOString().slice(0, 10),
                        };
                      });
                      alert('🎉 칭찬 스티커 30칸이 즉시 채워졌습니다! 상장 출력을 확인해보세요.');
                    }}
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-jua shadow-xs"
                  >
                    스티커 30칸 즉시 채우기 ✨
                  </button>
                </div>

                {/* Pet Tamagotchi Berry & Heart Cheat */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#eedfc9] space-y-2">
                  <h4 className="font-jua text-[#1b1917] flex items-center gap-1">
                    🍇 다마고치 열매 20개 & 레벨업
                  </h4>
                  <p className="text-[11px] text-[#7D736A] font-hand">
                    글자 열매 20개와 쓰다듬기 하트 5개를 즉시 지급하여 진화 애니메이션을 확인합니다.
                  </p>
                  <button
                    onClick={() => {
                      playSfx('levelup');
                      onUpdatePetState((prev) => ({
                        ...prev,
                        berriesCount: (prev.berriesCount || 0) + 20,
                        happiness: 100,
                      }));
                    }}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-jua shadow-xs"
                  >
                    글자 열매 20개 즉시 지급 🍇
                  </button>
                </div>
                {/* 1~10 Stages Padlock Management */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#eedfc9] space-y-2 sm:col-span-2">
                  <h4 className="font-jua text-[#1b1917] flex items-center gap-1">
                    🗺️ 한글 모험 1~10단계 자물쇠 잠금/해제 관리
                  </h4>
                  <p className="text-[11px] text-[#7D736A] font-hand">
                    1단계 기본 잠금 상태로 초기화하거나, 10단계 전체를 한 번에 검수용으로 즉시 해제합니다.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        playSfx('levelup');
                        if (onUnlockAllStages) onUnlockAllStages();
                      }}
                      className="w-1/2 py-2 rounded-xl bg-gradient-to-r from-[#c9502f] to-[#e05b38] hover:from-[#b84324] hover:to-[#c9502f] text-white font-jua shadow-xs text-xs flex items-center justify-center gap-1"
                    >
                      <span>🔓</span>
                      <span>1~10단계 모두 해제</span>
                    </button>
                    <button
                      onClick={() => {
                        playSfx('tap');
                        if (onResetStageLocks) onResetStageLocks();
                      }}
                      className="w-1/2 py-2 rounded-xl bg-white border border-[#eedfc9] text-[#7D736A] hover:bg-stone-50 font-jua text-xs flex items-center justify-center gap-1"
                    >
                      <span>🔒</span>
                      <span>1단계만 남기고 잠그기</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: APP STORE GUIDE & FAQ */}
          {activeTab === 'guide' && (
            <div className="space-y-3.5 text-xs">
              <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-200 text-blue-900 space-y-1.5">
                <h4 className="font-jua text-sm flex items-center gap-1 text-blue-950">
                  <Smartphone className="w-4 h-4 text-blue-700" />
                  대표님 질문: "구글 앱스토어에 등록하면 구독이 가능한가요?"
                </h4>
                <p className="font-hand text-[12px] leading-relaxed text-blue-900">
                  <b>네, 100% 가능합니다!</b> 현재 이 프로젝트는 웹(React)으로 완성된 상태이며,
                  구글 플레이 스토어(Android)와 애플 앱스토어(iOS)에 정식 앱으로 출시하여 인앱결제(In-App Billing)를 연결할 수 있습니다.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#eedfc9] space-y-2 font-hand text-left">
                <h5 className="font-jua text-xs sm:text-sm text-[#1b1917]">
                  📱 스토어 출시 & 구독 연결 3단계 로드맵 (초보 대표님 맞춤)
                </h5>

                <div className="space-y-2 text-[#4a443e] pt-1 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-[#fdfcf9] border border-[#f0ebe1]">
                    <b className="text-[#c9502f] font-jua block">1단계: 앱 껍데기 씌우기 (Capacitor / TWA)</b>
                    지금 만든 웹 앱을 그대로 안드로이드 앱 프로젝트(APK/AAB)로 5분 만에 패키징합니다. 코드를 새로 짤 필요가 전혀 없습니다!
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fdfcf9] border border-[#f0ebe1]">
                    <b className="text-[#c9502f] font-jua block">2단계: 구글 개발자 계정 등록 & 정기결제 상품 생성</b>
                    Google Play Console에서 개발자 등록(등록비 $25) 후, '월간 구독 (4,900원)' 인앱 상품 ID를 생성합니다.
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fdfcf9] border border-[#f0ebe1]">
                    <b className="text-[#c9502f] font-jua block">3단계: 웹 버전에서도 즉시 결제 가능 (포트원 / 토스페이먼츠)</b>
                    앱스토어 등록 전이라도 웹에서는 '토스페이먼츠'나 '카카오페이' 일반 결제를 붙여서 오늘 바로 엄마들에게 결제를 받을 수도 있습니다!
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 font-hand">
                💡 <b>30년 경력 PM의 조언:</b> 처음에는 복잡한 결제 연동보다, 지금처럼 <b>"30일 완주 인증 시 선물 증정"</b> 이벤트로 맘카페와 인스타에서 100명의 열성 엄마 팬(기수제 챌린지)을 먼저 모으는 것이 앱스토어 1위로 가는 가장 확실하고 돈 버는 지름길입니다!
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#eedfc9] bg-[#f5efe6] flex items-center justify-between">
          <span className="text-[11px] text-[#7D736A] font-hand flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-amber-700" />
            대표님 전용 보안 관리 콘솔 (비공개 시스템)
          </span>
          <button
            onClick={() => {
              playSfx('tap');
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-xs shadow-xs"
          >
            콘솔 닫기
          </button>
        </div>
          </>
        )}
      </div>

      {/* Modal: Add New Member ID */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-5 text-left space-y-3.5 animate-pop relative">
            <button
              onClick={() => setShowAddMemberModal(false)}
              className="absolute top-4 right-4 text-[#8a8178]"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-jua text-base text-[#1b1917] flex items-center gap-1.5">
              <span>👤</span> 새 회원 ID 등록하기
            </h3>
            <p className="text-[11px] text-[#7D736A] font-hand">
              등록한 회원 ID로 결제 승인, 선물 지급, 무료 체험 연장을 관리할 수 있습니다.
            </p>

            <form onSubmit={handleAddNewMember} className="space-y-2 text-xs">
              <div>
                <label className="font-jua text-[#1b1917] block mb-1">고유 회원 ID (영문/숫자)</label>
                <input
                  type="text"
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  placeholder="예: jihoo_mom, hayun_dad"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#eedfc9] bg-white font-body"
                />
              </div>

              <div>
                <label className="font-jua text-[#1b1917] block mb-1">회원 이름 (닉네임)</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="예: 지후맘, 하윤이네"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#eedfc9] bg-white font-body"
                />
              </div>

              <div>
                <label className="font-jua text-[#1b1917] block mb-1">이메일 (선택)</label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="예: parent@naver.com"
                  className="w-full px-3 py-2 rounded-xl border border-[#eedfc9] bg-white font-body"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-white border border-[#eedfc9] text-[#7D736A] font-jua"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua shadow-md"
                >
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Manual Web Payment */}
      {showManualPayModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-5 text-left space-y-3.5 animate-pop relative">
            <button
              onClick={() => setShowManualPayModal(false)}
              className="absolute top-4 right-4 text-[#8a8178]"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-jua text-base text-[#1b1917] flex items-center gap-1.5">
              <span>🧾</span> 웹 결제 영수증 수동 등록
            </h3>
            <p className="text-[11px] text-[#7D736A] font-hand">
              [{selectedMember.name}] 회원의 계좌이체/카드 입금을 확인하고 구독을 즉시 활성화합니다.
            </p>

            <form onSubmit={handleAddManualPayment} className="space-y-2 text-xs">
              <div>
                <label className="font-jua text-[#1b1917] block mb-1">결제 상품 선택</label>
                <select
                  value={manualPayItem}
                  onChange={(e) => {
                    const item = e.target.value;
                    setManualPayItem(item);
                    if (item.includes('월간')) setManualPayAmount('3900');
                    else if (item.includes('연간')) setManualPayAmount('29000');
                    else if (item.includes('VIP')) setManualPayAmount('49000');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#eedfc9] bg-white font-jua"
                >
                  <option value="웹 직접결제 월간 정기구독 (3,900원)">월간 정기구독 (월 3,900원)</option>
                  <option value="연간 프리미엄 패스 (29,000원)">연간 프리미엄 패스 (연 29,000원)</option>
                  <option value="VIP 평생 무제한 회원권 (49,000원)">VIP 평생 무제한 회원권 (49,000원)</option>
                  <option value="특별 교재 + 구독 패키지 (59,000원)">특별 교재 + 구독 패키지 (59,000원)</option>
                </select>
              </div>

              <div>
                <label className="font-jua text-[#1b1917] block mb-1">결제 금액 (원)</label>
                <input
                  type="number"
                  value={manualPayAmount}
                  onChange={(e) => setManualPayAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#eedfc9] bg-white font-jua"
                />
              </div>

              <div>
                <label className="font-jua text-[#1b1917] block mb-1">결제 수단</label>
                <select
                  value={manualPayMethod}
                  onChange={(e) => setManualPayMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#eedfc9] bg-white font-jua"
                >
                  <option value="계좌이체 / 입금확인">계좌이체 / 입금확인</option>
                  <option value="카카오페이 송금">카카오페이 송금</option>
                  <option value="토스 송금">토스 송금</option>
                  <option value="신용카드 직접결제">신용카드 직접결제</option>
                  <option value="대표 관리자 무상증정">대표 관리자 무상증정</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualPayModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-white border border-[#eedfc9] text-[#7D736A] font-jua"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-jua shadow-md"
                >
                  결제 승인 & 활성화
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
