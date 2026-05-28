"use client";

/**
 * googleProvider.js
 * Google Meet / Google Calendar provider.
 * Mock mode: returns realistic mock data.
 * Production mode: implement real Google Calendar API calls here.
 *
 * To enable real API: use OAuth2 + fetch to
 * https://www.googleapis.com/calendar/v3/calendars/primary/events
 */

const MOCK_DELAY = 280;
const mock = (data) => new Promise(resolve => setTimeout(() => resolve(data), MOCK_DELAY));

const generateMeetCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${seg(3)}-${seg(4)}-${seg(3)}`;
};

export const googleProvider = {
  id:    'google',
  name:  'Google Meet',
  icon:  'google',
  color: '#1A73E8',

  /**
   * Create a Google Meet / Calendar event.
   * @param {{ title, date, time, duration, attendees, notes }} data
   */
  async createMeeting({ title, date, time, duration, attendees, notes }) {
    // Production:
    // POST https://www.googleapis.com/calendar/v3/calendars/primary/events
    // Body: { summary: title, start: { dateTime }, end: { dateTime }, attendees, conferenceData }
    const code = generateMeetCode();
    return mock({
      id:       `gcal-${Date.now()}`,
      link:     `https://meet.google.com/${code}`,
      joinUrl:  `https://meet.google.com/${code}`,
      platform: 'google',
      dialIn:   null,
      createdAt: new Date().toISOString(),
    });
  },

  /**
   * Update a Google Calendar event.
   * @param {string} eventId
   * @param {Object} updates
   */
  async updateMeeting(eventId, updates) {
    // Production: PATCH https://www.googleapis.com/calendar/v3/calendars/primary/events/{eventId}
    return mock({ id: eventId, updated: true, ...updates });
  },

  /**
   * Delete a Google Calendar event.
   * @param {string} eventId
   */
  async cancelMeeting(eventId) {
    // Production: DELETE https://www.googleapis.com/calendar/v3/calendars/primary/events/{eventId}
    return mock({ id: eventId, cancelled: true });
  },

  /**
   * Sync availability via Google Calendar free/busy.
   * @param {{ emails, startDate, endDate }} config
   */
  async syncAvailability({ emails, startDate, endDate }) {
    // Production: POST https://www.googleapis.com/calendar/v3/freeBusy
    return mock({
      calendars: Object.fromEntries(emails.map(e => [e, { busy: [] }])),
    });
  },
};

