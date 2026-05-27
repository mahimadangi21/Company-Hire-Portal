/**
 * zoomProvider.js
 * Zoom Video Conferencing provider.
 * Mock mode: returns realistic mock data.
 * Production mode: implement real Zoom API calls here.
 *
 * To enable real API: use OAuth JWT + fetch to
 * https://api.zoom.us/v2/users/me/meetings
 */

const MOCK_DELAY = 250;
const mock = (data) => new Promise(resolve => setTimeout(() => resolve(data), MOCK_DELAY));

const generateZoomId = () => Math.floor(Math.random() * 9e9 + 1e9).toString();
const generateZoomPassword = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const zoomProvider = {
  id:    'zoom',
  name:  'Zoom',
  icon:  'zoom',
  color: '#2D8CFF',

  /**
   * Create a Zoom meeting.
   * @param {{ title, date, time, duration, attendees, notes }} data
   */
  async createMeeting({ title, date, time, duration }) {
    // Production: POST https://api.zoom.us/v2/users/me/meetings
    const id       = generateZoomId();
    const password = generateZoomPassword();
    return mock({
      id:       `zoom-${id}`,
      link:     `https://zoom.us/j/${id}?pwd=${password}`,
      joinUrl:  `https://zoom.us/j/${id}`,
      platform: 'zoom',
      password,
      dialIn:   `+1 (669) 900-6833`,
      meetingId: id,
      createdAt: new Date().toISOString(),
    });
  },

  /**
   * Update a Zoom meeting.
   * @param {string} meetingId
   * @param {Object} updates
   */
  async updateMeeting(meetingId, updates) {
    // Production: PATCH https://api.zoom.us/v2/meetings/{meetingId}
    return mock({ id: meetingId, updated: true, ...updates });
  },

  /**
   * Delete a Zoom meeting.
   * @param {string} meetingId
   */
  async cancelMeeting(meetingId) {
    // Production: DELETE https://api.zoom.us/v2/meetings/{meetingId}
    return mock({ id: meetingId, cancelled: true });
  },

  /**
   * Sync availability (Zoom does not natively support this).
   * Falls back to no-op.
   */
  async syncAvailability() {
    return mock({ message: 'Zoom does not support calendar availability sync.' });
  },
};
