import React, { useState } from 'react';

interface ChatInputProps {
  onSubmit: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'tel' | 'email';
  visible?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSubmit, 
  placeholder = "Type here...",
  type = 'text',
  visible = false
}) => {
  const [value, setValue] = useState('');

  if (!visible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-border/50 p-4"
    >
      <div className="max-w-lg mx-auto flex gap-2">
        <input
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-border/70 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
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
