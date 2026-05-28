"use client";

/**
 * CalendarEventCard.jsx
 * Draggable, resizable event block for the calendar grid.
 * Memoized to prevent re-renders during drag operations.
 * Pixel-positioned via inline dynamic styles (top/height/left/width only).
 */

import React, { memo } from 'react';
import { Video, Users, ExternalLink, GripVertical, MapPin, Laptop } from 'lucide-react';
import { formatTime, formatDuration, getEventTop, getEventHeight } from '../utils/calendarUtils.js';
import { useSchedulerContext } from '../store/schedulerReducer.js';

const PLATFORM_ICONS = {
  teams:    Laptop,
  google:   Video,
  zoom:     Video,
  inperson: MapPin,
};

const PLATFORM_COLORS = {
  teams:    '#6264A7',
  google:   '#1A73E8',
  zoom:     '#2D8CFF',
  inperson: '#64748b',
};

const STATUS_CLASSES = {
  scheduled:  'cal-event--scheduled',
  completed:  'cal-event--completed',
  cancelled:  'cal-event--cancelled',
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

const isEventNow = (date, time, duration = 60) => {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const eventStart = new Date(date);
    eventStart.setHours(hours, minutes, 0, 0);
    const eventEnd = new Date(eventStart.getTime() + duration * 60000);
    const now = new Date();
    return now >= eventStart && now <= eventEnd;
  } catch (e) {
    return false;
  }
};

// ─── Avatar Chip ──────────────────────────────────────────────────────────────

const PanelistAvatars = memo(({ panelistIds }) => {
  const { state } = useSchedulerContext();
  const { panelists: allPanelists } = state;
  const panelists = (panelistIds || [])
    .map(id => allPanelists.find(p => p.id === id))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="cal-event__avatars">
      {panelists.map((p, i) => (
        <div
          key={p.id}
          className="cal-event__avatar"
          title={p.name}
          style={{ backgroundColor: p.color, zIndex: panelists.length - i }}
        >
          {p.avatar}
        </div>
      ))}
      {(panelistIds?.length || 0) > 3 && (
        <div className="cal-event__avatar cal-event__avatar--more">
          +{panelistIds.length - 3}
        </div>
      )}
    </div>
  );
});

PanelistAvatars.displayName = 'PanelistAvatars';

// ─── Main Event Card ──────────────────────────────────────────────────────────

const CalendarEventCard = memo(({
  interview,
  col,
  totalCols,
  isDragging,
  isGhost,
  onDragStart,
  onDragEnd,
  onResizeStart,
  onClick,
}) => {
  const top      = getEventTop(interview);
  const height   = getEventHeight(interview.duration || 60);
  const colWidth = 100 / (totalCols || 1);
  const colLeft  = col * colWidth;

  const isCompact  = height < 48;
  const isVerySmall = height < 32;
  const platformColor = PLATFORM_COLORS[interview.platform] || PLATFORM_COLORS.teams;
  const statusClass   = STATUS_CLASSES[interview.status] || STATUS_CLASSES.scheduled;

  const PlatformIcon = PLATFORM_ICONS[interview.platform] || Laptop;
  const initials = getInitials(interview.candidate_name);
  const isNow = interview.status === 'scheduled' && isEventNow(interview.date, interview.time, interview.duration);

  // Dynamic layout styles (top/height are data-driven)
  const positionStyle = {
    top:    `${top}px`,
    height: `${height}px`,
    left:   `calc(${colLeft}% + 2px)`,
    width:  `calc(${colWidth}% - 4px)`,
    opacity: isGhost ? 0.3 : isDragging ? 0.85 : 1,
  };

  return (
    <div
      className={`cal-event ${statusClass} ${isDragging ? 'cal-event--dragging' : ''} ${isNow ? 'cal-event--active' : ''}`}
      style={{ ...positionStyle, '--platform-color': platformColor }}
      draggable={interview.status !== 'cancelled'}
      onDragStart={(e) => onDragStart?.(e, interview)}
      onDragEnd={onDragEnd}
      onClick={(e) => { e.stopPropagation(); onClick?.(interview.id); }}
      role="button"
      tabIndex={0}
      aria-label={`Interview: ${interview.candidate_name}, ${formatTime(interview.time)}, ${formatDuration(interview.duration)}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(interview.id)}
    >
      {/* Left accent bar (platform color) */}
      <div className="cal-event__accent" style={{ backgroundColor: platformColor }} />

      <div className="cal-event__content">
        {/* Candidate name & brand platform logo */}
        <div className="cal-event__name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className="cal-event__candidate-avatar" style={{
            width: '18px', height: '18px', borderRadius: '50%',
            backgroundColor: 'var(--brand-navy)', color: '#fff',
            fontSize: '0.62rem', fontWeight: 'bold', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            {initials}
          </div>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>
            {interview.candidate_name}
          </span>
          {isNow && (
            <span className="cal-event__pulse-dot" title="Happening now" />
          )}
        </div>

        {!isVerySmall && (
          <>
            {/* Time + Duration */}
            {!isCompact && (
              <div className="cal-event__meta" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <PlatformIcon size={10} style={{ opacity: 0.6 }} />
                <span>{formatTime(interview.time)} · {formatDuration(interview.duration)}</span>
              </div>
            )}

            {/* Round + template */}
            {!isCompact && (
              <div className="cal-event__tags">
                <span className="cal-event__tag">
                  Technical Interview
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Panelist avatars (right side) */}
      {!isCompact && (
        <div className="cal-event__footer">
          <PanelistAvatars panelistIds={interview.panelists} />
          {interview.meeting_link && interview.platform !== 'inperson' && (
            <a
              href={interview.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="cal-event__join"
              title={`Join ${interview.platform === 'teams' ? 'Teams' : interview.platform === 'google' ? 'Meet' : 'Zoom'}`}
              onClick={e => e.stopPropagation()}
            >
              Join
            </a>
          )}
        </div>
      )}

      {/* Drag grip icon */}
      {!isCompact && interview.status !== 'cancelled' && (
        <div className="cal-event__grip" title="Drag to reschedule">
          <GripVertical size={12} />
        </div>
      )}

      {/* Resize handle */}
      {interview.status !== 'cancelled' && (
        <div
          className="cal-event__resize-handle"
          onPointerDown={(e) => onResizeStart?.(e, interview)}
          title="Drag to resize duration"
          aria-label="Resize interview duration"
        />
      )}
    </div>
  );
});

CalendarEventCard.displayName = 'CalendarEventCard';

export default CalendarEventCard;
