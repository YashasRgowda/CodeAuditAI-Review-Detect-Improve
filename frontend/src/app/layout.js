'use client'
// File: src/app/layout.js - REPLACE ENTIRE FILE
import { AuthProvider } from '@/context/AuthContext';
import { SessionProvider } from 'next-auth/react';
import './globals.css';


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  )
}