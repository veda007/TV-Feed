import { useEffect, useRef, useState } from 'react';
import Mascot, { TypedLine } from '../Shared/Mascot';

const RING_DELAY_DEFAULT = 45000;  // 45s before any selection
const RING_DELAY_ENGAGED = 10000;  // 10s once ≥1 tile selected
const RING_CIRCUMFERENCE = 2 * Math.PI * 28;

export interface WorldOption {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  visibleInitially: boolean;
}

export const WORLD_OPTIONS: WorldOption[] = [
  { id: 'food-finds',        title: 'Food finds',        subtitle: 'Local spots, street food, ideas to try',    image: '/images/q2/q2-food-finds.jpg',        visibleInitially: true },
  { id: 'style-ideas',       title: 'Style ideas',       subtitle: 'Outfits, looks, things to wear',             image: '/images/q2/q2-style-ideas.jpg',       visibleInitially: true },
  { id: 'weekend-escapes',   title: 'Weekend escapes',   subtitle: 'Short trips, views, places to discover',     image: '/images/q2/q2-weekend-escapes.jpg',   visibleInitially: true },
  { id: 'calm-routines',     title: 'Calm routines',     subtitle: 'Wellness, mornings, ways to unwind',          image: '/images/q2/q2-calm-routines.jpg',     visibleInitially: true },
  { id: 'home-upgrades',     title: 'Home upgrades',     subtitle: 'Spaces, corners, small improvements',         image: '/images/q2/q2-home-upgrades.jpg',     visibleInitially: false },
  { id: 'local-discoveries', title: 'Local discoveries', subtitle: 'Culture, places, things happening nearby',   image: '/images/q2/q2-local-discoveries.jpg', visibleInitially: false },
  { id: 'game-day-sport',    title: 'Game-day & sport',  subtitle: 'Matches, fans, the thrill of the game',       image: '/images/q2/q2-game-day-sport.jpg',    visibleInitially: false },
  { id: 'tech-gadgets',      title: 'Tech & gadgets',    subtitle: "New gear, smart things, what's next",         image: '/images/q2/q2-tech-gadgets.jpg',      visibleInitially: false },
];

const FIRST_4 = WORLD_OPTIONS.slice(0, 4);
const SECOND_4 = WORLD_OPTIONS.slice(4, 8);

function buildPayoff(selected: string[]): string {
  const titles = selected.map(id => WORLD_OPTIONS.find(w => w.id === id)?.title).filter(Boolean);
  if (titles.length === 0) return '';
  if (titles.length === 1) return `Love it — ${titles[0]}. I'll weave that in.`;
  const last = titles[titles.length - 1];
  const rest = titles.slice(0, -1).join(', ');
  return `Love it — ${rest} and ${last}. I'll weave those in.`;
}

type Props = {
  onNext: (selectedIds: string[]) => void;
  onSkip: () => void;
};

