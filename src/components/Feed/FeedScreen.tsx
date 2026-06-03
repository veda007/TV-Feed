import { useEffect, useRef, useState, useCallback } from 'react';
import type { FeedItem, PreferenceProfile } from '../../data/types';
import { explainScore } from '../../logic/ranking';
import InterstitialQuestion from '../Polls/InterstitialQuestion';
import PostActionFollowUp from '../Polls/PostActionFollowUp';
import type { FollowUpSignal } from '../Polls/PostActionFollowUp';
import { INTERSTITIAL_QUESTIONS } from '../../data/preferenceQuestions';
import type { GenOption, GenQuestion } from '../../data/generalQuestions';
import { GENQ } from '../../data/generalQuestions';
import { tagOpts } from '../../data/tagLabel';
import {
  type PromptSchedulerState,
  createScheduler,
  onCardViewed,
  onPromptShown,
  shouldShowPrompt,
} from '../../logic/promptScheduler';
import DeepDive from './DeepDive';
import GeneralQuestion from '../Polls/GeneralQuestion';

const feedKf = `
@keyframes payoff-fade {
  0%   { opacity: 0; transform: translateX(-50%) translateY(8px); }
  15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
  75%  { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes hint-fade {
  0%, 10% { opacity: 0; }
  20%      { opacity: 1; }
  70%      { opacity: 1; }
  100%     { opacity: 0; }
}
@keyframes overlay-in {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes settings-in {
  from { opacity: 0; transform: translateX(48px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes nav-in {
  from { opacity: 0; transform: translateX(-24px); }
  to   { opacity: 1; transform: translateX(0); }
}
`;

type FeedScreenProps = {
  feed: FeedItem[];
  feedIdx: number;
  profile: PreferenceProfile;
  onNext: (dwellMs?: number) => void;
  onPrev: (dwellMs?: number) => void;
  onThumbsUp: (item: FeedItem, boosts: Record<string, string[]>, label: string) => void;
  onThumbsDown: (item: FeedItem, decays: Record<string, string[]>, label: string, sessionOnly: boolean) => void;
  onContextualYes: (item: FeedItem) => void;
  onPassiveDwell: (item: FeedItem, isRepeat: boolean) => void;
  onSettingsChange: (change: { language?: string; familyFriendly?: boolean }) => void;
  onReset: () => void;
  onGenAnswer: (opt: GenOption) => void;
  onL1Exit: (item: FeedItem, label: string, key: string) => void;
  onInterstitialAnswer: (label: string, boosts: any, confirmationText: string) => void;
  interactionFollowUpsToday: number;
  onOpenDataPanel: () => void;
  toast: (msg: string) => void;
};

type Overlay =
  | 'none'
  | 'thumbs-up'
  | 'thumbs-down-step1'
  | 'thumbs-down-step2'
  | 'contextual'
  | 'settings'
  | 'reset-confirm'
  | 'deep-dive'
  | 'general'
  | 'l1-exit'
  | 'interstitial';

// NAV_ITEMS replaced by NAV_ITEMS_WITH_DATA defined per-component instance

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Spanish'];

