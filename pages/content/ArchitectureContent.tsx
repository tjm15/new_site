import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Layers, ShieldCheck, Cpu, ArrowUp } from 'lucide-react';

import { ModuleCard } from '../../components/ModuleCard';
import { MarkdownContent } from '../../components/MarkdownContent';
import {
  ARCHITECTURE_GROUPS,
  ARCHITECTURE_MODULES,
  ArchitectureCategory,
  ArchitectureModule,
  ArchitectureModuleId,
} from '../../data/architectureModules';

const LAYER_ICONS: Record<ArchitectureCategory, any> = {
  application: Layers,
  orchestration: Cpu,
  senses: Eye,
  governance: ShieldCheck,
};

const LAYER_COLORS: Record<ArchitectureCategory, string> = {
  application: 'text-blue-600 bg-blue-50 border-blue-200',
  orchestration: 'text-amber-600 bg-amber-50 border-amber-200',
  senses: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  governance: 'text-slate-600 bg-slate-50 border-slate-200',
};

export function ArchitectureContent() {
  const [activeModuleId, setActiveModuleId] = React.useState<ArchitectureModuleId | null>(null);
  const activeModule = ARCHITECTURE_MODULES.find((m) => m.id === activeModuleId) || null;

  const stackOrder: ArchitectureCategory[] = ['application', 'orchestration', 'senses'];

  return (
    <div className="relative max-w-5xl mx-auto">
      <div className="mb-16 text-center max-w-2xl mx-auto">
        <p className="text-lg text-slate-600 leading-relaxed">
          The Planner’s Assistant is a <strong>Layered Cognitive Stack</strong>. It separates raw evidence (Senses) from
          reasoning (Orchestration) and final judgement (Applications), ensuring every output is grounded, explainable, and safe.
        </p>
      </div>

      <div className="relative space-y-12 pb-24">
        <div className="absolute left-8 top-8 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-amber-200 to-emerald-200 hidden md:block" />

        {stackOrder.map((cat, index) => {
          const group = ARCHITECTURE_GROUPS[cat];
          const modules = ARCHITECTURE_MODULES.filter((m) => m.category === cat);
          const Icon = LAYER_ICONS[cat];

          return (
            <motion.section
              key={cat}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-0 md:pl-24"
            >
              <div className="absolute left-0 top-0 hidden md:flex flex-col items-center w-16">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 z-10 bg-white shadow-sm ${LAYER_COLORS[cat]}`}
                >
                  <Icon size={24} />
                </div>
                {index < stackOrder.length - 1 && (
                  <div className="mt-2">
                    <ArrowUp size={16} className="text-slate-300 animate-bounce" />
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3 md:hidden mb-3">
                  <div className={`p-2 rounded-lg ${LAYER_COLORS[cat]}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{group.label}</h3>
                </div>
                <h3 className="hidden md:block text-xl font-bold text-slate-900">{group.label}</h3>
                <p className="text-slate-500 text-sm md:text-base max-w-2xl">{group.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {modules.map((module) => (
                  <div key={module.id} className="h-full">
                    <ModuleCard
                      title={module.title}
                      desc={module.description}
                      onClick={() => setActiveModuleId(module.id)}
                      ctaLabel="Inspect component"
                    />
                  </div>
                ))}
              </div>
            </motion.section>
          );
        })}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-12 relative"
      >
        <div className="absolute inset-0 bg-slate-50 -skew-y-1 rounded-3xl -z-10 transform scale-105" />

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl ring-1 ring-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <ShieldCheck size={120} />
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{ARCHITECTURE_GROUPS.governance.label}</h3>
              <p className="text-slate-500">{ARCHITECTURE_GROUPS.governance.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ARCHITECTURE_MODULES.filter((m) => m.category === 'governance').map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModuleId(module.id)}
                className="text-left group hover:bg-slate-50 p-4 rounded-xl transition-colors border border-transparent hover:border-slate-200"
              >
                <h4 className="font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                  {module.title}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    View
                  </span>
                </h4>
                <p className="text-sm text-slate-500">{module.description}</p>
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      <ArchitectureModuleModal module={activeModule} onClose={() => setActiveModuleId(null)} />
    </div>
  );
}

const ArchitectureModuleModal: React.FC<{
  module: ArchitectureModule | null;
  onClose: () => void;
}> = ({ module, onClose }) => {
  if (!module) return null;

  const group = ARCHITECTURE_GROUPS[module.category];
  const Icon = LAYER_ICONS[module.category];

  const content =
    module.modalContent?.trim() ||
    `
## ${module.title}

*Detailed technical specification for this module is being migrated to the open documentation standard.*

### Core Responsibilities
- Handling ${module.title.toLowerCase()} tasks.
- Integrating with the wider reasoning engine.
- Ensuring auditability of all outputs.
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden ring-1 ring-black/5">
        <div className={`px-6 py-5 border-b flex items-start justify-between bg-slate-50/50`}>
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${LAYER_COLORS[module.category]}`}>
              <Icon size={24} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">{group.label}</div>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">{module.title}</h2>
            </div>
          </div>
          <button
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-6 md:p-10 overflow-y-auto">
          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-xl prose-h3:text-lg prose-a:text-blue-600">
            <MarkdownContent content={content} />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 shadow-sm rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close Specification
          </button>
        </div>
      </div>
    </div>
  );
};
