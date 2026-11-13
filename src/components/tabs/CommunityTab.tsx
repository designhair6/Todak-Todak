import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Plus,
  X,
  Send,
  HelpCircle,
  Lightbulb,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Camera,
  Lock,
  Trash2,
  Edit2,
  Shield,
  Gift,
  Pin,
  Crown,
  Image as ImageIcon,
  Eye,
  EyeOff,
  KeyRound,
  Check,
} from 'lucide-react';
import { MOM_GUIDE_ARTICLES } from '../../data/hangulData';
import { CommunityComment, CommunityPost } from '../../types';
import { playSfx } from '../../utils/sound';
import { verifyAdminPin, setStoredAdminActive, resetAdminPinToDefault, DEFAULT_INITIAL_PIN } from '../../utils/adminAuth';

interface CommunityTabProps {
  posts: CommunityPost[];
  onAddPost: (post: Omit<CommunityPost, 'id' | 'date' | 'likes' | 'cheeredByMe' | 'comments'>) => void;
  onUpdatePost: (postId: string, title: string, content: string, doodleImg?: string) => void;
  onDeletePost: (postId: string) => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, author: string, content: string, password?: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onTogglePinPost?: (postId: string) => void;
  onRewardExp: (amount: number) => void;
  onRewardHearts?: (amount: number) => void;
  childName: string;
  initialNewPostImage?: string;
  initialNewPostTitle?: string;
  onClearInitialPostImage?: () => void;
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
  onSetIsAdmin?: (status: boolean) => void;
}

