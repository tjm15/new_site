import React from 'react';
import { Cpu, Database, FileText, Map } from 'lucide-react';

type BranchId = 'spatial' | 'dm' | 'monitoring';

type EngineDiagramProps = {
  activeBranch: BranchId;
  onChange: (branch: BranchId) => void;
  accentMap: Record<string, string>;
};

export function EngineDiagram({ activeBranch, onChange, accentMap }: EngineDiagramProps) {
  const activeColor = accentMap[activeBranch];
  const inactiveColor = '#e2e8f0';

  return (
    <div className="relative w-full bg-white pt-8 pb-0 rounded-t-2xl border border-b-0 border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="absolute top-6 left-8 z-10">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Live Architecture</h3>
        <p className="text-sm text-slate-500 mt-1">Select a pipeline output to reconfigure the engine.</p>
      </div>

      <div className="w-full flex justify-center">
        <svg width="100%" height="420" viewBox="0 0 800 420" className="max-w-5xl overflow-visible">
          <defs>
            <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={activeColor} stopOpacity="0.1" />
              <stop offset="100%" stopColor={activeColor} stopOpacity="1" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.05" />
            </filter>
          </defs>

          {/* Inputs */}
          <g transform="translate(100, 210)">
            {[{ y: -80, label: 'Geospatial', icon: Map }, { y: 0, label: 'Policy Docs', icon: FileText }, { y: 80, label: 'Live Evidence', icon: Database }].map((item, i) => (
              <g key={i} transform={`translate(0, ${item.y})`} className="group">
                <path d="M20 0 L180 0" stroke={inactiveColor} strokeWidth="2" />
                <circle r="24" fill="white" stroke={inactiveColor} strokeWidth="2" />
                <foreignObject x="-12" y="-12" width="24" height="24" className="pointer-events-none">
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <item.icon size={14} />
                  </div>
                </foreignObject>
                <text x="-35" y="4" textAnchor="end" className="text-[11px] font-semibold fill-slate-400 uppercase tracking-wide">
                  {item.label}
                </text>
              </g>
            ))}
            <path d="M200 -80 Q 230 -80, 230 0 Q 230 80, 200 80" fill="none" stroke={inactiveColor} strokeWidth="2" />
            <path d="M230 0 L 280 0" fill="none" stroke={inactiveColor} strokeWidth="2" />
          </g>

          {/* Engine */}
          <g transform="translate(400, 210)">
            <path d="M0 60 L0 210" stroke={activeColor} strokeWidth="4" strokeDasharray="4,4" opacity="0.6" />
            <circle r="3" fill={activeColor}>
              <animateMotion dur="1.5s" repeatCount="indefinite" path="M0 60 L0 210" />
            </circle>
            <rect x="-80" y="-60" width="160" height="120" rx="24" fill="white" stroke={activeColor} strokeWidth="4" filter="url(#shadow)" className="transition-colors duration-500" />
            <circle r="20" fill={activeColor} fillOpacity="0.1" className="animate-pulse" />
            <foreignObject x="-12" y="-12" width="24" height="24">
              <div className="flex items-center justify-center h-full" style={{ color: activeColor }}>
                <Cpu size={24} />
              </div>
            </foreignObject>
            <text x="0" y="90" textAnchor="middle" className="text-[10px] font-bold fill-slate-400 uppercase tracking-widest">
              Civic Reasoning Engine
            </text>
          </g>

          {/* Outputs */}
          <BranchNode
            xPath="M480 210 C 550 210, 550 110, 650 110"
            boxX="650"
            boxY="90"
            label="Spatial Plan"
            active={activeBranch === 'spatial'}
            color={activeBranch === 'spatial' ? activeColor : inactiveColor}
            onClick={() => onChange('spatial')}
          />
          <BranchNode
            xPath="M480 210 L 650 210"
            boxX="650"
            boxY="190"
            label="Casework"
            active={activeBranch === 'dm'}
            color={activeBranch === 'dm' ? activeColor : inactiveColor}
            onClick={() => onChange('dm')}
          />
          <BranchNode
            xPath="M480 210 C 550 210, 550 310, 650 310"
            boxX="650"
            boxY="290"
            label="Monitoring"
            active={activeBranch === 'monitoring'}
            color={activeBranch === 'monitoring' ? activeColor : inactiveColor}
            onClick={() => onChange('monitoring')}
          />
        </svg>
      </div>
    </div>
  );
}

function BranchNode({
  xPath,
  boxX,
  boxY,
  label,
  active,
  color,
  onClick,
}: {
  xPath: string;
  boxX: string;
  boxY: string;
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <g className="cursor-pointer group" opacity={active ? 1 : 0.5} onClick={onClick}>
      <path d={xPath} fill="none" stroke={color} strokeWidth={active ? 4 : 2} className="transition-all duration-500" />
      <foreignObject x={boxX} y={boxY} width="150" height="40" className="overflow-visible">
        <div
          className={`flex items-center gap-3 px-4 py-2 rounded-full border-2 bg-white shadow-sm transition-all duration-300 ${
            active ? 'scale-105 ring-4 ring-opacity-10' : 'border-slate-200 hover:border-slate-300 hover:scale-105'
          }`}
          style={{ borderColor: active ? color : undefined, boxShadow: active ? `0 0 0 8px ${color}10` : undefined }}
        >
          <span className={`w-2 h-2 rounded-full ${active ? 'animate-pulse' : ''}`} style={{ background: active ? color : '#cbd5e1' }} />
          <span className={`text-xs font-bold uppercase tracking-wide ${active ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
        </div>
      </foreignObject>
    </g>
  );
}
