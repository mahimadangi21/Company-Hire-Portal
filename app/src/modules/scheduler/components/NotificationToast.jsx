/**
 * NotificationToast.jsx
 * Enterprise toast notification stack.
 * Auto-dismiss, progress bar, undo action support.
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useSchedulerContext, ACTIONS } from '../store/schedulerReducer.js';

const ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  error:   XCircle,
  info:    Info,
};

const COLORS = {
  success: { bg: 'rgba(16,185,129,0.1)',  border: '#10b981', icon: '#10b981', text: '#065f46' },
  warning: { bg: 'rgba(245,158,11,0.1)',  border: '#f59e0b', icon: '#f59e0b', text: '#78350f' },
  error:   { bg: 'rgba(239,68,68,0.1)',   border: '#ef4444', icon: '#ef4444', text: '#7f1d1d' },
  info:    { bg: 'rgba(14,45,123,0.08)',  border: '#0E2D7B', icon: '#0E2D7B', text: '#0E2D7B' },
};

const DURATION = 4000;

function ToastItem({ notification, onDismiss }) {
  const [progress, setProgress] = useState(100);
  const Icon   = ICONS[notification.type] || Info;
  const colors = COLORS[notification.type] || COLORS.info;

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sched-toast" style={{ borderLeftColor: colors.border, backgroundColor: colors.bg }}>
      <div className="sched-toast__body">
        <Icon size={16} color={colors.icon} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span className="sched-toast__message" style={{ color: colors.text }}>
          {notification.message}
        </span>
      </div>
      {notification.action && (
        <button className="sched-toast__action" onClick={notification.action.handler}>
          {notification.action.label}
        </button>
      )}
      <button className="sched-toast__close" onClick={() => onDismiss(notification.id)}>
        <X size={14} />
      </button>
      <div
        className="sched-toast__progress"
        style={{ width: `${progress}%`, backgroundColor: colors.border }}
      />
    </div>
  );
}

export default function NotificationToast() {
  const { state, dispatch } = useSchedulerContext();

  const dismiss = (id) =>
    dispatch({ type: ACTIONS.DISMISS_NOTIFICATION, payload: id });

  if (!state.notifications.length) return null;

  return (
    <div className="sched-toast-stack" role="region" aria-label="Notifications" aria-live="polite">
      {state.notifications.map(n => (
        <ToastItem key={n.id} notification={n} onDismiss={dismiss} />
      ))}
    </div>
  );
}
