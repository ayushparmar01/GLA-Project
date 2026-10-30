import React from 'react';
import { HelpCircle, ChevronRight, Sparkles } from 'lucide-react';
import { DEMO_SUGGESTED_QUESTIONS, SuggestedQuestion } from './demoKnowledgeBase';

interface SuggestedQuestionsProps {
  onSelectQuestion: (questionText: string) => void;
  disabled?: boolean;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onSelectQuestion,
  disabled = false,
}) => {
  return (
    <div className="bg-slate-50/90 border-t border-slate-200 p-2.5 sm:p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Suggested Demo Questions</span>
        </span>
        <span className="text-[10px] text-slate-400">Click to ask assistant</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300">
        {DEMO_SUGGESTED_QUESTIONS.map((item: SuggestedQuestion) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion(item.question)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/90 hover:border-emerald-300 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 whitespace-nowrap"
          >
            <span>{item.question}</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};