export default function WorldsQuestion({ onNext, onSkip }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  // 'first' = showing tiles 1-4 | 'second' = showing tiles 5-8 | 'transitioning' = crossfade
  const [page, setPage] = useState<'first' | 'transitioning' | 'second'>('first');
  const [focusIdx, setFocusIdx] = useState(0);
  const [focusCta, setFocusCta] = useState<'none' | 'see-more' | 'continue' | 'skip'>('none');
  const [ringProgress, setRingProgress] = useState(0);
  const [payoff, setPayoff] = useState('');
  const [payoffVisible, setPayoffVisible] = useState(false);
  const [visible, setVisible] = useState(false);
  const ringRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringStart = useRef<number | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const currentTiles = page === 'second' ? SECOND_4 : FIRST_4;
  const revealed = page !== 'first';
  const allFirstSelected = FIRST_4.every(w => selected.includes(w.id));

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Ring timer — restarts with shorter duration once user picks something
  const startRing = (delay: number) => {
    if (ringRef.current) clearInterval(ringRef.current);
    ringStart.current = Date.now();
    setRingProgress(0);
    ringRef.current = setInterval(() => {
      const elapsed = Date.now() - (ringStart.current || Date.now());
      const progress = Math.min(elapsed / delay, 1);
      setRingProgress(progress);
      if (progress >= 1) {
        clearInterval(ringRef.current!);
        doReveal(false);
      }
    }, 80);
  };

  // Start default 45s ring on mount
  useEffect(() => {
    if (page !== 'first') return;
    startRing(RING_DELAY_DEFAULT);
    return () => { if (ringRef.current) clearInterval(ringRef.current); };
  }, []);

  // When first selection made, restart ring at 10s (if still on first page)
  const prevSelectedLen = useRef(0);
  useEffect(() => {
    if (page !== 'first') return;
    if (selected.length === 1 && prevSelectedLen.current === 0) {
      // First selection — switch to 10s ring from now
      startRing(RING_DELAY_ENGAGED);
    }
    // All 4 selected — auto-reveal immediately
    if (allFirstSelected && page === 'first') {
      if (ringRef.current) clearInterval(ringRef.current);
      setTimeout(() => doReveal(false), 300); // brief pause so last checkmark animates
    }
    prevSelectedLen.current = selected.length;
  }, [selected.length, allFirstSelected, page]);

  function doReveal(moveFocus: boolean) {
    if (ringRef.current) clearInterval(ringRef.current);
    setPage('transitioning');
    setTimeout(() => {
      setPage('second');
      setFocusIdx(0);
      if (moveFocus) setFocusIdx(0);
    }, 350); // crossfade duration
  }

  function toggleWorld(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  // Payoff chip
  useEffect(() => {
    if (selected.length === 0) { setPayoffVisible(false); return; }
    setPayoff(buildPayoff(selected));
    setPayoffVisible(true);
    const t = setTimeout(() => setPayoffVisible(false), 3000);
    return () => clearTimeout(t);
  }, [selected.join(',')]);

  // Keyboard navigation
  useEffect(() => {
    const COLS = 2;
    const handler = (e: KeyboardEvent) => {
      if (page === 'transitioning') return;
      const count = 4; // always 4 tiles on screen

      if (focusCta !== 'none') {
        if (e.key === 'ArrowLeft') { e.preventDefault(); setFocusCta('none'); return; }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusCta(f => f === 'continue' ? 'skip' : f === 'skip' ? (page === 'first' ? 'see-more' : 'continue') : 'continue');
          return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (focusCta === 'continue' && selected.length > 0) onNext(selected);
          if (focusCta === 'skip') onSkip();
          if (focusCta === 'see-more') doReveal(true);
          return;
        }
        if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); onSkip(); return; }
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (focusIdx % COLS === COLS - 1 || focusIdx === count - 1) {
          setFocusCta(selected.length > 0 ? 'continue' : page === 'first' ? 'see-more' : 'skip');
        } else {
          setFocusIdx(i => Math.min(i + 1, count - 1));
        }
      }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(i + COLS, count - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - COLS)); }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const world = currentTiles[focusIdx];
        if (world) toggleWorld(world.id);
      }
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); onSkip(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusIdx, focusCta, selected, page, currentTiles, onNext, onSkip]);

  const ringDash = RING_CIRCUMFERENCE * (1 - ringProgress);

  return (
    <div style={{
      width: 1920, height: 1080,
      background: '#010101',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.5s ease',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 30% 50%, rgba(112,71,226,0.12) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Wordmark */}
      <div style={{ position: 'absolute', top: 56, left: 72, display: 'flex', alignItems: 'center', gap: 12, zIndex: 2 }}>
        <span style={{ fontSize: 30, background: 'linear-gradient(135deg, #A786E5, #7047E2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>✦</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#F5F3F7' }}>Glance</span>
      </div>

      {/* Left: question + payoff */}
      <div style={{ width: 480, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 72, paddingRight: 40, gap: 24, zIndex: 1 }}>
        <Mascot state="speaking" size={64} />
        <h2 style={{ fontSize: 44, fontWeight: 800, color: '#F5F3F7', margin: 0, letterSpacing: -0.5, lineHeight: 1.15 }}>
          Let Glance bring more of what feels like you
        </h2>
        <p style={{ fontSize: 20, color: 'rgba(167,134,229,0.75)', margin: 0, lineHeight: 1.5 }}>
          {page === 'second'
            ? "Here are 4 more — pick anything that calls to you"
            : "Pick what calls to you — I'll keep learning as you watch"}
        </p>

        {/* Page indicator dots */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              width: i === (page === 'second' ? 1 : 0) ? 20 : 8,
              height: 8, borderRadius: 4,
              background: i === (page === 'second' ? 1 : 0) ? '#A786E5' : 'rgba(167,134,229,0.25)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Payoff chip */}
        <div style={{
          opacity: payoffVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          background: 'rgba(112,71,226,0.18)',
          border: '1px solid rgba(167,134,229,0.3)',
          borderRadius: 12,
          padding: '12px 16px',
          fontSize: 16,
          color: 'rgba(167,134,229,0.9)',
          lineHeight: 1.4,
          minHeight: 52,
        }}>
          {payoff}
        </div>
      </div>

      {/* Center: 2×2 grid — always exactly 4 tiles, crossfades between pages */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 310px)',
          gap: 20,
          opacity: page === 'transitioning' ? 0 : 1,
          transform: page === 'transitioning' ? 'scale(0.97)' : 'scale(1)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}>
          {currentTiles.map((world, i) => {
            const isSel = selected.includes(world.id);
            const isFocused = focusCta === 'none' && focusIdx === i && page !== 'transitioning';
            return (
              <div
                key={world.id}
                onClick={() => toggleWorld(world.id)}
                style={{
                  width: 310,
                  height: 290,
                  borderRadius: 20,
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  outline: isFocused ? '3px solid rgba(167,134,229,0.85)' : isSel ? '3px solid #c084fc' : '3px solid transparent',
                  outlineOffset: 4,
                  transform: isFocused ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  // Stagger the entrance on page 2
                  animation: page === 'second' ? `worldIn 0.35s ease ${i * 0.07}s both` : 'none',
                }}
              >
                <img src={world.image} alt={world.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)',
                }} />
                <div style={{ position: 'absolute', bottom: 16, left: 16, right: 40 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#F5F3F7', lineHeight: 1.2 }}>{world.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(245,243,247,0.65)', marginTop: 4 }}>{world.subtitle}</div>
                </div>
                {isSel && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#7047E2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, color: '#fff', fontWeight: 700,
                    animation: 'checkPop 0.25s ease',
                  }}>✓</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: CTAs */}
      <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', paddingRight: 60, gap: 16, zIndex: 1 }}>
        {selected.length > 0 && (
          <button
            onClick={() => onNext(selected)}
            onFocus={() => setFocusCta('continue')}
            style={{
              padding: '20px 40px', borderRadius: 999, fontSize: 20, fontWeight: 700, cursor: 'pointer',
              border: focusCta === 'continue' ? '3px solid #c084fc' : '3px solid transparent',
              background: 'linear-gradient(135deg, #A786E5 0%, #7047E2 100%)', color: '#fff',
              boxShadow: focusCta === 'continue' ? '0 0 0 3px rgba(192,132,252,0.4), 0 8px 32px rgba(112,71,226,0.5)' : '0 8px 32px rgba(112,71,226,0.35)',
              transform: focusCta === 'continue' ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.15s ease', whiteSpace: 'nowrap',
            }}
          >
            Continue
          </button>
        )}

        {/* See more — only on first page */}
        {page === 'first' && (
          <button
            onClick={() => doReveal(true)}
            onFocus={() => setFocusCta('see-more')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 24px', borderRadius: 999, fontSize: 17, fontWeight: 600, cursor: 'pointer',
              border: focusCta === 'see-more' ? '2px solid rgba(167,134,229,0.8)' : '2px solid rgba(167,134,229,0.3)',
              background: 'rgba(112,71,226,0.12)', color: 'rgba(245,243,247,0.8)',
              transform: focusCta === 'see-more' ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.15s ease', whiteSpace: 'nowrap',
              animation: 'seeMorePulse 2.5s ease-in-out infinite',
            }}
          >
            <svg width={56} height={56} style={{ flexShrink: 0, marginLeft: -6 }}>
              <circle cx={28} cy={28} r={24} fill="none" stroke="rgba(112,71,226,0.2)" strokeWidth={3} />
              <circle
                cx={28} cy={28} r={24} fill="none" stroke="#A786E5" strokeWidth={3}
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={ringDash}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
                style={{ transition: 'stroke-dashoffset 0.08s linear' }}
              />
              <text x={28} y={33} textAnchor="middle" fontSize={16} fill="rgba(167,134,229,0.9)" fontWeight={700}>+4</text>
            </svg>
            See more
          </button>
        )}

        <button
          onClick={onSkip}
          onFocus={() => setFocusCta('skip')}
          style={{
            padding: '14px 28px', borderRadius: 999, fontSize: 17, fontWeight: 600, cursor: 'pointer',
            border: focusCta === 'skip' ? '2px solid rgba(167,134,229,0.6)' : '2px solid transparent',
            background: 'transparent', color: 'rgba(245,243,247,0.45)',
            transform: focusCta === 'skip' ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.15s ease', whiteSpace: 'nowrap',
          }}
        >
          Skip for now
        </button>
      </div>

      <style>{`
        @keyframes worldIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes checkPop {
          0%   { transform: scale(0); }
          60%  { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes seeMorePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(112,71,226,0); }
          50%       { box-shadow: 0 0 0 6px rgba(112,71,226,0.2); }
        }
      `}</style>
    </div>
  );
}
