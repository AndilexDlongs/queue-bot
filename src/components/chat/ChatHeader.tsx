import React, { useEffect, useRef, useState } from 'react';
import { useQueue } from '../../context/QueueContext';

export const ChatHeader: React.FC = () => {
  const { salon } = useQueue();
  const [expanded, setExpanded] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const copyTimeoutRef = useRef<number | null>(null);
  const fullAddress = `${salon.address}, ${salon.city}`;
  const initials = salon.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('');

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyAddress = async () => {
    if (!navigator.clipboard) {
      setCopyStatus('error');
      return;
    }

    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopyStatus('copied');
    } catch (error) {
      console.error('Failed to copy address', error);
      setCopyStatus('error');
    }

    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = window.setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const copyLabel =
    copyStatus === 'copied' ? 'Copied' : copyStatus === 'error' ? 'Copy failed' : 'Copy address';

  const copyButtonStyle =
    copyStatus === 'copied'
      ? 'bg-primary/20 text-primary'
      : copyStatus === 'error'
        ? 'bg-rose-100 text-rose-700'
        : 'bg-background/80 text-foreground hover:bg-background';

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-lg mx-auto px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          className="w-full flex flex-col items-center gap-2 text-center"
          aria-expanded={expanded}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
            {initials}
          </div>
          <div className="flex flex-col items-center text-center">
            <h1 className="font-semibold text-foreground text-sm">{salon.name}</h1>
            <span className="text-xs text-muted-foreground">
              {expanded ? 'Tap to collapse details' : 'Tap for salon details'}
            </span>
          </div>
        </button>
        {expanded && (
          <div className="mt-3 rounded-2xl bg-primary/10 px-4 py-4 text-sm text-muted-foreground shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">{salon.name}</p>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Address
                  </p>
                  <p className="text-sm text-foreground">{fullAddress}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyAddress}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${copyButtonStyle}`}
              >
                {copyLabel}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-foreground">
              <span className="rounded-full bg-background/80 px-3 py-1">
                {salon.workingDays}
              </span>
              <span className="rounded-full bg-background/80 px-3 py-1">
                {salon.opensAt} - {salon.closesAt}
              </span>
            </div>
            {copyStatus === 'error' && (
              <p className="mt-2 text-xs text-rose-600">
                Unable to copy. Select the address to copy manually.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
