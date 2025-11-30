import React from 'react';
import { ModuleCard } from '../../components/ModuleCard';
import { MarkdownContent } from '../../components/MarkdownContent';
import { ARCHITECTURE_MODULES, ArchitectureModule, ArchitectureModuleId } from '../../data/architectureModules';

export function ArchitectureContent() {
  const [activeModuleId, setActiveModuleId] = React.useState<ArchitectureModuleId | null>(null);
  const activeModule = ARCHITECTURE_MODULES.find(m => m.id === activeModuleId) || null;

  return (
    <>
        <p className="max-w-prose">The Planner’s Assistant works as a set of connected tools that share data, reasoning, and context. Each part has a clear job, but together they form one environment where planning evidence can be explored, tested, and explained.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {/* FIX: Destructuring module props in map to resolve incorrect 'key' prop error. */}
            {ARCHITECTURE_MODULES.map(module => (
              <ModuleCard
                key={module.id}
                title={module.title}
                desc={module.description}
                onClick={() => setActiveModuleId(module.id)}
              />
            ))}
        </div>
        <ArchitectureModuleModal module={activeModule} onClose={() => setActiveModuleId(null)} />
    </>
  );
}

const ArchitectureModuleModal: React.FC<{
  module: ArchitectureModule | null;
  onClose: () => void;
}> = ({ module, onClose }) => {
  if (!module) return null;
  const content = module.modalContent?.trim() || `${module.description}\n\nMore detail for ${module.title} will be added soon.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-2xl shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-edge)]">
          <div className="font-semibold text-[var(--color-ink)]">{module.title}</div>
          <button className="text-sm text-[var(--color-accent)] hover:underline" onClick={onClose}>Close</button>
        </div>
        <div className="p-5 overflow-auto max-h-[78vh] text-[var(--color-ink)]">
          <MarkdownContent content={content} />
        </div>
      </div>
    </div>
  );
};
