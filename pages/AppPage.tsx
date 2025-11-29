import React from 'react';
import { motion } from 'framer-motion';
import { PlanningAssistantDemo } from './app/PlanningAssistantDemo';
import { isOllamaEnabled } from '../utils/llmClient';

export function AppPage() {
    const env: any = (typeof import.meta !== 'undefined' ? (import.meta as any).env : {});
    const llmBackend = isOllamaEnabled() ? 'Ollama (local)' : 'Gemini (hosted)';
    const environmentLabel = env?.MODE ? env.MODE : 'local demo';
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <PlanningAssistantDemo />
            <div className="mt-6 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 sticky bottom-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <div className="text-xs text-[var(--color-muted)]">Save state</div>
                        <div className="font-semibold text-[var(--color-ink)]">Local browser storage</div>
                        <p className="text-xs text-[var(--color-muted)]">No cloud writes from this demo.</p>
                    </div>
                    <div>
                        <div className="text-xs text-[var(--color-muted)]">Environment</div>
                        <div className="font-semibold text-[var(--color-ink)]">{environmentLabel}</div>
                        <p className="text-xs text-[var(--color-muted)]">Single-authority workspace.</p>
                    </div>
                    <div>
                        <div className="text-xs text-[var(--color-muted)]">LLM backend</div>
                        <div className="font-semibold text-[var(--color-ink)]">{llmBackend}</div>
                        <p className="text-xs text-[var(--color-muted)]">Switch via environment flags.</p>
                    </div>
                    <div>
                        <div className="text-xs text-[var(--color-muted)]">Build</div>
                        <div className="font-semibold text-[var(--color-ink)]">Front-end demo</div>
                        <p className="text-xs text-[var(--color-muted)]">QA guidance only; no server writes.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
