import React, { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
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
  Gift,
  MessageCircle,
  CreditCard,
  Pin,
  Lock,
  Info,
  Users,
  Plus,
  Search,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Receipt,
  Ticket,
  Copy,
  RotateCcw,
  Loader2,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import { CommunityPost, PetGrowthState, StickerBoardState } from '../types';
import { playSfx } from '../utils/sound';
import { getOrCreateUserIdentity } from '../utils/userIdentity';
import {
  verifyAdminPin,
  updateAdminPin,
  setStoredAdminActive,
  resetAdminPinToDefault,
} from '../utils/adminAuth';
import {
  ADMIN_BOOTSTRAP_EMAIL,
  auth,
  isVerifiedAdminUser,
  signInAdminWithGoogle,
  signOutAdminFirebase,
} from '../firebase';
import {
  createBatchServerVouchers,
  createServerVoucher,
  deleteServerVoucher,
  generateRandomVoucherCode,
  normalizeVoucherCode,
  resetServerVoucherStatus,
  ServerVoucher,
  subscribeServerVouchers,
} from '../utils/couponHelper';

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
  onDeleteComment?: (postId: string, commentId: string) => void;
  onTogglePinPost: (postId: string) => void;
  completedDaysCount: number;
  diaryCount: number;
  onResetAllData: () => void;
  onUnlockAllStages?: () => void;
  onResetStageLocks?: () => void;
}

type AdminTabId = 'vouchers' | 'members' | 'overview' | 'trial' | 'community' | 'security' | 'cheats';

interface MemberPayment {
  id: string;
  date: string;
  item: string;
  amount: number;
  method: string;
  status: '완료' | '대기' | '취소';
}

interface AdminMember {
  id: string;
  name: string;
  email: string;
  tier: 'free' | 'monthly' | 'yearly' | 'vip';
  trialDaysLeft: number;
  berries: number;
  hearts: number;
  joinedAt: string;
  notes: string;
  payments: MemberPayment[];
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
  onDeleteComment,
  onTogglePinPost,
  completedDaysCount,
  diaryCount,
  onResetAllData,
  onUnlockAllStages,
  onResetStageLocks,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('vouchers');
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [communityActionNotice, setCommunityActionNotice] = useState<string | null>(null);
  const [pendingDeleteCommunity, setPendingDeleteCommunity] = useState<
    | { type: 'post'; postId: string; title: string; author: string }
    | { type: 'comment'; postId: string; commentId: string; author: string; content: string }
    | null
  >(null);

  // Collapsible help accordions (collapsed by default for clean mobile view)
  const [showMemberHelp, setShowMemberHelp] = useState(false);
  const [showOverviewHelp, setShowOverviewHelp] = useState(false);
  const [showTrialHelp, setShowTrialHelp] = useState(false);
  const [showSecurityHelp, setShowSecurityHelp] = useState(false);
  const [showVoucherGuide, setShowVoucherGuide] = useState(false);

