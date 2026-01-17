import React from 'react';
import { ChatBubble } from './components/ChatBubble';
import { ChatHeader } from './components/ChatHeader';
import { ChatInput } from './components/ChatInput';
import { ChatOption } from './components/ChatOption';
import { useChatFlow } from './hooks/useChatFlow';

const ChatPage: React.FC = () => {
  const {
    messages,
    showInput,
    inputType,
    inputPlaceholder,
    messagesEndRef,
    latestOptionsMessageId,
    latestMessageId,
    handleOptionClick,
    handleInputSubmit,
    handleInputCancel
  } = useChatFlow();

  return (
    <div className="min-h-screen bg-background">
      <ChatHeader />

      <div className="max-w-lg mx-auto pt-28 pb-24 px-4">
        {messages.map(message => (
          <div key={message.id}>
            <ChatBubble message={message.text} isBot={message.isBot} />
            {message.options && message.isBot && (
              <div className="flex flex-col gap-2 mb-4 pl-2">
                {message.options.map((option, idx) => (
                  <ChatOption
                    key={idx}
                    label={option.label}
                    sublabel={option.sublabel}
                    variant={option.sublabel ? 'barber' : 'default'}
                    disabled={
                      showInput
                        ? message.id !== latestMessageId
                        : message.id !== latestOptionsMessageId
                    }
                    onClick={() => handleOptionClick(option.value, option.label)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        visible={showInput}
        type={inputType}
        placeholder={inputPlaceholder}
        onSubmit={handleInputSubmit}
        onCancel={handleInputCancel}
      />
    </div>
  );
};

export default ChatPage;
