import { useEffect, useState } from 'react';
import Mascot, { TypedLine } from '../Shared/Mascot';

const TYPED_LINE = "I'm your screen that quietly learns what you love — starting right now.";

type Props = {
  onNext: () => void;
  onSkip: () => void;
};

export default function WelcomeScreen({ onNext, onSkip }: Props) {
  const [focusBtn, setFocusBtn] = useState<'start' | 'skip'>('start');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusBtn(f => f === 'start' ? 'skip' : 'start');
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        focusBtn === 'start' ? onNext() : onSkip();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusBtn, onNext, onSkip]);

  return (
    <div style={{
      width: 1920, height: 1080,
      background: '#010101',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.5s ease',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 55%, rgba(112,71,226,0.18) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Wordmark */}
      <div style={{ position: 'absolute', top: 56, left: 72, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 30, background: 'linear-gradient(135deg, #A786E5, #7047E2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>✦</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#F5F3F7' }}>Glance</span>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, maxWidth: 820, textAlign: 'center', zIndex: 1 }}>
        {/* Mascot */}
        <Mascot state="speaking" size={96} />

        {/* Hello */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 style={{
            fontSize: 72,
            fontWeight: 900,
            color: '#F5F3F7',
            margin: 0,
            letterSpacing: -1,
            lineHeight: 1.05,
          }}>
            Hello, I'm Glance.
          </h1>

          {/* Typed narration */}
          <p style={{
            fontSize: 26,
            color: 'rgba(167,134,229,0.9)',
            margin: 0,
            lineHeight: 1.5,
            minHeight: 40,
          }}>
            <TypedLine text={TYPED_LINE} speedMs={24} />
          </p>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
          <button
            onClick={onNext}
            onFocus={() => setFocusBtn('start')}
            style={{
              padding: '22px 64px',
              borderRadius: 999,
              fontSize: 22,
              fontWeight: 700,
              cursor: 'pointer',
              border: focusBtn === 'start' ? '3px solid #c084fc' : '3px solid transparent',
              background: 'linear-gradient(135deg, #A786E5 0%, #7047E2 100%)',
              color: '#fff',
              boxShadow: focusBtn === 'start' ? '0 0 0 3px rgba(192,132,252,0.4), 0 8px 32px rgba(112,71,226,0.5)' : '0 8px 32px rgba(112,71,226,0.35)',
              transform: focusBtn === 'start' ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.15s ease',
            }}
          >
            Let's go
          </button>
          <button
            onClick={onSkip}
            onFocus={() => setFocusBtn('skip')}
            style={{
              padding: '22px 64px',
              borderRadius: 999,
              fontSize: 22,
              fontWeight: 700,
              cursor: 'pointer',
              border: focusBtn === 'skip' ? '3px solid rgba(167,134,229,0.8)' : '3px solid rgba(167,134,229,0.3)',
              background: 'transparent',
              color: 'rgba(245,243,247,0.75)',
              transform: focusBtn === 'skip' ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.15s ease',
            }}
          >
            Skip intro
          </button>
        </div>
      </div>

      {/* Bangalore context hint */}
      <p style={{
        position: 'absolute', bottom: 48,
        fontSize: 16,
        color: 'rgba(167,134,229,0.45)',
        margin: 0,
        letterSpacing: '0.04em',
      }}>
        Personalised for Bangalore · rainy Friday evening
      </p>
    </div>
  );
}
