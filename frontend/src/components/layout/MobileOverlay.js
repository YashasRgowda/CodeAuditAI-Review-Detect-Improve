// File: src/components/layout/MobileOverlay.js
'use client';

export default function MobileOverlay({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden" 
      onClick={onClose}
    />
  );
}