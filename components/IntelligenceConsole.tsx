import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';

export type BranchId = 'spatial' | 'dm' | 'monitoring';

export type BranchFeature = {
  title: string;
  detail: string;
  icon: LucideIcon;
};

export type Branch = {
  id: BranchId;
  name: string;
  label: string;
  summary: string;
  engineUse: string;
  features: BranchFeature[];
  accent: string;
};

type IntelligenceConsoleProps = {
  branches: Branch[];
  activeId: BranchId;
  onChange: (id: BranchId) => void;
};

export function IntelligenceConsole({ branches, activeId, onChange }: IntelligenceConsoleProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return (
      <div className="space-y-3">
        {branches.map((branch) => {
          const isActive = branch.id === activeId;
          return (
            <div key={branch.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                className="w-full px-4 py-3 text-left"
                onClick={() => onChange(branch.id)}
                aria-expanded={isActive}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{branch.name}</p>
                    <p className="text-xs text-slate-600">{branch.label}</p>
                  </div>
                  <span className="text-[12px]" style={{ color: branch.accent }}>
                    {isActive ? 'Hide' : 'Inspect'}
                  </span>
                </div>
              </button>
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-slate-200 px-4 py-4 space-y-3"
                  >
                    <BranchDetail branch={branch} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    );
  }

  const active = branches.find((b) => b.id === activeId) || branches[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] items-start">
      <div className="space-y-3">
        {branches.map((branch) => (
          <button
            key={branch.id}
            type="button"
            onClick={() => onChange(branch.id)}
            className={`w-full rounded-2xl border px-4 py-4 text-left transition shadow-sm ${
              branch.id === activeId ? 'bg-white' : 'bg-white/80 hover:bg-white'
            }`}
            style={{
              borderColor: branch.id === activeId ? branch.accent : '#e2e8f0',
            }}
            aria-pressed={branch.id === activeId}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">{branch.name}</p>
                <p className="text-xs text-slate-600">{branch.label}</p>
              </div>
              <span className="rounded-full px-2 py-1 text-[0.65rem] font-semibold" style={{ background: `${branch.accent}1a`, color: branch.accent }}>
                Inspect
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(18,23,38,0.12)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: active.accent }}>
                  {active.name}
                </p>
                <p className="text-xs font-medium text-slate-600">{active.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{active.summary}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <FeatureGrid features={active.features} accent={active.accent} />
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-[#f9fafb] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-800">How it uses the engine</p>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700">{active.engineUse}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function FeatureGrid({ features, accent }: { features: BranchFeature[]; accent: string }) {
  return (
    <div className="grid gap-3">
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <motion.div
            key={feature.title}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm flex gap-3 items-start"
          >
            <div className="mt-1 rounded-lg" style={{ color: accent }}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{feature.title}</p>
              <p className="text-xs text-slate-600 mt-1">{feature.detail}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function BranchDetail({ branch }: { branch: Branch }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-slate-600">{branch.label}</p>
      <p className="text-sm leading-relaxed text-slate-700">{branch.summary}</p>
      <FeatureGrid features={branch.features} accent={branch.accent} />
      <div className="rounded-2xl border border-slate-200 bg-[#f9fafb] px-3 py-3 text-xs text-slate-700">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-800">How it uses the engine</p>
        <p className="mt-1">{branch.engineUse}</p>
      </div>
    </div>
  );
}
