import { useEffect, useState } from 'react';
import Mascot from '../Shared/Mascot';

const OPTIONS: Array<{ id: 'familiar' | 'medium' | 'medium_high' | 'high'; label: string; description: string; image: string }> = [
  { id: 'familiar',    label: 'Keep it familiar',       description: 'More of what already feels right',       image: '/images/q3/q3-01-keep-it-close-to-what-i-love.jpg' },
  { id: 'medium',      label: 'Mix in related ideas',   description: 'Familiar, with a few nearby worlds',     image: '/images/q3/q3-02-mix-in-some-fresh-ideas.jpg' },
  { id: 'medium_high', label: 'Surprise me sometimes',  description: 'Bring in new worlds regularly',          image: '/images/q3/q3-03-surprise-me-sometimes.jpg' },
  { id: 'high',        label: 'Take me somewhere new',  description: 'A bolder feed with more fresh discoveries', image: '/images/q3/q3-04-let-it-change-with-my-mood.jpg' },
];

type Props = {
  onNext: (appetite: 'familiar' | 'medium' | 'medium_high' | 'high') => void;
  onSkip: () => void;
};

export default function DiscoveryAppetite({ onNext, onSkip }: Props) {
  const [focusIdx, setFocusIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [focusCta, setFocusCta] = useState<'none' | 'continue' | 'skip'>('none');
  const [visible, setVisible] = useState(false);

  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (focusCta !== 'none') {
        if (e.key === 'ArrowLeft') { e.preventDefault(); setFocusCta('none'); return; }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); setFocusCta(f => f === 'continue' ? 'skip' : 'continue'); return; }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (focusCta === 'continue' && selected) onNext(selected as any);
          if (focusCta === 'skip') onSkip();
          return;
        }
        return;
      }

      if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(OPTIONS.length - 1, i + 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setFocusCta(selected ? 'continue' : 'skip'); }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const opt = OPTIONS[focusIdx];
        setSelected(opt.id);
        setTimeout(() => onNext(opt.id), 500);
      }
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); onSkip(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusIdx, focusCta, selected, onNext, onSkip]);

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
      {/* Background glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(112,71,226,0.13) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Wordmark */}
      <div style={{ position: 'absolute', top: 56, left: 72, display: 'flex', alignItems: 'center', gap: 12, zIndex: 2 }}>
        <span style={{ fontSize: 30, background: 'linear-gradient(135deg, #A786E5, #7047E2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>✦</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#F5F3F7' }}>Glance</span>
      </div>

      {/* Left: question + options */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 120, paddingRight: 60, gap: 36 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Mascot state="speaking" size={56} />
          <h2 style={{ fontSize: 52, fontWeight: 800, color: '#F5F3F7', margin: 0, letterSpacing: -0.5, lineHeight: 1.1, maxWidth: 680 }}>
            How far should Glance take you?
          </h2>
          <p style={{ fontSize: 20, color: 'rgba(167,134,229,0.7)', margin: 0 }}>Pick one — change anytime.</p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
          {OPTIONS.map((opt, i) => {
            const isFocused = focusCta === 'none' && focusIdx === i;
            const isSel = selected === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => { setSelected(opt.id); setTimeout(() => onNext(opt.id), 500); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 20,
                  padding: '18px 24px',
                  borderRadius: 16,
                  cursor: 'pointer',
                  background: isSel ? 'rgba(112,71,226,0.22)' : isFocused ? 'rgba(112,71,226,0.10)' : 'rgba(255,255,255,0.03)',
                  border: isSel ? '2px solid rgba(192,132,252,0.6)' : isFocused ? '2px solid rgba(167,134,229,0.5)' : '2px solid rgba(255,255,255,0.07)',
                  transform: isFocused ? 'scale(1.01)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Thumbnail */}
                <div style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={opt.image} alt={opt.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.background = '#1a0e30'; }} />
                </div>
                {/* Text */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#F5F3F7', lineHeight: 1.2 }}>{opt.label}</div>
                  <div style={{ fontSize: 15, color: 'rgba(245,243,247,0.55)', marginTop: 4 }}>{opt.description}</div>
                </div>
                {/* Radio */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  border: isSel ? '2px solid #c084fc' : '2px solid rgba(167,134,229,0.4)',
                  background: isSel ? 'radial-gradient(circle, #c084fc 0%, #7047E2 100%)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: CTAs */}
      <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', paddingRight: 60, gap: 16 }}>
        {selected && (
          <button
            onClick={() => onNext(selected as any)}
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
    </div>
  );
}
