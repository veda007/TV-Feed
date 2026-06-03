import { useEffect, useRef, useState } from 'react';

type Props = {
  onNext: () => void;
  onSkip: () => void;
};

const SILHOUETTE_IMG = '/images/ui/human-silhouette-cut.png';
const MONUMENT_IMG = '/images/feed/feed_05-travel-rajasthan-haveli.jpg';

export default function SelfieScreen({ onNext, onSkip }: Props) {
  const [animated, setAnimated] = useState(false);
  const [focused, setFocused] = useState<'next' | 'skip'>('next');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => { ref.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocused(f => f === 'next' ? 'skip' : 'next');
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        focused === 'next' ? onNext() : onSkip();
      }
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); onSkip(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focused, onNext, onSkip]);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      style={{
        width: 1920, height: 1080,
        background: '#010101',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        outline: 'none',
        opacity: animated ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 70% 50%, rgba(112,71,226,0.14) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Wordmark */}
      <div style={{ position: 'absolute', top: 56, left: 72, display: 'flex', alignItems: 'center', gap: 12, zIndex: 2 }}>
        <span style={{ fontSize: 30, background: 'linear-gradient(135deg, #A786E5, #7047E2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>✦</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#F5F3F7' }}>Glance</span>
      </div>

      {/* Left: text + QR + CTAs */}
      <div style={{
        width: 660, flexShrink: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        paddingLeft: 96, paddingRight: 56, gap: 22, zIndex: 1,
      }}>
        <div style={{
          fontSize: 15, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: '#A786E5', fontWeight: 600,
        }}>
          Imagine yourself here
        </div>

        <h1 style={{
          fontSize: 58, fontWeight: 800, lineHeight: 1.08,
          letterSpacing: -0.5, color: '#F5F3F7', margin: 0, maxWidth: '16ch',
        }}>
          Step into the moments you love.
        </h1>

        <p style={{
          fontSize: 20, lineHeight: 1.55, color: 'rgba(183,179,192,0.9)',
          maxWidth: '34ch', margin: 0,
        }}>
          Add a selfie and Glance places you right inside — a candlelit dinner, a mountain sunrise, a rooftop at dusk.
        </p>

        {/* QR box */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 24,
          background: 'linear-gradient(135deg, rgba(112,71,226,0.18) 0%, rgba(192,132,252,0.08) 100%)',
          border: '1.5px solid rgba(167,134,229,0.4)',
          borderRadius: 20, padding: '20px 24px',
          boxShadow: '0 0 32px rgba(112,71,226,0.15)',
          animation: 'qrpulse 3s ease-in-out infinite',
        }}>
          {/* QR placeholder */}
          <div style={{
            width: 100, height: 100, borderRadius: 12, background: '#fff',
            padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 0 0 2px rgba(112,71,226,0.3)',
          }}>
            <svg width="84" height="84" viewBox="0 0 84 84" fill="none">
              <rect width="36" height="36" rx="4" fill="#111"/>
              <rect x="6" y="6" width="24" height="24" rx="2" fill="#fff"/>
              <rect x="10" y="10" width="16" height="16" fill="#111"/>
              <rect x="48" width="36" height="36" rx="4" fill="#111"/>
              <rect x="54" y="6" width="24" height="24" rx="2" fill="#fff"/>
              <rect x="58" y="10" width="16" height="16" fill="#111"/>
              <rect y="48" width="36" height="36" rx="4" fill="#111"/>
              <rect x="6" y="54" width="24" height="24" rx="2" fill="#fff"/>
              <rect x="10" y="58" width="16" height="16" fill="#111"/>
              <rect x="48" y="48" width="8" height="8" rx="1" fill="#111"/>
              <rect x="60" y="48" width="8" height="8" rx="1" fill="#111"/>
              <rect x="72" y="48" width="12" height="8" rx="1" fill="#111"/>
              <rect x="48" y="60" width="12" height="8" rx="1" fill="#111"/>
              <rect x="64" y="60" width="8" height="8" rx="1" fill="#111"/>
              <rect x="48" y="72" width="8" height="12" rx="1" fill="#111"/>
              <rect x="62" y="72" width="22" height="12" rx="1" fill="#111"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#F5F3F7', lineHeight: 1.25, marginBottom: 6 }}>
              Scan to upload your selfie
            </div>
            <div style={{ fontSize: 14, color: 'rgba(183,179,192,0.7)', lineHeight: 1.5, maxWidth: '26ch' }}>
              Point your phone camera here — takes 10 seconds. We'll place you into the scene.
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 10, fontSize: 12, fontWeight: 700, color: '#fff',
              background: 'rgba(112,71,226,0.28)', border: '1px solid rgba(167,134,229,0.35)',
              borderRadius: 999, padding: '5px 14px', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              <span style={{ fontSize: 11, background: 'linear-gradient(135deg, #A786E5, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✦</span>
              Scan to add yours
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button
            onClick={onNext}
            onFocus={() => setFocused('next')}
            style={{
              padding: '20px 44px', borderRadius: 999,
              border: focused === 'next' ? '3px solid #c084fc' : '3px solid transparent',
              background: focused === 'next' ? '#F4F2F7' : 'rgba(255,255,255,0.08)',
              color: focused === 'next' ? '#111' : '#F5F3F7',
              fontSize: 20, fontWeight: 700, cursor: 'pointer',
              boxShadow: focused === 'next' ? '0 0 0 4px #010101, 0 0 0 7px #fff, 0 0 34px rgba(255,255,255,0.35)' : 'none',
              transform: focused === 'next' ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.18s ease',
            }}
          >
            Continue
          </button>
          <button
            onClick={onSkip}
            onFocus={() => setFocused('skip')}
            style={{
              padding: '18px 32px', borderRadius: 999,
              background: 'transparent',
              color: 'rgba(183,179,192,0.7)', fontSize: 18, fontWeight: 600,
              cursor: 'pointer',
              border: focused === 'skip' ? '2px solid rgba(167,134,229,0.6)' : '2px solid transparent',
              transform: focused === 'skip' ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.18s ease',
            }}
          >
            Maybe later
          </button>
        </div>

        <div style={{ fontSize: 13, color: 'rgba(93,89,104,0.9)' }}>
          No rush — this is optional and always available.
        </div>
      </div>

      {/* Right: single hero monument with silhouette */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '24px 0 0 24px',
        margin: '40px 0 40px 0',
        opacity: animated ? 1 : 0,
        transform: animated ? 'translateX(0)' : 'translateX(40px)',
        transition: 'opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s',
      }}>
        {/* Monument photo */}
        <img
          src={MONUMENT_IMG}
          alt="Imagine yourself here"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(1,1,1,0.55) 0%, rgba(1,1,1,0) 30%, rgba(1,1,1,0) 70%, rgba(1,1,1,0.2) 100%), linear-gradient(to top, rgba(1,1,1,0.7) 0%, rgba(1,1,1,0) 35%)',
        }} />

        {/* Silhouette */}
        <img
          src={SILHOUETTE_IMG}
          alt=""
          style={{
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 180,
            height: 'auto',
            filter: 'drop-shadow(0 0 32px rgba(112,71,226,0.95)) drop-shadow(0 0 14px rgba(199,77,255,0.7))',
            opacity: animated ? 1 : 0,
            transition: 'opacity 0.6s ease 0.6s',
            pointerEvents: 'none',
          }}
        />

        {/* Ground glow */}
        <div style={{
          position: 'absolute', bottom: 12, left: '50%',
          transform: 'translateX(-50%)',
          width: 220, height: 28,
          background: 'radial-gradient(ellipse, rgba(167,134,229,0.7) 0%, transparent 70%)',
          filter: 'blur(8px)',
          pointerEvents: 'none',
        }} />

        {/* "You here" badge */}
        <div style={{
          position: 'absolute', top: 24, right: 24,
          display: 'inline-flex', alignItems: 'center', gap: 7,
          fontSize: 15, fontWeight: 700, color: '#fff',
          background: 'rgba(8,5,18,0.7)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 999, padding: '8px 18px',
          backdropFilter: 'blur(8px)',
          animation: 'youpulse 2.5s ease-in-out infinite',
        }}>
          <span style={{
            fontSize: 12,
            background: 'linear-gradient(135deg, #A786E5, #c084fc)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>✦</span>
          You here
        </div>

        {/* Moment label */}
        <div style={{
          position: 'absolute', bottom: 28, left: 28,
          fontSize: 18, fontWeight: 700, color: '#fff',
          textShadow: '0 1px 12px rgba(0,0,0,0.9)',
        }}>
          A golden evening in Rajasthan
        </div>
      </div>

      <style>{`
        @keyframes youpulse {
          0%, 100% { box-shadow: 0 0 20px rgba(112,71,226,0.3); }
          50%       { box-shadow: 0 0 36px rgba(192,132,252,0.55); }
        }
        @keyframes qrpulse {
          0%, 100% { border-color: rgba(167,134,229,0.4); box-shadow: 0 0 32px rgba(112,71,226,0.15); }
          50%       { border-color: rgba(167,134,229,0.65); box-shadow: 0 0 48px rgba(112,71,226,0.28); }
        }
      `}</style>
    </div>
  );
}
