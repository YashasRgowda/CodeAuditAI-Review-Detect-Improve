'use client';
// DashboardLayout.js — Main authenticated layout (Sidebar + Header + content area)
// Uses 'use client' only to render Sidebar/Header; children are server-rendered.
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#080808]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
