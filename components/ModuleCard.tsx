import React from "react";
import { motion } from "framer-motion";

interface ModuleCardProps {
    title: string;
    desc: string;
    onClick?: () => void;
}

export function ModuleCard({ title, desc, onClick }: ModuleCardProps) {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.05)" }}
      className={`rounded-2xl bg-[var(--color-panel)]/95 backdrop-blur border border-[var(--color-edge)] p-5 shadow-sm h-full flex flex-col ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="text-[var(--color-ink)] font-semibold">{title}</div>
      <p className="text-[var(--color-muted)] mt-2">{desc}</p>
      {onClick && (
        <span className="mt-4 inline-flex items-center text-sm font-semibold text-teal-500 hover:text-teal-600 transition-colors">
          How it works &rarr;
        </span>
      )}
    </motion.div>
  );
}
