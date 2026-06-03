import { useEffect, useRef, useState } from 'react';
import type { QuestionConfig, QuestionOptionConfig } from '../../data/preferenceQuestions';

type Props = {
  question: QuestionConfig;
  backgroundImage: string;
  onAnswer: (option: QuestionOptionConfig) => void;
  onDismiss: () => void;
};

export default function InterstitialQuestion({ question, backgroundImage, onAnswer, onDismiss }: Props) {
  const [focusIdx, setFocusIdx] = useState(0);
  const [barWidth, setBarWidth] = useState(100);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!question.autoDismissMs) return;
    const raf = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / question.autoDismissMs) * 100);
      setBarWidth(pct);
      if (pct <= 0) { clearInterval(raf); onDismiss(); }
    }, 80);
    return () => clearInterval(raf);
  }, [question.autoDismissMs, onDismiss]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setFocusIdx(i => Math.min(question.options.length - 1, i + 1)); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAnswer(question.options[focusIdx]); }
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); onDismiss(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusIdx, question.options, onAnswer, onDismiss]);

  const isFocused = (i: number) => focusIdx === i;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 18,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-end',
    }}>
      {/* Dimmed bg */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(3,1,10,0.97) 0%, rgba(3,1,10,0.75) 40%, rgba(3,1,10,0.4) 100%)' }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%', padding: '0 120px 80px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Question header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#A786E5', marginBottom: 12 }}>
            ✦ Tune your feed
          </div>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 42, fontWeight: 600, color: '#F5F3F7', margin: 0, letterSpacing: -0.3 }}>
            {question.question}
          </h3>
          {question.subtext && (
            <p style={{ fontSize: 18, color: '#B7B3C0', marginTop: 10 }}>
              {question.subtext}
            </p>
          )}
        </div>

        {/* Image option cards */}
        <div style={{ display: 'flex', gap: 20, width: '100%', maxWidth: 1400 }}>
          {question.options.map((opt, i) => (
            <div
              key={opt.id}
              onClick={() => onAnswer(opt)}
              onMouseEnter={() => setFocusIdx(i)}
              style={{
                flex: 1, height: 320, borderRadius: 20, overflow: 'hidden',
                position: 'relative', cursor: 'pointer',
                border: isFocused(i) ? '3px solid #fff' : '2px solid rgba(255,255,255,0.1)',
                boxShadow: isFocused(i) ? '0 0 0 3px rgba(3,1,10,0.6), 0 0 0 6px #fff, 0 0 40px rgba(112,71,226,0.5)' : '0 8px 32px rgba(0,0,0,0.5)',
                transform: isFocused(i) ? 'scale(1.04) translateY(-4px)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Image */}
              {opt.image ? (
                <img src={opt.image} alt={opt.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #21124B, #0E0A22)' }} />
              )}
              {/* Gradient */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(3,1,10,0.9) 0%, rgba(3,1,10,0.3) 50%, rgba(3,1,10,0) 75%)' }} />
              {/* Text */}
              <div style={{ position: 'absolute', left: 20, right: 20, bottom: 20 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#F5F3F7', marginBottom: 4, textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>
                  {opt.label}
                </div>
                {opt.sublabel && (
                  <div style={{ fontSize: 14, color: 'rgba(245,243,247,0.7)', lineHeight: 1.4 }}>
                    {opt.sublabel}
                  </div>
                )}
              </div>
              {/* Focused indicator */}
              {isFocused(i) && (
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#7047E2', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 16, color: '#fff',
                  boxShadow: '0 0 16px rgba(112,71,226,0.7)',
                }}>✓</div>
              )}
            </div>
          ))}
        </div>

        {/* Dismiss hint */}
        <div style={{ marginTop: 20, fontSize: 14, color: 'rgba(245,243,247,0.35)' }}>
          Left/Right to browse · OK to choose · Back to dismiss
        </div>
      </div>

      {/* Progress bar */}
      {question.autoDismissMs > 0 && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(167,134,229,0.15)' }}>
          <div style={{
            height: '100%', width: `${barWidth}%`,
            background: 'linear-gradient(90deg, #7047E2, #A786E5)',
            transition: 'width 0.08s linear',
          }} />
        </div>
      )}
    </div>
  );
}
