'use client';
// analysis/compare/page.js — Compare two analysis results side by side
import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import ScoreGauge from '@/components/ui/ScoreGauge';
import Badge from '@/components/ui/Badge';
import { analysisApi } from '@/lib/api/analysis';
import { toast } from 'sonner';

export default function CompareAnalysisPage() {
  const [id1, setId1] = useState('');
  const [id2, setId2] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);

  const handleCompare = async () => {
    if (!id1 || !id2) return toast.error('Enter both analysis IDs');
    setLoading(true);
    try {
      const data = await analysisApi.compare(id1, id2);
      setComparison(data);
    } catch (e) {
      toast.error(e.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
            <GitCompare size={20} className="text-violet-400" />
            Compare Analyses
          </h1>
          <p className="text-sm text-white/35">Track improvement trends between two analysis runs</p>
        </div>

        <div className="glass-card p-5 flex items-end gap-4">
          <div className="flex-1">
            <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-1.5">Analysis ID (Before)</label>
            <input value={id1} onChange={e => setId1(e.target.value)} placeholder="e.g. 10"
              className="w-full bg-white/4 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>
          <ArrowRight size={18} className="text-white/20 shrink-0 mb-2.5" />
          <div className="flex-1">
            <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-1.5">Analysis ID (After)</label>
            <input value={id2} onChange={e => setId2(e.target.value)} placeholder="e.g. 20"
              className="w-full bg-white/4 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>
          <Button onClick={handleCompare} loading={loading} icon={GitCompare}>Compare</Button>
        </div>

        {comparison && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              {[{ label: 'Before', data: comparison.analysis1 || comparison.before }, { label: 'After', data: comparison.analysis2 || comparison.after }].map(({ label, data }) => (
                <div key={label} className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-white/60 mb-4">{label}</h3>
                  {data ? (
                    <>
                      <p className="text-xs text-white/50 mb-4 line-clamp-2">{data.summary}</p>
                      <div className="flex gap-4 flex-wrap">
                        <ScoreGauge score={data.overall_score > 10 ? data.overall_score : (data.overall_score || 0) * 10} label="Overall" size={64} />
                        <ScoreGauge score={data.security_score || 0} label="Security" size={64} />
                        <ScoreGauge score={data.maintainability_score || 0} label="Maintain" size={64} />
                      </div>
                    </>
                  ) : <p className="text-xs text-white/30">No data</p>}
                </div>
              ))}
            </div>
            {comparison.improvements && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white/70 mb-3">Improvements</h3>
                <pre className="text-xs text-white/50 font-mono">{JSON.stringify(comparison.improvements, null, 2)}</pre>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
