"use client";

/**
 * TechnicalScheduler.jsx
 * Thin page wrapper — mounts SchedulerProvider + SchedulerApp.
 * All logic lives inside the scheduler module.
 */

import React from 'react';
import { SchedulerProvider } from '../modules/scheduler/store/schedulerReducer.js';
import dynamic from 'next/dynamic';

const SchedulerApp = dynamic(
  () => import('../modules/scheduler/index').then((mod) => mod.SchedulerApp),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading scheduler component...
      </div>
    )
  }
);

export default function TechnicalScheduler() {
  return (
    <SchedulerProvider>
      <SchedulerApp />
    </SchedulerProvider>
  );
}
