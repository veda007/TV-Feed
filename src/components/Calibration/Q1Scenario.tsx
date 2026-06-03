// Q1 — Scenario / lifestyle signal.
// Single-select. Categories are DERIVED from vibe in tuning.ts — no category UI here.
// The two-phase category tile layer has been removed per product direction:
// users pick moods, Glance infers categories.

import { useEffect, useState } from 'react';
import type { PreferenceProfile } from '../../data/types';
import { Q1_SCENARIO_OPTIONS } from '../../data/onboardingQuestions';
import { applyOnboardingSignal } from '../../logic/signals';

// Content-type tags shown on each card (preview — display only, write nothing)
const SCENARIO_TAGS: Record<string, string[]> = {
  'slow-morning':  ['Travel', 'Scenic'],
  'forest-trail':  ['Food', 'Local'],
  'social-brunch': ['Style', 'Fashion'],
  'city-lights':   ['Home', 'Interiors'],
};

type Props = {
  profile: PreferenceProfile;
  onNext: (p: PreferenceProfile) => void;
  onSkip: () => void;
};

export default function Q1Scenario({ profile, onNext, onSkip }: Props) {
  const [focusIdx, setFocusIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const cardCount = Q1_SCENARIO_OPTIONS.length;
  const COLS = 2;
  const totalSlots = cardCount + (selected ? 1 : 0) + 1;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (focusIdx < cardCount) {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
        if (e.key === 'ArrowRight') { e.preventDefault(); setFocusIdx(i => Math.min(totalSlots - 1, i + 1)); }
        if (e.key === 'ArrowDown')  { e.preventDefault(); const next = focusIdx + COLS; setFocusIdx(next < cardCount ? next : cardCount); }
        if (e.key === 'ArrowUp')    { e.preventDefault(); setFocusIdx(i => Math.max(0, i - COLS)); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(Q1_SCENARIO_OPTIONS[focusIdx].id); }
      } else {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')   { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(totalSlots - 1, i + 1)); }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (selected && focusIdx === cardCount) { handleDone(); return; }
          if (focusIdx === totalSlots - 1) { onSkip(); return; }
        }
      }
      if (e.key === 'Backspace' || e.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusIdx, selected, totalSlots, cardCount, onSkip]);

  const handleDone = () => {
    if (!selected) return;
    const opt = Q1_SCENARIO_OPTIONS.find(o => o.id === selected)!;
    const p: PreferenceProfile = {
      ...profile,
      weights: { ...profile.weights },
      negativeWeights: { ...profile.negativeWeights },
      evidenceCounts: { ...profile.evidenceCounts },
      selectedQ1Scenario: selected,
    };
    // Write vibe/pace/social signals from the scenario
    applyOnboardingSignal(p, opt.mappedAttributes, opt.label);
    // Cat: weights are derived from vibe in App.enterFeed → seedVibeCategories()
    onNext(p);
  };

  const selectedOpt = Q1_SCENARIO_OPTIONS.find(o => o.id === selected);

  return (
    <div style={{
      width: 1920, height: 1080, background: '#010101',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(112,71,226,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ position: 'absolute', top: 56, left: 72, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 30, background: 'linear-gradient(135deg, #A786E5, #7047E2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>✦</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#F5F3F7' }}>Glance AI</span>
      </div>
      <div style={{ position: 'absolute', top: 60, right: 72, fontSize: 18, color: 'rgba(167,134,229,0.6)', fontWeight: 500 }}>1 of 3</div>

      {/* Question */}
      <div style={{ textAlign: 'center', marginBottom: 28, zIndex: 1 }}>
        <div style={{ fontSize: 18, color: '#A786E5', letterSpacing: 3, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
          Step 1 of 3
        </div>
        <h2 style={{ fontSize: 46, fontWeight: 800, color: '#F5F3F7', margin: 0, letterSpacing: -0.5 }}>
          What should your TV bring up first?
        </h2>
      </div>

      {/* 2×2 scenario cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 24, zIndex: 1, marginBottom: 36, width: 1180, height: 640 }}>
        {Q1_SCENARIO_OPTIONS.map((opt, i) => {
          const isSelected = selected === opt.id;
          const isFocused = focusIdx === i;
          const isDimmed = selected !== null && !isSelected;
          const tags = SCENARIO_TAGS[opt.id] || [];

          return (
            <div
              key={opt.id}
              tabIndex={-1}
              onClick={() => { setSelected(opt.id); setFocusIdx(i); }}
              style={{
                borderRadius: 24, overflow: 'hidden', position: 'relative',
                cursor: 'pointer',
                opacity: isDimmed ? 0.5 : 1,
                transition: 'opacity 0.3s, box-shadow 0.2s, outline 0.1s',
                outline: isFocused ? '3px solid #A786E5' : isSelected ? '3px solid #c084fc' : '3px solid transparent',
                outlineOffset: 4,
                boxShadow: isSelected ? '0 0 0 4px rgba(192,132,252,0.5), 0 16px 48px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.5)',
                background: 'radial-gradient(ellipse at 50% 30%, #3b1d6e, #0d0620)',
              }}
            >
              <img src={opt.image} alt={opt.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.15) 52%, transparent 100%)' }} />
              {isSelected && (
                <div style={{ position: 'absolute', top: 18, right: 18, width: 36, height: 36, borderRadius: '50%', background: '#7047E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 700 }}>✓</div>
              )}
              {/* Labels + content-type tags */}
              <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#F5F3F7', marginBottom: 6 }}>{opt.label}</div>
                <div style={{ fontSize: 16, color: 'rgba(245,243,247,0.75)', lineHeight: 1.4, marginBottom: 10 }}>{opt.sublabel}</div>
                {/* Content-type tags — display only, write nothing, help user see what's coming */}
                {tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {tags.map(tag => (
                      <span key={tag} style={{ fontSize: 12, fontWeight: 600, color: 'rgba(167,134,229,0.65)', background: 'rgba(112,71,226,0.18)', borderRadius: 999, padding: '3px 10px', letterSpacing: '0.05em' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation + buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, zIndex: 1 }}>
        {selectedOpt && (
          <div style={{ fontSize: 20, color: '#A786E5', fontWeight: 500, background: 'rgba(112,71,226,0.15)', border: '1px solid rgba(112,71,226,0.3)', borderRadius: 40, padding: '10px 28px' }}>
            ✦ {selectedOpt.confirmationText}
          </div>
        )}
        {selected && (
          <button tabIndex={-1} onClick={handleDone} style={{ padding: '18px 52px', fontSize: 22, fontWeight: 700, background: 'linear-gradient(135deg, #7047E2 0%, #A786E5 100%)', color: '#fff', border: 'none', borderRadius: 50, cursor: 'pointer', boxShadow: '0 4px 24px rgba(112,71,226,0.45)', outline: focusIdx === cardCount ? '3px solid #A786E5' : 'none', outlineOffset: 4 }}>
            Next
          </button>
        )}
        <button tabIndex={-1} onClick={onSkip} style={{ padding: '18px 40px', fontSize: 20, fontWeight: 500, background: 'transparent', color: 'rgba(167,134,229,0.7)', border: '1px solid rgba(167,134,229,0.3)', borderRadius: 50, cursor: 'pointer', outline: focusIdx === totalSlots - 1 ? '3px solid #A786E5' : 'none', outlineOffset: 4 }}>
          Skip for now
        </button>
      </div>
      <div style={{ marginTop: 10, fontSize: 15, color: 'rgba(167,134,229,0.4)', zIndex: 1 }}>
        You can skip — your feed sharpens as you watch, and you can set this up anytime.
      </div>
    </div>
  );
}
