"use client";

/**
 * teamsProvider.js
 * Microsoft Teams calendar provider.
 * Mock mode: returns realistic mock data.
 * Production mode: implement real MS Graph API calls here.
 *
 * To enable real API: replace mock functions with actual fetch() calls to
 * https://graph.microsoft.com/v1.0/me/events
 */

const MOCK_DELAY = 300;
const mock = (data) => new Promise(resolve => setTimeout(() => resolve(data), MOCK_DELAY));

const generateTeamsLink = () =>
  `https://teams.microsoft.com/l/meetup-join/19%3ameeting_${
    Math.random().toString(36).slice(2, 18)
  }%40thread.v2/0?context=%7B%22Tid%22%3A%22${
    Math.random().toString(36).slice(2, 10)
  }%22%7D`;

export const teamsProvider = {
  id:   'teams',
  name: 'Microsoft Teams',
  icon: 'teams',
  color: '#6264A7',

  /**
   * Create a new Teams meeting.
   * @param {{ title, date, time, duration, attendees, notes }} data
   * @returns {{ id, link, joinUrl, platform, dialIn }}
   */
  async createMeeting({ title, date, time, duration, attendees, notes }) {
    // Production: POST https://graph.microsoft.com/v1.0/me/onlineMeetings
    return mock({
      id:       `teams-${Date.now()}`,
      link:     generateTeamsLink(),
      joinUrl:  generateTeamsLink(),
      platform: 'teams',
      dialIn:   `+1 (555) 000-${Math.floor(Math.random() * 9000 + 1000)}`,
      createdAt: new Date().toISOString(),
    });
  },

  /**
   * Update an existing meeting.
   * @param {string} meetingId
   * @param {Object} updates
   */
  async updateMeeting(meetingId, updates) {
    // Production: PATCH https://graph.microsoft.com/v1.0/me/onlineMeetings/{id}
    return mock({ id: meetingId, updated: true, ...updates });
  },

  /**
   * Cancel/delete a meeting.
   * @param {string} meetingId
   */
  async cancelMeeting(meetingId) {
    // Production: DELETE https://graph.microsoft.com/v1.0/me/onlineMeetings/{id}
    return mock({ id: meetingId, cancelled: true });
  },

  /**
   * Sync attendee availability from Microsoft Graph.
   * @param {{ emails: string[], startDate: string, endDate: string }} config
   */
  async syncAvailability({ emails, startDate, endDate }) {
    // Production: POST https://graph.microsoft.com/v1.0/me/getSchedule
    return mock({
      scheduleItems: emails.map(email => ({
        scheduleId: email,
        availabilityView: '0000000000000000', // mock: all free
      })),
    });
  },
};

