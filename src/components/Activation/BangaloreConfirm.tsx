import { useEffect, useState } from 'react';
import Mascot, { TypedLine } from '../Shared/Mascot';

type Props = {
  onConfirm: () => void;   // Yes, Bangalore
  onNotQuite: () => void;  // Not quite → same flow, brief acknowledgement
};

export default function BangaloreConfirm({ onConfirm, onNotQuite }: Props) {
  const [focusBtn, setFocusBtn] = useState<'yes' | 'no'>('yes');
  const [notQuiteMsg, setNotQuiteMsg] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusBtn(f => f === 'yes' ? 'no' : 'yes');
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (focusBtn === 'yes') {
          onConfirm();
        } else {
          handleNotQuite();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusBtn, onConfirm]);

  function handleNotQuite() {
    setNotQuiteMsg(true);
    setTimeout(() => onNotQuite(), 2200);
  }

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
        background: 'radial-gradient(ellipse at 50% 55%, rgba(112,71,226,0.15) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Wordmark */}
      <div style={{ position: 'absolute', top: 56, left: 72, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 30, background: 'linear-gradient(135deg, #A786E5, #7047E2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>✦</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#F5F3F7' }}>Glance</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 48, maxWidth: 860, textAlign: 'center', zIndex: 1 }}>
        <Mascot state={notQuiteMsg ? 'thinking' : 'speaking'} size={80} />

        {!notQuiteMsg ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{
                fontSize: 52,
                fontWeight: 800,
                color: '#F5F3F7',
                margin: 0,
                letterSpacing: -0.5,
                lineHeight: 1.1,
              }}>
                <TypedLine
                  text="I see you're in Bangalore — that right?"
                  speedMs={22}
                />
              </h2>
              <p style={{ fontSize: 22, color: 'rgba(167,134,229,0.75)', margin: 0 }}>
                It helps me get your feed spot on.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <button
                onClick={onConfirm}
                onFocus={() => setFocusBtn('yes')}
                style={{
                  padding: '22px 64px',
                  borderRadius: 999,
                  fontSize: 22,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: focusBtn === 'yes' ? '3px solid #c084fc' : '3px solid transparent',
                  background: 'linear-gradient(135deg, #A786E5 0%, #7047E2 100%)',
                  color: '#fff',
                  boxShadow: focusBtn === 'yes' ? '0 0 0 3px rgba(192,132,252,0.4), 0 8px 32px rgba(112,71,226,0.5)' : '0 8px 32px rgba(112,71,226,0.35)',
                  transform: focusBtn === 'yes' ? 'scale(1.04)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                }}
              >
                Yes, Bangalore
              </button>
              <button
                onClick={handleNotQuite}
                onFocus={() => setFocusBtn('no')}
                style={{
                  padding: '22px 64px',
                  borderRadius: 999,
                  fontSize: 22,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: focusBtn === 'no' ? '3px solid rgba(167,134,229,0.8)' : '3px solid rgba(167,134,229,0.3)',
                  background: 'transparent',
                  color: 'rgba(245,243,247,0.75)',
                  transform: focusBtn === 'no' ? 'scale(1.04)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                }}
              >
                Not quite
              </button>
            </div>
          </>
        ) : (
          <p style={{
            fontSize: 32,
            color: 'rgba(167,134,229,0.9)',
            margin: 0,
            fontStyle: 'italic',
          }}>
            Got it — I'll still start with Bangalore for this demo.
          </p>
        )}
      </div>
    </div>
  );
}
