import React, { useEffect, useRef, useState } from 'react';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatOption } from '../components/chat/ChatOption';
import { ChatInput } from '../components/chat/ChatInput';
import { useQueue } from '../context/QueueContext';
import { QueueClient } from '../data/mockData';

type ChatStep =
  | 'welcome'
  | 'select-barber'
  | 'confirm-join'
  | 'select-notification'
  | 'enter-phone'
  | 'verify-phone'
  | 'enter-email'
  | 'check-start'
  | 'check-phone'
  | 'check-email'
  | 'leave-start'
  | 'leave-phone'
  | 'leave-email'
  | 'joined-success'
  | 'cancelled';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  options?: Array<{
    label: string;
    sublabel?: string;
    value: string;
  }>;
}

const normalizePhone = (value: string) => value.replace(/\D/g, '');
const isActiveClient = (client: QueueClient) =>
  !['done', 'declined', 'left'].includes(client.status);

const Chat: React.FC = () => {
  const {
    salon,
    barbers,
    queue,
    getQueueCount,
    getEstimatedWaitTime,
    addToQueue,
    removeClient
  } = useQueue();
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<ChatStep>('welcome');
  const [selectedService, setSelectedService] = useState<QueueClient['service'] | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [showInput, setShowInput] = useState(false);
  const [inputType, setInputType] = useState<'tel' | 'email' | 'text'>('text');
  const [inputPlaceholder, setInputPlaceholder] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    showWelcomeOptions();
  }, []);

  const addBotMessage = (text: string, options?: Message['options']) => {
    const newMessage: Message = {
      id: `bot-${Date.now()}`,
      text,
      isBot: true,
      options
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addClientMessage = (text: string) => {
    const newMessage: Message = {
      id: `client-${Date.now()}`,
      text,
      isBot: false
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const showWelcomeOptions = () => {
    addBotMessage(
      `Welcome to ${salon.name}!\n\nHow can we help you today?`,
      [
        { label: 'Get a haircut', value: 'haircut' },
        { label: 'Plait or braid hair', value: 'plait' },
        { label: 'Check my queue position', value: 'check-position' },
        { label: 'Leave the queue', value: 'leave-queue' }
      ]
    );
    setStep('welcome');
  };

  const handleOptionClick = (value: string, label: string) => {
    addClientMessage(label);
    setShowInput(false);

    setTimeout(() => {
      switch (step) {
        case 'welcome':
          if (value === 'haircut' || value === 'plait') {
            setSelectedService(value);
            showBarberSelection(value);
          } else if (value === 'check-position') {
            promptForLookup('check');
          } else if (value === 'leave-queue') {
            promptForLookup('leave');
          }
          break;

        case 'select-barber':
          if (value === 'back') {
            showWelcomeOptions();
          } else {
            setSelectedBarber(value);
            const barber = barbers.find(b => b.id === value);
            const waitTime = getEstimatedWaitTime(value);
            const queueCount = getQueueCount(value);

            addBotMessage(
              `Great choice! ${barber?.name} is ready for you.\n\n` +
                `Current wait: ~${waitTime} minutes\n` +
                `People in queue: ${queueCount}\n\n` +
                `Would you like to join the queue?`,
              [
                { label: 'Yes, join the queue', value: 'join' },
                { label: 'Never mind', value: 'back' }
              ]
            );
            setStep('confirm-join');
          }
          break;

        case 'confirm-join':
          if (value === 'join') {
            addBotMessage(
              "How would you like to be notified when it's almost your turn?",
              [
                { label: 'Text message (SMS)', value: 'phone' },
                { label: 'Email', value: 'email' }
              ]
            );
            setStep('select-notification');
          } else {
            if (selectedService) {
              showBarberSelection(selectedService);
            } else {
              showWelcomeOptions();
            }
          }
          break;

        case 'select-notification':
          if (value === 'phone') {
            addBotMessage('Please enter your phone number:');
            setShowInput(true);
            setInputType('tel');
            setInputPlaceholder('Enter phone number...');
            setStep('enter-phone');
          } else {
            addBotMessage('Please enter your email address:');
            setShowInput(true);
            setInputType('email');
            setInputPlaceholder('Enter email...');
            setStep('enter-email');
          }
          break;

        case 'verify-phone':
          if (value === 'verified') {
            completeQueueJoin();
          } else if (value === 'resend') {
            addBotMessage("A new code has been sent. Tap 'Verified' once you have it.", [
              { label: 'Verified', value: 'verified' }
            ]);
          }
          break;

        case 'check-start':
          if (value === 'phone') {
            addBotMessage('Enter the phone number you used:');
            setShowInput(true);
            setInputType('tel');
            setInputPlaceholder('Phone number...');
            setStep('check-phone');
          } else if (value === 'email') {
            addBotMessage('Enter the email you used:');
            setShowInput(true);
            setInputType('email');
            setInputPlaceholder('Email address...');
            setStep('check-email');
          } else {
            showWelcomeOptions();
          }
          break;

        case 'leave-start':
          if (value === 'phone') {
            addBotMessage('Enter the phone number you used:');
            setShowInput(true);
            setInputType('tel');
            setInputPlaceholder('Phone number...');
            setStep('leave-phone');
          } else if (value === 'email') {
            addBotMessage('Enter the email you used:');
            setShowInput(true);
            setInputType('email');
            setInputPlaceholder('Email address...');
            setStep('leave-email');
          } else {
            showWelcomeOptions();
          }
          break;

        case 'cancelled':
        case 'joined-success':
          if (value === 'restart') {
            resetChat();
          }
          break;
      }
    }, 500);
  };

  const promptForLookup = (mode: 'check' | 'leave') => {
    addBotMessage(
      mode === 'check'
        ? 'How would you like to look up your spot in line?'
        : 'How would you like to find your queue entry?',
      [
        { label: 'Use phone number', value: 'phone' },
        { label: 'Use email', value: 'email' },
        { label: 'Go back', value: 'back' }
      ]
    );
    setStep(mode === 'check' ? 'check-start' : 'leave-start');
  };

  const resetChat = () => {
    setMessages([]);
    setStep('welcome');
    setSelectedService(null);
    setSelectedBarber(null);
    setClientPhone('');
    setClientEmail('');
    showWelcomeOptions();
  };

  const showBarberSelection = (service: QueueClient['service']) => {
    const availableBarbers = barbers.filter(b => b.isAvailable);

    if (availableBarbers.length === 0) {
      addBotMessage(
        'Sorry, no barbers are available at the moment. Please check back later!',
        [{ label: 'Start over', value: 'restart' }]
      );
      return;
    }

    const barberOptions = availableBarbers.map(b => ({
      label: b.name,
      sublabel: `~${getEstimatedWaitTime(b.id)} min wait - ${getQueueCount(b.id)} in queue`,
      value: b.id
    }));

    addBotMessage(
      `Here are our available barbers for ${service === 'haircut' ? 'a haircut' : 'plaiting'}:\n\n` +
        `Please select who you'd like to see:`,
      [...barberOptions, { label: 'Go back', value: 'back' }]
    );
    setStep('select-barber');
  };

  const handleInputSubmit = (value: string) => {
    addClientMessage(value);
    setShowInput(false);

    setTimeout(() => {
      if (step === 'enter-phone') {
        setClientPhone(value);
        addBotMessage(
          `We've sent a verification code to ${value}.\n\nFor this demo, tap "Verified" to continue.`,
          [
            { label: 'Verified', value: 'verified' },
            { label: 'Resend code', value: 'resend' }
          ]
        );
        setStep('verify-phone');
      } else if (step === 'enter-email') {
        setClientEmail(value);
        addBotMessage(
          `We've sent a verification link to ${value}.\n\nFor this demo, your email is confirmed!`
        );
        setTimeout(() => completeQueueJoin(), 1000);
      } else if (step === 'check-phone' || step === 'check-email') {
        handleCheckPosition(value);
      } else if (step === 'leave-phone' || step === 'leave-email') {
        handleLeaveQueue(value);
      }
    }, 500);
  };

  const findMatches = (value: string, kind: 'phone' | 'email') => {
    if (kind === 'phone') {
      const target = normalizePhone(value);
      return queue.filter(
        client => client.phone && normalizePhone(client.phone) === target && isActiveClient(client)
      );
    }
    const target = value.trim().toLowerCase();
    return queue.filter(
      client => client.email && client.email.toLowerCase() === target && isActiveClient(client)
    );
  };

  const handleCheckPosition = (value: string) => {
    const kind = step === 'check-phone' ? 'phone' : 'email';
    const matches = findMatches(value, kind);

    if (matches.length === 0) {
      addBotMessage(
        "We could not find an active queue entry with that contact. Want to try again?",
        [{ label: 'Start over', value: 'restart' }]
      );
      setStep('cancelled');
      return;
    }

    const summaries = matches.map(match => {
      const barber = barbers.find(b => b.id === match.barberId);
      const activeQueue = queue
        .filter(client => client.barberId === match.barberId && isActiveClient(client))
        .sort((a, b) => a.visibleId - b.visibleId);
      const position = activeQueue.findIndex(client => client.id === match.id) + 1;
      const waitMinutes = Math.max(
        5,
        Math.round((match.estimatedTime.getTime() - Date.now()) / 60000)
      );
      return `Barber: ${barber?.name ?? 'Unknown'} | Position: #${position} | Est wait: ~${waitMinutes} min`;
    });

    addBotMessage(
      `Here is your latest queue status:\n\n${summaries.join('\n')}\n\n` +
        `We will notify you about 45 minutes before your turn.`,
      [{ label: 'Start over', value: 'restart' }]
    );
    setStep('cancelled');
  };

  const handleLeaveQueue = (value: string) => {
    const kind = step === 'leave-phone' ? 'phone' : 'email';
    const matches = findMatches(value, kind);

    if (matches.length === 0) {
      addBotMessage(
        "We could not find an active queue entry with that contact.",
        [{ label: 'Start over', value: 'restart' }]
      );
      setStep('cancelled');
      return;
    }

    matches.forEach(match => removeClient(match.id));

    addBotMessage(
      "Sorry to see you go! We'll be here when you're ready.\n\nThanks for stopping by.",
      [{ label: 'Start over', value: 'restart' }]
    );
    setStep('cancelled');
  };

  const completeQueueJoin = () => {
    if (!selectedBarber || !selectedService) {
      showWelcomeOptions();
      return;
    }

    const barber = barbers.find(b => b.id === selectedBarber);
    const waitTime = getEstimatedWaitTime(selectedBarber);
    const queuePosition = getQueueCount(selectedBarber) + 1;

    const newClient: QueueClient = {
      id: `client-${Date.now()}`,
      visibleId: queuePosition,
      name: 'Guest',
      phone: clientPhone || undefined,
      email: clientEmail || undefined,
      barberId: selectedBarber,
      joinedAt: new Date(),
      estimatedTime: new Date(Date.now() + waitTime * 60000),
      status: 'waiting',
      notificationSent: false,
      service: selectedService
    };
    addToQueue(newClient);

    addBotMessage(
      `You're in the queue!\n\n` +
        `Barber: ${barber?.name}\n` +
        `Service: ${selectedService === 'haircut' ? 'Haircut' : 'Plaiting'}\n` +
        `Position: #${queuePosition}\n` +
        `Estimated wait: ~${waitTime} minutes\n\n` +
        `We'll notify you 45 minutes before your turn.\n\n` +
        `Address: ${salon.address}, ${salon.city}`,
      [{ label: 'Start over', value: 'restart' }]
    );
    setStep('joined-success');
  };

  return (
    <div className="min-h-screen bg-white">
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
      />
    </div>
  );
};

export default Chat;