  // Admin PIN change state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState('');
  const [pinChangeError, setPinChangeError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [cheatNotice, setCheatNotice] = useState<string | null>(null);

  // Current device user info (auto-generated unique ID per browser/device)
  const currentIdentity = getOrCreateUserIdentity(boardState.name);
  const currentUserId = currentIdentity.userId;
  const currentUserNickname = currentIdentity.userNickname;
  const currentUserEmail = currentIdentity.userEmail;

  const [members, setMembers] = useState<AdminMember[]>(() => {
    let initialList: AdminMember[] = [];
    try {
      const stored = localStorage.getItem('hangul_admin_members');
      if (stored) {
        initialList = JSON.parse(stored);
      }
    } catch {}

    if (!Array.isArray(initialList) || initialList.length === 0) {
      initialList = [
        {
          id: currentUserId,
          name: `${currentUserNickname} (내 접속 계정)`,
          email: currentUserEmail || `${currentUserId}@todak.local`,
          tier: 'monthly',
          trialDaysLeft: 30,
          berries: 20,
          hearts: 5,
          joinedAt: '2026-10-20',
          notes: '현재 기기 접속 대표 계정',
          payments: [
            {
              id: 'pay-001',
              date: '2026-10-24 14:20',
              item: '웹 직접결제 월간 정기구독',
              amount: 3900,
              method: '계좌이체 / 승인완료',
              status: '완료',
            },
          ],
        },
        {
          id: 'siwoo_mom_01',
          name: '시우맘 (5세 시우네)',
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
          id: 'minjun_mom_02',
          name: '민준맘 (6세 민준이네)',
          email: 'minjun_house@kakao.com',
          tier: 'yearly',
          trialDaysLeft: 365,
          berries: 40,
          hearts: 10,
          joinedAt: '2026-10-21',
          notes: '연간 패스 사전 결제 회원',
          payments: [
            {
              id: 'pay-002',
              date: '2026-10-21 09:15',
              item: '연간 프리미엄 패스',
              amount: 29000,
              method: '카카오페이',
              status: '완료',
            },
          ],
        },
        {
          id: 'yuna_home_03',
          name: '윤아맘 (7세 윤아네)',
          email: 'yuna_family@gmail.com',
          tier: 'vip',
          trialDaysLeft: 9999,
          berries: 100,
          hearts: 20,
          joinedAt: '2026-10-23',
          notes: '평생 VIP 마스터 회원',
          payments: [
            {
              id: 'pay-003',
              date: '2026-10-23 18:40',
              item: 'VIP 평생 무제한 회원권',
              amount: 49000,
              method: '신용카드',
              status: '완료',
            },
          ],
        },
      ];
    } else {
      const firstIdx = initialList.findIndex(
        (m) => m.id === currentUserId || m.name.includes('(내 접속 계정)')
      );
      if (firstIdx >= 0) {
        initialList[firstIdx] = {
          ...initialList[firstIdx],
          id: currentUserId,
          name: `${currentUserNickname} (내 접속 계정)`,
          email: currentUserEmail || initialList[firstIdx].email || `${currentUserId}@todak.local`,
        };
      }
    }
    return initialList;
  });

  const [selectedMemberId, setSelectedMemberId] = useState<string>(currentUserId);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(currentUserId);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [memberActionNotice, setMemberActionNotice] = useState<string | null>(null);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  // Manual Web Billing Entry Modal
  const [showManualPayModal, setShowManualPayModal] = useState(false);
  const [manualPayItem, setManualPayItem] = useState('웹 직접결제 월간 정기구독 (3,900원)');
  const [manualPayAmount, setManualPayAmount] = useState('3900');
  const [manualPayMethod, setManualPayMethod] = useState('계좌이체 / 입금확인');

  // Server DB (Firebase) Voucher Admin State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(() => auth.currentUser);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [serverVouchers, setServerVouchers] = useState<ServerVoucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [voucherFilter, setVoucherFilter] = useState<'all' | 'unused' | 'used'>('all');
  const [voucherSearch, setVoucherSearch] = useState('');
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'subscription' | 'trial_days'>('subscription');
  const [newCouponDays, setNewCouponDays] = useState(30);
  const [newCouponTitle, setNewCouponTitle] = useState('');
  const [newCouponNote, setNewCouponNote] = useState('');
  const [isCreatingVoucher, setIsCreatingVoucher] = useState(false);
  const [voucherNotice, setVoucherNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [copiedVoucherKey, setCopiedVoucherKey] = useState<string | null>(null);
  const [confirmDeleteVoucherCode, setConfirmDeleteVoucherCode] = useState<string | null>(null);
  const [lastCreatedCodes, setLastCreatedCodes] = useState<string[]>([]);
  const voucherListRef = useRef<HTMLDivElement | null>(null);

  const jumpToVoucherList = (filter: 'all' | 'unused' | 'used') => {
    playSfx('tap');
    setVoucherFilter(filter);
    setTimeout(() => {
      voucherListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsub();
  }, []);

  const isFirebaseAdminReady = isAdmin && isVerifiedAdminUser(firebaseUser);

  useEffect(() => {
    if (!isOpen || !isFirebaseAdminReady) {
      setVouchersLoading(false);
      return;
    }
    setVouchersLoading(true);
    const unsub = subscribeServerVouchers(
      (list) => {
        setServerVouchers(list);
        setVouchersLoading(false);
      },
      (err) => {
        console.error('Server voucher subscription failed:', err);
        setVouchersLoading(false);
        setVoucherNotice({
          ok: false,
          text: '서버 DB 목록을 불러오지 못했습니다. Google 관리자 계정을 확인해주세요.',
        });
      }
    );
    return () => unsub();
  }, [isOpen, isFirebaseAdminReady]);

  const saveMembers = (updated: AdminMember[]) => {
    setMembers(updated);
    try {
      localStorage.setItem('hangul_admin_members', JSON.stringify(updated));
    } catch {}
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];

  const flashMemberNotice = (msg: string) => {
    setMemberActionNotice(msg);
    setTimeout(() => setMemberActionNotice(null), 3200);
  };

  const handleGrantBerries = (targetMember: AdminMember, amount = 20) => {
    playSfx('pop');
    const updated = members.map((m) =>
      m.id === targetMember.id ? { ...m, berries: m.berries + amount } : m
    );
    saveMembers(updated);
    if (targetMember.id === currentUserId) {
      onUpdatePetState((prev) => ({
        ...prev,
        berriesCount: (prev.berriesCount || 0) + amount,
      }));
    }
    flashMemberNotice(`🍇 [${targetMember.name.split(' ')[0]}] 열매 +${amount}개 지급 완료`);
  };

  const handleGrantHearts = (targetMember: AdminMember, amount = 5) => {
    playSfx('fan');
    const updated = members.map((m) =>
      m.id === targetMember.id ? { ...m, hearts: m.hearts + amount } : m
    );
    saveMembers(updated);
    if (targetMember.id === currentUserId) {
      onUpdatePetState((prev) => ({
        ...prev,
        heartsCount: (prev.heartsCount || 0) + amount,
      }));
    }
    flashMemberNotice(`💖 [${targetMember.name.split(' ')[0]}] 하트 +${amount}개 지급 완료`);
  };

  const handleGrantTrialDays = (targetMember: AdminMember, days = 30) => {
    playSfx('fan');
    const updated = members.map((m) =>
      m.id === targetMember.id ? { ...m, trialDaysLeft: m.trialDaysLeft + days } : m
    );
    saveMembers(updated);
    if (targetMember.id === currentUserId) {
      onUpdateTrialDays(trialDaysLeft + days);
    }
    flashMemberNotice(`⏳ [${targetMember.name.split(' ')[0]}] 체험 +${days}일 연장 완료`);
  };

  const handleSetSubscriptionTier = (
    targetMember: AdminMember,
    tier: 'free' | 'monthly' | 'yearly' | 'vip'
  ) => {
    playSfx('fan');
    const updated = members.map((m) => {
      if (m.id !== targetMember.id) return m;
      return {
        ...m,
        tier,
        trialDaysLeft:
          tier === 'vip'
            ? 9999
            : tier === 'yearly'
            ? 365
            : tier === 'monthly'
            ? 30
            : m.trialDaysLeft,
      };
    });
    saveMembers(updated);
    if (targetMember.id === currentUserId) {
      if (onUpdateSubscribed) onUpdateSubscribed(tier !== 'free');
      if (tier === 'vip') onUpdateTrialDays(9999);
      else if (tier === 'yearly') onUpdateTrialDays(365);
      else if (tier === 'monthly') onUpdateTrialDays(30);
    }
    const tierName =
      tier === 'monthly'
        ? '월간 구독'
        : tier === 'yearly'
        ? '연간 패스'
        : tier === 'vip'
        ? 'VIP 평생'
        : '무료 체험판';
    flashMemberNotice(`👑 [${targetMember.name.split(' ')[0]}] 등급이 '${tierName}'으로 변경되었습니다`);
  };

  const handleAddManualPayment = (e: React.FormEvent) => {
    e.preventDefault();
    playSfx('fan');
    const newPay: MemberPayment = {
      id: 'pay-' + Date.now(),
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      item: manualPayItem,
      amount: Number(manualPayAmount) || 0,
      method: manualPayMethod,
      status: '완료',
    };
    const nextTier: AdminMember['tier'] = manualPayItem.includes('연간')
      ? 'yearly'
      : manualPayItem.includes('VIP')
      ? 'vip'
      : 'monthly';

    const updated = members.map((m) =>
      m.id === selectedMemberId
        ? { ...m, tier: nextTier, payments: [newPay, ...m.payments] }
        : m
    );
    saveMembers(updated);
    if (selectedMemberId === currentUserId && onUpdateSubscribed) {
      onUpdateSubscribed(true);
    }
    setShowManualPayModal(false);
    flashMemberNotice(`💳 [${selectedMember.name.split(' ')[0]}] 결제 승인 및 등록 완료`);
  };

  const handleAddNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberError(null);
    const trimmedNewId = newMemberId.trim();
    if (!trimmedNewId || !newMemberName.trim()) {
      setAddMemberError('아이디와 회원명을 모두 입력해주세요.');
      return;
    }
    if (members.some((m) => m.id.toLowerCase() === trimmedNewId.toLowerCase())) {
      playSfx('erase');
      setAddMemberError(`이미 사용 중인 아이디(${trimmedNewId})입니다.`);
      return;
    }
    playSfx('pop');
    const newMem: AdminMember = {
      id: trimmedNewId,
      name: newMemberName.trim(),
      email: newMemberEmail.trim() || `${trimmedNewId}@user.com`,
      tier: 'free',
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
    setExpandedMemberId(newMem.id);
    setNewMemberId('');
    setNewMemberName('');
    setNewMemberEmail('');
    setAddMemberError(null);
    setShowAddMemberModal(false);
    flashMemberNotice(`✨ 새 회원 [${newMem.name}] 등록 완료`);
  };

  const flashVoucherNotice = (ok: boolean, text: string) => {
    setVoucherNotice({ ok, text });
    setTimeout(() => setVoucherNotice(null), 4000);
  };

  const handleConnectGoogleAdmin = async () => {
    if (isConnectingGoogle) return;
    setIsConnectingGoogle(true);
    try {
      const user = await signInAdminWithGoogle();
      if (isVerifiedAdminUser(user)) {
        playSfx('fan');
        flashVoucherNotice(true, `✅ 관리자 Google 계정(${user.email}) 연결 완료`);
      } else {
        playSfx('pop');
        flashVoucherNotice(
          false,
          `⚠️ 로그인된 계정(${user.email || '알 수 없음'})은 관리자 계정(${ADMIN_BOOTSTRAP_EMAIL})이 아닙니다.`
        );
      }
    } catch (err) {
      playSfx('pop');
      console.error('Google admin sign-in error:', err);
      flashVoucherNotice(false, 'Google 인증 창이 취소되었거나 연결에 실패했습니다.');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleCreateSingleVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingVoucher) return;
    const cleanCode = normalizeVoucherCode(newCouponCode);
    if (!cleanCode) {
      flashVoucherNotice(false, '등록할 이용권 코드 또는 스마트스토어 주문번호를 입력해주세요.');
      return;
    }
    setIsCreatingVoucher(true);
    try {
      const res = await createServerVoucher({
        code: cleanCode,
        type: newCouponType,
        value: newCouponType === 'trial_days' ? newCouponDays : 365,
        title: newCouponTitle,
        orderNote: newCouponNote,
      });
      if (res.ok) {
        playSfx('fan');
        if (res.code) setLastCreatedCodes([res.code]);
        setNewCouponCode('');
        setNewCouponTitle('');
        setNewCouponNote('');
        flashVoucherNotice(true, res.message);
      } else {
        playSfx('pop');
        flashVoucherNotice(false, res.message);
      }
    } catch (err) {
      playSfx('pop');
      console.error('Create voucher error:', err);
      flashVoucherNotice(false, '코드 등록 중 오류가 발생했습니다. Google 관리자 연결을 확인해주세요.');
    } finally {
      setIsCreatingVoucher(false);
    }
  };

  const handleBatchGenerateVouchers = async (count: number) => {
    if (isCreatingVoucher) return;
    setIsCreatingVoucher(true);
    try {
      const res = await createBatchServerVouchers(count, {
        type: newCouponType,
        value: newCouponType === 'trial_days' ? newCouponDays : 365,
        title:
          newCouponTitle.trim() ||
          (newCouponType === 'subscription'
            ? '스마트스토어 1회용 정식 이용권'
            : `체험 ${newCouponDays}일 연장권`),
        orderNote: newCouponNote.trim() || '자동 생성 1회용 코드',
      });
      if (res.ok) {
        playSfx('fan');
        setLastCreatedCodes(res.codes);
        flashVoucherNotice(
          true,
          res.codes.length === 1
            ? `🎉 새 이용권 코드 [${res.codes[0]}] 발급 완료!`
            : `🎉 1회용 코드 ${res.codes.length}개 발급 완료! 아래 목록에서 바로 확인하세요.`
        );
      } else {
        playSfx('pop');
        flashVoucherNotice(false, res.message);
      }
    } catch (err) {
      playSfx('pop');
      console.error('Batch create error:', err);
      flashVoucherNotice(false, '일괄 코드 발급 중 오류가 발생했습니다.');
    } finally {
      setIsCreatingVoucher(false);
    }
  };

  const handleCopyText = async (key: string, text: string, noticeText: string) => {
    try {
      await navigator.clipboard.writeText(text);
      playSfx('tap');
      setCopiedVoucherKey(key);
      flashVoucherNotice(true, noticeText);
      setTimeout(() => setCopiedVoucherKey(null), 2000);
    } catch {
      flashVoucherNotice(false, '클립보드 복사에 실패했습니다. 직접 길게 눌러 복사해주세요.');
    }
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
      setPinChangeSuccess('비밀번호가 변경되었습니다.');
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
    } else {
      setPinChangeError('비밀번호 변경 중 오류가 발생했습니다.');
    }
  };

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
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todak-hangul-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupError(null);
      playSfx('fan');
    } catch {
      setBackupError('백업 파일 생성 중 오류가 발생했습니다.');
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      !memberSearchQuery ||
      m.id.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const tierMeta = (tier: AdminMember['tier']) => {
    switch (tier) {
      case 'monthly':
        return { label: '월간 구독', badgeCls: 'bg-[#fff1ed] text-[#c9502f] border-[#fcd5cb]' };
      case 'yearly':
        return { label: '연간 패스', badgeCls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'vip':
        return { label: 'VIP 평생', badgeCls: 'bg-amber-100 text-amber-800 border-amber-300' };
      default:
        return { label: '무료 체험', badgeCls: 'bg-stone-100 text-stone-700 border-stone-200' };
    }
  };

  const adminTabs: Array<{ id: AdminTabId; label: string; icon: React.ReactNode }> = [
    { id: 'vouchers', label: `이용권 코드 (${serverVouchers.length})`, icon: <Ticket className="w-4 h-4 shrink-0" /> },
    { id: 'members', label: '회원·결제', icon: <Users className="w-4 h-4 shrink-0" /> },
    { id: 'overview', label: '대시보드', icon: <Shield className="w-4 h-4 shrink-0" /> },
    { id: 'trial', label: '체험·요금', icon: <CreditCard className="w-4 h-4 shrink-0" /> },
    {
      id: 'community',
      label: `커뮤니티 (${communityPosts.length})`,
      icon: <MessageCircle className="w-4 h-4 shrink-0" />,
    },
    { id: 'security', label: '비밀번호', icon: <Key className="w-4 h-4 shrink-0" /> },
    { id: 'cheats', label: '빠른검수', icon: <Sparkles className="w-4 h-4 shrink-0" /> },
  ];

  const unusedVouchersCount = serverVouchers.filter((v) => v.status === 'unused').length;
  const usedVouchersCount = serverVouchers.filter((v) => v.status === 'used').length;
  const filteredVouchers = serverVouchers.filter((v) => {
    if (voucherFilter !== 'all' && v.status !== voucherFilter) return false;
    if (!voucherSearch.trim()) return true;
    const q = voucherSearch.trim().toLowerCase();
    return (
      v.code.toLowerCase().includes(q) ||
      v.title.toLowerCase().includes(q) ||
      (v.orderNote || '').toLowerCase().includes(q) ||
      (v.redeemedBy || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#fcfaf7] border-2 border-[#e4dccf] rounded-3xl w-full max-w-xl max-h-[90dvh] sm:max-h-[92vh] box-border overflow-hidden shadow-2xl flex flex-col relative text-left">
        {/* Compact Mobile-First Header */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-[#eedfc9] bg-gradient-to-r from-[#2B231D] to-[#1C1613] text-white flex items-center justify-between gap-2 flex-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#F4A261] text-white flex items-center justify-center shadow-xs shrink-0">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-jua text-white truncate">
                  관리자 콘솔
                </h2>
                {isAdmin ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                    <Check className="w-3 h-3" /> 인증됨
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/80 text-white flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                    <Lock className="w-3 h-3" /> 잠금
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-jua transition-colors active:scale-95 whitespace-nowrap"
              >
                로그아웃
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                playSfx('tap');
                onClose();
              }}
              aria-label="닫기"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-95 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Login Gate */}
        {!isAdmin ? (
          <div className="p-5 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 my-auto overflow-y-auto">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-jua text-xs border border-amber-300">
                대표 관리자 인증
              </span>
              <h3 className="font-jua text-xl text-[#1b1917] break-keep">
                관리자 비밀번호를 입력해주세요
              </h3>
            </div>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-3 pt-1">
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-jua text-stone-700">비밀번호</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-[#8a8178] hover:text-[#1b1917] font-jua flex items-center gap-1 py-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>{showPassword ? '숨기기' : '보기'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setAuthError(false);
                    }}
                    autoFocus
                    required
                    placeholder="비밀번호 입력"
                    maxLength={64}
                    className="w-full min-h-[48px] px-4 py-3 rounded-2xl border-2 border-stone-300 font-jua text-sm bg-white outline-none focus:border-amber-600 tracking-wider text-center shadow-xs pr-10"
                  />
                  {pinInput && (
                    <button
                      type="button"
                      onClick={() => setPinInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-jua text-center break-keep">
                  비밀번호가 일치하지 않습니다. 다시 입력해주세요.
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    playSfx('tap');
                    onClose();
                  }}
                  className="w-1/3 min-h-[48px] py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-jua text-sm active:scale-95 transition-all"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-jua text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Crown className="w-4 h-4 fill-amber-300 text-amber-200 shrink-0" />
                  <span>로그인</span>
                </button>
              </div>

              <div className="pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    playSfx('fan');
                    resetAdminPinToDefault();
                    onSetIsAdmin(true);
                    setStoredAdminActive(true);
                    setAuthError(false);
                    setPinInput('');
                  }}
                  className="w-full min-h-[48px] py-3 px-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-jua text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
                >
                  <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>대표님 본인 인증 · 즉시 열기</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Mobile-First Smooth Horizontal Snap Tab Pill Bar */}
            <nav
              aria-label="관리자 메뉴"
              className="flex items-center gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory px-3.5 py-2.5 bg-[#f5efe6] border-b border-[#eedfc9] flex-none"
            >
              {adminTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      playSfx('tap');
                      setActiveTab(tab.id);
                    }}
                    className={`min-h-[42px] px-3.5 py-2 rounded-2xl font-jua text-xs sm:text-sm shrink-0 snap-start transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap border ${
                      isActive
                        ? 'bg-[#c9502f] text-white border-[#c9502f] shadow-sm'
                        : 'bg-white text-[#5d534a] border-[#e4dccf] hover:border-[#c9502f]/40'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Scrollable Body */}
            <div className="p-3.5 sm:p-5 overflow-y-auto overflow-x-hidden flex-1 space-y-3.5 font-body">
              {/* TAB: SERVER VOUCHERS & COUPONS */}
              {activeTab === 'vouchers' && (
                <div className="space-y-3.5">
                  {/* Server DB Auth Status Card */}
                  {!isFirebaseAdminReady ? (
                    <div className="p-4 rounded-3xl bg-gradient-to-br from-[#fff7ec] to-[#fdebd2] border-2 border-[#f3c68f] space-y-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-[#c9502f] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="font-jua text-sm sm:text-base text-[#1b1917] break-keep">
                            서버 DB 이용권 관리 연결하기
                          </h3>
                          <p className="text-xs text-[#5d534a] font-hand leading-relaxed break-keep">
                            {firebaseUser && !isVerifiedAdminUser(firebaseUser)
                              ? `현재 로그인(${firebaseUser.email || '알 수 없음'})은 관리자 계정이 아닙니다. 사장님 계정(${ADMIN_BOOTSTRAP_EMAIL})으로 연결해 주세요.`
                              : `구매자가 입력한 코드를 서버에서 확인하고 1회 사용 후 자동 잠금하려면 사장님 Google 계정(${ADMIN_BOOTSTRAP_EMAIL}) 연결이 필요합니다.`}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={handleConnectGoogleAdmin}
                          disabled={isConnectingGoogle}
                          className="flex-1 min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#c9502f] hover:bg-[#b54122] disabled:opacity-60 text-white font-jua text-sm shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          {isConnectingGoogle ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Crown className="w-4 h-4" />
                          )}
                          <span>
                            {isConnectingGoogle
                              ? 'Google 인증 중...'
                              : firebaseUser
                              ? '사장님 Google 계정으로 다시 연결'
                              : 'Google 계정으로 서버 DB 연결'}
                          </span>
                        </button>
                        {firebaseUser && (
                          <button
                            type="button"
                            onClick={() => void signOutAdminFirebase()}
                            className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-white border border-[#e4dccf] text-xs font-jua text-[#5d534a]"
                          >
                            로그아웃
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Connected Banner & Live Stats */}
                      <div className="p-3.5 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                            <span className="font-jua text-xs sm:text-sm text-emerald-900 truncate">
                              서버 DB 실시간 연결됨 ({firebaseUser?.email})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => void signOutAdminFirebase()}
                            className="text-[11px] font-jua text-emerald-700 hover:text-emerald-950 px-2.5 py-1 rounded-xl bg-white border border-emerald-200 shrink-0"
                          >
                            연결해제
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center font-jua">
                          <button
                            type="button"
                            onClick={() => jumpToVoucherList('all')}
                            className="py-2 px-2 rounded-2xl bg-white hover:bg-emerald-100/60 border border-emerald-100 transition-all active:scale-95"
                            title="전체 코드 목록으로 이동"
                          >
                            <span className="text-[10px] text-[#8a8178] font-hand block">전체 코드 보기 ↓</span>
                            <span className="text-base text-[#1b1917]">{serverVouchers.length}개</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => jumpToVoucherList('unused')}
                            className="py-2 px-2 rounded-2xl bg-white hover:bg-emerald-100/60 border border-emerald-200 transition-all active:scale-95"
                            title="사용 가능한 코드 목록 보기"
                          >
                            <span className="text-[10px] text-emerald-700 font-hand block">사용 가능 ↓</span>
                            <span className="text-base text-emerald-600">{unusedVouchersCount}개</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => jumpToVoucherList('used')}
                            className="py-2 px-2 rounded-2xl bg-white hover:bg-stone-100 border border-stone-200 transition-all active:scale-95"
                            title="사용 완료된 코드 목록 보기"
                          >
                            <span className="text-[10px] text-stone-500 font-hand block">사용 완료 ↓</span>
                            <span className="text-base text-stone-600">{usedVouchersCount}개</span>
                          </button>
                        </div>
                      </div>

                      {voucherNotice && (
                        <div
                          className={`p-3 rounded-2xl border text-xs font-jua animate-pop break-keep ${
                            voucherNotice.ok
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-red-50 border-red-200 text-red-700'
                          }`}
                        >
                          {voucherNotice.text}
                        </div>
                      )}

                      {/* Quick 1-Click Generator + Custom Order Number Registration */}
                      <div className="p-4 rounded-3xl bg-white border-2 border-[#eedfc9] space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-jua text-sm sm:text-base text-[#1b1917] flex items-center gap-1.5">
                            <Wand2 className="w-4 h-4 text-[#c9502f] shrink-0" />
                            <span>1회용 이용권 코드 발급</span>
                          </h3>
                          <span className="text-[11px] font-hand text-[#8a8178]">재사용 자동 차단</span>
                        </div>

                        {/* Shared Option Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-jua">
                          <select
                            value={newCouponType}
                            onChange={(e) =>
                              setNewCouponType(e.target.value as 'subscription' | 'trial_days')
                            }
                            className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#e4dccf] bg-[#faf8f5] outline-none focus:border-[#c9502f]"
                          >
                            <option value="subscription">정식 이용권 (전과정 무제한)</option>
                            <option value="trial_days">체험 기간 연장권</option>
                          </select>
                          {newCouponType === 'trial_days' ? (
                            <input
                              type="number"
                              min={1}
                              max={9999}
                              value={newCouponDays}
                              onChange={(e) => setNewCouponDays(Number(e.target.value))}
                              placeholder="연장 일수 (예: 30)"
                              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#e4dccf] bg-[#faf8f5] outline-none focus:border-[#c9502f]"
                            />
                          ) : (
                            <input
                              type="text"
                              value={newCouponNote}
                              onChange={(e) => setNewCouponNote(e.target.value)}
                              maxLength={120}
                              placeholder="메모 (예: 스마트스토어 11월 주문)"
                              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#e4dccf] bg-[#faf8f5] outline-none focus:border-[#c9502f] font-body"
                            />
                          )}
                        </div>

                        {/* Method A: 1-Click Random Generator */}
                        <div className="p-3 rounded-2xl bg-[#fff8f0] border border-[#f5d8b8] space-y-2">
                          <span className="text-xs font-jua text-[#c9502f] block">
                            방법 1. 랜덤 16자리 1회용 코드 즉시 생성 (추천)
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={isCreatingVoucher}
                              onClick={() => void handleBatchGenerateVouchers(1)}
                              className="min-h-[46px] px-3 py-2 rounded-xl bg-[#c9502f] hover:bg-[#b54122] disabled:opacity-60 text-white font-jua text-xs sm:text-sm shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
                            >
                              {isCreatingVoucher ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Sparkles className="w-4 h-4 shrink-0" />
                              )}
                              <span>1개 즉시 생성</span>
                            </button>
                            <button
                              type="button"
                              disabled={isCreatingVoucher}
                              onClick={() => void handleBatchGenerateVouchers(5)}
                              className="min-h-[46px] px-3 py-2 rounded-xl bg-white hover:bg-[#fff2e6] disabled:opacity-60 border border-[#f0c7a8] text-[#c9502f] font-jua text-xs sm:text-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
                            >
                              <Plus className="w-4 h-4 shrink-0" />
                              <span>5개 한꺼번에 생성</span>
                            </button>
                          </div>
                        </div>

                        {/* Method B: SmartStore Order Number / Custom Code */}
                        <form
                          onSubmit={handleCreateSingleVoucher}
                          className="p-3 rounded-2xl bg-[#faf8f5] border border-[#e4dccf] space-y-2"
                        >
                          <span className="text-xs font-jua text-[#1b1917] block">
                            방법 2. 스마트스토어 주문번호 또는 원하는 코드 직접 등록
                          </span>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newCouponCode}
                              onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                              placeholder="예: 2026111298765432 또는 TDK-VIP-01"
                              maxLength={64}
                              className="flex-1 min-w-0 min-h-[44px] px-3 py-2 rounded-xl border border-stone-300 bg-white font-mono text-xs uppercase outline-none focus:border-[#c9502f]"
                            />
                            <button
                              type="button"
                              onClick={() => setNewCouponCode(generateRandomVoucherCode('TDK'))}
                              className="shrink-0 min-h-[44px] px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-jua text-xs whitespace-nowrap"
                              title="랜덤 채우기"
                            >
                              자동채움
                            </button>
                          </div>
                          <input
                            type="text"
                            value={newCouponTitle}
                            onChange={(e) => setNewCouponTitle(e.target.value)}
                            maxLength={100}
                            placeholder="이용권 이름 (비워두면 '스마트스토어 정식 이용권')"
                            className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs outline-none focus:border-[#c9502f]"
                          />
                          <button
                            type="submit"
                            disabled={isCreatingVoucher}
                            className="w-full min-h-[46px] py-2.5 rounded-xl bg-[#1b1917] hover:bg-stone-800 disabled:opacity-60 text-white font-jua text-xs sm:text-sm shadow-2xs active:scale-95 transition-all"
                          >
                            직접 입력한 코드 서버 DB에 등록하기
                          </button>
                        </form>

                        {lastCreatedCodes.length > 0 && (
                          <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-2 animate-pop">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-jua text-emerald-900">
                                ✨ 방금 발급된 이용권 코드
                              </span>
                              <button
                                type="button"
                                onClick={() => jumpToVoucherList('all')}
                                className="text-[11px] font-jua text-emerald-700 underline underline-offset-2"
                              >
                                아래 전체 목록 보기 ↓
                              </button>
                            </div>
                            <div className="space-y-1.5">
                              {lastCreatedCodes.map((code) => (
                                <div
                                  key={code}
                                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-emerald-200"
                                >
                                  <span className="font-mono font-bold text-xs text-[#c9502f] break-all">
                                    {code}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleCopyText(
                                        `recent-${code}`,
                                        code,
                                        `📋 [${code}] 코드가 복사되었습니다.`
                                      )
                                    }
                                    className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-jua text-[11px]"
                                  >
                                    {copiedVoucherKey === `recent-${code}` ? '복사됨!' : '복사'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Filter & Search Voucher List */}
                      <div ref={voucherListRef} className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between px-1">
                          <h4 className="font-jua text-xs sm:text-sm text-[#1b1917]">
                            📋 발급된 전체 이용권 코드 목록 ({filteredVouchers.length}개)
                          </h4>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative flex-1 min-w-0">
                            <Search className="w-4 h-4 text-[#8a8178] absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={voucherSearch}
                              onChange={(e) => setVoucherSearch(e.target.value)}
                              placeholder="코드·메모·회원ID 검색..."
                              className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-2xl border border-[#e4dccf] bg-white text-xs outline-none focus:border-[#c9502f]"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 font-jua text-xs shrink-0">
                            {(
                              [
                                { id: 'all', label: '전체' },
                                { id: 'unused', label: '사용가능' },
                                { id: 'used', label: '사용완료' },
                              ] as const
                            ).map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => setVoucherFilter(f.id)}
                                className={`min-h-[44px] px-3 rounded-2xl border transition-colors ${
                                  voucherFilter === f.id
                                    ? 'bg-[#c9502f] text-white border-[#c9502f]'
                                    : 'bg-white text-[#5d534a] border-[#e4dccf]'
                                }`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {vouchersLoading ? (
                          <div className="p-6 rounded-2xl bg-white border border-[#e4dccf] text-center text-xs font-jua text-[#8a8178] flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-[#c9502f]" />
                            <span>서버 DB에서 이용권 목록 불러오는 중...</span>
                          </div>
                        ) : filteredVouchers.length === 0 ? (
                          <div className="p-6 rounded-2xl bg-white border border-[#e4dccf] text-center space-y-1">
                            <p className="font-jua text-sm text-[#1b1917]">
                              아직 등록된 코드가 없습니다
                            </p>
                            <p className="font-hand text-xs text-[#8a8178] break-keep">
                              위에서 [1개 즉시 생성]을 누르거나 스마트스토어 주문번호를 등록해 보세요!
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {filteredVouchers.map((v) => {
                              const isUsed = v.status === 'used';
                              const smsTemplate = `[토닥 한글 정식 이용권 안내]\n구매해 주셔서 감사합니다!\n앱 실행 후 이용권 등록 화면에 아래 1회용 코드를 입력해주세요.\n(회원가입 없이 바로 적용됩니다)\n\n▶ 이용권 코드: ${v.code}`;
                              return (
                                <div
                                  key={v.code}
                                  className={`p-3.5 rounded-2xl border-2 space-y-2.5 text-xs transition-all ${
                                    isUsed
                                      ? 'bg-stone-50 border-stone-200 opacity-85'
                                      : 'bg-white border-[#eedfc9] shadow-2xs'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span
                                          className={`font-mono font-bold text-xs sm:text-sm px-2.5 py-0.5 rounded-lg border break-all ${
                                            isUsed
                                              ? 'bg-stone-200/70 text-stone-600 border-stone-300 line-through'
                                              : 'bg-[#fff5f0] text-[#c9502f] border-[#f5d0be]'
                                          }`}
                                        >
                                          {v.code}
                                        </span>
                                        <span
                                          className={`text-[10px] font-jua px-2 py-0.5 rounded-full whitespace-nowrap ${
                                            isUsed
                                              ? 'bg-stone-200 text-stone-700'
                                              : 'bg-emerald-100 text-emerald-800'
                                          }`}
                                        >
                                          {isUsed ? '사용완료 (재사용 불가)' : '사용가능 (미사용)'}
                                        </span>
                                      </div>
                                      <p className="font-jua text-[#1b1917] text-xs truncate">
                                        {v.title}{' '}
                                        <span className="text-[#8a8178] font-hand">
                                          ({v.type === 'subscription' ? '무제한 구독' : `+${v.value}일`})
                                        </span>
                                      </p>
                                      {(v.orderNote || v.usedAt || v.createdAt) && (
                                        <p className="text-[11px] text-[#7d736a] font-hand break-keep">
                                          {v.orderNote ? `${v.orderNote} · ` : ''}
                                          {isUsed && v.usedAt
                                            ? `사용일: ${v.usedAt.toLocaleString('ko-KR')}`
                                            : v.createdAt
                                            ? `발급: ${v.createdAt.toLocaleDateString('ko-KR')}`
                                            : ''}
                                        </p>
                                      )}
                                      {isUsed && v.redeemedBy && (
                                        <p className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 inline-block px-2 py-0.5 rounded-lg break-all">
                                          사용 회원 ID: {v.redeemedBy}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#f3ece2] font-jua">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void handleCopyText(
                                          `code-${v.code}`,
                                          v.code,
                                          `📋 [${v.code}] 코드가 복사되었습니다.`
                                        )
                                      }
                                      className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-[#faf8f5] hover:bg-[#f2ece3] border border-[#e4dccf] text-[#1b1917] text-[11px] flex items-center gap-1 active:scale-95"
                                    >
                                      <Copy className="w-3.5 h-3.5 shrink-0" />
                                      <span>
                                        {copiedVoucherKey === `code-${v.code}` ? '복사됨!' : '코드 복사'}
                                      </span>
                                    </button>

                                    {!isUsed && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void handleCopyText(
                                            `sms-${v.code}`,
                                            smsTemplate,
                                            `✉️ [${v.code}] 구매자 문자 발송 안내문이 복사되었습니다.`
                                          )
                                        }
                                        className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1 active:scale-95"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                                        <span>
                                          {copiedVoucherKey === `sms-${v.code}`
                                            ? '안내문 복사됨!'
                                            : '문자 안내문 복사'}
                                        </span>
                                      </button>
                                    )}

                                    {isUsed && (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            await resetServerVoucherStatus(v.code);
                                            playSfx('pop');
                                            flashVoucherNotice(
                                              true,
                                              `🔄 [${v.code}] 다시 사용 가능한 상태로 복구했습니다.`
                                            );
                                          } catch {
                                            flashVoucherNotice(false, '상태 복구에 실패했습니다.');
                                          }
                                        }}
                                        className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1 active:scale-95"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                                        <span>미사용 복구</span>
                                      </button>
                                    )}

                                    {confirmDeleteVoucherCode === v.code ? (
                                      <div className="flex items-center gap-1 ml-auto">
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteVoucherCode(null)}
                                          className="min-h-[38px] px-2.5 py-1 rounded-xl bg-stone-100 text-stone-700 text-[11px]"
                                        >
                                          취소
                                        </button>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            try {
                                              await deleteServerVoucher(v.code);
                                              setConfirmDeleteVoucherCode(null);
                                              playSfx('erase');
                                              flashVoucherNotice(
                                                true,
                                                `🗑️ [${v.code}] 코드가 삭제되었습니다.`
                                              );
                                            } catch {
                                              flashVoucherNotice(false, '코드 삭제에 실패했습니다.');
                                            }
                                          }}
                                          className="min-h-[38px] px-2.5 py-1 rounded-xl bg-red-600 text-white text-[11px]"
                                        >
                                          확인삭제
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteVoucherCode(v.code)}
                                        className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[11px] flex items-center gap-1 ml-auto active:scale-95"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                        <span>삭제</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Owner Day-to-Day Operation Guide Accordion */}
                  <div className="rounded-2xl border border-[#e4dccf] bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowVoucherGuide(!showVoucherGuide)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 flex items-center justify-between text-xs font-jua text-[#5d534a] hover:bg-[#faf8f5]"
                    >
                      <span className="flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-[#c9502f] shrink-0" />
                        <span>사장님 운영 방법 한눈에 보기</span>
                      </span>
                      {showVoucherGuide ? (
                        <ChevronUp className="w-4 h-4 text-[#8a8178] shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#8a8178] shrink-0" />
                      )}
                    </button>
                    {showVoucherGuide && (
                      <div className="px-3.5 pb-3.5 pt-2 text-xs text-[#5d534a] font-hand space-y-1.5 border-t border-[#f3ece2] leading-relaxed break-keep">
                        <p>
                          <b className="font-jua text-[#1b1917]">1. 주문 확인</b> : 스마트스토어에서 결제가 들어오면 관리자 콘솔 → <b>[이용권 코드]</b> 탭을 엽니다.
                        </p>
                        <p>
                          <b className="font-jua text-[#1b1917]">2. 코드 생성/등록</b> : <b>[1개 즉시 생성]</b>을 누르거나 구매자의 <b>스마트스토어 주문번호</b>를 그대로 등록합니다.
                        </p>
                        <p>
                          <b className="font-jua text-[#1b1917]">3. 구매자에게 발송</b> : <b>[문자 안내문 복사]</b> 버튼을 눌러 네이버 톡톡/문자로 붙여넣어 발송합니다.
                        </p>
                        <p>
                          <b className="font-jua text-[#1b1917]">4. 자동 재사용 차단</b> : 구매자가 회원가입 없이 앱에 코드를 입력하면 서버가 즉시 <b>사용완료</b>로 잠그므로, 같은 코드를 다른 사람과 공유해도 재사용할 수 없습니다.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: MEMBERS & BILLING */}
              {activeTab === 'members' && (
                <div className="space-y-3.5">
                  {memberActionNotice && (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-jua animate-pop shadow-xs break-keep">
                      {memberActionNotice}
                    </div>
                  )}

                  {/* Search + Total + Collapsible Guide Toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 min-w-0">
                        <Search className="w-4 h-4 text-[#8a8178] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          placeholder="아이디, 이름, 이메일 검색..."
                          className="w-full min-h-[46px] pl-9 pr-3 py-2.5 rounded-2xl border border-[#e4dccf] bg-white text-xs sm:text-sm font-body outline-none focus:border-[#c9502f]"
                        />
                      </div>
                      <span className="min-h-[46px] px-3 rounded-2xl bg-[#fdf3e4] border border-[#eedfc9] text-xs font-jua text-[#c9502f] flex items-center justify-center shrink-0 whitespace-nowrap">
                        {filteredMembers.length}명
                      </span>
                    </div>

                    {/* Collapsible Info Accordion (Hidden by default) */}
                    <div className="rounded-2xl border border-[#e4dccf] bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowMemberHelp(!showMemberHelp)}
                        className="w-full min-h-[42px] px-3.5 py-2 flex items-center justify-between text-xs font-jua text-[#5d534a] hover:bg-[#faf8f5]"
                      >
                        <span className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-[#c9502f] shrink-0" />
                          <span>회원 계정 &amp; 결제 안내</span>
                        </span>
                        {showMemberHelp ? (
                          <ChevronUp className="w-4 h-4 text-[#8a8178] shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#8a8178] shrink-0" />
                        )}
                      </button>
                      {showMemberHelp && (
                        <div className="px-3.5 pb-3 pt-1 text-[11px] text-[#5d534a] font-hand space-y-1 border-t border-[#f3ece2] leading-relaxed break-keep">
                          <p>
                            • <b className="text-[#1b1917] font-jua">내 접속 계정 ({currentUserId})</b>: 선물이나 등급 변경 시 현재 기기에 즉시 반영됩니다.
                          </p>
                          <p>
                            • <b className="text-[#1b1917] font-jua">타 회원 카드</b>: 각 회원 카드를 눌러 선물 지급, 구독 등급 변경, 영수증 등록을 한 번에 처리할 수 있습니다.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Independent Vertical Member Card List */}
                  <div className="space-y-3">
                    {filteredMembers.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-white border border-[#e4dccf] text-center text-xs text-[#8a8178] font-jua">
                        검색된 회원이 없습니다.
                      </div>
                    ) : (
                      filteredMembers.map((member) => {
                        const isExpanded = expandedMemberId === member.id;
                        const isCurrentDevice = member.id === currentUserId;
                        const meta = tierMeta(member.tier);

                        return (
                          <div
                            key={member.id}
                            className={`rounded-3xl bg-white border-2 transition-all overflow-hidden shadow-xs ${
                              isExpanded ? 'border-[#c9502f]' : 'border-[#e4dccf]'
                            }`}
                          >
                            {/* Card Summary Header (Tap anywhere to expand/collapse) */}
                            <button
                              type="button"
                              onClick={() => {
                                playSfx('tap');
                                setSelectedMemberId(member.id);
                                setExpandedMemberId(isExpanded ? null : member.id);
                              }}
                              className="w-full p-4 text-left space-y-3 active:bg-[#fcfaf7]"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  <div className="w-10 h-10 rounded-2xl bg-[#fdf3e4] border border-[#eedfc9] flex items-center justify-center text-lg shrink-0">
                                    {isCurrentDevice ? '🌟' : '👤'}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4 className="font-jua text-sm sm:text-base text-[#1b1917] truncate max-w-full">
                                        {member.name}
                                      </h4>
                                      {isCurrentDevice && (
                                        <span className="text-[10px] font-jua px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0 whitespace-nowrap">
                                          실시간 연동
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-[#7d736a] font-mono break-all mt-0.5">
                                      @{member.id} · {member.email}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <span
                                    className={`text-[11px] font-jua px-2.5 py-0.5 rounded-full border whitespace-nowrap ${meta.badgeCls}`}
                                  >
                                    {meta.label}
                                  </span>
                                  <span className="text-[11px] font-jua text-[#8a8178] flex items-center gap-0.5">
                                    {isExpanded ? (
                                      <>
                                        접기 <ChevronUp className="w-3.5 h-3.5" />
                                      </>
                                    ) : (
                                      <>
                                        관리 <ChevronDown className="w-3.5 h-3.5" />
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Compact 3-Stat Row */}
                              <div className="grid grid-cols-3 gap-2 text-center font-jua text-xs">
                                <div className="py-2 px-1.5 rounded-xl bg-[#f8f2fd] text-[#6b21a8]">
                                  <span className="block text-[10px] opacity-75 font-hand">열매</span>
                                  <span>🍇 {member.berries}</span>
                                </div>
                                <div className="py-2 px-1.5 rounded-xl bg-[#fff2f5] text-[#be185d]">
                                  <span className="block text-[10px] opacity-75 font-hand">하트</span>
                                  <span>💖 {member.hearts}</span>
                                </div>
                                <div className="py-2 px-1.5 rounded-xl bg-[#eef8ed] text-[#2d6a2f]">
                                  <span className="block text-[10px] opacity-75 font-hand">잔여일</span>
                                  <span>
                                    ⏳ {member.tier === 'vip' ? '무제한' : `${member.trialDaysLeft}일`}
                                  </span>
                                </div>
                              </div>
                            </button>

                            {/* Expanded Member Management Actions */}
                            {isExpanded && (
                              <div className="px-4 pb-4 pt-3 border-t border-[#f0ebe1] bg-[#fcfaf7] space-y-4">
                                {/* 1. Quick Gifts */}
                                <div className="space-y-2">
                                  <span className="text-xs font-jua text-[#1b1917] flex items-center gap-1.5">
                                    <Gift className="w-3.5 h-3.5 text-[#c9502f]" />
                                    <span>선물 · 체험 연장 지급</span>
                                  </span>
                                  <div className="grid grid-cols-3 gap-2 text-xs font-jua">
                                    <button
                                      type="button"
                                      onClick={() => handleGrantBerries(member, 20)}
                                      className="min-h-[48px] py-2 px-2 rounded-2xl bg-[#fcf8ff] border border-[#d8b4fe] hover:bg-[#f3e8ff] text-[#6b21a8] active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
                                    >
                                      <span className="text-sm leading-none">🍇</span>
                                      <span className="whitespace-nowrap">열매 +20</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleGrantHearts(member, 5)}
                                      className="min-h-[48px] py-2 px-2 rounded-2xl bg-[#fff5f7] border border-[#fbcfe8] hover:bg-[#ffe4e6] text-[#be185d] active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
                                    >
                                      <span className="text-sm leading-none">💖</span>
                                      <span className="whitespace-nowrap">하트 +5</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleGrantTrialDays(member, 30)}
                                      className="min-h-[48px] py-2 px-2 rounded-2xl bg-[#f0f9ed] border border-[#bbf7d0] hover:bg-[#dcfce7] text-[#15803d] active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
                                    >
                                      <span className="text-sm leading-none">⏳</span>
                                      <span className="whitespace-nowrap">+30일 연장</span>
                                    </button>
                                  </div>
                                </div>

                                {/* 2. Tier Change & Manual Receipt */}
                                <div className="space-y-2 pt-2 border-t border-[#eee6da]">
                                  <span className="text-xs font-jua text-[#1b1917] flex items-center gap-1.5">
                                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                                    <span>이용 등급 변경</span>
                                  </span>
                                  <div className="grid grid-cols-2 gap-2 text-xs font-jua">
                                    {(
                                      [
                                        { id: 'monthly', icon: '💳', name: '월간 구독', sub: '3,900원' },
                                        { id: 'yearly', icon: '💎', name: '연간 패스', sub: '29,000원' },
                                        { id: 'vip', icon: '👑', name: 'VIP 평생', sub: '무제한' },
                                        { id: 'free', icon: '⏳', name: '무료 체험', sub: '구독 해지' },
                                      ] as const
                                    ).map((t) => {
                                      const activeTier = member.tier === t.id;
                                      return (
                                        <button
                                          key={t.id}
                                          type="button"
                                          onClick={() => handleSetSubscriptionTier(member, t.id)}
                                          className={`min-h-[52px] px-3 py-2 rounded-2xl border-2 text-left transition-all active:scale-95 flex items-center gap-2 ${
                                            activeTier
                                              ? t.id === 'vip'
                                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                                : t.id === 'free'
                                                ? 'bg-stone-600 text-white border-stone-700 shadow-xs'
                                                : 'bg-[#c9502f] text-white border-[#c9502f] shadow-xs'
                                              : 'bg-white border-[#e4dccf] text-[#1b1917] hover:bg-[#faf8f5]'
                                          }`}
                                        >
                                          <span className="text-lg shrink-0">{t.icon}</span>
                                          <div className="min-w-0">
                                            <span className="block font-bold leading-tight truncate">
                                              {t.name}
                                            </span>
                                            <span className="block text-[10px] opacity-80 truncate">
                                              {t.sub}
                                            </span>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedMemberId(member.id);
                                      setShowManualPayModal(true);
                                    }}
                                    className="w-full min-h-[48px] mt-1 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-jua text-xs sm:text-sm shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <Receipt className="w-4 h-4 shrink-0" />
                                    <span>결제 영수증 수동 등록</span>
                                  </button>
                                </div>

                                {/* 3. Payment History Cards */}
                                <div className="space-y-2 pt-2 border-t border-[#eee6da]">
                                  <span className="text-xs font-jua text-[#1b1917] block">
                                    결제 내역 ({member.payments.length}건)
                                  </span>
                                  {member.payments.length === 0 ? (
                                    <p className="p-3 rounded-2xl bg-white border border-[#e4dccf] text-center text-[11px] text-[#8a8178] font-hand">
                                      등록된 결제 내역이 없습니다.
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {member.payments.map((pay) => (
                                        <div
                                          key={pay.id}
                                          className="p-3 rounded-2xl bg-white border border-[#e4dccf] flex items-center justify-between gap-2 text-xs"
                                        >
                                          <div className="min-w-0 flex-1">
                                            <span className="font-jua text-[#1b1917] block truncate">
                                              {pay.item}
                                            </span>
                                            <span className="text-[10px] text-[#8a8178] font-hand block truncate">
                                              {pay.date} · {pay.method}
                                            </span>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <span className="font-jua text-[#c9502f] block">
                                              {pay.amount.toLocaleString()}원
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-jua inline-block">
                                              {pay.status}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Shortcut Card to Server DB Voucher Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('tap');
                      setActiveTab('vouchers');
                    }}
                    className="w-full p-4 rounded-3xl bg-white border-2 border-[#eedfc9] hover:border-[#c9502f]/60 flex items-center justify-between gap-3 text-left shadow-2xs active:scale-98 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#fff3ed] text-[#c9502f] flex items-center justify-center shrink-0">
                        <Gift className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-jua text-sm text-[#1b1917] block truncate">
                          서버 DB 1회용 이용권 · 쿠폰 관리
                        </span>
                        <span className="font-hand text-xs text-[#7d736a] block truncate">
                          등록된 코드 {serverVouchers.length}개 · 사용가능 {unusedVouchersCount}개
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-[#c9502f] text-white font-jua text-xs shrink-0 whitespace-nowrap">
                      관리하기 →
                    </span>
                  </button>
                </div>
              )}

              {/* TAB: OVERVIEW DASHBOARD */}
              {activeTab === 'overview' && (
                <div className="space-y-3.5">
                  <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-lg shrink-0">
                        👑
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-jua text-sm text-emerald-950 break-keep">
                          관리자 모드 활성화 중
                        </h4>
                        <p className="text-xs text-emerald-700 font-hand">
                          완료 미션 {completedDaysCount}회 · 등록 회원 {members.length}명
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('security')}
                        className="min-h-[48px] px-3 py-2 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-jua hover:bg-amber-200 flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Key className="w-4 h-4 shrink-0" />
                        <span>비밀번호 변경</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="min-h-[48px] px-3 py-2 rounded-2xl bg-white border border-emerald-300 text-emerald-800 text-xs font-jua hover:bg-emerald-100 active:scale-95 shadow-2xs"
                      >
                        일반 모드 전환
                      </button>
                    </div>
                  </div>

                  {/* Key Metrics Cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-white p-3.5 rounded-2xl border border-[#eedfc9] text-center shadow-2xs">
                      <span className="text-xs text-[#7D736A] font-jua block">무료 체험</span>
                      <span className="text-xl font-jua text-[#c9502f]">
                        {isSubscribed ? '구독중' : `D-${trialDaysLeft}`}
                      </span>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-[#eedfc9] text-center shadow-2xs">
                      <span className="text-xs text-[#7D736A] font-jua block">스티커판</span>
                      <span className="text-xl font-jua text-amber-600">
                        {boardState.stickers.length}/30
                      </span>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-[#eedfc9] text-center shadow-2xs">
                      <span className="text-xs text-[#7D736A] font-jua block">다마고치</span>
                      <span className="text-xl font-jua text-emerald-600">Lv.{petState.level}</span>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-[#eedfc9] text-center shadow-2xs">
                      <span className="text-xs text-[#7D736A] font-jua block">성장일기</span>
                      <span className="text-xl font-jua text-indigo-600">{diaryCount}편</span>
                    </div>
                  </div>

                  {/* Collapsible Mode Guide */}
                  <div className="rounded-2xl border border-[#e4dccf] bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowOverviewHelp(!showOverviewHelp)}
                      className="w-full min-h-[42px] px-3.5 py-2 flex items-center justify-between text-xs font-jua text-[#5d534a]"
                    >
                      <span className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>관리자 화면 표시 안내</span>
                      </span>
                      {showOverviewHelp ? (
                        <ChevronUp className="w-4 h-4 text-[#8a8178]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#8a8178]" />
                      )}
                    </button>
                    {showOverviewHelp && (
                      <p className="px-3.5 pb-3 pt-1 text-[11px] text-[#5d534a] font-hand border-t border-[#f3ece2] leading-relaxed break-keep">
                        관리자 권한이 켜져 있을 때만 앱 최상단 관리자 바가 보이며, 일반 사용자에게는 노출되지 않습니다.
                      </p>
                    )}
                  </div>

                  {/* Backup & Reset */}
                  <div className="bg-white p-4 rounded-3xl border border-[#eedfc9] space-y-3">
                    <h4 className="font-jua text-sm text-[#1b1917] flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-[#c9502f] shrink-0" />
                      <span>데이터 백업 · 초기화</span>
                    </h4>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleExportBackup}
                        className="w-full min-h-[48px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#fdf3e4] hover:bg-[#fae7ce] text-[#c9502f] border border-[#f5b8a6] text-xs sm:text-sm font-jua active:scale-95 transition-all"
                      >
                        <Download className="w-4 h-4 shrink-0" />
                        <span>전체 데이터 JSON 백업</span>
                      </button>

                      {!confirmResetAll ? (
                        <button
                          type="button"
                          onClick={() => setConfirmResetAll(true)}
                          className="w-full min-h-[48px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs sm:text-sm font-jua active:scale-95 transition-all"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                          <span>전체 데이터 초기화</span>
                        </button>
                      ) : (
                        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 space-y-2 text-center">
                          <span className="text-xs font-jua text-red-700 block">
                            모든 로컬 데이터를 초기화할까요?
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmResetAll(false)}
                              className="min-h-[44px] rounded-xl bg-white border border-red-200 text-stone-700 text-xs font-jua"
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmResetAll(false);
                                onResetAllData();
                              }}
                              className="min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-jua"
                            >
                              초기화 확인
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {backupError && (
                      <p className="text-xs font-jua text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                        {backupError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: TRIAL & PRICING */}
              {activeTab === 'trial' && (
                <div className="space-y-3.5">
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FFF1ED] to-[#FFE8E1] border border-[#FCD5CB] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-jua text-[#E76F51] bg-white px-2.5 py-0.5 rounded-full inline-block">
                          체험 · 결제 테스트
                        </span>
                        <h3 className="text-base font-jua text-[#2D2825] mt-1 break-keep">
                          {isSubscribed
                            ? '정식 구독 활성화됨'
                            : trialDaysLeft <= 0
                            ? '체험 만료 (결제 잠금)'
                            : `무료 체험 D-${trialDaysLeft}`}
                        </h3>
                      </div>
                      <span
                        className={`text-2xl font-jua shrink-0 ${
                          isSubscribed
                            ? 'text-emerald-600'
                            : trialDaysLeft <= 0
                            ? 'text-red-600'
                            : 'text-[#E76F51]'
                        }`}
                      >
                        {isSubscribed ? 'ON' : `D-${trialDaysLeft}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          playSfx('pop');
                          onUpdateTrialDays(0);
                          if (onUpdateSubscribed) onUpdateSubscribed(false);
                          const updated = members.map((m) =>
                            m.id === currentUserId
                              ? { ...m, tier: 'free' as const, trialDaysLeft: 0 }
                              : m
                          );
                          saveMembers(updated);
                          onClose();
                        }}
                        className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-jua shadow-2xs active:scale-95 transition-all"
                      >
                        🔒 D-0 만료 &amp; 결제 잠금 테스트
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playSfx('pop');
                          onUpdateTrialDays(30);
                          onUpdateSubscribed?.(false);
                        }}
                        className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-white hover:bg-orange-50 border border-[#FCD5CB] text-xs sm:text-sm font-jua text-[#E76F51] shadow-2xs active:scale-95 transition-all"
                      >
                        🎁 30일 무료 체험으로 리셋
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playSfx('fan');
                          onUpdateSubscribed?.(!isSubscribed);
                        }}
                        className={`w-full min-h-[48px] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-jua shadow-2xs active:scale-95 transition-all ${
                          isSubscribed
                            ? 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isSubscribed ? '구독 해제 (미결제 전환)' : '💳 결제 완료 (구독 활성) 전환'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playSfx('fan');
                          onUpdateTrialDays(999);
                          onUpdateSubscribed?.(true);
                        }}
                        className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-jua shadow-2xs active:scale-95 transition-all"
                      >
                        👑 무제한 VIP 모드 (D-999)
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Paywall Explanation */}
                  <div className="rounded-2xl border border-[#e4dccf] bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowTrialHelp(!showTrialHelp)}
                      className="w-full min-h-[42px] px-3.5 py-2 flex items-center justify-between text-xs font-jua text-[#5d534a]"
                    >
                      <span className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-[#E76F51] shrink-0" />
                        <span>요금제 및 스토어 연동 안내</span>
                      </span>
                      {showTrialHelp ? (
                        <ChevronUp className="w-4 h-4 text-[#8a8178]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#8a8178]" />
                      )}
                    </button>
                    {showTrialHelp && (
                      <div className="px-3.5 pb-3.5 pt-2 border-t border-[#f3ece2] space-y-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                          <span className="font-jua text-emerald-800">30일 무료 체험</span>
                          <span className="font-bold text-emerald-700">0원</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#FFF5F2] border border-[#FCD5CB] flex items-center justify-between">
                          <span className="font-jua text-[#E76F51]">월간 정기구독</span>
                          <span className="font-bold text-[#E76F51]">월 4,900원</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                          <span className="font-jua text-indigo-800">1년 패스</span>
                          <span className="font-bold text-indigo-700">39,000원</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: COMMUNITY MODERATION */}
              {activeTab === 'community' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-jua text-sm text-[#1b1917]">
                      커뮤니티 글 관리 ({communityPosts.length}개)
                    </h3>
                  </div>

                  {communityActionNotice && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-jua flex items-center gap-1.5 animate-pop">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="break-keep">{communityActionNotice}</span>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {communityPosts.map((post) => {
                      const isExpanded = expandedCommentsPostId === post.id;
                      return (
                        <div
                          key={post.id}
                          className="p-3.5 rounded-2xl bg-white border border-[#eedfc9] space-y-2.5 text-xs shadow-2xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {post.pinned && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-jua flex items-center gap-0.5 shrink-0">
                                  <Pin className="w-3 h-3 text-amber-700" /> 공지
                                </span>
                              )}
                              <span className="text-[#8a8178] text-[11px] font-jua">
                                {post.author}
                              </span>
                            </div>
                            <h4 className="font-jua text-sm text-[#1b1917] break-keep">
                              {post.title}
                            </h4>
                            <p className="text-[#5D534A] text-xs font-hand line-clamp-2 break-keep">
                              {post.content}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#f5efe6] font-jua">
                            <button
                              type="button"
                              onClick={() => {
                                playSfx('tap');
                                setExpandedCommentsPostId(isExpanded ? null : post.id);
                              }}
                              className={`min-h-[42px] px-2 rounded-xl flex items-center justify-center gap-1 text-[11px] transition-colors ${
                                isExpanded
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                              }`}
                            >
                              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                              <span className="whitespace-nowrap">댓글 ({post.comments.length})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                playSfx('pop');
                                onTogglePinPost(post.id);
                                setCommunityActionNotice(
                                  post.pinned ? '공지 고정 해제됨' : '상단 공지로 고정됨'
                                );
                                setTimeout(() => setCommunityActionNotice(null), 2500);
                              }}
                              className={`min-h-[42px] px-2 rounded-xl border text-[11px] flex items-center justify-center gap-1 transition-colors ${
                                post.pinned
                                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                                  : 'bg-white border-[#e4dccf] text-[#7D736A]'
                              }`}
                            >
                              <Pin className="w-3.5 h-3.5 shrink-0" />
                              <span className="whitespace-nowrap">
                                {post.pinned ? '고정해제' : '공지고정'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                playSfx('tap');
                                setPendingDeleteCommunity({
                                  type: 'post',
                                  postId: post.id,
                                  title: post.title,
                                  author: post.author,
                                });
                              }}
                              className="min-h-[42px] px-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[11px] flex items-center justify-center gap-1 transition-colors active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="whitespace-nowrap">삭제</span>
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="pt-2 space-y-2 border-l-2 border-amber-300 bg-[#fffaf5] p-2.5 rounded-xl">
                              {post.comments.length === 0 ? (
                                <p className="text-[11px] text-[#8a8178] font-hand py-1 text-center">
                                  등록된 댓글이 없습니다.
                                </p>
                              ) : (
                                post.comments.map((comment) => (
                                  <div
                                    key={comment.id}
                                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-[#eedfc9] text-[11px]"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 text-stone-600">
                                        <span className="font-bold font-jua text-[#1b1917] truncate">
                                          {comment.author}
                                        </span>
                                        <span className="text-[10px] text-stone-400 font-hand shrink-0">
                                          {comment.date}
                                        </span>
                                      </div>
                                      <p className="text-stone-700 font-hand mt-0.5 break-keep">
                                        {comment.content}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        playSfx('tap');
                                        setPendingDeleteCommunity({
                                          type: 'comment',
                                          postId: post.id,
                                          commentId: comment.id,
                                          author: comment.author,
                                          content: comment.content,
                                        });
                                      }}
                                      className="min-h-[36px] px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-jua text-[11px] shrink-0 active:scale-95"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: SECURITY & PIN */}
              {activeTab === 'security' && (
                <div className="space-y-3.5">
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FFF9EE] to-[#FFF3DF] border border-[#F6D8A6] space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                        <Key className="w-4 h-4" />
                      </div>
                      <h3 className="font-jua text-sm sm:text-base text-amber-950">
                        관리자 비밀번호 변경
                      </h3>
                    </div>

                    <form
                      onSubmit={handleChangePassword}
                      className="p-3.5 rounded-2xl bg-white border border-amber-200 space-y-3 text-xs"
                    >
                      <div className="space-y-1">
                        <label className="font-jua text-stone-700 block">현재 비밀번호</label>
                        <input
                          type={showNewPin ? 'text' : 'password'}
                          value={currentPinInput}
                          onChange={(e) => {
                            setCurrentPinInput(e.target.value);
                            setPinChangeError('');
                          }}
                          required
                          placeholder="현재 비밀번호 입력"
                          maxLength={64}
                          className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-stone-300 font-jua text-xs bg-stone-50 outline-none focus:border-amber-600 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="font-jua text-stone-700">새 비밀번호 (4자 이상)</label>
                          <button
                            type="button"
                            onClick={() => setShowNewPin(!showNewPin)}
                            className="text-xs text-stone-500 hover:text-stone-800 font-jua flex items-center gap-1"
                          >
                            {showNewPin ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                            <span>{showNewPin ? '숨기기' : '보기'}</span>
                          </button>
                        </div>
                        <input
                          type={showNewPin ? 'text' : 'password'}
                          value={newPinInput}
                          onChange={(e) => {
                            setNewPinInput(e.target.value);
                            setPinChangeError('');
                          }}
                          required
                          placeholder="새 비밀번호 입력"
                          maxLength={64}
                          className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-stone-300 font-jua text-xs bg-stone-50 outline-none focus:border-amber-600 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-jua text-stone-700 block">새 비밀번호 확인</label>
                        <input
                          type={showNewPin ? 'text' : 'password'}
                          value={confirmPinInput}
                          onChange={(e) => {
                            setConfirmPinInput(e.target.value);
                            setPinChangeError('');
                          }}
                          required
                          placeholder="새 비밀번호 다시 입력"
                          maxLength={64}
                          className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-stone-300 font-jua text-xs bg-stone-50 outline-none focus:border-amber-600 focus:bg-white"
                        />
                      </div>

                      {pinChangeError && (
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-jua">
                          {pinChangeError}
                        </div>
                      )}
                      {pinChangeSuccess && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-jua flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{pinChangeSuccess}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full min-h-[48px] py-2.5 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-jua text-sm shadow-xs active:scale-95 transition-all"
                      >
                        비밀번호 저장
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playSfx('fan');
                          resetAdminPinToDefault();
                          setPinChangeSuccess('기본 비밀번호(9966)로 초기화되었습니다.');
                          setCurrentPinInput('');
                          setNewPinInput('');
                          setConfirmPinInput('');
                        }}
                        className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-jua flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>기본 비밀번호(9966)로 초기화</span>
                      </button>
                    </form>

                    <div className="rounded-2xl border border-amber-200 bg-white/80 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowSecurityHelp(!showSecurityHelp)}
                        className="w-full min-h-[40px] px-3 py-2 flex items-center justify-between text-xs font-jua text-amber-900"
                      >
                        <span className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>보안 수칙 보기</span>
                        </span>
                        {showSecurityHelp ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      {showSecurityHelp && (
                        <p className="px-3 pb-3 pt-1 text-[11px] text-amber-900 font-hand border-t border-amber-100 leading-relaxed break-keep">
                          관리자 비밀번호는 일반 화면 어디에도 표시되지 않으며 변경 즉시 브라우저에 저장됩니다.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: QUICK INSPECTION CHEATS */}
              {activeTab === 'cheats' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-white border border-[#eedfc9] space-y-2.5">
                    <h4 className="font-jua text-sm text-[#1b1917]">
                      🏅 칭찬 스티커 30칸 즉시 완주
                    </h4>
                    <button
                      type="button"
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
                        setCheatNotice('칭찬 스티커 30칸이 채워졌습니다.');
                        setTimeout(() => setCheatNotice(null), 3500);
                      }}
                      className="w-full min-h-[48px] py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-jua text-sm shadow-xs active:scale-95 transition-all"
                    >
                      스티커 30칸 채우기 ✨
                    </button>
                    {cheatNotice && (
                      <p className="text-xs font-jua text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                        {cheatNotice}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#eedfc9] space-y-2.5">
                    <h4 className="font-jua text-sm text-[#1b1917]">
                      🍇 다마고치 열매 20개 지급
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        playSfx('levelup');
                        onUpdatePetState((prev) => ({
                          ...prev,
                          berriesCount: (prev.berriesCount || 0) + 20,
                          happiness: 100,
                        }));
                      }}
                      className="w-full min-h-[48px] py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-jua text-sm shadow-xs active:scale-95 transition-all"
                    >
                      열매 20개 즉시 지급 🍇
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#eedfc9] space-y-2.5">
                    <h4 className="font-jua text-sm text-[#1b1917]">
                      🗺️ 한글 모험 1~10단계 잠금 제어
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          playSfx('levelup');
                          if (onUnlockAllStages) onUnlockAllStages();
                        }}
                        className="min-h-[48px] px-3 py-2 rounded-2xl bg-gradient-to-r from-[#c9502f] to-[#e05b38] text-white font-jua text-xs shadow-xs active:scale-95 transition-all"
                      >
                        🔓 전체 해제
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playSfx('tap');
                          if (onResetStageLocks) onResetStageLocks();
                        }}
                        className="min-h-[48px] px-3 py-2 rounded-2xl bg-white border border-[#eedfc9] text-[#7D736A] hover:bg-stone-50 font-jua text-xs active:scale-95 transition-all"
                      >
                        🔒 1단계만 열기
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Thumb-Friendly Bottom CTA Bar */}
            <div className="px-3.5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] border-t border-[#eedfc9] bg-[#f5efe6] flex items-center gap-2 flex-none">
              {activeTab === 'members' && (
                <button
                  type="button"
                  onClick={() => {
                    playSfx('tap');
                    setShowAddMemberModal(true);
                  }}
                  className="flex-1 min-h-[48px] px-4 py-3 rounded-2xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>새 회원 ID 등록</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  playSfx('tap');
                  onClose();
                }}
                className={`${
                  activeTab === 'members' ? 'px-5 bg-white text-[#4a443e] border border-[#e4dccf]' : 'flex-1 bg-[#c9502f] hover:bg-[#b84324] text-white'
                } min-h-[48px] py-3 rounded-2xl font-jua text-sm shadow-xs active:scale-95 transition-all whitespace-nowrap`}
              >
                콘솔 닫기
              </button>
            </div>
          </>
        )}
      </div>

      {/* Submodal: Add New Member ID */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-5 text-left space-y-3.5 animate-pop relative">
            <button
              type="button"
              onClick={() => setShowAddMemberModal(false)}
              aria-label="닫기"
              className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178]"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-jua text-base text-[#1b1917] flex items-center gap-1.5 pr-8">
              <span>👤</span> 새 회원 ID 등록
            </h3>

            <form onSubmit={handleAddNewMember} className="space-y-2.5 text-xs">
              {addMemberError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-jua">
                  {addMemberError}
                </div>
              )}
              <div>
                <label className="font-jua text-[#1b1917] block mb-1">회원 ID (영문/숫자)</label>
                <input
                  type="text"
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  placeholder="예: jihoo_mom"
                  required
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#eedfc9] bg-white font-body outline-none focus:border-[#c9502f]"
                />
              </div>

              <div>
                <label className="font-jua text-[#1b1917] block mb-1">회원 이름 (닉네임)</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="예: 지후맘"
                  required
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#eedfc9] bg-white font-body outline-none focus:border-[#c9502f]"
                />
              </div>

              <div>
                <label className="font-jua text-[#1b1917] block mb-1">이메일 (선택)</label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="예: parent@naver.com"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#eedfc9] bg-white font-body outline-none focus:border-[#c9502f]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="w-1/2 min-h-[48px] py-2.5 rounded-2xl bg-white border border-[#eedfc9] text-[#7D736A] font-jua text-sm"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-1/2 min-h-[48px] py-2.5 rounded-2xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm shadow-md"
                >
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submodal: Record Manual Web Payment */}
      {showManualPayModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-5 text-left space-y-3.5 animate-pop relative">
            <button
              type="button"
              onClick={() => setShowManualPayModal(false)}
              aria-label="닫기"
              className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178]"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-jua text-base text-[#1b1917] flex items-center gap-1.5 pr-8">
              <span>🧾</span> 결제 영수증 수동 등록
            </h3>
            <p className="text-xs text-[#7D736A] font-hand truncate">
              대상: {selectedMember.name}
            </p>

            <form onSubmit={handleAddManualPayment} className="space-y-2.5 text-xs">
              <div>
                <label className="font-jua text-[#1b1917] block mb-1">결제 상품</label>
                <select
                  value={manualPayItem}
                  onChange={(e) => {
                    const item = e.target.value;
                    setManualPayItem(item);
                    if (item.includes('월간')) setManualPayAmount('3900');
                    else if (item.includes('연간')) setManualPayAmount('29000');
                    else if (item.includes('VIP')) setManualPayAmount('49000');
                  }}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#eedfc9] bg-white font-jua"
                >
                  <option value="웹 직접결제 월간 정기구독 (3,900원)">월간 정기구독 (3,900원)</option>
                  <option value="연간 프리미엄 패스 (29,000원)">연간 프리미엄 패스 (29,000원)</option>
                  <option value="VIP 평생 무제한 회원권 (49,000원)">VIP 평생 회원권 (49,000원)</option>
                  <option value="특별 교재 + 구독 패키지 (59,000원)">교재 + 구독 패키지 (59,000원)</option>
                </select>
              </div>

              <div>
                <label className="font-jua text-[#1b1917] block mb-1">결제 금액 (원)</label>
                <input
                  type="number"
                  value={manualPayAmount}
                  onChange={(e) => setManualPayAmount(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#eedfc9] bg-white font-jua"
                />
              </div>

              <div>
                <label className="font-jua text-[#1b1917] block mb-1">결제 수단</label>
                <select
                  value={manualPayMethod}
                  onChange={(e) => setManualPayMethod(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#eedfc9] bg-white font-jua"
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
                  className="w-1/2 min-h-[48px] py-2.5 rounded-2xl bg-white border border-[#eedfc9] text-[#7D736A] font-jua text-sm"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-1/2 min-h-[48px] py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-jua text-sm shadow-md"
                >
                  승인 · 활성화
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Submodal: Confirm Community Post/Comment Deletion */}
      {pendingDeleteCommunity && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl p-5 text-center space-y-3.5 animate-pop relative">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-jua text-base sm:text-lg text-[#1b1917] break-keep">
                {pendingDeleteCommunity.type === 'post'
                  ? '게시글을 삭제하시겠습니까?'
                  : '댓글을 삭제하시겠습니까?'}
              </h3>
              <p className="text-xs text-[#7D736A] font-hand break-keep">
                삭제한 내용은 다시 복구할 수 없습니다.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#eedfc9] text-left text-xs space-y-1">
              <span className="text-[11px] font-jua text-[#8a8178] block">
                작성자: {pendingDeleteCommunity.author}
              </span>
              <p className="font-jua text-[#1b1917] line-clamp-2 break-keep">
                {pendingDeleteCommunity.type === 'post'
                  ? pendingDeleteCommunity.title
                  : pendingDeleteCommunity.content}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  playSfx('tap');
                  setPendingDeleteCommunity(null);
                }}
                className="min-h-[48px] py-2.5 rounded-2xl bg-white hover:bg-stone-50 border border-[#e4dccf] text-[#5d534a] font-jua text-sm active:scale-95 transition-all"
              >
                아니오
              </button>
              <button
                type="button"
                onClick={() => {
                  playSfx('erase');
                  if (pendingDeleteCommunity.type === 'post') {
                    onDeletePost(pendingDeleteCommunity.postId);
                    setCommunityActionNotice('게시글이 삭제되었습니다.');
                  } else {
                    if (onDeleteComment) {
                      onDeleteComment(
                        pendingDeleteCommunity.postId,
                        pendingDeleteCommunity.commentId
                      );
                    }
                    setCommunityActionNotice('댓글이 삭제되었습니다.');
                  }
                  setPendingDeleteCommunity(null);
                  setTimeout(() => setCommunityActionNotice(null), 2500);
                }}
                className="min-h-[48px] py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-jua text-sm shadow-md active:scale-95 transition-all"
              >
                예, 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
