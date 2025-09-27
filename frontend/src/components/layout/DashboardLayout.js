// File: src/components/layout/DashboardLayout.js
'use client';
import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileOverlay from './MobileOverlay';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header onToggleSidebar={toggleSidebar} />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          isCollapsed={sidebarCollapsed} 
          onToggleCollapse={toggleCollapse}
        />
        
        <MobileOverlay isOpen={sidebarOpen} onClose={closeSidebar} />
        
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}