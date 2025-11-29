import React from 'react';
import { motion } from 'framer-motion';
import { PlanningAssistantDemo } from './app/PlanningAssistantDemo';
import { usePlan } from '../contexts/PlanContext';
import { Link } from 'react-router-dom';
import { PlanChecksButton } from '../components/PlanChecksButton';

export function AppPage() {
        const { activePlan } = usePlan();
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <PlanningAssistantDemo />
                        {/* Dashboard home enhancements for spatial plan landing */}
                        <div className="mt-6 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 sticky bottom-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-[var(--color-muted)]">Active Plan</div>
                                    <div className="font-semibold text-[var(--color-ink)]">{activePlan ? `${activePlan.title} – ${activePlan.area}` : 'None'}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Link to="/app/gateway1" className="px-3 py-2 bg-[var(--color-accent)] text-white rounded">Gateway 1</Link>
                                    <Link to="/app?tool=vision" className="px-3 py-2 bg-[var(--color-ink)] text-white rounded">Vision</Link>
                                    <Link to="/app?tool=sites" className="px-3 py-2 bg-[var(--color-ink)] text-white rounded">Sites</Link>
                                    <PlanChecksButton />
                                </div>
                            </div>
                            {activePlan && (
                                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded p-3">
                                        <div className="text-xs text-[var(--color-muted)]">Stage</div>
                                        <div className="font-medium text-[var(--color-ink)]">{activePlan.planStage || activePlan.currentStage}</div>
                                    </div>
                                    <div className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded p-3">
                                        <div className="text-xs text-[var(--color-muted)]">Outcomes</div>
                                        <div className="font-medium text-[var(--color-ink)]">{activePlan.visionStatements?.length || 0}</div>
                                    </div>
                                    <div className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded p-3">
                                        <div className="text-xs text-[var(--color-muted)]">Sites scored</div>
                                        <div className="font-medium text-[var(--color-ink)]">{activePlan.sites?.filter(s=>s.suitability||s.availability||s.achievability).length || 0}</div>
                                    </div>
                                </div>
                            )}
                        </div>
        </motion.div>
    );
}