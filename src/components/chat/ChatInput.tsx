import React, { useEffect, useRef, useState } from 'react';

interface ChatInputProps {
  onSubmit: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'tel' | 'email';
  visible?: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  placeholder = 'Type here...',
  type = 'text',
  visible = false,
  onCancel,
  cancelLabel = 'Never mind'
}) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [visible, type]);

  useEffect(() => {
    if (!visible) {
      inputRef.current?.blur();
    }
  }, [visible]);

  if (!visible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      inputRef.current?.blur();
      onSubmit(value.trim());
      setValue('');
    }
  };

  const handleCancel = () => {
    setValue('');
    inputRef.current?.blur();
    onCancel?.();
  };

  const inputMode = type === 'tel' ? 'numeric' : type === 'email' ? 'email' : 'text';
  const autoComplete = type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'off';

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border/50 p-4"
    >
      <div className="max-w-lg mx-auto flex flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          enterKeyHint="send"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-border/70 bg-white/80 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {onCancel && (
          <button
            type="button"
            onClick={handleCancel}
            className="shrink-0 rounded-lg border border-border/60 bg-white px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/40"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Send
        </button>
      </div>
    </form>
  );
};
