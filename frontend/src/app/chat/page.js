'use client';
// chat/page.js — Conversational AI Review Chat
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, MessageSquare, Plus, Sparkles } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { chatApi } from '@/lib/api/chat';
import { toast } from 'sonner';

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-cyan-400"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'bg-violet-600/20 border border-violet-500/30' : 'bg-cyan-500/15 border border-cyan-500/25'
      }`}>
        {isUser ? <User size={13} className="text-violet-400" /> : <Bot size={13} className="text-cyan-400" />}
      </div>
      <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-violet-600/20 text-white/85 rounded-tr-md border border-violet-500/20'
            : 'bg-white/4 text-white/75 rounded-tl-md border border-white/8'
        }`}>
          {message.content}
        </div>
        <span className="text-xs text-white/20 px-1">{isUser ? 'You' : 'CodeAuditAI'}</span>
      </div>
    </motion.div>
  );
}

const SUGGESTIONS = [
  'Explain the security concern in more detail',
  'How should I fix the performance issue?',
  'What is the risk level and why?',
  'Show me best practices for this pattern',
  'Summarize all critical issues',
];

function ChatInner() {
  const searchParams = useSearchParams();
  const initialSession = searchParams.get('session');

  const [sessionId, setSessionId] = useState(initialSession || '');
  const [analysisId, setAnalysisId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;
    chatApi.history(sessionId)
      .then(data => setMessages(data.messages || []))
      .catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleStart = async () => {
    if (!analysisId) return toast.error('Enter an analysis ID to start chat');
    setStarting(true);
    try {
      const data = await chatApi.start(parseInt(analysisId));
      setSessionId(data.session_id);
      setMessages([{ role: 'assistant', content: data.initial_message || "Hi! I've loaded the analysis context. What would you like to know about this code review?" }]);
      toast.success('Chat session started!');
    } catch (e) {
      toast.error(e.message || 'Could not start chat');
    } finally {
      setStarting(false);
    }
  };

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || !sessionId) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await chatApi.message(sessionId, msg);
      setMessages(prev => [...prev, { role: 'assistant', content: res.response }]);
    } catch {
      toast.error('Failed to get response');
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              <Bot size={20} className="text-cyan-400" />AI Chat
            </h1>
            <p className="text-sm text-white/35">Ask follow-up questions about any code review</p>
          </div>
          {sessionId && (
            <div className="flex items-center gap-2 text-xs text-white/30 bg-white/4 border border-white/8 rounded-lg px-3 py-1.5 font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {sessionId.slice(0, 20)}...
            </div>
          )}
        </div>

        {!sessionId && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={28} className="text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Start a Chat Session</h2>
            <p className="text-sm text-white/40 mb-6 max-w-sm mx-auto">
              Enter an analysis ID to chat with AI about that specific code review.
            </p>
            <div className="flex items-center gap-3 max-w-sm mx-auto">
              <input
                value={analysisId}
                onChange={e => setAnalysisId(e.target.value)}
                placeholder="Analysis ID (e.g. 42)"
                className="flex-1 bg-white/4 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all"
              />
              <Button onClick={handleStart} loading={starting} variant="ai" icon={Plus}>Start</Button>
            </div>
          </motion.div>
        )}

        {sessionId && (
          <div className="flex-1 flex flex-col glass-card overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Sparkles size={28} className="text-cyan-400/40 mb-3" />
                  <p className="text-sm text-white/30">Session ready. Ask anything about the code review.</p>
                </div>
              )}
              {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
                    <Bot size={13} className="text-cyan-400" />
                  </div>
                  <div className="bg-white/4 border border-white/8 rounded-2xl rounded-tl-md"><TypingDots /></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {messages.length < 3 && (
              <div className="px-4 py-2 border-t border-white/4 flex gap-2 overflow-x-auto">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => handleSend(s)}
                    className="shrink-0 text-xs text-white/40 hover:text-white/70 bg-white/3 hover:bg-white/6 border border-white/8 rounded-full px-3 py-1.5 transition-all cursor-pointer whitespace-nowrap">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="p-4 border-t border-white/6">
              <div className="flex items-end gap-3">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Ask about this code review... (Enter to send)"
                  rows={1}
                  className="flex-1 bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 transition-all resize-none"
                />
                <Button onClick={() => handleSend()} disabled={!input.trim() || loading} variant="ai" icon={Send} className="shrink-0">Send</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#080808]"><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>}>
      <ChatInner />
    </Suspense>
  );
}