export default function FeedScreen({
  feed,
  feedIdx,
  profile,
  onNext,
  onPrev,
  onThumbsUp,
  onThumbsDown,
  onContextualYes,
  onPassiveDwell,
  onSettingsChange,
  onReset,
  onGenAnswer,
  onL1Exit,
  onInterstitialAnswer,
  interactionFollowUpsToday,
  onOpenDataPanel,
  toast,
}: FeedScreenProps) {
  const item = feed[feedIdx];
  const prevItem = useRef<FeedItem | null>(null);

  // Image crossfade
  const [imgA, setImgA] = useState(item?.image || '');
  const [imgB, setImgB] = useState('');
  const [showB, setShowB] = useState(false);

  // UI state
  const [navOpen, setNavOpen] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>('none');
  const [actionsVisible, setActionsVisible] = useState(false);
  const [navFocusIdx, setNavFocusIdx] = useState(0);
  const [pollFocusIdx, setPollFocusIdx] = useState(0);
  const [settingsFocusIdx, setSettingsFocusIdx] = useState(0);

  // Payoff chip
  const [payoffText, setPayoffText] = useState('');
  const [showPayoff, setShowPayoff] = useState(false);
  const payoffTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hint
  const [showHint, setShowHint] = useState(true);
  const hintShown = useRef(false);

  // Dwell timer + skip-speed tracking
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contextualTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardShownAt = useRef<number>(Date.now());
  const deepDiveOpenedAt = useRef<number>(0);
  const [showContextual, setShowContextual] = useState(false);

  // "Why this?" affordance
  const [showWhy, setShowWhy] = useState(false);
  const contextualDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // General question overlay
  const [activeGenQ, setActiveGenQ] = useState<GenQuestion | null>(null);

  // Interstitial question
  const [activeInterstitial, setActiveInterstitial] = useState<typeof INTERSTITIAL_QUESTIONS[0] | null>(null);
  const askedInterstitialIds = useRef<Set<string>>(new Set());
  const cardsViewedRef = useRef(0);

  // Two-step dislike
  const [dislikeStep1Reason, setDislikeStep1Reason] = useState<string | null>(null);

  // L1 exit follow-up (after deep-dive close)
  const [showL1Exit, setShowL1Exit] = useState(false);

  // Data panel nav item
  // Nav rail: Home + Settings only. Signal Log is internal — S key only.
  const NAV_ITEMS_WITH_DATA = [
    { id: 'home', icon: '⌂', label: 'Home' },
    { id: 'settings', icon: '☰', label: 'Settings' },
  ];

  // Prompt scheduler
  const scheduler = useRef<PromptSchedulerState>(createScheduler());

  // Clock
  const [clock, setClock] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  });
  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // Crossfade on item change
  useEffect(() => {
    if (!item) return;
    if (prevItem.current?.image === item.image) return;
    if (!prevItem.current) {
      setImgA(item.image);
      prevItem.current = item;
      return;
    }
    if (showB) {
      setImgA(item.image);
      setShowB(false);
    } else {
      setImgB(item.image);
      setShowB(true);
    }
    prevItem.current = item;
    cardShownAt.current = Date.now(); // reset dwell timer on card change
    setShowWhy(false); // hide "why this?" on card change
  }, [item?.image]);

  // Hint: show once for 5s
  useEffect(() => {
    if (hintShown.current) return;
    hintShown.current = true;
    const t = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Payoff chip helper
  const showPayoffChip = useCallback((text: string) => {
    setPayoffText(text);
    setShowPayoff(true);
    if (payoffTimer.current) clearTimeout(payoffTimer.current);
    payoffTimer.current = setTimeout(() => setShowPayoff(false), 2200);
  }, []);

  // Handle general question answer
  const handleGenAnswer = useCallback((opt: GenOption) => {
    onGenAnswer(opt);
    showPayoffChip(opt.tuned);
    setActiveGenQ(null);
    setOverlay('none');
  }, [onGenAnswer, showPayoffChip]);

  // Dwell tracking + prompt scheduler check
  useEffect(() => {
    if (!item) return;

    // Update scheduler on card change
    scheduler.current = onCardViewed(scheduler.current);
    cardsViewedRef.current += 1;

    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    dwellTimer.current = setTimeout(() => {
      onPassiveDwell(item, false);

      if (overlay !== 'none') return;

      // Gap-targeted interstitial: prefer the question whose gapAxis the profile knows least
      const eligible = INTERSTITIAL_QUESTIONS.filter(q =>
        !askedInterstitialIds.current.has(q.id) &&
        cardsViewedRef.current >= (q.triggerAfterCards || 6)
      );
      // Sort by lowest evidence on gapAxis (gap-targeting per spec §6.B)
      const gapSorted = eligible.sort((a, b) => {
        const evA = a.gapAxis ? (profile.evidenceCounts?.[a.gapAxis] ?? 0) : 0;
        const evB = b.gapAxis ? (profile.evidenceCounts?.[b.gapAxis] ?? 0) : 0;
        return evA - evB; // lowest evidence first
      });
      const nextInterstitial = gapSorted[0] ?? null;
      if (nextInterstitial) {
        askedInterstitialIds.current.add(nextInterstitial.id);
        setActiveInterstitial(nextInterstitial);
        setOverlay('interstitial');
        return;
      }

      // Fall back to GENQ / contextual scheduler
      const decision = shouldShowPrompt(
        scheduler.current,
        !!item.contextualQuestion,
        overlay !== 'none',
      );

      if (decision === null) return;

      if (decision.type === 'gen') {
        const genQ = GENQ.find(q => q.id === decision.genId);
        if (genQ) {
          setActiveGenQ(genQ);
          setOverlay('general');
          scheduler.current = onPromptShown(scheduler.current, decision.genId);
        }
      } else if (decision.type === 'ctx' && item.contextualQuestion) {
        setShowContextual(true);
        scheduler.current = onPromptShown(scheduler.current, undefined);
        if (contextualDismissTimer.current) clearTimeout(contextualDismissTimer.current);
        contextualDismissTimer.current = setTimeout(() => setShowContextual(false), 10000);
      }
    }, 7000);

    return () => {
      if (dwellTimer.current) clearTimeout(dwellTimer.current);
    };
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Legacy contextual question show logic (kept for backward compat, scheduler now drives it)
  useEffect(() => {
    if (!item?.contextualQuestion) return;
    if (contextualTimer.current) clearTimeout(contextualTimer.current);
    contextualTimer.current = setTimeout(() => {
      // Only show if scheduler hasn't already decided to show something
    }, 6000);
    return () => {
      if (contextualTimer.current) clearTimeout(contextualTimer.current);
    };
  }, [item?.id]);

  // Build dynamic poll options from tags
  const positivePollOptions = item ? tagOpts(item.subCategories ?? [], item.category, true) : [];
  const negativePollOptions = item
    ? [
        ...tagOpts(item.subCategories ?? [], item.category, false),
        { label: 'Not now', key: '__not_now__' },
      ]
    : [];

  // Keyboard handler
  useEffect(() => {
    if (!item) return;

    const handler = (e: KeyboardEvent) => {
      const key = e.key;

      // Deep-dive overlay — handled internally by DeepDive component
      if (overlay === 'deep-dive') {
        // DeepDive registers its own keydown handler; only intercept Escape/Back here as fallback
        if (key === 'Escape' || key === 'Backspace') {
          e.preventDefault();
          setOverlay('none');
        }
        return;
      }

      // General question overlay — handled internally by GeneralQuestion component
      if (overlay === 'general') {
        if (key === 'Escape' || key === 'Backspace') {
          e.preventDefault();
          setActiveGenQ(null);
          setOverlay('none');
        }
        return;
      }

      // Handle thumbs-up / thumbs-down poll overlays
      if (overlay === 'thumbs-up') {
        const opts = positivePollOptions;
        if (key === 'ArrowUp') { e.preventDefault(); setPollFocusIdx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown') { e.preventDefault(); setPollFocusIdx(i => Math.min(opts.length - 1, i + 1)); return; }
        if (key === 'Enter' || key === ' ') {
          e.preventDefault();
          const opt = opts[pollFocusIdx];
          if (overlay === 'thumbs-up') {
            onThumbsUp(item, { subCategories: opt.key ? [opt.key] : [], vibes: [], categories: [] }, opt.label);
            showPayoffChip(`✦ More ${opt.label.replace('More ', '')} coming up`);
          } else {
            // "Not now" sentinel key or empty key → sessionOnly = true
            const isNotNow = opt.key === '__not_now__';
            const isLessLikeThis = opt.key === '';
            const sessionOnly = isNotNow || isLessLikeThis;
            if (isNotNow) {
              onThumbsDown(item, {}, 'Not now', true);
            } else {
              onThumbsDown(
                item,
                { subCategories: opt.key ? [opt.key] : [], categories: [] },
                opt.label,
                sessionOnly,
              );
            }
            showPayoffChip('✦ Showing less like this.');
          }
          setOverlay('none');
          return;
        }
        if (key === 'Escape' || key === 'Backspace') { e.preventDefault(); setOverlay('none'); return; }
        return;
      }

      if (overlay === 'contextual') {
        if (key === 'ArrowLeft') { e.preventDefault(); setPollFocusIdx(0); return; }
        if (key === 'ArrowRight') { e.preventDefault(); setPollFocusIdx(1); return; }
        if (key === 'Enter') {
          e.preventDefault();
          if (pollFocusIdx === 0) {
            onContextualYes(item);
            setShowContextual(false);
          } else {
            setShowContextual(false);
          }
          setOverlay('none');
          return;
        }
        if (key === 'Escape' || key === 'Backspace') { e.preventDefault(); setOverlay('none'); setShowContextual(false); return; }
        return;
      }

      if (overlay === 'reset-confirm') {
        if (key === 'ArrowLeft') { e.preventDefault(); setPollFocusIdx(0); return; }
        if (key === 'ArrowRight') { e.preventDefault(); setPollFocusIdx(1); return; }
        if (key === 'Enter') {
          e.preventDefault();
          if (pollFocusIdx === 0) { onReset(); }
          setOverlay('none');
          return;
        }
        if (key === 'Escape' || key === 'Backspace') { e.preventDefault(); setOverlay('none'); return; }
        return;
      }

      if (overlay === 'settings') {
        const settingsItems = ['lang-English', 'lang-Hindi', 'lang-Tamil', 'lang-Telugu', 'lang-Spanish', 'family', 'reset'];
        if (key === 'ArrowUp') { e.preventDefault(); setSettingsFocusIdx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown') { e.preventDefault(); setSettingsFocusIdx(i => Math.min(settingsItems.length - 1, i + 1)); return; }
        if (key === 'Enter' || key === ' ') {
          e.preventDefault();
          const sel = settingsItems[settingsFocusIdx];
          if (sel.startsWith('lang-')) {
            const lang = sel.replace('lang-', '');
            onSettingsChange({ language: lang });
            toast(`${lang} feed is on`);
          } else if (sel === 'family') {
            onSettingsChange({ familyFriendly: !profile.familyFriendly });
            toast(profile.familyFriendly ? 'Family-friendly mode is off' : 'Family-friendly mode is on');
          } else if (sel === 'reset') {
            setOverlay('reset-confirm');
            setPollFocusIdx(1);
          }
          return;
        }
        if (key === 'Escape' || key === 'Backspace') { e.preventDefault(); setOverlay('none'); return; }
        if (key === 'ArrowLeft') { e.preventDefault(); setOverlay('none'); return; }
        return;
      }

      // Nav rail open
      if (navOpen) {
        if (key === 'ArrowUp') { e.preventDefault(); setNavFocusIdx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown') { e.preventDefault(); setNavFocusIdx(i => Math.min(NAV_ITEMS_WITH_DATA.length - 1, i + 1)); return; } // 2 items: Home, Settings
        if (key === 'Enter' || key === ' ') {
          e.preventDefault();
          const nav = NAV_ITEMS_WITH_DATA[navFocusIdx];
          if (nav.id === 'settings') { setOverlay('settings'); setSettingsFocusIdx(0); setNavOpen(false); }
          else if (nav.id === 'data') { onOpenDataPanel(); setNavOpen(false); }
          else { setNavOpen(false); }
          return;
        }
        if (key === 'ArrowLeft' || key === 'Escape' || key === 'Backspace') {
          e.preventDefault(); setNavOpen(false); return;
        }
        if (key === 'ArrowRight') { e.preventDefault(); setNavOpen(false); return; }
        return;
      }

      // Actions panel open
      if (actionsVisible) {
        if (key === 'ArrowUp') { e.preventDefault(); setPollFocusIdx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown') { e.preventDefault(); setPollFocusIdx(i => Math.min(2, i + 1)); return; }
        if (key === 'Enter' || key === ' ') {
          e.preventDefault();
          if (pollFocusIdx === 0) { /* like = silent positive — no poll */ onThumbsUp(item, { categories: [item.category], subCategories: item.subCategories.slice(0,2) } as any, 'like'); showPayoffChip('✦ More like this coming up.'); setActionsVisible(false); }
          else if (pollFocusIdx === 1) { setOverlay('thumbs-down-step1'); setPollFocusIdx(0); setDislikeStep1Reason(null); }
          else { toast('✦ Saved for later'); }
          setActionsVisible(false);
          return;
        }
        if (key === 'ArrowLeft' || key === 'Escape' || key === 'Backspace') {
          e.preventDefault(); setActionsVisible(false); return;
        }
        return;
      }

      // Default navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Backspace', ' '].includes(key)) {
        e.preventDefault();
      }

      if (key === 'ArrowUp') { onPrev(Date.now() - cardShownAt.current); setShowContextual(false); setShowWhy(false); }
      if (key === 'ArrowDown') { onNext(Date.now() - cardShownAt.current); setShowContextual(false); setShowWhy(false); }
      if (key === 'ArrowLeft') { setNavOpen(true); setNavFocusIdx(0); }
      if (key === 'ArrowRight') { setActionsVisible(true); setPollFocusIdx(0); }
      if (key === 'Enter' || key === ' ') {
        // CTA click = strong positive + open L1
        onThumbsUp(item, { categories: [item.category], subCategories: item.subCategories.slice(0, 2) } as any, 'cta_click');
        deepDiveOpenedAt.current = Date.now();
        setOverlay('deep-dive');
      }
      if (key === 'Escape' || key === 'Backspace') { toast('↑↓ to browse · ← for menu'); }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    item,
    overlay,
    navOpen,
    actionsVisible,
    pollFocusIdx,
    navFocusIdx,
    settingsFocusIdx,
    positivePollOptions,
    negativePollOptions,
    onNext,
    onPrev,
    onThumbsUp,
    onThumbsDown,
    onContextualYes,
    onReset,
    onSettingsChange,
    toast,
    profile.familyFriendly,
    showPayoffChip,
  ]);

  if (!item) {
    return (
      <div style={{ width: 1920, height: 1080, background: '#010101', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#A786E5', fontSize: 32 }}>Loading feed…</div>
      </div>
    );
  }

  const prevImg = showB ? imgA : imgB;

  // Pager dots
  const totalDots = Math.min(feed.length, 8);
  const dotOffset = Math.max(0, Math.min(feedIdx - 3, feed.length - totalDots));

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden', background: '#010101' }}>
      <style>{feedKf}</style>

      {/* Background images — crossfade */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${prevImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'opacity 0.7s ease',
          opacity: showB ? 0 : 1,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${imgB})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'opacity 0.7s ease',
          opacity: showB ? 1 : 0,
        }} />
      </div>

      {/* Dark gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(1,1,1,0.92) 0%, rgba(1,1,1,0.55) 35%, rgba(1,1,1,0.25) 60%, rgba(1,1,1,0.45) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Top-left: Glance logo + weather */}
      <div style={{
        position: 'absolute', top: 48, left: 56,
        display: 'flex', flexDirection: 'column', gap: 6, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 28,
            background: 'linear-gradient(135deg, #A786E5, #7047E2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
          }}>✦</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#F5F3F7', letterSpacing: 0.3 }}>Glance AI</span>
        </div>
        <div style={{ fontSize: 16, color: 'rgba(245,243,247,0.65)', letterSpacing: 0.2, paddingLeft: 2 }}>
          ☁ 24° · Mon, 2 Jun
        </div>
      </div>

      {/* Top-right: clock */}
      <div style={{
        position: 'absolute', top: 48, right: 56,
        fontSize: 52,
        fontWeight: 200,
        color: 'rgba(245,243,247,0.9)',
        letterSpacing: -1,
        zIndex: 10,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {clock}
      </div>

      {/* Nav rail — left */}
      {navOpen && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 260,
          background: 'rgba(5,3,14,0.88)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(112,71,226,0.25)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 8,
          padding: '0 24px',
          zIndex: 30,
          animation: 'nav-in 0.2s ease',
        }}>
          {NAV_ITEMS_WITH_DATA.map((nav, i) => (
            <div
              key={nav.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '18px 20px',
                borderRadius: 16,
                background: navFocusIdx === i ? 'rgba(112,71,226,0.22)' : 'transparent',
                border: navFocusIdx === i ? '1.5px solid rgba(112,71,226,0.5)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onClick={() => {
                setNavFocusIdx(i);
                if (nav.id === 'tune') { toast('Coming soon'); setNavOpen(false); }
                else if (nav.id === 'settings') { setOverlay('settings'); setSettingsFocusIdx(0); setNavOpen(false); }
                else if (nav.id === 'data') { onOpenDataPanel(); setNavOpen(false); }
                else { setNavOpen(false); }
              }}
            >
              <span style={{ fontSize: 24, color: '#A786E5', position: 'relative' }}>
                {nav.icon}
              </span>
              <span style={{ fontSize: 20, color: '#F5F3F7', fontWeight: navFocusIdx === i ? 700 : 400 }}>{nav.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pager dots — right edge */}
      <div style={{
        position: 'absolute',
        right: 28,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 10,
      }}>
        {Array.from({ length: totalDots }).map((_, i) => {
          const realIdx = i + dotOffset;
          const isCurrent = realIdx === feedIdx;
          return (
            <div
              key={i}
              style={{
                width: isCurrent ? 6 : 4,
                height: isCurrent ? 24 : 12,
                borderRadius: 4,
                background: isCurrent ? '#A786E5' : 'rgba(245,243,247,0.35)',
                transition: 'all 0.25s',
              }}
            />
          );
        })}
      </div>

      {/* Bottom-left: content metadata */}
      <div style={{
        position: 'absolute',
        bottom: 72,
        left: 80,
        zIndex: 10,
        maxWidth: 780,
      }}>
        {item.locationLabel && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(112,71,226,0.3)',
            border: '1px solid rgba(112,71,226,0.4)',
            borderRadius: 24,
            padding: '6px 16px',
            fontSize: 16,
            color: '#F5F3F7',
            marginBottom: 16,
            letterSpacing: 0.5,
          }}>
            📍 {item.locationLabel}
          </div>
        )}
        {/* Eyebrow */}
        <div style={{
          fontSize: 16,
          fontWeight: 600,
          color: '#A786E5',
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          {item.category}
        </div>
        {/* Title */}
        <h1 style={{
          fontSize: 56,
          fontWeight: 800,
          color: '#F5F3F7',
          margin: '0 0 14px',
          lineHeight: 1.05,
          letterSpacing: -0.5,
          fontFamily: '"Playfair Display", "Georgia", serif',
          textShadow: '0 2px 16px rgba(0,0,0,0.6)',
        }}>
          {item.title}
        </h1>
        {/* Subtitle */}
        <p style={{
          fontSize: 22,
          color: 'rgba(245,243,247,0.75)',
          margin: '0 0 28px',
          lineHeight: 1.45,
          maxWidth: 640,
        }}>
          {item.subtitle}
        </p>
        {/* CTA row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            tabIndex={-1}
            onClick={() => { onThumbsUp(item, { categories: [item.category], subCategories: item.subCategories.slice(0,2) } as any, 'cta_click'); deepDiveOpenedAt.current = Date.now(); setOverlay('deep-dive'); }}
            style={{
              padding: '16px 40px', fontSize: 20, fontWeight: 700,
              background: 'linear-gradient(135deg, #7047E2 0%, #A786E5 100%)',
              color: '#fff', border: 'none', borderRadius: 48, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(112,71,226,0.45)', letterSpacing: 0.3,
            }}
          >
            {item.ctaLabel}
          </button>
          {/* Why this? toggle */}
          <button
            tabIndex={-1}
            onClick={() => setShowWhy(w => !w)}
            style={{
              padding: '10px 18px', fontSize: 14, fontWeight: 600,
              background: showWhy ? 'rgba(167,134,229,0.25)' : 'rgba(255,255,255,0.08)',
              color: showWhy ? '#A786E5' : 'rgba(245,243,247,0.55)',
              border: '1px solid rgba(167,134,229,0.2)', borderRadius: 999, cursor: 'pointer',
              transition: 'all 0.15s', backdropFilter: 'blur(6px)',
            }}
          >
            Why this?
          </button>
        </div>

        {/* Why this? explanation panel — human labels only, no raw scores */}
        {showWhy && (() => {
          const reasons = explainScore(item, profile);
          const positives = reasons.filter(r => r.contribution > 0);
          return (
            <div style={{
              marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8,
              animation: 'overlay-in 0.3s ease forwards',
            }}>
              {positives.length === 0 && (
                <span style={{ fontSize: 14, color: 'rgba(245,243,247,0.4)' }}>Still learning your taste — keep watching.</span>
              )}
              {positives.length > 0 && (
                <div style={{ fontSize: 14, color: 'rgba(245,243,247,0.55)', marginBottom: 4 }}>
                  Because you seem into:
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {positives.map(r => (
                  <span key={r.label} style={{
                    padding: '6px 14px', borderRadius: 999, fontSize: 14, fontWeight: 600,
                    background: 'rgba(112,71,226,0.22)',
                    color: '#A786E5',
                    border: '1px solid rgba(167,134,229,0.28)',
                    backdropFilter: 'blur(4px)',
                  }}>
                    {r.label}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Bottom-right: action buttons */}
      <div style={{
        position: 'absolute',
        bottom: 80,
        right: 72,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        zIndex: 10,
        opacity: actionsVisible ? 1 : 0.4,
        transition: 'opacity 0.2s',
      }}>
        {[
          { icon: '👍', label: 'Like', action: () => { onThumbsUp(item, { categories: [item.category], subCategories: item.subCategories.slice(0,2) } as any, 'like'); showPayoffChip('✦ More like this coming up.'); setActionsVisible(false); }, focused: pollFocusIdx === 0 && actionsVisible },
          { icon: '👎', label: 'Not for me', action: () => { setOverlay('thumbs-down-step1'); setPollFocusIdx(0); setDislikeStep1Reason(null); setActionsVisible(false); }, focused: pollFocusIdx === 1 && actionsVisible },
          { icon: '🔖', label: 'Save', action: () => toast('✦ Saved for later'), focused: pollFocusIdx === 2 && actionsVisible },
        ].map((btn) => (
          <button
            key={btn.label}
            tabIndex={-1}
            onClick={() => { setActionsVisible(true); btn.action(); }}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: btn.focused ? 'rgba(112,71,226,0.5)' : 'rgba(10,6,22,0.65)',
              border: btn.focused ? '2px solid #A786E5' : '1px solid rgba(167,134,229,0.3)',
              backdropFilter: 'blur(12px)',
              fontSize: 26,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s, border 0.15s',
            }}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* First-time hint */}
      {showHint && (
        <div style={{
          position: 'absolute',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 18,
          color: 'rgba(245,243,247,0.7)',
          background: 'rgba(10,6,22,0.75)',
          border: '1px solid rgba(112,71,226,0.25)',
          borderRadius: 32,
          padding: '10px 28px',
          letterSpacing: 0.3,
          zIndex: 10,
          animation: 'hint-fade 5s ease forwards',
          whiteSpace: 'nowrap',
        }}>
          Press OK for details · Up/Down to browse · Right for actions
        </div>
      )}

      {/* Payoff chip */}
      {showPayoff && (
        <div style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          zIndex: 20,
          background: 'rgba(112,71,226,0.88)',
          color: '#F5F3F7',
          fontSize: 20,
          fontWeight: 600,
          padding: '12px 30px',
          borderRadius: 40,
          letterSpacing: 0.2,
          whiteSpace: 'nowrap',
          animation: 'payoff-fade 2.2s ease forwards',
        }}>
          {payoffText}
        </div>
      )}

      {/* Contextual question overlay */}
      {showContextual && overlay === 'none' && (
        <div style={{
          position: 'absolute',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(18,12,36,0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(112,71,226,0.4)',
          borderRadius: 24,
          padding: '28px 40px',
          zIndex: 25,
          textAlign: 'center',
          animation: 'overlay-in 0.3s ease',
          minWidth: 560,
        }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#F5F3F7', marginBottom: 20 }}>
            {item.contextualQuestion}
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button
              tabIndex={-1}
              onClick={() => { onContextualYes(item); setShowContextual(false); setOverlay('none'); }}
              style={{
                padding: '14px 40px',
                fontSize: 20,
                fontWeight: 700,
                background: pollFocusIdx === 0 ? 'linear-gradient(135deg, #7047E2, #A786E5)' : 'rgba(112,71,226,0.2)',
                color: '#fff',
                border: pollFocusIdx === 0 ? 'none' : '1px solid rgba(112,71,226,0.4)',
                borderRadius: 40,
                cursor: 'pointer',
              }}
            >
              {item.contextualTopic ? `Yes, more ${item.contextualTopic}` : 'Yes, more like this'}
            </button>
            <button
              tabIndex={-1}
              onClick={() => setShowContextual(false)}
              style={{
                padding: '14px 40px',
                fontSize: 20,
                fontWeight: 500,
                background: 'transparent',
                color: 'rgba(167,134,229,0.8)',
                border: '1px solid rgba(167,134,229,0.3)',
                borderRadius: 40,
                cursor: 'pointer',
              }}
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {/* Thumbs-up overlay */}
      {overlay === 'thumbs-up' && (
        <div style={{
          position: 'absolute',
          bottom: 80,
          right: 80,
          background: 'rgba(18,12,36,0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(112,71,226,0.4)',
          borderRadius: 24,
          padding: '28px 32px',
          zIndex: 40,
          minWidth: 360,
          animation: 'overlay-in 0.25s ease',
        }}>
          <div style={{ fontSize: 18, color: '#A786E5', fontWeight: 600, marginBottom: 16, letterSpacing: 0.5 }}>
            What do you love about this?
          </div>
          {positivePollOptions.map((opt, i) => (
            <div
              key={opt.key || opt.label}
              onClick={() => {
                onThumbsUp(item, { subCategories: opt.key ? [opt.key] : [], vibes: [], categories: [] }, opt.label);
                showPayoffChip(`✦ More ${opt.label.replace('More ', '')} coming up`);
                setOverlay('none');
              }}
              style={{
                padding: '14px 20px',
                borderRadius: 14,
                background: pollFocusIdx === i ? 'rgba(112,71,226,0.3)' : 'rgba(255,255,255,0.05)',
                border: pollFocusIdx === i ? '1.5px solid rgba(112,71,226,0.6)' : '1px solid rgba(255,255,255,0.08)',
                marginBottom: 8,
                fontSize: 18,
                color: '#F5F3F7',
                cursor: 'pointer',
                fontWeight: pollFocusIdx === i ? 600 : 400,
              }}
            >
              {opt.label}
            </div>
          ))}
          <div
            onClick={() => setOverlay('none')}
            style={{ textAlign: 'center', fontSize: 16, color: 'rgba(167,134,229,0.6)', cursor: 'pointer', marginTop: 8 }}
          >
            Cancel
          </div>
        </div>
      )}

      {/* Thumbs-down is now handled by PostActionFollowUp two-step flow below */}

      {/* Settings panel */}
      {overlay === 'settings' && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 440,
          background: 'rgba(8,5,20,0.96)',
          backdropFilter: 'blur(28px)',
          borderLeft: '1px solid rgba(112,71,226,0.3)',
          display: 'flex',
          flexDirection: 'column',
          padding: '56px 36px',
          zIndex: 40,
          animation: 'settings-in 0.25s ease',
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#F5F3F7', marginBottom: 32 }}>
            Manage my feed
          </div>

          {/* Language */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 16, color: '#A786E5', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>
              Language
            </div>
            {LANGUAGES.map((lang, i) => {
              const isFocused = settingsFocusIdx === i;
              const isActive = profile.language === lang;
              return (
                <div
                  key={lang}
                  onClick={() => { onSettingsChange({ language: lang }); toast(`${lang} feed is on`); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: 14,
                    background: isFocused ? 'rgba(112,71,226,0.2)' : 'transparent',
                    border: isFocused ? '1.5px solid rgba(112,71,226,0.5)' : '1px solid transparent',
                    marginBottom: 6,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 20, color: '#F5F3F7', fontWeight: isActive ? 700 : 400 }}>{lang}</span>
                  {isActive && <span style={{ color: '#A786E5', fontSize: 18 }}>✓</span>}
                </div>
              );
            })}
          </div>

          {/* Family friendly */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 16, color: '#A786E5', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>
              Content
            </div>
            <div
              onClick={() => { onSettingsChange({ familyFriendly: !profile.familyFriendly }); toast(profile.familyFriendly ? 'Family-friendly mode is off' : 'Family-friendly mode is on'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 18px',
                borderRadius: 14,
                background: settingsFocusIdx === 5 ? 'rgba(112,71,226,0.2)' : 'transparent',
                border: settingsFocusIdx === 5 ? '1.5px solid rgba(112,71,226,0.5)' : '1px solid rgba(255,255,255,0.07)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20, color: '#F5F3F7' }}>Family-friendly mode</span>
              <div style={{
                width: 48, height: 28, borderRadius: 14,
                background: profile.familyFriendly ? '#7047E2' : 'rgba(255,255,255,0.15)',
                position: 'relative',
                transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 4,
                  left: profile.familyFriendly ? 24 : 4,
                  width: 20, height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                }} />
              </div>
            </div>
          </div>

          {/* Reset */}
          <div
            onClick={() => { setOverlay('reset-confirm'); setPollFocusIdx(1); }}
            style={{
              padding: '16px 18px',
              borderRadius: 14,
              background: settingsFocusIdx === 6 ? 'rgba(200,50,50,0.15)' : 'transparent',
              border: settingsFocusIdx === 6 ? '1.5px solid rgba(200,80,80,0.5)' : '1px solid rgba(255,255,255,0.07)',
              cursor: 'pointer',
              marginTop: 'auto',
            }}
          >
            <span style={{ fontSize: 20, color: '#f87171' }}>Start fresh</span>
          </div>

          {/* Close hint */}
          <div style={{ fontSize: 14, color: 'rgba(167,134,229,0.4)', marginTop: 24, textAlign: 'center' }}>
            Press Back to close
          </div>
        </div>
      )}

      {/* Reset confirm dialog */}
      {overlay === 'reset-confirm' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(1,1,1,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}>
          <div style={{
            background: 'rgba(18,12,36,0.98)',
            border: '1px solid rgba(112,71,226,0.4)',
            borderRadius: 24,
            padding: '48px 56px',
            textAlign: 'center',
            maxWidth: 560,
            animation: 'overlay-in 0.25s ease',
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#F5F3F7', marginBottom: 16 }}>Reset your feed?</div>
            <div style={{ fontSize: 18, color: 'rgba(245,243,247,0.65)', marginBottom: 36, lineHeight: 1.5 }}>
              This clears what Glance has learned and starts fresh. Your feed will return to basics until Glance learns your taste again.
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                tabIndex={-1}
                onClick={() => { onReset(); setOverlay('none'); }}
                style={{
                  padding: '16px 40px',
                  fontSize: 20,
                  fontWeight: 700,
                  background: pollFocusIdx === 0 ? '#c04040' : 'rgba(200,50,50,0.2)',
                  color: '#fff',
                  border: pollFocusIdx === 0 ? 'none' : '1px solid rgba(200,80,80,0.4)',
                  borderRadius: 40,
                  cursor: 'pointer',
                }}
              >
                Yes, start fresh
              </button>
              <button
                tabIndex={-1}
                onClick={() => setOverlay('none')}
                style={{
                  padding: '16px 40px',
                  fontSize: 20,
                  fontWeight: 600,
                  background: pollFocusIdx === 1 ? 'rgba(112,71,226,0.3)' : 'transparent',
                  color: '#F5F3F7',
                  border: pollFocusIdx === 1 ? '1.5px solid rgba(112,71,226,0.6)' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 40,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DeepDive overlay */}
      {overlay === 'deep-dive' && (
        <DeepDive
          item={item}
          onClose={() => {
            setOverlay('none');
            const dwellMs = Date.now() - deepDiveOpenedAt.current;
            // Show follow-up if user spent ≥1.5s inside (not an accidental tap)
            // and the session cap of 1 hasn't been used yet
            if (dwellMs >= 1500 && interactionFollowUpsToday < 1) {
              setTimeout(() => setShowL1Exit(true), 350);
            }
          }}
          onSave={() => toast('✦ Saved for later')}
        />
      )}

      {/* L1 exit follow-up */}
      {showL1Exit && (
        <PostActionFollowUp
          mode="l1-exit"
          item={item}
          backgroundImage={item.image}
          onAnswer={(sig: FollowUpSignal) => {
            setShowL1Exit(false);
            if (sig.key === '__yes_more__') {
              // Broad "yes" — positive boost on item's primary cat + sub tags
              onL1Exit(item, 'Yes — more like this', item.category);
              showPayoffChip('✦ More like this coming up.');
            } else if (sig.key === '__not_really__') {
              // Soft decaying negative on dominant tag only — NOT a hard filter
              onThumbsDown(item, { categories: [item.category] } as any, 'Not really', false);
              showPayoffChip('✦ Got it — adjusting the feed.');
            } else if (sig.key) {
              // Specific "More [X]" direction selected
              onL1Exit(item, sig.label, sig.key);
              showPayoffChip(`✦ ${sig.label} coming up.`);
            }
          }}
          onDismiss={() => setShowL1Exit(false)}
        />
      )}

      {/* Two-step thumbs-down */}
      {overlay === 'thumbs-down-step1' && (
        <PostActionFollowUp
          mode="thumbs-down-step1"
          item={item}
          backgroundImage={item.image}
          onAnswer={(sig: FollowUpSignal) => {
            if (sig.key === 'not-now') {
              // No durable signal, no step 2
              setOverlay('none');
              return;
            }
            // Apply step 1 signal
            const decays = sig.key === 'not-topic' ? { categories: [item.category] } : sig.key === 'wrong-vibe' || sig.key === 'too-busy' ? { vibes: item.vibes.slice(0, 2) } : {};
            onThumbsDown(item, decays as any, sig.label, sig.key === 'repetitive');
            setDislikeStep1Reason(sig.key);
            // Advance to step 2 for named reasons
            if (sig.key !== 'not-now') setOverlay('thumbs-down-step2');
            else setOverlay('none');
          }}
          onDismiss={() => setOverlay('none')}
        />
      )}
      {overlay === 'thumbs-down-step2' && (
        <PostActionFollowUp
          mode="thumbs-down-step2"
          item={item}
          backgroundImage={item.image}
          step1Reason={dislikeStep1Reason || undefined}
          onAnswer={(sig: FollowUpSignal) => {
            setOverlay('none');
            if (!sig.sessionOnly && sig.key && sig.key !== 'explore') {
              onThumbsUp(item, { categories: [sig.key] } as any, `Prefers: ${sig.label}`);
            }
            toast('✦ Got it — adjusting the feed.');
          }}
          onDismiss={() => setOverlay('none')}
        />
      )}

      {/* Interstitial question */}
      {overlay === 'interstitial' && activeInterstitial && (
        <InterstitialQuestion
          question={activeInterstitial}
          backgroundImage={item.image}
          onAnswer={(opt) => {
            setOverlay('none');
            setActiveInterstitial(null);
            onInterstitialAnswer(opt.label, opt.boosts, opt.confirmationText);
          }}
          onDismiss={() => { setOverlay('none'); setActiveInterstitial(null); }}
        />
      )}

      {/* General question overlay */}
      {overlay === 'general' && activeGenQ && (
        <GeneralQuestion
          question={activeGenQ}
          backgroundImage={item.image}
          onAnswer={handleGenAnswer}
          onDismiss={() => { setActiveGenQ(null); setOverlay('none'); }}
        />
      )}
    </div>
  );
}
