import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ClipboardCheck,
  MapPin,
  Pencil,
  Sparkles,
  Users,
  Heart,
  Award,
  Lock,
  CreditCard,
  Crown,
} from 'lucide-react';
import { Header } from './components/Header';
import { TrialModal } from './components/TrialModal';
import { PrintModal } from './components/PrintModal';
import { SettingsModal } from './components/SettingsModal';
import { PetGrowthModal } from './components/PetGrowthModal';
import { SoundBlendingModal } from './components/SoundBlendingModal';
import { FootprintCalendarModal } from './components/FootprintCalendarModal';
import { AdminModal } from './components/AdminModal';
import { ParentVoiceMissionModal } from './components/ParentVoiceMissionModal';
import { ChecklistTab } from './components/tabs/ChecklistTab';
import { ProgressTab } from './components/tabs/ProgressTab';
import { DoodleBoardTab } from './components/tabs/DoodleBoardTab';
import { StickerBoardTab } from './components/tabs/StickerBoardTab';
import { CommunityTab } from './components/tabs/CommunityTab';
import {
  FRIENDS,
  THEMES,
  WISHES,
  PET_LEVELS,
  INITIAL_COMMUNITY_POSTS,
  getPetLevelData,
} from './data/hangulData';
import {
  CommunityPost,
  DailyMomDiary,
  MasteryLevel,
  PetGrowthState,
  ProgressState,
  SoundVolume,
  StageId,
  StickerBoardState,
  TabKey,
} from './types';
import { cycleSoundVolume, getSoundVolume, playSfx } from './utils/sound';
import { getOrCreateUserIdentity } from './utils/userIdentity';

