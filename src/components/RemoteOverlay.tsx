function dispatch(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

const btnBase: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 12,
  border: '1px solid rgba(167,134,229,0.3)',
  background: 'rgba(30,18,54,0.75)',
  color: '#F5F3F7',
  fontSize: 20,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none',
  transition: 'background 0.15s',
};

const wideBtn: React.CSSProperties = {
  ...btnBase,
  width: 116,
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: 0.4,
};

const okBtn: React.CSSProperties = {
  ...btnBase,
  width: 56,
  height: 56,
  borderRadius: '50%',
  background: 'rgba(112,71,226,0.55)',
  fontWeight: 700,
  fontSize: 14,
  letterSpacing: 0.4,
};

import React from 'react';

export default function RemoteOverlay() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 8000,
        background: 'rgba(10,6,22,0.82)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(112,71,226,0.25)',
        borderRadius: 20,
        padding: '18px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        scale: '0.8',
        transformOrigin: 'bottom right',
      }}
    >
      {/* Up */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button style={btnBase} onClick={() => dispatch('ArrowUp')} tabIndex={-1}>▲</button>
      </div>

      {/* Left / OK / Right */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button style={btnBase} onClick={() => dispatch('ArrowLeft')} tabIndex={-1}>◀</button>
        <button style={okBtn} onClick={() => dispatch('Enter')} tabIndex={-1}>OK</button>
        <button style={btnBase} onClick={() => dispatch('ArrowRight')} tabIndex={-1}>▶</button>
      </div>

      {/* Down */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button style={btnBase} onClick={() => dispatch('ArrowDown')} tabIndex={-1}>▼</button>
      </div>

      {/* Back + Restart */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button style={wideBtn} onClick={() => dispatch('Backspace')} tabIndex={-1}>
          ← Back
        </button>
        <button style={wideBtn} onClick={() => dispatch('r')} tabIndex={-1}>
          ⟳ Restart
        </button>
      </div>
    </div>
  );
}
