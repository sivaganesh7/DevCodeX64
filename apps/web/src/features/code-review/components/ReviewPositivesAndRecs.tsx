import React from 'react';
import { ThumbsUp, Compass } from 'lucide-react';

interface ReviewPositivesAndRecsProps {
  positives: string[];
  recommendations: string[];
}

export const ReviewPositivesAndRecs: React.FC<ReviewPositivesAndRecsProps> = ({
  positives,
  recommendations,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Positives Card */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-4">
          <ThumbsUp size={18} />
          <span>Observed Strengths & Clean Patterns</span>
        </div>

        {positives.length === 0 ? (
          <p className="text-xs text-white/50 italic">No specific strengths annotated.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {positives.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Strategic Recommendations Card */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.03] p-5 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-4">
          <Compass size={18} />
          <span>Strategic Recommendations & Next Steps</span>
        </div>

        {recommendations.length === 0 ? (
          <p className="text-xs text-white/50 italic">No additional strategic steps required.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {recommendations.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold text-[10px] shrink-0">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