export default function App() {
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<TabKey>('checklist');

  // Curriculum Stage (1 to 10)
  const [currentStage, setCurrentStage] = useState<StageId>(() => {
    try {
      const checklistStored = localStorage.getItem('hangul_checklist_by_stage');
      const checklist = checklistStored ? JSON.parse(checklistStored) : {};
      const stage1Days = checklist[1] || [];
      // If Stage 1 is not fully finished (< 30 days), always start at Stage 1
      if (!Array.isArray(stage1Days) || stage1Days.length < 30) {
        return 1;
      }
      const stored = localStorage.getItem('hangul_current_stage');
      const stg = stored ? (JSON.parse(stored) as StageId) : 1;
      return stg >= 1 && stg <= 10 ? stg : 1;
    } catch {
      return 1;
    }
  });

  // Sound volume: mute / soft / medium / loud
  const [soundVolume, setSoundVolumeState] = useState<SoundVolume>(() => getSoundVolume());

  // Trial state
  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('hangul_trial_days');
      return stored ? JSON.parse(stored) : 30;
    } catch {
      return 30;
    }
  });

  // Subscription / Payment state (persisted)
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hangul_is_subscribed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('hangul_is_subscribed', String(isSubscribed));
  }, [isSubscribed]);

  // Mandatory Paywall Lock condition: when trial hits 0 days and not subscribed
  const isTrialExpiredLocked = trialDaysLeft <= 0 && !isSubscribed;

  // 1. Checklist State by Stage
  const [completedDaysByStage, setCompletedDaysByStage] = useState<Record<StageId, number[]>>(() => {
    try {
      const stored = localStorage.getItem('hangul_checklist_by_stage');
      return stored
        ? JSON.parse(stored)
        : { 1: [1], 2: [], 3: [], 4: [], 5: [] };
    } catch {
      return { 1: [1], 2: [], 3: [], 4: [], 5: [] };
    }
  });

  // 1b. Stage 1 is always unlocked; subsequent Stage N is unlocked ONLY when Stage N-1 has all 30 days completed!
  const computeUnlockedStages = (checklist: Record<StageId, number[]>): StageId[] => {
    const list: StageId[] = [1];
    for (let s = 1; s < 10; s++) {
      const days = checklist[s as StageId] || [];
      if (days && days.length >= 30) {
        list.push((s + 1) as StageId);
      } else {
        break;
      }
    }
    return list;
  };

  const [unlockedStages, setUnlockedStages] = useState<StageId[]>(() => {
    try {
      const stored = localStorage.getItem('hangul_checklist_by_stage');
      const checklist = stored ? JSON.parse(stored) : { 1: [1], 2: [], 3: [], 4: [], 5: [] };
      return computeUnlockedStages(checklist);
    } catch {
      return [1];
    }
  });

  useEffect(() => {
    localStorage.setItem('hangul_unlocked_stages', JSON.stringify(unlockedStages));
  }, [unlockedStages]);

  const handleUnlockStage = (stageId: StageId) => {
    setUnlockedStages((prev) => {
      if (prev.includes(stageId)) return prev;
      return [...prev, stageId].sort((a, b) => a - b) as StageId[];
    });
  };

  // 30-Day Daily Mom Diaries
  const [dailyDiaries, setDailyDiaries] = useState<Record<number, DailyMomDiary>>(() => {
    try {
      const stored = localStorage.getItem('hangul_daily_diaries');
      return stored
        ? JSON.parse(stored)
        : {
            1: {
              day: 1,
              date: '2026-10-24',
              content: "첫날이라 긴장했는데 기린 목처럼 꺾인 ㄱ 모양을 보더니 '엄마 기린이다!' 하며 꺄르르 웃었다. 조급해하지 말고 매일 10분만 이렇게 웃으며 놀아줘야지.",
              mood: '🥹',
              updatedAt: Date.now(),
            },
          };
    } catch {
      return {};
    }
  });

  // 2. Progress State
  const [progressState, setProgressState] = useState<ProgressState>(() => {
    try {
      const stored = localStorage.getItem('hangul_progress_state');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // 3. Sticker Board State (Starts completely empty per user request)
  const [boardState, setBoardState] = useState<StickerBoardState>(() => {
    try {
      const stored = localStorage.getItem('hangul_sticker_board');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return {
      name: '우리 아이',
      childAge: '5세',
      friend: 'bear',
      theme: 'home',
      wish: WISHES[0],
      msg: '30일 동안 정말 멋졌어! 엄마가 꼭 들어줄게!',
      stickers: [],
      stamped: false,
      doneDate: null,
    };
  });

  // 4. Pet Tamagotchi State
  const [petState, setPetState] = useState<PetGrowthState>(() => {
    try {
      const stored = localStorage.getItem('hangul_pet_growth');
      if (stored) {
        const parsed = JSON.parse(stored);
        const totalExp = Math.max(0, Number(parsed.totalExp ?? 0) || 0);
        const levelData = getPetLevelData(totalExp);
        return {
          level: levelData.level,
          exp: totalExp - levelData.reqExp,
          totalExp,
          happiness: parsed.happiness ?? 100,
          berriesCount: parsed.berriesCount !== undefined ? parsed.berriesCount : 5,
          stageName: levelData.stageName,
        };
      }
    } catch {}
    return {
      level: 1,
      exp: 0,
      totalExp: 0,
      happiness: 100,
      berriesCount: 5,
      stageName: '알 / 아기 요람 🥚',
    };
  });

  // 5. Community Posts State
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    try {
      const stored = localStorage.getItem('hangul_community_posts');
      return stored ? JSON.parse(stored) : INITIAL_COMMUNITY_POSTS;
    } catch {
      return INITIAL_COMMUNITY_POSTS;
    }
  });

  // Shared doodle image to community post
  const [shareDoodleImage, setShareDoodleImage] = useState<string | undefined>();
  const [shareDoodleTitle, setShareDoodleTitle] = useState<string | undefined>();

  // Completed Dates tracking (date when a mission day was checked: 's1_d1' -> 'YYYY-MM-DD')
  const [completedDates, setCompletedDates] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('hangul_completed_dates');
      return stored ? JSON.parse(stored) : { 's1_d1': '2026-10-24' };
    } catch {
      return { 's1_d1': '2026-10-24' };
    }
  });

  // Ensure every device has a unique persistent user ID on first load
  useEffect(() => {
    getOrCreateUserIdentity(boardState.name);
  }, []);

  // Modals
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [isSoundBlendOpen, setIsSoundBlendOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isParentVoiceModalOpen, setIsParentVoiceModalOpen] = useState(false);

  // Admin status (persisted)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hangul_admin_active') === 'true';
    } catch {
      return false;
    }
  });

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('hangul_current_stage', JSON.stringify(currentStage));
  }, [currentStage]);

  useEffect(() => {
    localStorage.setItem('hangul_checklist_by_stage', JSON.stringify(completedDaysByStage));
  }, [completedDaysByStage]);

  useEffect(() => {
    localStorage.setItem('hangul_completed_dates', JSON.stringify(completedDates));
  }, [completedDates]);

  useEffect(() => {
    localStorage.setItem('hangul_daily_diaries', JSON.stringify(dailyDiaries));
  }, [dailyDiaries]);

  useEffect(() => {
    localStorage.setItem('hangul_progress_state', JSON.stringify(progressState));
  }, [progressState]);

  useEffect(() => {
    localStorage.setItem('hangul_sticker_board', JSON.stringify(boardState));
  }, [boardState]);

  useEffect(() => {
    localStorage.setItem('hangul_pet_growth', JSON.stringify(petState));
  }, [petState]);

  useEffect(() => {
    localStorage.setItem('hangul_community_posts', JSON.stringify(communityPosts));
  }, [communityPosts]);

  useEffect(() => {
    localStorage.setItem('hangul_trial_days', JSON.stringify(trialDaysLeft));
  }, [trialDaysLeft]);

  // Reward Pet EXP Helper
  const handleRewardExp = (amount: number) => {
    setPetState((prev) => {
      const nextTotalExp = prev.totalExp + amount;
      const { level: nextLevel, stageName } = getPetLevelData(nextTotalExp);
      if (nextLevel > prev.level) {
        playSfx('levelup');
        confetti({ particleCount: 50, spread: 80 });
      }
      return {
        ...prev,
        totalExp: nextTotalExp,
        level: nextLevel,
        stageName,
        happiness: Math.min(100, prev.happiness + 10),
      };
    });
  };

  // Sound Volume Handler (약, 중, 강)
  const handleCycleVolume = () => {
    const next = cycleSoundVolume();
    setSoundVolumeState(next);
    playSfx('pop');
  };

  // Checklist day toggle for current stage
  const currentStageDays = completedDaysByStage[currentStage] || [];

  const handleToggleChecklistDay = (day: number) => {
    const key = `s${currentStage}_d${day}`;
    const todayStr = new Date().toISOString().split('T')[0];

    setCompletedDaysByStage((prev) => {
      const list = prev[currentStage] || [];
      const isAlready = list.includes(day);
      if (!isAlready) {
        // Reward +3 letter berries to pet tamagotchi!
        setPetState((p) => ({
          ...p,
          berriesCount: (p.berriesCount ?? 0) + 3,
        }));
        setCompletedDates((cd) => ({ ...cd, [key]: todayStr }));
      } else {
        setCompletedDates((cd) => {
          const next = { ...cd };
          delete next[key];
          return next;
        });
      }
      const updated = isAlready
        ? list.filter((d) => d !== day)
        : [...list, day].sort((a, b) => a - b);

      const nextChecklist = { ...prev, [currentStage]: updated };
      setUnlockedStages(computeUnlockedStages(nextChecklist));

      return nextChecklist;
    });
  };

  const handleCompleteCurrentStage = () => {
    const all30 = Array.from({ length: 30 }, (_, i) => i + 1);
    setCompletedDaysByStage((prev) => {
      const nextChecklist = { ...prev, [currentStage]: all30 };
      setUnlockedStages(computeUnlockedStages(nextChecklist));
      return nextChecklist;
    });
  };

  const handleRewardHearts = (amount: number) => {
    setPetState((prev) => ({
      ...prev,
      heartsCount: (prev.heartsCount ?? 0) + amount,
    }));
  };

  const handleResetChecklistDays = () => {
    setCompletedDaysByStage((prev) => {
      const nextChecklist = { ...prev, [currentStage]: [] };
      setUnlockedStages(computeUnlockedStages(nextChecklist));
      return nextChecklist;
    });
  };

  const handleSaveDiary = (diary: DailyMomDiary) => {
    setDailyDiaries((prev) => ({ ...prev, [diary.day]: diary }));
  };

  const handleDeleteDiary = (day: number) => {
    setDailyDiaries((prev) => {
      const copy = { ...prev };
      delete copy[day];
      return copy;
    });
  };

  // Progress update
  const handleUpdateProgress = (id: string, level: MasteryLevel) => {
    setProgressState((prev) => {
      const copy = { ...prev };
      if (level === 0) delete copy[id];
      else copy[id] = level;
      return copy;
    });
  };

  const handleResetProgress = () => {
    setProgressState({});
  };

  // Community action handlers
  const handleAddPost = (
    post: Omit<CommunityPost, 'id' | 'date' | 'likes' | 'cheeredByMe' | 'comments'>
  ) => {
    const newPost: CommunityPost = {
      ...post,
      id: 'post-' + Date.now(),
      date: '방금 전',
      likes: 1,
      cheeredByMe: true,
      comments: [],
    };
    setCommunityPosts((prev) => [newPost, ...prev]);
  };

  const handleUpdatePost = (postId: string, title: string, content: string, doodleImg?: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, title, content, doodleImg } : p))
    );
  };

  const handleDeletePost = (postId: string) => {
    setCommunityPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleTogglePostLike = (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nextCheered = !p.cheeredByMe;
        return {
          ...p,
          cheeredByMe: nextCheered,
          likes: nextCheered ? p.likes + 1 : Math.max(0, p.likes - 1),
        };
      })
    );
  };

  const handleAddPostComment = (
    postId: string,
    author: string,
    content: string,
    password?: string
  ) => {
    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: 'c-' + Date.now(),
              author,
              content,
              date: '방금 전',
              password: password || '1234',
            },
          ],
        };
      })
    );
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: p.comments.filter((c) => c.id !== commentId),
        };
      })
    );
  };

  const handleTogglePinPost = (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, pinned: !p.pinned } : p))
    );
  };

  // Reset all local data for testing new user onboarding
  const handleResetAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Share from Doodle to Community
  const handleShareDoodleToCommunity = (dataUrl: string, title: string) => {
    setShareDoodleImage(dataUrl);
    setShareDoodleTitle(title);
    setActiveTab('community');
  };

  // Current animal friend & theme
  const currentFriend =
    FRIENDS.find((f) => f.id === boardState.friend) || FRIENDS[0];
  const currentTheme =
    THEMES.find((t) => t.id === boardState.theme) || THEMES[0];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#ece6dc] flex flex-col items-center justify-start sm:py-3 select-none font-body">
      {/* App Shell Container */}
      <div className={`w-full max-w-xl box-border h-[100dvh] sm:h-[94vh] sm:max-h-[920px] bg-[#fbf8f2] sm:rounded-3xl sm:shadow-2xl border-0 sm:border flex flex-col relative overflow-hidden ${
        isAdmin ? 'border-amber-400 sm:ring-2 sm:ring-amber-400/30' : 'border-[#e4dccf]'
      }`}>
        {/* Slim Admin Bar */}
        {isAdmin && (
          <div className="bg-[#241c16] text-white px-3 py-1.5 flex items-center justify-between text-xs font-jua shadow-xs z-50 flex-none border-b border-amber-600/30">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-amber-200 text-xs truncate">👑 관리자 모드</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  playSfx('pop');
                  setIsAdminModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] border border-amber-500/30 active:scale-95 transition-all whitespace-nowrap"
              >
                ⚙️ 콘솔
              </button>
              <button
                onClick={() => {
                  playSfx('tap');
                  setIsAdmin(false);
                  localStorage.setItem('hangul_admin_active', 'false');
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 text-[11px] active:scale-95 transition-all whitespace-nowrap"
                title="일반 사용자 화면으로 전환"
              >
                👤 일반 화면
              </button>
            </div>
          </div>
        )}

        {/* App Global Header */}
        <Header
          childName={boardState.name}
          childAge={boardState.childAge || '5세'}
          friend={currentFriend}
          theme={currentTheme}
          petState={petState}
          soundVolume={soundVolume}
          onCycleVolume={handleCycleVolume}
          onOpenTrial={() => setIsTrialModalOpen(true)}
          onOpenPrint={() => setIsPrintModalOpen(true)}
          onOpenPetModal={() => setIsPetModalOpen(true)}
          onOpenSoundBlend={() => setIsSoundBlendOpen(true)}
          onEditProfile={() => setIsSettingsModalOpen(true)}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          isAdmin={isAdmin}
          trialDaysLeft={trialDaysLeft}
          isSubscribed={isSubscribed}
        />

        {/* Scrollable Main Views Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-thumb-stone-300">
          {/* Mandatory Paywall Screen when trial expired and not subscribed */}
          {isTrialExpiredLocked ? (
            <div className="p-5 sm:p-8 flex flex-col items-center justify-center min-h-[480px] text-center space-y-5">
              <div className="w-20 h-20 rounded-3xl bg-[#fff1ed] border-2 border-[#fcd5cb] text-[#e76f51] flex items-center justify-center shadow-sm">
                <Lock className="w-9 h-9" />
              </div>
              <div className="space-y-2 max-w-sm mx-auto">
                <span className="inline-block px-3 py-1 rounded-full bg-[#fff1ed] text-[#c9502f] font-jua text-xs border border-[#fcd5cb]">
                  30일 무료 체험 완료
                </span>
                <h2 className="text-xl sm:text-2xl font-jua text-[#1b1917] break-keep leading-snug">
                  정식 이용권을 등록하면<br />바로 이어서 놀 수 있어요
                </h2>
                <p className="text-xs sm:text-sm text-[#7D736A] font-hand break-keep leading-relaxed">
                  우리 아이의 한글 기록과 일기장은 모두 안전하게 보관되어 있습니다.
                </p>
              </div>

              <div className="w-full max-w-xs space-y-2.5 pt-1">
                <button
                  onClick={() => {
                    playSfx('pop');
                    setIsTrialModalOpen(true);
                  }}
                  className="w-full min-h-[52px] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#c9502f] to-[#e05b38] hover:from-[#b84324] hover:to-[#c9502f] text-white font-jua text-base shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  이용권 등록하고 이어하기
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      playSfx('fan');
                      setTrialDaysLeft(30);
                    }}
                    className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 font-jua text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-700" />
                    관리자 권한: 30일 무료 연장
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'checklist' && (
                <ChecklistTab
                  currentStage={currentStage}
                  onChangeStage={setCurrentStage}
                  completedDays={currentStageDays}
                  onToggleDay={handleToggleChecklistDay}
                  onResetDays={handleResetChecklistDays}
                  diaries={dailyDiaries}
                  onSaveDiary={handleSaveDiary}
                  onDeleteDiary={handleDeleteDiary}
                  onOpenPrintBook={() => setIsPrintModalOpen(true)}
                  onGoToStickers={() => setActiveTab('sticker')}
                  onRewardExp={handleRewardExp}
                  onOpenSoundBlend={() => setIsSoundBlendOpen(true)}
                  onOpenCalendar={() => setIsCalendarModalOpen(true)}
                  completedDates={completedDates}
                  childName={boardState.name}
                  unlockedStages={unlockedStages}
                  onUnlockStage={handleUnlockStage}
                  onCompleteAllDays={handleCompleteCurrentStage}
                  onOpenParentVoice={() => setIsParentVoiceModalOpen(true)}
                />
              )}

              {activeTab === 'progress' && (
                <ProgressTab
                  progress={progressState}
                  onUpdateProgress={handleUpdateProgress}
                  onResetProgress={handleResetProgress}
                  onRewardExp={handleRewardExp}
                  childName={boardState.name}
                  onOpenParentVoice={() => setIsParentVoiceModalOpen(true)}
                />
              )}

              {activeTab === 'doodle' && (
                <DoodleBoardTab
                  onShareToCommunity={handleShareDoodleToCommunity}
                  onRewardExp={handleRewardExp}
                  childName={boardState.name}
                />
              )}

              {activeTab === 'sticker' && (
                <StickerBoardTab
                  boardState={boardState}
                  onUpdateBoardState={setBoardState}
                  onOpenSettings={() => setIsSettingsModalOpen(true)}
                  onRewardExp={handleRewardExp}
                  completedDaysCount={currentStageDays.length}
                  onResetChecklistDays={handleResetChecklistDays}
                />
              )}

              {activeTab === 'community' && (
                <CommunityTab
                  posts={communityPosts}
                  onAddPost={handleAddPost}
                  onUpdatePost={handleUpdatePost}
                  onDeletePost={handleDeletePost}
                  onToggleLike={handleTogglePostLike}
                  onAddComment={handleAddPostComment}
                  onDeleteComment={handleDeleteComment}
                  onTogglePinPost={handleTogglePinPost}
                  onRewardExp={handleRewardExp}
                  onRewardHearts={handleRewardHearts}
                  childName={boardState.name}
                  onOpenAdmin={() => setIsAdminModalOpen(true)}
                  isAdmin={isAdmin}
                  onSetIsAdmin={setIsAdmin}
                  initialNewPostImage={shareDoodleImage}
                  initialNewPostTitle={shareDoodleTitle}
                  onClearInitialPostImage={() => {
                    setShareDoodleImage(undefined);
                    setShareDoodleTitle(undefined);
                  }}
                />
              )}
            </>
          )}
        </main>

        {/* Bottom Tab Navigation Bar */}
        <nav className={`flex-none bg-white/95 backdrop-blur-md border-t border-[#e4dccf] grid grid-cols-5 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))] px-1.5 relative z-40 shadow-[0_-6px_20px_-8px_rgba(45,40,37,0.1)] ${
          isTrialExpiredLocked ? 'opacity-60 pointer-events-none' : ''
        }`}>
          {isTrialExpiredLocked && (
            <div className="absolute inset-0 z-50 bg-stone-900/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-auto cursor-pointer"
              onClick={() => {
                playSfx('tap');
                setIsTrialModalOpen(true);
              }}
            >
              <span className="px-3 py-1.5 rounded-full bg-red-600 text-white font-jua text-xs flex items-center gap-1 shadow-md">
                <Lock className="w-3.5 h-3.5" /> 이용권 등록이 필요해요
              </span>
            </div>
          )}
          {/* Tab 1: 30일 체크 */}
          <button
            type="button"
            onClick={() => {
              playSfx('tap');
              setActiveTab('checklist');
            }}
            className={`min-h-[48px] flex flex-col items-center justify-center py-1 rounded-2xl transition-all active:scale-95 ${
              activeTab === 'checklist'
                ? 'text-[#c9502f] bg-[#fff4f0] font-bold'
                : 'text-[#8a8178] hover:text-[#1b1917]'
            }`}
          >
            <ClipboardCheck className={`w-5 h-5 ${activeTab === 'checklist' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px] font-jua mt-0.5 whitespace-nowrap">30일 체크</span>
          </button>

          {/* Tab 2: 한글 진도 */}
          <button
            type="button"
            onClick={() => {
              playSfx('tap');
              setActiveTab('progress');
            }}
            className={`min-h-[48px] flex flex-col items-center justify-center py-1 rounded-2xl transition-all active:scale-95 ${
              activeTab === 'progress'
                ? 'text-[#c9502f] bg-[#fff4f0] font-bold'
                : 'text-[#8a8178] hover:text-[#1b1917]'
            }`}
          >
            <MapPin className={`w-5 h-5 ${activeTab === 'progress' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px] font-jua mt-0.5 whitespace-nowrap">한글 진도</span>
          </button>

          {/* Tab 3: 낙서보드 (Center highlighted) */}
          <button
            type="button"
            onClick={() => {
              playSfx('pop');
              setActiveTab('doodle');
            }}
            className={`min-h-[48px] flex flex-col items-center justify-center py-1 rounded-2xl transition-all active:scale-95 ${
              activeTab === 'doodle'
                ? 'text-[#c9502f] bg-[#fff4f0] font-bold'
                : 'text-[#8a8178] hover:text-[#1b1917]'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                activeTab === 'doodle'
                  ? 'bg-[#c9502f] text-white shadow-xs'
                  : 'bg-[#fdf3e4] text-[#c9502f]'
              }`}
            >
              <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-jua mt-0.5 whitespace-nowrap">낙서보드</span>
          </button>

          {/* Tab 4: 스티커판 */}
          <button
            type="button"
            onClick={() => {
              playSfx('tap');
              setActiveTab('sticker');
            }}
            className={`min-h-[48px] flex flex-col items-center justify-center py-1 rounded-2xl transition-all active:scale-95 ${
              activeTab === 'sticker'
                ? 'text-[#c9502f] bg-[#fff4f0] font-bold'
                : 'text-[#8a8178] hover:text-[#1b1917]'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${activeTab === 'sticker' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px] font-jua mt-0.5 whitespace-nowrap">스티커</span>
          </button>

          {/* Tab 5: 으쌰으쌰 */}
          <button
            type="button"
            onClick={() => {
              playSfx('tap');
              setActiveTab('community');
            }}
            className={`min-h-[48px] flex flex-col items-center justify-center py-1 rounded-2xl transition-all active:scale-95 ${
              activeTab === 'community'
                ? 'text-[#c9502f] bg-[#fff4f0] font-bold'
                : 'text-[#8a8178] hover:text-[#1b1917]'
            }`}
          >
            <Users className={`w-5 h-5 ${activeTab === 'community' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px] font-jua mt-0.5 whitespace-nowrap">으쌰으쌰</span>
          </button>
        </nav>

        {/* Global Modals */}
        <SoundBlendingModal
          isOpen={isSoundBlendOpen}
          onClose={() => setIsSoundBlendOpen(false)}
          onRewardExp={handleRewardExp}
        />

        <PetGrowthModal
          isOpen={isPetModalOpen}
          onClose={() => setIsPetModalOpen(false)}
          friend={currentFriend}
          petState={petState}
          onUpdatePet={setPetState}
          childName={boardState.name}
          onSelectFriend={(friendId) => {
            setBoardState((prev) => {
              const updated = { ...prev, friend: friendId };
              try {
                localStorage.setItem('hangul_sticker_board', JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }}
          onGoToCommunity={() => {
            setIsPetModalOpen(false);
            setActiveTab('community');
          }}
        />

        <TrialModal
          isOpen={isTrialModalOpen || isTrialExpiredLocked}
          onClose={() => setIsTrialModalOpen(false)}
          daysLeft={trialDaysLeft}
          onExtendTrial={(days) => {
            setTrialDaysLeft(days || 30);
          }}
          isSubscribed={isSubscribed}
          onSubscribe={(plan) => {
            setIsSubscribed(true);
            playSfx('fan');
          }}
          onUpdateSubscribed={setIsSubscribed}
          onSetDaysLeft={setTrialDaysLeft}
          isAdmin={isAdmin}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
        />

        <PrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          childName={boardState.name}
          childAge={boardState.childAge || '5세'}
          diaries={dailyDiaries}
        />

        <FootprintCalendarModal
          isOpen={isCalendarModalOpen}
          onClose={() => setIsCalendarModalOpen(false)}
          childName={boardState.name}
          currentStage={currentStage}
          completedDays={currentStageDays}
          completedDates={completedDates}
          diaries={dailyDiaries}
          onOpenDiary={(day) => {
            // Can trigger diary edit if user navigates to checklist
            setActiveTab('checklist');
          }}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          boardState={boardState}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          onOpenPrint={() => setIsPrintModalOpen(true)}
          onOpenSoundBlend={() => setIsSoundBlendOpen(true)}
          onOpenParentVoice={() => setIsParentVoiceModalOpen(true)}
          onSave={(name, childAge, friendId, themeId, wish, msg) => {
            setBoardState((prev) => ({
              ...prev,
              name,
              childAge,
              friend: friendId,
              theme: themeId,
              wish,
              msg,
            }));
          }}
        />

        <AdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          isAdmin={isAdmin}
          onSetIsAdmin={setIsAdmin}
          trialDaysLeft={trialDaysLeft}
          onUpdateTrialDays={setTrialDaysLeft}
          isSubscribed={isSubscribed}
          onUpdateSubscribed={setIsSubscribed}
          boardState={boardState}
          onUpdateBoardState={setBoardState}
          petState={petState}
          onUpdatePetState={setPetState}
          communityPosts={communityPosts}
          onDeletePost={handleDeletePost}
          onDeleteComment={handleDeleteComment}
          onTogglePinPost={handleTogglePinPost}
          completedDaysCount={currentStageDays.length}
          diaryCount={Object.keys(dailyDiaries).length}
          onResetAllData={handleResetAllData}
          onUnlockAllStages={() => setUnlockedStages([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])}
          onResetStageLocks={() => setUnlockedStages([1])}
        />

        <ParentVoiceMissionModal
          isOpen={isParentVoiceModalOpen}
          onClose={() => setIsParentVoiceModalOpen(false)}
          childName={boardState.name}
          currentLetter="시"
        />
      </div>
    </div>
  );
}
