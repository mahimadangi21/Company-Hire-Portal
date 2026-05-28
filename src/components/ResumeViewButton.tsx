"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import StandardResume from '@/components/admin/StandardResume';

export function ResumeViewButton({ candidate }: { candidate: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modalContent = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '2rem'
    }} onClick={() => setIsOpen(false)}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '850px' }}>
        <StandardResume 
          candidate={candidate} 
          onClose={() => setIsOpen(false)} 
          readOnly={true} 
        />
      </div>
    </div>
  );

  return (
    <>
      <button
        className="btn btn-outline hover-scale"
        style={{ 
          padding: '2px 8px', 
          fontSize: '0.68rem', 
          height: '22px', 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer',
          marginLeft: 'auto',
          backgroundColor: '#fff',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          color: 'var(--brand-navy)',
          fontWeight: '600'
        }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
        View Resume
      </button>

      {mounted && isOpen && typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
}
