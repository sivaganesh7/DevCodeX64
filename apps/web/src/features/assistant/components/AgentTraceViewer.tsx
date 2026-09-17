import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Cpu,
  BrainCircuit,
  Wrench,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { AgentStep } from '../services/assistantApi';

interface AgentTraceViewerProps {
  steps: AgentStep[];
  toolsUsed?: string[];
  iterationsUsed?: number;
}

export const AgentTraceViewer: React.FC<AgentTraceViewerProps> = ({
  steps,
  toolsUsed = [],
  iterationsUsed,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({ 1: true });

  const toggleStep = (idx: number) => {
    setExpandedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!steps || steps.length === 0) return null;

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 my-3 overflow-hidden text-xs">
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-indigo-300 font-semibold">
          <Cpu size={15} className="text-indigo-400" />
          <span>Autonomous ReAct Execution Trace</span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/30">
            {iterationsUsed || steps.length} steps
          </span>
        </div>

        <div className="flex items-center gap-3">
          {toolsUsed.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-white/40">
              <Wrench size={12} />
              <span>Tools: {toolsUsed.join(', ')}</span>
            </div>
          )}
          {isExpanded ? <ChevronUp size={15} className="text-white/60" /> : <ChevronDown size={15} className="text-white/60" />}
        </div>
      </button>

      {/* Expanded Trace Timeline */}
      {isExpanded && (
        <div className="p-3.5 flex flex-col gap-3 border-t border-indigo-500/15 bg-black/30">
          {steps.map((step) => {
            const isStepOpen = expandedSteps[step.iteration] ?? false;

            return (
              <div
                key={step.iteration}
                className="rounded-lg border border-white/10 bg-[#12121e]/80 overflow-hidden"
              >
                <div
                  onClick={() => toggleStep(step.iteration)}
                  className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                      {step.iteration}
                    </span>
                    {step.action ? (
                      <span className="font-mono text-xs font-medium text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/20 flex items-center gap-1">
                        <Wrench size={11} /> {step.action}
                      </span>
                    ) : (
                      <span className="font-medium text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Resolution Synthesis
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/40 italic line-clamp-1 max-w-[200px] sm:max-w-xs">
                      {step.thought}
                    </span>
                    {isStepOpen ? <ChevronUp size={13} className="text-white/40" /> : <ChevronDown size={13} className="text-white/40" />}
                  </div>
                </div>

                {/* Step Details */}
                {isStepOpen && (
                  <div className="p-3 border-t border-white/5 flex flex-col gap-2.5 bg-black/20">
                    {/* Thought */}
                    <div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-300 mb-1">
                        <BrainCircuit size={12} /> Thought / Reasoning:
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pl-4 border-l border-indigo-500/30">
                        {step.thought}
                      </p>
                    </div>

                    {/* Action & Input */}
                    {step.action && (
                      <div>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-300 mb-1">
                          <Wrench size={12} /> Action Invocation:
                        </div>
                        <div className="font-mono text-[11px] bg-white/[0.03] p-2 rounded border border-white/5 text-purple-200">
                          <span className="font-bold text-white">{step.action}</span>(
                          {step.actionInput ? JSON.stringify(step.actionInput) : ''})
                        </div>
                      </div>
                    )}

                    {/* Observation */}
                    {step.observation && (
                      <div>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300 mb-1">
                          <Eye size={12} /> Observation (Sanitized Output):
                        </div>
                        <div className="font-mono text-[11px] bg-white/[0.02] p-2 rounded border border-white/5 text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {step.observation}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
