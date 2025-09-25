// File: src/components/ui/Toast.js
'use client';
import { useState, useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const typeStyles = {
    success: 'bg-green-100 text-green-800 border-green-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-md border z-50 ${typeStyles[type]}`}>
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button 
          onClick={onClose}
          className="ml-4 text-xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}