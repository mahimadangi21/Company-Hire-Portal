/**
 * calendarProviders/index.js
 * Provider Factory — standardized abstraction over Teams / Google / Zoom / In-Person.
 * Swap mock → production by updating individual provider files.
 */

import { teamsProvider } from './teamsProvider.js';
import { googleProvider } from './googleProvider.js';
import { zoomProvider }   from './zoomProvider.js';

// ─── In-Person "provider" (no external API needed) ────────────────────────────

const inPersonProvider = {
  id:    'inperson',
  name:  'In Person',
  icon:  'inperson',
  color: '#64748b',

  async createMeeting({ title, date, time, duration }) {
    return {
      id:       `inperson-${Date.now()}`,
      link:     null,
      joinUrl:  null,
      platform: 'inperson',
      location: 'Conference Room A',
      createdAt: new Date().toISOString(),
    };
  },

  async updateMeeting(id, updates) { return { id, ...updates }; },
  async cancelMeeting(id)          { return { id, cancelled: true }; },
  async syncAvailability()         { return {}; },
};

// ─── Provider Registry ────────────────────────────────────────────────────────

const PROVIDERS = {
  teams:    teamsProvider,
  google:   googleProvider,
  zoom:     zoomProvider,
  inperson: inPersonProvider,
};

export const PLATFORM_OPTIONS = [
  { id: 'teams',    label: 'Microsoft Teams', color: '#6264A7' },
  { id: 'google',   label: 'Google Meet',     color: '#1A73E8' },
  { id: 'zoom',     label: 'Zoom',            color: '#2D8CFF' },
  { id: 'inperson', label: 'In Person',       color: '#64748b' },
];

// ─── Standardized API ─────────────────────────────────────────────────────────

/**
 * Get provider by platform id.
 * @param {'teams'|'google'|'zoom'|'inperson'} platform
 */
export const getProvider = (platform) => {
  const provider = PROVIDERS[platform];
  if (!provider) throw new Error(`Unknown platform: ${platform}`);
  return provider;
};

/**
 * Create a meeting on the given platform.
 * @param {string} platform
 * @param {Object} data - { title, date, time, duration, attendees, notes }
 * @returns {Promise<MeetingResult>}
 */
export const createMeeting = async (platform, data) => {
  const provider = getProvider(platform);
  return provider.createMeeting(data);
};

/**
 * Update a meeting on the given platform.
 */
export const updateMeeting = async (platform, meetingId, updates) => {
  const provider = getProvider(platform);
  return provider.updateMeeting(meetingId, updates);
};

/**
 * Cancel a meeting on the given platform.
 */
export const cancelMeeting = async (platform, meetingId) => {
  const provider = getProvider(platform);
  return provider.cancelMeeting(meetingId);
};

/**
 * Sync availability for given attendees.
 */
export const syncAvailability = async (platform, config) => {
  const provider = getProvider(platform);
  return provider.syncAvailability(config);
};
