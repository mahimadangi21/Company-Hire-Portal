"use client";

if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
  try {
    delete (globalThis as any).localStorage;
  } catch (e) {}
}

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider } from '@/components/admin/context/AppContext';
import Layout from '@/components/admin/Layout';
import '@/app/globals.css'; // Assume they share the main CSS

// Simple Next.js auth check wrapper replacing ProtectedRoute
function AdminRouteWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If we are on the login page, don't show the Layout (Sidebar/Nav)
  if (pathname.includes('/admin/login')) {
     return <AppProvider>{children}</AppProvider>;
  }

  // Note: Authentication is now handled securely by middleware.ts
  return (
    <AppProvider>
      <Layout>
        {children}
      </Layout>
    </AppProvider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminRouteWrapper>{children}</AdminRouteWrapper>;
}
