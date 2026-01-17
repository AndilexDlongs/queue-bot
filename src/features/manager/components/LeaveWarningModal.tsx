import React from 'react';

interface LeaveWarningModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LeaveWarningModal: React.FC<LeaveWarningModalProps> = ({
  open,
  onClose,
  onConfirm
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close warning"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-border/60 bg-background px-5 py-4 shadow-xl">
        <p className="text-sm font-semibold text-foreground">Leave the manager view?</p>
        <p className="mt-2 text-sm text-muted-foreground">
          You will not be able to redirect back once you open the client queue bot.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border/60 px-3 py-1 text-xs font-semibold text-foreground hover:border-primary/40"
          >
            Stay here
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Open Client Queue Bot
          </button>
        </div>
      </div>
    </div>
  );
};
