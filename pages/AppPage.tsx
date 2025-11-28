import React from 'react';
import { motion } from 'framer-motion';
import { PlanningAssistantDemo } from './app/PlanningAssistantDemo';

export function AppPage() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <PlanningAssistantDemo />
        </motion.div>
    );
}