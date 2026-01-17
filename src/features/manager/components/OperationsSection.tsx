import React from 'react';
import type { QueueClient } from '../../../data/mockData';
import { cn } from '../../../shared/utils/cn';
import { queueLogo, walkInLogo } from '../icons';

interface OperationsSectionProps {
  hasProvider: boolean;
  isOnDuty: boolean;
  selectedQueue: QueueClient[];
  aliveScale: number;
  timeLeftMs: number;
  isQueueListOpen: boolean;
  isWalkInConfirmOpen: boolean;
  onToggleDuty: (nextState: boolean) => void;
  onToggleQueueList: () => void;
  onToggleWalkInConfirm: () => void;
  onConfirmWalkIn: () => void;
  onCloseWalkInConfirm: () => void;
  onAlivePing: () => void;
}

export const OperationsSection: React.FC<OperationsSectionProps> = ({
  hasProvider,
  isOnDuty,
  selectedQueue,
  aliveScale,
  timeLeftMs,
  isQueueListOpen,
  isWalkInConfirmOpen,
  onToggleDuty,
  onToggleQueueList,
  onToggleWalkInConfirm,
  onConfirmWalkIn,
  onCloseWalkInConfirm,
  onAlivePing
}) => {
  const timeLeftMinutes = Math.max(0, Math.ceil(timeLeftMs / 60000));

  return (
    <div className="grid gap-8">
      <div className="flex w-full flex-wrap items-center justify-center gap-3 rounded-full border border-border/60 bg-white/80 p-3 shadow-sm">
        <div>
          <div
            className={cn(
              'flex rounded-full border border-border/60 bg-white/80 p-1 shadow-sm',
              !hasProvider && 'opacity-50'
            )}
          >
            <button
              type="button"
              onClick={() => onToggleDuty(false)}
              aria-pressed={!isOnDuty}
              disabled={!hasProvider}
              className={cn(
                'rounded-full px-4 py-2 text-xs font-semibold transition',
                !isOnDuty
                  ? 'bg-slate-200 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Off
            </button>
            <button
              type="button"
              onClick={() => onToggleDuty(true)}
              aria-pressed={isOnDuty}
              disabled={!hasProvider}
              className={cn(
                'rounded-full px-4 py-2 text-xs font-semibold transition',
                isOnDuty
                  ? 'bg-emerald-200 text-emerald-900 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              On
            </button>
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={onToggleQueueList}
            disabled={!hasProvider}
            className={cn(
              'flex items-center gap-2 rounded-full border border-border/60 bg-white/80 px-5 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:border-primary/40',
              !hasProvider && 'cursor-not-allowed opacity-50'
            )}
          >
            <img src={queueLogo} alt="" aria-hidden="true" className="h-4 w-4" />
            Queue
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
              {selectedQueue.length}
            </span>
          </button>
          {isQueueListOpen && (
            <div className="absolute left-1/2 top-full z-50 mt-3 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl border border-border/60 bg-white/95 p-4 shadow-xl backdrop-blur animate-float-in">
              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {selectedQueue.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No one is in the queue yet.</p>
                ) : (
                  selectedQueue.map(client => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between rounded-2xl border border-border/40 bg-white/80 px-3 py-2 text-xs"
                    >
                      <span className="font-semibold text-foreground">{client.name}</span>
                      {client.isWalkIn && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.6rem] font-semibold text-emerald-700">
                          Walk-in
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="mx-2 mt-4 border-t border-border/60 pt-3 text-center text-xs font-semibold text-foreground">
                {selectedQueue.length} {selectedQueue.length === 1 ? 'Person' : 'People'} In Queue
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={onToggleWalkInConfirm}
            disabled={!hasProvider}
            className={cn(
              'flex items-center gap-2 rounded-full border border-border/60 bg-white/80 px-5 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:border-primary/40',
              !hasProvider && 'cursor-not-allowed opacity-50'
            )}
          >
            <img src={walkInLogo} alt="" aria-hidden="true" className="h-4 w-4" />
            Walk-in
          </button>
          {isWalkInConfirmOpen && (
            <div className="absolute right-0 top-full z-50 mt-3 w-[min(11rem,calc(100vw-2rem))] rounded-2xl border border-border/60 bg-white/95 p-3 shadow-xl backdrop-blur animate-float-in">
              <p className="text-xs font-semibold text-foreground">Confirm Walk-in</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={onConfirmWalkIn}
                  className="flex-1 rounded-full bg-emerald-500 px-3 py-1 text-[0.65rem] font-semibold text-white shadow-sm hover:bg-emerald-600"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={onCloseWalkInConfirm}
                  className="flex-1 rounded-full border border-border/60 px-3 py-1 text-[0.65rem] font-semibold text-foreground hover:border-primary/40"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <button
          type="button"
          onClick={onAlivePing}
          disabled={!isOnDuty || !hasProvider}
          style={{ transform: `scale(${aliveScale})` }}
          className={cn(
            'relative flex h-56 w-56 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-400/90 text-foreground shadow-2xl transition-transform duration-500',
            isOnDuty && 'alive-breathe',
            !isOnDuty && 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500',
            !hasProvider && 'opacity-50'
          )}
        >
          <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full border border-emerald-500/60 bg-emerald-200/90 text-center">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-emerald-900">
              Stay Alive
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-900">
              {isOnDuty ? timeLeftMinutes : '--'}
            </p>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-emerald-900">
              Minutes
            </p>
          </div>
        </button>
        <p className="text-xs text-muted-foreground">
          {isOnDuty ? 'Tap every 45 minutes to stay on duty.' : 'Toggle on to start your shift.'}
        </p>
      </div>
    </div>
  );
};
