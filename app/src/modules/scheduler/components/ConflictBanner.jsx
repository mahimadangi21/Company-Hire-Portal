/**
 * ConflictBanner.jsx
 * Inline conflict display with severity-based styling.
 * Shows all conflicts with suggestions and override controls.
 */

import React from 'react';
import { AlertTriangle, XCircle, Info, ChevronRight } from 'lucide-react';
import { CONFLICT_SEVERITY } from '../utils/conflictUtils.js';

const CONFIG = {
  [CONFLICT_SEVERITY.HARD]: {
    icon:       XCircle,
    className:  'conflict-banner--hard',
    label:      'HARD CONFLICT',
  },
  [CONFLICT_SEVERITY.SOFT]: {
    icon:       AlertTriangle,
    className:  'conflict-banner--soft',
    label:      'WARNING',
  },
  [CONFLICT_SEVERITY.INFO]: {
    icon:       Info,
    className:  'conflict-banner--info',
    label:      'NOTE',
  },
};

function ConflictItem({ conflict, onUseSuggestion }) {
  const cfg  = CONFIG[conflict.severity];
  const Icon = cfg.icon;

  return (
    <div className={`conflict-item ${cfg.className}`}>
      <div className="conflict-item__header">
        <Icon size={14} className="conflict-item__icon" />
        <span className="conflict-item__label">{cfg.label}</span>
      </div>
      <p className="conflict-item__message">{conflict.message}</p>
      {conflict.detail && (
        <p className="conflict-item__detail">{conflict.detail}</p>
      )}
      {conflict.suggestion && onUseSuggestion && (
        <button
          className="conflict-item__suggestion"
          onClick={() => onUseSuggestion(conflict.suggestion)}
        >
          <ChevronRight size={12} />
          Use suggested time: {conflict.suggestion}
        </button>
      )}
    </div>
  );
}

export default function ConflictBanner({ conflicts, onUseSuggestion }) {
  if (!conflicts?.length) return null;

  const hard = conflicts.filter(c => c.severity === CONFLICT_SEVERITY.HARD);
  const soft = conflicts.filter(c => c.severity === CONFLICT_SEVERITY.SOFT);
  const info = conflicts.filter(c => c.severity === CONFLICT_SEVERITY.INFO);

  return (
    <div className="conflict-banner" role="alert">
      <div className="conflict-banner__list">
        {hard.map((c, i) => (
          <ConflictItem key={`hard-${i}`} conflict={c} onUseSuggestion={onUseSuggestion} />
        ))}
        {soft.map((c, i) => (
          <ConflictItem key={`soft-${i}`} conflict={c} onUseSuggestion={onUseSuggestion} />
        ))}
        {info.map((c, i) => (
          <ConflictItem key={`info-${i}`} conflict={c} onUseSuggestion={onUseSuggestion} />
        ))}
      </div>
    </div>
  );
}
