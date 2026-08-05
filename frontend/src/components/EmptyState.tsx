import React from 'react';

// Image asset generated for empty state illustration
import emptyIllustration from "../assets/empty_state_illustration.png";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => {
  return (
    <div className="empty-state flex flex-col items-center justify-center p-6 bg-white/30 dark:bg-slate-900/35 rounded-xl border border-dashed border-slate-300/20 dark:border-slate-700/30">
      <img src={emptyIllustration} alt="Empty illustration" className="w-24 h-24 mb-4" />
      <h3 className="text-heading mb-2">{title}</h3>
      <p className="text-body text-center max-w-sm mb-4">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
