"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const session = sessionStorage.getItem('kl_admin_session');
      if (!session) {
        router.push('/admin/login');
      }
    }
  }, [router]);

  return <>{children}</>;
};

export default ProtectedRoute;
