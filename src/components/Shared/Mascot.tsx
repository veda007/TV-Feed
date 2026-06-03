import { useEffect, useState } from 'react';

export type MascotState = 'idle' | 'speaking' | 'thinking';

const keyframes = `
@keyframes mascot-breathe {
  0%   { transform: scale(1);    opacity: 0.75; box-shadow: 0 0 40px 12px rgba(112,71,226,0.35); }
  50%  { transform: scale(1.12); opacity: 1;   box-shadow: 0 0 90px 40px rgba(112,71,226,0.60); }
  100% { transform: scale(1);    opacity: 0.75; box-shadow: 0 0 40px 12px rgba(112,71,226,0.35); }
}
@keyframes mascot-speak {
  0%   { transform: scale(1);    box-shadow: 0 0 60px 24px rgba(192,132,252,0.55); }
  40%  { transform: scale(1.18); box-shadow: 0 0 120px 60px rgba(192,132,252,0.80); }
  100% { transform: scale(1);    box-shadow: 0 0 60px 24px rgba(192,132,252,0.55); }
}
@keyframes mascot-think-dot {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40%           { opacity: 1;   transform: scale(1.2); }
}
@keyframes typed-cursor {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
`;

type Props = {
  state?: MascotState;
  size?: number;
};

export default function Mascot({ state = 'idle', size = 80 }: Props) {
  const anim =
    state === 'speaking' ? 'mascot-speak 1.6s ease-in-out infinite' :
    state === 'thinking' ? 'none' :
    'mascot-breathe 2.8s ease-in-out infinite';

  return (
    <>
      <style>{keyframes}</style>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <div style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #c084fc 0%, #7047E2 55%, #3a1a7a 100%)',
          animation: anim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontSize: size * 0.4,
            background: 'linear-gradient(135deg, #fff 0%, #e9d5ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 900,
            lineHeight: 1,
          }}>✦</span>
        </div>

        {/* Thinking dots */}
        {state === 'thinking' && (
          <div style={{ position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'rgba(167,134,229,0.8)',
                animation: `mascot-think-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── useTypedText hook ────────────────────────────────────────────────────────

export function useTypedText(text: string, speedMs = 28): { typed: string; done: boolean } {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [text]);

  useEffect(() => {
    if (idx >= text.length) return;
    const t = setTimeout(() => setIdx(i => i + 1), speedMs);
    return () => clearTimeout(t);
  }, [idx, text, speedMs]);

  return { typed: text.slice(0, idx), done: idx >= text.length };
}

// ── TypedLine component ──────────────────────────────────────────────────────

type TypedLineProps = {
  text: string;
  style?: React.CSSProperties;
  speedMs?: number;
  showCursor?: boolean;
};

export function TypedLine({ text, style, speedMs = 28, showCursor = true }: TypedLineProps) {
  const { typed, done } = useTypedText(text, speedMs);
  return (
    <>
      <style>{`.typed-cursor { animation: typed-cursor 1s step-end infinite; }`}</style>
      <span style={style}>
        {typed}
        {showCursor && !done && <span className="typed-cursor" style={{ color: 'rgba(167,134,229,0.8)' }}>|</span>}
      </span>
    </>
  );
}
