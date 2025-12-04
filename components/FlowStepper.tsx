import React from 'react';
import { motion } from 'framer-motion';

export type FlowStepId = 'evidence' | 'context' | 'patterns' | 'options' | 'tests' | 'judgement' | 'explanation';

const STEPS: { id: FlowStepId; label: string }[] = [
  { id: 'evidence', label: 'Evidence' },
  { id: 'context', label: 'Context' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'options', label: 'Options' },
  { id: 'tests', label: 'Tests' },
  { id: 'judgement', label: 'Judgement' },
  { id: 'explanation', label: 'Explanation' },
];

type FlowStepperProps = {
  activeStep: FlowStepId;
  onStepChange: (step: FlowStepId) => void;
  accentColor: string;
};

export function FlowStepper({ activeStep, onStepChange, accentColor }: FlowStepperProps) {
  return (
    <div className="relative w-full bg-white px-4 pb-8 pt-0 rounded-b-2xl border border-t-0 border-slate-200 shadow-sm overflow-hidden sm:px-8 z-10">
      <div className="relative mx-auto mt-2 max-w-3xl">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Reasoning Chain
        </div>

        <div className="absolute top-3 left-0 h-1 w-full bg-slate-100 rounded-full" />

        <motion.div
          className="absolute top-3 left-0 z-0 h-1 w-32 rounded-full opacity-60"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
          animate={{ left: ['-20%', '110%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />

        <div className="relative z-10 flex justify-between w-full">
          {STEPS.map((step) => {
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => onStepChange(step.id)}
                className="flex flex-col items-center gap-3 group focus:outline-none pt-2"
              >
                <div
                  className={`flex h-3 w-3 items-center justify-center rounded-full transition-all duration-300 z-20 ${
                    isActive ? 'scale-150 ring-4 ring-white' : 'bg-slate-300 group-hover:bg-slate-400'
                  }`}
                  style={{ backgroundColor: isActive ? accentColor : undefined }}
                />

                <span
                  className={`text-[10px] font-bold uppercase tracking-wide transition-colors duration-200 ${
                    isActive ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
