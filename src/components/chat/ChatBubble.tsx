import React from 'react';
import { cn } from '../../utils/cn';

interface ChatBubbleProps {
  message: string;
  isBot: boolean;
  children?: React.ReactNode;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isBot, children }) => {
  return (
    <div className={cn(
      "flex w-full mb-3",
      isBot ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "max-w-[85%] px-4 py-3 rounded-2xl shadow-sm backdrop-blur-sm",
        isBot
          ? "bg-primary/85 text-primary-foreground rounded-tl-sm"
          : "bg-white/85 text-foreground border border-border/70 rounded-tr-sm"
      )}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
        {children}
      </div>
    </div>
  );
};
