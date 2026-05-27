/**
 * TechnicalScheduler.jsx
 * Thin page wrapper — mounts SchedulerProvider + SchedulerApp.
 * All logic lives inside the scheduler module.
 */

import React from 'react';
import { SchedulerProvider } from '../modules/scheduler/store/schedulerReducer.js';
import { SchedulerApp }      from '../modules/scheduler/index.jsx';

export default function TechnicalScheduler() {
  return (
    <SchedulerProvider>
      <SchedulerApp />
    </SchedulerProvider>
  );
}
