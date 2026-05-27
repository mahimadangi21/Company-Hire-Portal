/**
 * KeyboardShortcutsModal.jsx
 * Accessible help overlay displaying scheduler keyboard controls.
 */

import React, { useEffect, memo } from 'react';
import { X, Calendar, ArrowLeftRight, FilePlus, HelpCircle } from 'lucide-react';

const SHORTCUT_GROUPS = [
  {
    title: 'Navigation',
    icon: Calendar,
    items: [
      { keys: ['T'], label: 'Jump to today' },
      { keys: ['←', '→'], label: 'Navigate previous / next period' },
    ],
  },
  {
    title: 'Calendar Views',
    icon: ArrowLeftRight,
    items: [
      { keys: ['D'], label: 'Switch to Day view' },
      { keys: ['W'], label: 'Switch to Week view' },
      { keys: ['M'], label: 'Switch to Month view' },
    ],
  },
  {
    title: 'Scheduling Commands',
    icon: FilePlus,
    items: [
      { keys: ['N'], label: 'Open Schedule Interview modal' },
      { keys: ['?'], label: 'Toggle help shortcut panel' },
      { keys: ['ESC'], label: 'Close open modal or side drawer' },
    ],
  },
];

const KeyboardShortcutsModal = memo(({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Keyboard Shortcuts" onClick={onClose}>
      <div 
        className="modal-container shortcuts-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '460px' }}
      >
        <div className="modal-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle size={18} className="text-primary" style={{ color: 'var(--brand-navy)' }} />
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.05rem' }}>Keyboard Shortcuts</h2>
              <p className="modal-subtitle" style={{ fontSize: '0.75rem' }}>Scheduler commands for power users</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close shortcuts help">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {SHORTCUT_GROUPS.map((group, gIdx) => {
            const GroupIcon = group.icon;
            return (
              <div key={gIdx} className="shortcuts-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.75rem' }}>
                  <GroupIcon size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {group.title}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {group.items.map((item, iIdx) => (
                    <div key={iIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--text-main)' }}>{item.label}</span>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        {item.keys.map((key, kIdx) => (
                          <kbd 
                            key={kIdx} 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '22px',
                              height: '22px',
                              padding: '0 5px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: 'var(--text-main)',
                              backgroundColor: 'var(--gray-50)',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              boxShadow: '0 1.5px 0 var(--border)',
                              fontFamily: 'inherit'
                            }}
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-footer" style={{ padding: '0.875rem 1.5rem', justifyContent: 'flex-end', background: 'var(--gray-50)' }}>
          <button className="btn btn-primary" onClick={onClose} style={{ fontSize: '0.75rem', padding: '0.375rem 0.875rem' }}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
});

KeyboardShortcutsModal.displayName = 'KeyboardShortcutsModal';

export default KeyboardShortcutsModal;