export const CommunityTab: React.FC<CommunityTabProps> = ({
  posts,
  onAddPost,
  onUpdatePost,
  onDeletePost,
  onToggleLike,
  onAddComment,
  onDeleteComment,
  onTogglePinPost,
  onRewardExp,
  onRewardHearts,
  childName,
  initialNewPostImage,
  initialNewPostTitle,
  onClearInitialPostImage,
  onOpenAdmin,
  isAdmin: isAdminProp,
  onSetIsAdmin,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'success' | 'doodle' | 'talk' | 'tip' | 'event'>('all');
  const [ageFilter, setAgeFilter] = useState<'all' | '5살' | '6살' | '7살'>('all');
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [expandedGuideIndex, setExpandedGuideIndex] = useState<number | null>(null);
  const [commentOpenPostId, setCommentOpenPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentPassword, setNewCommentPassword] = useState('');

  // In-App Comment Deletion State (Replaces flaky window.prompt)
  const [commentDeleteTarget, setCommentDeleteTarget] = useState<{
    postId: string;
    commentId: string;
    expectedPassword?: string;
  } | null>(null);
  const [commentDeletePinInput, setCommentDeletePinInput] = useState('');
  const [commentDeleteError, setCommentDeleteError] = useState('');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Admin Mode state (synced with App.tsx prop)
  const isAdmin = isAdminProp !== undefined ? isAdminProp : (localStorage.getItem('hangul_admin_active') === 'true');
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState(false);
  const [adminResetNotice, setAdminResetNotice] = useState<string | null>(null);

  // Edit Post state
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState<string | undefined>(undefined);
  const [editPasswordInput, setEditPasswordInput] = useState('');

  // Delete Prompt
  const [deletePromptPost, setDeletePromptPost] = useState<CommunityPost | null>(null);
  const [deletePasswordInput, setDeletePasswordInput] = useState('');

  // Monthly Lucky Draw Event Modal
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [drawnWinner, setDrawnWinner] = useState<string | null>(null);

  // New post draft
  const [authorName, setAuthorName] = useState(() => (isAdmin ? '토닥한글 관리자' : `${childName || '아이'}맘`));
  const [childAge, setChildAge] = useState(isAdmin ? '공식 관리자' : '5~7세');
  const [postCategory, setPostCategory] = useState<'success' | 'talk' | 'doodle' | 'tip' | 'event'>('success');
  const [postTitle, setPostTitle] = useState(initialNewPostTitle || '');
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<string | undefined>(initialNewPostImage);
  const [postPassword, setPostPassword] = useState('');
  const [postTags, setPostTags] = useState('엄마표한글, 우리아이, 응원해요');
  const [writeFormError, setWriteFormError] = useState<string | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Sync authorName when isAdmin changes
  React.useEffect(() => {
    if (isAdmin) {
      setAuthorName('토닥한글 관리자');
      setChildAge('공식 관리자');
    } else {
      setAuthorName(`${childName || '아이'}맘`);
      setChildAge('5~7세');
    }
  }, [isAdmin, childName]);

  React.useEffect(() => {
    if (initialNewPostImage) {
      setPostImage(initialNewPostImage);
      if (initialNewPostTitle) setPostTitle(initialNewPostTitle);
      setPostCategory('doodle');
      setWriteModalOpen(true);
      if (onClearInitialPostImage) onClearInitialPostImage();
    }
  }, [initialNewPostImage]);

  const filteredPosts = posts.filter((p) => {
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    const matchesAge = ageFilter === 'all' || (p.childAge && p.childAge.includes(ageFilter.slice(0, 1)));
    return matchesCat && matchesAge;
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPostImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    setWriteFormError(null);
    if (!postTitle.trim() || !postContent.trim()) {
      playSfx('pop');
      setWriteFormError('제목과 내용을 입력해주세요!');
      return;
    }

    if (!postPassword.trim() || postPassword.trim().length < 4) {
      playSfx('pop');
      setWriteFormError('수정/삭제 시 필요한 4자리 비밀번호를 입력해주세요.');
      return;
    }

    playSfx('fan');
    confetti({ particleCount: 30, spread: 60 });
    onRewardExp(8);
    // Pet Tamagotchi Heart Reward (+3 hearts)
    if (onRewardHearts) onRewardHearts(3);

    const tagsArray = postTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const finalAuthor = isAdmin ? '토닥한글 관리자' : (authorName.trim() || '엄마');
    const isPostAdmin = isAdmin || finalAuthor.includes('관리자');

    onAddPost({
      author: finalAuthor,
      childAge: isPostAdmin ? '공식 관리자' : (childAge || '5살'),
      category: postCategory,
      title: postTitle.trim(),
      content: postContent.trim(),
      doodleImg: postImage,
      password: postPassword.trim(),
      isAdmin: isPostAdmin,
      tags: tagsArray.length > 0 ? tagsArray : [isPostAdmin ? '공지사항' : '엄마표한글'],
      pinned: isPostAdmin && (postCategory === 'event' || postCategory === 'tip'),
    });

    setPostTitle('');
    setPostContent('');
    setPostImage(undefined);
    setPostPassword('');
    setWriteFormError(null);
    setWriteModalOpen(false);
  };

  // Edit Post Confirm
  const handleConfirmEdit = () => {
    if (!editingPost) return;
    setEditFormError(null);
    if (!isAdmin && editingPost.password && editingPost.password !== editPasswordInput) {
      playSfx('pop');
      setEditFormError('비밀번호가 일치하지 않습니다.');
      return;
    }
    playSfx('pop');
    onUpdatePost(editingPost.id, editTitle.trim(), editContent.trim(), editImage);
    setEditFormError(null);
    setEditingPost(null);
  };

  // Delete Post Confirm
  const handleConfirmDelete = () => {
    if (!deletePromptPost) return;
    const isMasterOrAdmin =
      deletePasswordInput === '9966' ||
      deletePasswordInput === DEFAULT_INITIAL_PIN ||
      deletePasswordInput === 'admin' ||
      isAdmin;

    if (!isMasterOrAdmin && deletePromptPost.password && deletePromptPost.password !== deletePasswordInput) {
      showToast('⚠️ 비밀번호가 일치하지 않습니다.');
      return;
    }
    playSfx('erase');
    onDeletePost(deletePromptPost.id);
    setDeletePromptPost(null);
    showToast('게시글이 삭제되었습니다.');
  };

  // Delete comment click
  const handleCommentDelete = (postId: string, comment: CommunityComment) => {
    playSfx('tap');
    // Open dedicated In-App Confirmation / PIN Modal so admins also confirm before deleting
    setCommentDeleteTarget({
      postId,
      commentId: comment.id,
      expectedPassword: comment.password || '1234',
    });
    setCommentDeletePinInput('');
    setCommentDeleteError('');
  };

  const handleConfirmDeleteComment = () => {
    if (!commentDeleteTarget) return;

    const isMasterOrAdmin =
      commentDeletePinInput === '9966' ||
      commentDeletePinInput === DEFAULT_INITIAL_PIN ||
      commentDeletePinInput === 'admin' ||
      isAdmin;

    if (
      !isMasterOrAdmin &&
      commentDeleteTarget.expectedPassword &&
      commentDeleteTarget.expectedPassword !== commentDeletePinInput
    ) {
      playSfx('pop');
      setCommentDeleteError('비밀번호가 일치하지 않습니다.');
      return;
    }

    playSfx('erase');
    onDeleteComment(commentDeleteTarget.postId, commentDeleteTarget.commentId);
    setCommentDeleteTarget(null);
    setCommentDeletePinInput('');
    setCommentDeleteError('');
    showToast('댓글이 삭제되었습니다.');
  };

  const handleCommentSubmit = (postId: string) => {
    if (!newCommentText.trim()) return;
    if (!newCommentPassword.trim() || newCommentPassword.trim().length < 4) {
      showToast('⚠️ 댓글 등록 시 삭제용 4자리 비밀번호를 입력해주세요!');
      return;
    }
    playSfx('pop');
    onRewardExp(3);
    // Pet Tamagotchi Heart Reward (+1 heart)
    if (onRewardHearts) onRewardHearts(1);

    onAddComment(
      postId,
      isAdmin ? '👑 관리자' : `${childName || '익명'}맘`,
      newCommentText.trim(),
      newCommentPassword.trim()
    );
    setNewCommentText('');
    setNewCommentPassword('');
  };

  // Toggle Admin Mode
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPin(adminPasswordInput)) {
      playSfx('fan');
      if (onSetIsAdmin) onSetIsAdmin(true);
      setStoredAdminActive(true);
      setAdminModalOpen(false);
      setAdminPasswordInput('');
      setAdminAuthError(false);
      setAdminResetNotice(null);
    } else {
      playSfx('pop');
      setAdminAuthError(true);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-5 pt-4 sm:pt-5 pb-6 space-y-5 box-border overflow-x-hidden">
      {/* Toast Notification Banner */}
      {toastNotice && (
        <div className="p-3 rounded-2xl bg-[#1b1917] text-white text-xs font-jua flex items-center justify-between shadow-lg animate-pop">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 flex-none" />
            <span>{toastNotice}</span>
          </div>
          <button
            onClick={() => setToastNotice(null)}
            className="text-stone-300 hover:text-white px-1 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Eye-catching Admin Mode Bar in Community */}
      {isAdmin && (
        <div className="w-full max-w-full box-border overflow-hidden bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-3xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3 border-2 border-amber-300">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl flex-none">
              👑
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-jua text-sm sm:text-base">관리자 모드 실행 중</span>
                <span className="bg-white text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-2xs">ADMIN</span>
              </div>
              <p className="text-[11px] text-amber-100 font-sans mt-0.5 break-keep">
                비밀번호 없이 글·댓글 관리 가능
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-none">
            {onOpenAdmin && (
              <button
                onClick={() => {
                  playSfx('pop');
                  onOpenAdmin();
                }}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white text-amber-900 font-jua text-xs shadow-xs hover:bg-amber-50 transition-all active:scale-95 whitespace-nowrap"
              >
                콘솔
              </button>
            )}
            <button
              onClick={() => {
                playSfx('tap');
                if (onSetIsAdmin) onSetIsAdmin(false);
                setStoredAdminActive(false);
              }}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-black/40 text-amber-200 border border-amber-300/40 font-jua text-xs hover:bg-black/60 transition-all active:scale-95 whitespace-nowrap"
              title="일반 사용자 화면으로 보기"
            >
              일반 모드
            </button>
          </div>
        </div>
      )}

      {/* Monthly Lucky Draw Gift Event Banner */}
      <div className="w-full max-w-full box-border bg-gradient-to-r from-[#ffe5d9] via-[#fff1e0] to-[#ffdcd2] rounded-3xl p-4 sm:p-5 border-2 border-[#f5b8a6] shadow-sm relative overflow-hidden space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-xs font-bold text-[#c9502f] font-jua shadow-2xs whitespace-nowrap">
            <Gift className="w-3.5 h-3.5" /> 매월 선물 추첨 이벤트
          </div>
          {onOpenAdmin && (
            <button
              onClick={() => {
                playSfx('pop');
                onOpenAdmin();
              }}
              className={`min-h-[32px] text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all whitespace-nowrap shrink-0 ${
                isAdmin
                  ? 'bg-[#1b1917] text-amber-300 border border-amber-400/50 hover:bg-black'
                  : 'bg-white/80 text-[#7D736A] hover:bg-white border border-[#f5b8a6]'
              }`}
              title="대표님 관리자 콘솔 열기"
            >
              👑 {isAdmin ? '관리자 On' : '관리자'}
            </button>
          )}
        </div>

        <h2 className="text-base sm:text-lg font-jua text-[#1b1917] leading-snug break-keep">
          🎁 완주 인증맘 선물 추첨 이벤트
        </h2>
        <p className="text-xs text-[#4a443e] font-body leading-relaxed break-keep">
          인증샷이나 일기를 올리면 <b>원목 한글 교구 &amp; 그림책</b> 선물을 드려요!
        </p>

        <button
          onClick={() => {
            playSfx('fan');
            setEventModalOpen(true);
          }}
          className="min-h-[42px] inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#c9502f] text-white font-jua text-xs sm:text-sm shadow-xs hover:bg-[#b84324] active:scale-95 transition-all"
        >
          이벤트 확인하기 ✨
        </button>
      </div>

      {/* Community Top Hero */}
      <div className="w-full max-w-full box-border overflow-hidden bg-white rounded-3xl p-4 sm:p-5 border border-[#e4dccf] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-jua text-[#1b1917] leading-snug break-keep">
            엄마표 한글 으쌰으쌰 광장 ☕
          </h1>
          <p className="text-xs text-[#8a8178] font-body mt-0.5 break-keep">
            우리 아이 이야기와 작품을 함께 나눠요
          </p>
        </div>

        <button
          onClick={() => {
            playSfx('pop');
            setWriteFormError(null);
            setWriteModalOpen(true);
          }}
          className="min-h-[44px] shrink-0 inline-flex items-center gap-1.5 py-2.5 px-4 rounded-2xl bg-[#c9502f] text-white font-jua text-xs sm:text-sm shadow-md hover:bg-[#b84324] active:scale-95 transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> 새 글 쓰기
        </button>
      </div>

      {/* Mom's Coaching Guide Accordion (No specific age limit) */}
      <div className="w-full max-w-full box-border overflow-hidden bg-white rounded-3xl p-4 border border-[#e4dccf] shadow-xs space-y-2">
        <div className="flex items-center justify-between font-jua text-sm text-[#1b1917] pb-1 border-b border-[#f0ebe1]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#c9502f]" />
            <span>엄마들을 위한 한글 코칭 가이드</span>
          </div>
          <button
            onClick={() => setExpandedGuideIndex(expandedGuideIndex === null ? 0 : null)}
            className="text-xs text-[#8a8178] hover:text-[#c9502f] font-jua"
          >
            {expandedGuideIndex === null ? '열기' : '접기'}
          </button>
        </div>

        {expandedGuideIndex !== null && (
          <div className="space-y-1.5 pt-1">
            {MOM_GUIDE_ARTICLES.map((article, idx) => (
              <div key={idx} className="border border-[#f0ebe1] rounded-2xl p-3 bg-[#fdfcf9] space-y-1 text-xs">
                <h4 className="font-jua text-xs sm:text-sm text-[#1b1917] break-keep">{article.title}</h4>
                <p className="font-semibold text-[#c9502f] font-body break-keep">{article.summary}</p>
                <ul className="space-y-1 text-[#4a443e] list-disc pl-4 font-body leading-relaxed break-keep">
                  {article.tips.map((tip, tIdx) => (
                    <li key={tIdx}>{tip}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Age Room Filter & Category Filter - Unified Mobile-Optimized Card */}
      <div className="w-full max-w-full box-border overflow-hidden bg-white rounded-2xl p-3 border border-[#e4dccf] shadow-xs space-y-2">
        {/* Row 1: Age Filter Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-xs font-jua text-[#8a8178] shrink-0 flex items-center gap-1 pl-0.5">
            <span>👶</span> 연령방:
          </span>
          {[
            { key: 'all', label: '전체' },
            { key: '5살', label: '5세반 🧸' },
            { key: '6살', label: '6세반 🎈' },
            { key: '7살', label: '7세 예비초등 🎒' },
          ].map((af) => (
            <button
              key={af.key}
              onClick={() => {
                playSfx('tap');
                setAgeFilter(af.key as any);
              }}
              className={`px-3 py-1 rounded-xl font-jua text-xs shrink-0 whitespace-nowrap transition-all ${
                ageFilter === af.key
                  ? 'bg-[#1b1917] text-white shadow-2xs'
                  : 'bg-[#faf8f5] text-[#8a8178] border border-[#e4dccf] hover:text-[#1b1917]'
              }`}
            >
              {af.label}
            </button>
          ))}
        </div>

        {/* Row 2: Category Filter Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5 border-t border-[#f0ebe1]">
          {[
            { key: 'all', label: '💖 전체글' },
            { key: 'success', label: '🏆 오늘 성공' },
            { key: 'doodle', label: '🎨 아이 솜씨' },
            { key: 'talk', label: '💬 수다·고민' },
            { key: 'tip', label: '💡 엄마표 팁' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                playSfx('tap');
                setActiveCategory(cat.key as typeof activeCategory);
              }}
              className={`px-3 py-1.5 rounded-xl font-jua text-xs shrink-0 whitespace-nowrap transition-all ${
                activeCategory === cat.key
                  ? 'bg-[#c9502f] text-white shadow-xs'
                  : 'bg-[#faf8f5] text-[#8a8178] border border-[#e4dccf] hover:text-[#1b1917]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-[#e4dccf] p-6 space-y-2">
            <span className="text-3xl">☕</span>
            <p className="font-jua text-base text-[#1b1917]">아직 작성된 글이 없어요.</p>
            <p className="text-xs text-[#8a8178] font-body">
              첫 번째로 우리 아이 이야기나 사진을 남겨보세요!
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="w-full max-w-full box-border overflow-hidden bg-white rounded-3xl p-4 sm:p-5 border border-[#e4dccf] shadow-xs space-y-3 hover:border-[#ebd9c7] transition-all"
            >
              {/* Post Header: Clean 1-row metadata & single category badge */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-jua text-sm sm:text-base shrink-0 shadow-xs ${
                    post.isAdmin || post.author.includes('관리자')
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-2 border-amber-300'
                      : 'bg-[#fdf3e4] border border-[#f3dfc6] text-[#c9502f]'
                  }`}>
                    {post.isAdmin || post.author.includes('관리자') ? '👑' : post.author.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-jua text-sm text-[#1b1917] truncate">
                        {post.author}
                      </span>
                      {(post.isAdmin || post.author.includes('관리자')) && (
                        <span className="text-[11px] font-jua text-amber-700 whitespace-nowrap">
                          👑 관리자
                        </span>
                      )}
                      {post.pinned && (
                        <span className="text-[11px] font-jua text-[#c9502f] whitespace-nowrap">
                          📌 공지
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#9c9387] font-body block mt-0.5">
                      {post.childAge} · {post.date}
                    </span>
                  </div>
                </div>

                {/* Right: Category Badge & Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-jua px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 shadow-2xs ${
                      post.category === 'success'
                        ? 'bg-[#eef6e2] text-[#336a18] border border-[#d2eab8]'
                        : post.category === 'doodle'
                        ? 'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]'
                        : post.category === 'tip'
                        ? 'bg-[#fef9c3] text-[#a16207] border border-[#fef08a]'
                        : 'bg-[#f5f5f4] text-[#57534e] border border-[#e7e5e4]'
                    }`}
                  >
                    {post.category === 'success' && '🏆 오늘 성공'}
                    {post.category === 'doodle' && '🎨 아이 솜씨'}
                    {post.category === 'tip' && '💡 꿀팁'}
                    {post.category === 'talk' && '💬 수다·고민'}
                    {post.category === 'event' && '🎁 이벤트'}
                  </span>

                  <div className="flex items-center text-[#8a8178]">
                    {onTogglePinPost && isAdmin && (
                      <button
                        onClick={() => onTogglePinPost(post.id)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#f6f1e7] ${post.pinned ? 'text-[#c9502f]' : ''}`}
                        title="공지 고정 토글"
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditFormError(null);
                        setEditingPost(post);
                        setEditTitle(post.title);
                        setEditContent(post.content);
                        setEditImage(post.doodleImg);
                        setEditPasswordInput('');
                      }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#f6f1e7] hover:text-[#1b1917] transition-colors"
                      title="수정하기"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletePromptPost(post);
                        setDeletePasswordInput('');
                      }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="삭제하기"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Title & Body: Consistent fonts & break-keep */}
              <div className="space-y-1">
                <h3 className="font-jua text-base sm:text-lg text-[#1b1917] leading-snug break-keep">
                  {post.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#3d3834] whitespace-pre-wrap leading-relaxed font-body break-keep">
                  {post.content}
                </p>
              </div>

              {/* Attached Photo or Doodle */}
              {post.doodleImg && (
                <div className="rounded-2xl overflow-hidden border border-[#e4dccf] bg-[#faf8f5] p-2 text-center">
                  <img
                    src={post.doodleImg}
                    alt="첨부 사진"
                    className="max-h-72 mx-auto rounded-xl object-contain bg-white shadow-2xs"
                  />
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {post.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[11px] text-[#3b5998] font-body bg-[#f0f4f8] px-2 py-0.5 rounded-md whitespace-nowrap shrink-0"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions: Cheering Like & Comments Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-[#f0ebe1]">
                <button
                  onClick={() => {
                    playSfx('pop');
                    onToggleLike(post.id);
                  }}
                  className={`flex items-center gap-1.5 text-xs font-jua px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${
                    post.cheeredByMe
                      ? 'bg-[#fbe7e1] border-[#f5b8a6] text-[#c9502f]'
                      : 'bg-white border-[#e4dccf] text-[#8a8178] hover:text-[#c9502f]'
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      post.cheeredByMe ? 'fill-[#c9502f] text-[#c9502f]' : ''
                    }`}
                  />
                  <span>응원해요 {post.likes}</span>
                </button>

                <button
                  onClick={() => {
                    playSfx('tap');
                    setCommentOpenPostId(commentOpenPostId === post.id ? null : post.id);
                  }}
                  className="flex items-center gap-1 text-xs text-[#8a8178] hover:text-[#1b1917] font-jua py-1.5 px-2 active:scale-95 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  댓글 {post.comments.length}개
                </button>
              </div>

              {/* Comments Section Drawer with Responsive Mobile Form */}
              {commentOpenPostId === post.id && (
                <div className="pt-3 border-t border-[#f0ebe1] space-y-2.5 bg-[#fcfbf8] p-3 rounded-2xl">
                  {post.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="text-xs space-y-0.5 bg-white p-2.5 rounded-xl border border-[#ece3d4] flex items-start justify-between"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 text-[#1b1917]">
                          <span className="font-jua text-xs">{comment.author}</span>
                          <span className="text-[10px] text-[#9c9387] font-body">{comment.date}</span>
                        </div>
                        <p className="text-[#3d3834] font-body text-xs leading-relaxed mt-0.5 break-keep">
                          {comment.content}
                        </p>
                      </div>

                      <button
                        onClick={() => handleCommentDelete(post.id, comment)}
                        className="text-[#a9a094] hover:text-red-500 p-1 flex-none"
                        title="댓글 삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add comment: Mobile-friendly layout */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="따뜻한 응원 한마디를 남겨주세요..."
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#e4dccf] bg-white text-[#1b1917] outline-none focus:border-[#c9502f] font-body"
                      />
                      <div className="flex items-center gap-1.5">
                        <input
                          type="password"
                          value={newCommentPassword}
                          onChange={(e) => setNewCommentPassword(e.target.value.replace(/[^0-9]/g, ''))}
                          maxLength={4}
                          placeholder="PIN 4자리"
                          title="삭제 시 필요한 비밀번호"
                          className="w-24 px-2 py-2 text-xs text-center rounded-xl border border-[#e4dccf] bg-white font-mono tracking-widest outline-none focus:border-[#c9502f]"
                        />
                        <button
                          onClick={() => handleCommentSubmit(post.id)}
                          className="px-3.5 py-2 rounded-xl bg-[#c9502f] text-white hover:bg-[#b84324] font-jua text-xs flex items-center justify-center gap-1 shadow-xs transition-all flex-1 sm:flex-none cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> 등록
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#8a8178] font-body">
                      🔒 댓글 삭제 시 필요한 비밀번호 4자리를 지정합니다 (기본: 1234)
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button (FAB) for mobile quick posting */}
      <div className="fixed bottom-20 right-4 sm:hidden z-30">
        <button
          onClick={() => {
            playSfx('pop');
            setWriteFormError(null);
            setWriteModalOpen(true);
          }}
          className="min-h-[48px] flex items-center gap-1.5 py-3 px-4 rounded-full bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-xs shadow-lg active:scale-95 transition-all cursor-pointer"
          title="새 글 쓰기"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> 새 글 쓰기
        </button>
      </div>

      {/* Admin Mode Footer Bar */}
      <div className="text-center pt-2">
        <button
          onClick={() => {
            playSfx('tap');
            if (isAdmin) {
              if (onSetIsAdmin) onSetIsAdmin(false);
              setStoredAdminActive(false);
            } else {
              setAdminModalOpen(true);
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs text-[#8a8178] hover:text-[#1b1917] py-1.5 px-3 rounded-xl bg-white border border-[#e4dccf]"
        >
          <Shield className="w-3.5 h-3.5 text-[#c9502f]" />
          {isAdmin ? '👑 관리자 모드 끄기' : '앱 제작자 / 관리자 로그인'}
        </button>
      </div>

      {/* Admin Auth Modal */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-sm box-border overflow-hidden shadow-2xl p-5 sm:p-6 text-center space-y-4 animate-pop relative">
            <button
              onClick={() => {
                setAdminModalOpen(false);
                setAdminAuthError(false);
                setAdminResetNotice(null);
              }}
              className="absolute top-4 right-4 text-[#8a8178] hover:text-[#1b1917]"
            >
              <X className="w-4 h-4" />
            </button>
            <Shield className="w-10 h-10 text-[#c9502f] mx-auto" />
            <div>
              <h3 className="font-jua text-lg text-[#1b1917]">대표 관리자 인증</h3>
              <p className="text-xs text-[#8a8178] font-hand">
                대표님 관리자 비밀번호를 입력해주세요
              </p>
            </div>
            <form onSubmit={handleAdminAuth} className="space-y-3">
              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-jua text-[#7D736A]">관리자 비밀번호</label>
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="text-[11px] text-[#8a8178] hover:text-[#1b1917] font-jua flex items-center gap-1"
                  >
                    {showAdminPass ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showAdminPass ? '숨기기' : '표시'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    value={adminPasswordInput}
                    onChange={(e) => {
                      setAdminPasswordInput(e.target.value);
                      setAdminAuthError(false);
                      setAdminResetNotice(null);
                    }}
                    autoFocus
                    required
                    maxLength={64}
                    placeholder="비밀번호 입력 (글자수 제한 없음)"
                    className="w-full text-center py-2.5 px-8 rounded-xl border border-[#e4dccf] bg-white text-base tracking-wider outline-none focus:border-[#c9502f]"
                  />
                  {adminPasswordInput && (
                    <button
                      type="button"
                      onClick={() => setAdminPasswordInput('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex justify-between text-[11px] text-[#8a8178] font-hand px-1">
                  <span>입력 글자수: {adminPasswordInput.length}자</span>
                  <span>최대 64자까지 입력 가능</span>
                </div>
              </div>

              {adminAuthError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-jua text-center">
                  <span>⚠️ 비밀번호가 일치하지 않습니다. 다시 입력해주세요.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm shadow-md active:scale-95 transition-all"
              >
                관리자로 로그인
              </button>

              <div className="pt-2 border-t border-[#eedfc9]">
                <button
                  type="button"
                  onClick={() => {
                    playSfx('fan');
                    resetAdminPinToDefault();
                    if (onSetIsAdmin) onSetIsAdmin(true);
                    setStoredAdminActive(true);
                    setAdminModalOpen(false);
                    setAdminPasswordInput('');
                    setAdminAuthError(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-jua text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span>👑 대표님 본인 인증 &amp; 관리자 모드 즉시 접속</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Write New Post Modal with Photo Upload & Password */}
      {writeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-lg box-border overflow-hidden shadow-2xl p-4 sm:p-6 text-left space-y-4 animate-pop max-h-[92vh] flex flex-col relative">
            <button
              onClick={() => {
                playSfx('tap');
                setWriteModalOpen(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-[#f0ebe1] pb-2">
              <span className="text-xs font-bold text-[#c9502f] font-jua">엄마표 한글 커뮤니티</span>
              <h2 className="text-xl font-jua text-[#1b1917]">새 글 쓰기 & 인증샷 올리기</h2>
            </div>

            <form onSubmit={handleSubmitPost} className="space-y-3 overflow-y-auto overflow-x-hidden flex-1 pb-4 box-border">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#4a443e] block mb-1">작성자 닉네임</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    required
                    maxLength={10}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#e4dccf] bg-white text-[#1b1917]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#4a443e] block mb-1">아이 나이</label>
                  <input
                    type="text"
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    required
                    maxLength={10}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#e4dccf] bg-white text-[#1b1917]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#4a443e] block mb-1">카테고리</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'success', label: '오늘 성공' },
                    { id: 'doodle', label: '아이 솜씨' },
                    { id: 'talk', label: '고민·수다' },
                    { id: 'tip', label: '엄마 팁' },
                  ].map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setPostCategory(c.id as typeof postCategory)}
                      className={`py-1.5 rounded-lg text-xs font-jua border ${
                        postCategory === c.id
                          ? 'bg-[#c9502f] text-white border-[#c9502f]'
                          : 'bg-white text-[#8a8178] border-[#e4dccf]'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#4a443e] block mb-1">제목</label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="예) 오늘 D+5 미션 성공했어요!"
                  required
                  maxLength={50}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#e4dccf] bg-white text-[#1b1917]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#4a443e] block mb-1">이야기 나누기</label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="오늘 아이와 어떤 일이 있었나요? 자랑하고 싶은 순간이나 고민을 편하게 적어주세요."
                  rows={4}
                  required
                  maxLength={600}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#e4dccf] bg-white text-[#1b1917] resize-none"
                />
              </div>

              {/* Photo / Doodle attachment */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#4a443e] flex items-center justify-between">
                  <span>인증샷 / 사진 첨부 (선택)</span>
                  {postImage && (
                    <button
                      type="button"
                      onClick={() => setPostImage(undefined)}
                      className="text-red-500 text-[11px] hover:underline"
                    >
                      사진 삭제
                    </button>
                  )}
                </label>

                {postImage ? (
                  <img
                    src={postImage}
                    alt="첨부 사진"
                    className="max-h-40 mx-auto rounded-xl object-contain border border-[#e4dccf] bg-white"
                  />
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-[#e4dccf] bg-[#faf8f5] hover:bg-[#f6f1e7] cursor-pointer text-xs font-jua text-[#8a8178]">
                    <Camera className="w-4 h-4 text-[#c9502f]" />
                    사진 / 인증샷 파일 올리기
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#4a443e] block mb-1">
                    수정/삭제 비밀번호 (4자리) <span className="text-red-500 font-bold">*필수 입력</span>
                  </label>
                  <input
                    type="password"
                    value={postPassword}
                    onChange={(e) => setPostPassword(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={4}
                    required
                    placeholder="숫자 4자리 직접 입력"
                    className="w-full px-3 py-2 text-xs rounded-xl border-2 border-[#e4dccf] bg-white text-[#1b1917] font-mono tracking-widest text-center outline-none focus:border-[#c9502f]"
                  />
                  <p className="text-[10px] text-[#8a8178] font-body mt-0.5">
                    비밀번호를 입력해야 글이 등록됩니다.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#4a443e] block mb-1">태그</label>
                  <input
                    type="text"
                    value={postTags}
                    onChange={(e) => setPostTags(e.target.value)}
                    placeholder="5살한글, 사자소리"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#e4dccf] bg-white text-[#1b1917]"
                  />
                </div>
              </div>

              {writeFormError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 font-jua text-xs text-center">
                  ⚠️ {writeFormError}
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setWriteModalOpen(false)}
                  className="w-1/3 min-h-[44px] py-2.5 rounded-xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-sm"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm shadow-md active:scale-95 transition-all"
                >
                  게시글 올리기 🎉
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-md box-border overflow-hidden flex flex-col max-h-[92vh] shadow-2xl p-4 sm:p-6 text-left space-y-3.5 animate-pop relative">
            <button
              onClick={() => setEditingPost(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178]"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-jua text-lg text-[#1b1917]">글 수정하기</h3>

            <div className="space-y-2.5 overflow-y-auto overflow-x-hidden flex-1 box-border">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="제목"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#e4dccf] bg-white"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#e4dccf] bg-white resize-none"
              />

              {/* Photo Edit & Replacement controls */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs text-[#8a8178] block font-jua">첨부 사진 / 그림 관리</label>
                {editImage ? (
                  <div className="relative inline-block border border-[#e4dccf] rounded-2xl overflow-hidden bg-white p-1">
                    <img
                      src={editImage}
                      alt="수정 첨부 이미지"
                      className="w-32 h-24 object-contain rounded-xl bg-[#faf8f5]"
                    />
                    <button
                      type="button"
                      onClick={() => setEditImage(undefined)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-sm"
                      title="사진 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#8a8178] font-hand">현재 첨부된 사진이 없습니다.</p>
                )}
                
                <div className="pt-1">
                  <label className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl border border-[#e4dccf] bg-white text-xs font-jua text-[#4a443e] cursor-pointer hover:bg-[#faf8f5] shadow-2xs">
                    <ImageIcon className="w-3.5 h-3.5 text-[#c9502f]" />
                    {editImage ? '다른 사진으로 변경' : '새 사진 추가'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditPhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {!isAdmin && (
                <div>
                  <label className="text-xs text-[#8a8178] block mb-1">비밀번호 4자리</label>
                  <input
                    type="password"
                    value={editPasswordInput}
                    onChange={(e) => {
                      setEditPasswordInput(e.target.value);
                      setEditFormError(null);
                    }}
                    maxLength={4}
                    placeholder="비밀번호"
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#e4dccf] bg-white"
                  />
                </div>
              )}

              {editFormError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 font-jua text-xs text-center">
                  ⚠️ {editFormError}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingPost(null)}
                className="w-1/3 min-h-[44px] py-2.5 rounded-xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-xs"
              >
                취소
              </button>
              <button
                onClick={handleConfirmEdit}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-[#c9502f] text-white font-jua text-xs shadow-md active:scale-95 transition-all"
              >
                수정 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Prompt Modal */}
      {deletePromptPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-xs box-border overflow-hidden shadow-2xl p-5 sm:p-6 text-center space-y-3.5 animate-pop relative">
            <h3 className="font-jua text-lg text-[#1b1917] break-keep">
              {isAdmin ? '게시글을 삭제하시겠습니까?' : '게시글 삭제'}
            </h3>
            <p className="text-xs text-[#8a8178] font-hand break-keep">
              {isAdmin ? '삭제한 게시글은 복구할 수 없습니다.' : '작성 시 등록한 비밀번호 4자리를 입력하세요.'}
            </p>

            {!isAdmin && (
              <input
                type="password"
                value={deletePasswordInput}
                onChange={(e) => setDeletePasswordInput(e.target.value)}
                maxLength={4}
                placeholder="비밀번호 4자리"
                className="w-full min-h-[44px] text-center py-2 text-sm rounded-xl border border-[#e4dccf] bg-white"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setDeletePromptPost(null)}
                className="w-1/2 min-h-[44px] py-2 rounded-xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-xs active:scale-95 transition-all"
              >
                {isAdmin ? '아니오' : '취소'}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="w-1/2 min-h-[44px] py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-jua text-xs shadow-md active:scale-95 transition-all"
              >
                {isAdmin ? '예, 삭제' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Comment Deletion Confirmation / PIN Modal */}
      {commentDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-xs box-border overflow-hidden shadow-2xl p-5 sm:p-6 text-center space-y-4 animate-pop relative">
            <button
              onClick={() => setCommentDeleteTarget(null)}
              className="absolute top-4 right-4 text-[#8a8178]"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-3xl">🗑️</div>
            <h3 className="font-jua text-base text-[#1b1917] break-keep">
              {isAdmin ? '댓글을 삭제하시겠습니까?' : '댓글 삭제'}
            </h3>
            <p className="text-xs text-[#8a8178] font-hand break-keep">
              {isAdmin
                ? '삭제한 댓글은 복구할 수 없습니다.'
                : '작성 시 설정한 비밀번호 4자리를 입력해주세요.'}
            </p>

            {!isAdmin && (
              <input
                type="password"
                value={commentDeletePinInput}
                onChange={(e) => {
                  setCommentDeletePinInput(e.target.value);
                  setCommentDeleteError('');
                }}
                maxLength={4}
                placeholder="비밀번호 4자리"
                className="w-full min-h-[44px] text-center py-2 text-sm rounded-xl border border-[#e4dccf] bg-white font-jua"
              />
            )}

            {commentDeleteError && (
              <p className="text-red-500 font-jua text-xs animate-shake">
                ⚠️ {commentDeleteError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setCommentDeleteTarget(null)}
                className="w-1/2 min-h-[44px] py-2 rounded-xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-xs active:scale-95 transition-all"
              >
                {isAdmin ? '아니오' : '취소'}
              </button>
              <button
                onClick={handleConfirmDeleteComment}
                className="w-1/2 min-h-[44px] py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-jua text-xs shadow-md active:scale-95 transition-all"
              >
                {isAdmin ? '예, 삭제' : '삭제 확인'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Lucky Draw Simulator Modal */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-4 border-[#f2c14e] rounded-3xl w-full max-w-md box-border overflow-hidden shadow-2xl p-5 sm:p-6 text-center space-y-4 animate-pop relative">
            <button
              onClick={() => setEventModalOpen(false)}
              className="absolute top-4 right-4 text-[#8a8178]"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-4xl animate-bounce">🎁</div>
            <div>
              <span className="text-xs font-bold text-[#c9502f] font-jua">매월 정기 커뮤니티 이벤트</span>
              <h3 className="text-xl font-jua text-[#1b1917]">
                30일 완주 인증맘 선물 추첨
              </h3>
              <p className="text-xs text-[#8a8178] font-hand mt-1">
                아이의 30일 성장 일기와 사진을 남겨주신 분들께 매월 1일 추첨을 통해 선물을 발송해드립니다!
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#eedfc9] space-y-2 text-xs font-hand text-left">
              <div className="font-bold text-[#1b1917] flex items-center gap-1">
                🏆 이달의 선물:
              </div>
              <p>• 1등 (1명): 최고급 원목 한글 블록 교구 세트 (정가 7만원 상당)</p>
              <p>• 2등 (3명): 5~7세 베스트셀러 창작 그림책 3권 세트</p>
              <p>• 3등 (전원): 30일 완주 공식 모바일 상장 발급</p>
            </div>

            {drawnWinner && (
              <div className="p-3 bg-[#eef6e2] rounded-xl border border-[#cbe5b0] text-xs font-jua text-[#3b6d1e] animate-pop">
                🎉 당첨 시뮬레이션: "{drawnWinner}" 님이 당첨되었습니다!
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => {
                  playSfx('fan');
                  confetti({ particleCount: 40, spread: 70 });
                  const randomPost = posts[Math.floor(Math.random() * posts.length)];
                  setDrawnWinner(randomPost ? `${randomPost.author} 님` : '시우맘 님');
                }}
                className="w-full py-3 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm shadow-md"
              >
                행운의 당첨자 추첨해보기 🎲
              </button>
              <button
                onClick={() => setEventModalOpen(false)}
                className="w-full py-2 text-xs text-[#8a8178] hover:underline font-hand"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
