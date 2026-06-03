import { useEffect, useRef, useState } from 'react';
import type { GlanceProfileDraft } from '../../logic/profileDraft';

const breatheKeyframes = `
@keyframes breathe-tuning {
  0%   { transform: scale(1);    opacity: 0.7; box-shadow: 0 0 60px 20px rgba(112,71,226,0.35); }
  50%  { transform: scale(1.15); opacity: 1;   box-shadow: 0 0 130px 60px rgba(112,71,226,0.6); }
  100% { transform: scale(1);    opacity: 0.7; box-shadow: 0 0 60px 20px rgba(112,71,226,0.35); }
}
@keyframes build-item-in {
  from { opacity: 0; transform: translateX(-16px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes check-pop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
`;

const BUILD_LINES = [
  { label: 'Reading Bangalore + weather', delay: 0.4 },
  { label: 'Matching the time of day', delay: 1.0 },
  { label: 'Folding in what you chose', delay: 1.7 },
];

type Props = {
  profileDraft: GlanceProfileDraft;
  onDone: () => void;
};

export default function TuningTransition({ profileDraft, onDone }: Props) {
  const [visible, setVisible] = useState(false);
  const [checkedLines, setCheckedLines] = useState<number[]>([]);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    setVisible(true);

    const timers: ReturnType<typeof setTimeout>[] = [];

    BUILD_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setCheckedLines(prev => [...prev, i]), (line.delay + 0.5) * 1000));
    });

    timers.push(setTimeout(() => onDoneRef.current(), 3800));

    return () => timers.forEach(clearTimeout);
  }, []); // runs exactly once on mount

  // Build world labels from draft for subline
  const cats = profileDraft.category_interests.primary_category_interests.map(c => c.category.toLowerCase());
  const subline = cats.length === 0
    ? "Starting with a balanced feed. We'll keep learning as you watch."
    : cats.length === 1
      ? `Starting with more ${cats[0]}.`
      : `Starting with more ${cats.slice(0, -1).join(', ')} and ${cats[cats.length - 1]}.`;

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
    }}>
      <style>{breatheKeyframes}</style>

      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 55%, rgba(112,71,226,0.22) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Wordmark */}
      <div style={{ position: 'absolute', top: 56, left: 72, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 30, background: 'linear-gradient(135deg, #A786E5, #7047E2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>✦</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#F5F3F7' }}>Glance</span>
      </div>

      {/* Breathing orb */}
      <div style={{
        width: 140, height: 140, borderRadius: '50%',
        background: 'radial-gradient(circle, #c084fc 0%, #7047E2 55%, #3a1a7a 100%)',
        animation: 'breathe-tuning 2.8s ease infinite',
        marginBottom: 48, zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 44, background: 'linear-gradient(135deg, #fff, #e9d5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900 }}>✦</span>
      </div>

      {/* Headline */}
      <div style={{ textAlign: 'center', zIndex: 1, marginBottom: 48 }}>
        <h2 style={{
          fontSize: 52, fontWeight: 800, color: '#F5F3F7',
          margin: '0 0 14px', letterSpacing: -0.5,
        }}>
          Made for your evening.
        </h2>
        <p style={{
          fontSize: 20, color: 'rgba(167,134,229,0.8)',
          margin: 0, maxWidth: 600,
        }}>
          {subline}
        </p>
      </div>

      {/* Build list */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 14, zIndex: 1,
        opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease',
      }}>
        {BUILD_LINES.map((line, i) => {
          const isChecked = checkedLines.includes(i);
          return (
            <div key={line.label} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              opacity: 0,
              animation: `build-item-in 0.4s ease ${line.delay}s forwards`,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: isChecked ? 'linear-gradient(135deg, #A786E5, #7047E2)' : 'rgba(112,71,226,0.25)',
                border: isChecked ? 'none' : '1.5px solid rgba(167,134,229,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}>
                {isChecked && (
                  <span style={{
                    fontSize: 12, color: '#fff', fontWeight: 700, lineHeight: 1,
                    animation: 'check-pop 0.3s ease',
                  }}>✓</span>
                )}
              </div>
              <span style={{
                fontSize: 18, fontWeight: 600,
                color: isChecked ? '#F5F3F7' : 'rgba(167,134,229,0.65)',
                transition: 'color 0.3s ease',
              }}>
                {line.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
