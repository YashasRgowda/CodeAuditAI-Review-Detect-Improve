'use client';
// settings/page.js — User settings and account management
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { User, Key, Bell, LogOut, Github, Shield } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Settings</h1>
          <p className="text-sm text-white/35">Manage your account and preferences</p>
        </div>

        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h2 className="text-sm font-semibold text-white/70 flex items-center gap-2 mb-5">
            <User size={15} /> Profile
          </h2>
          {session?.user && (
            <div className="flex items-center gap-4">
              <img
                src={session.user.image}
                alt={session.user.name}
                className="w-16 h-16 rounded-2xl border border-white/10"
              />
              <div>
                <p className="font-semibold text-white">{session.user.name}</p>
                <p className="text-sm text-white/40">{session.user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="violet">
                    <Github size={11} className="mr-1" />
                    GitHub Connected
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* AI Features status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h2 className="text-sm font-semibold text-white/70 flex items-center gap-2 mb-5">
            <Shield size={15} /> AI Features Status
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Streaming Analysis',         status: 'active' },
              { label: 'Multi-Agent (3 Agents)',      status: 'active' },
              { label: 'Conversational AI Chat',      status: 'active' },
              { label: 'RAG Knowledge Base',          status: 'active' },
              { label: 'Auto-Fix Generation',         status: 'active' },
            ].map(feat => (
              <div key={feat.label} className="flex items-center justify-between py-2 border-b border-white/4 last:border-0">
                <span className="text-sm text-white/60">{feat.label}</span>
                <Badge variant="emerald" dot>Active</Badge>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Danger zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 border-red-500/15">
          <h2 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-4">
            <LogOut size={15} /> Sign Out
          </h2>
          <p className="text-xs text-white/35 mb-4">You will be redirected to the login page.</p>
          <Button
            variant="danger"
            icon={LogOut}
            onClick={() => signOut({ callbackUrl: '/auth' })}
          >
            Sign Out
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
