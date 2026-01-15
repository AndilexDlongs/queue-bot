import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatOption } from '../components/chat/ChatOption';
import { ChatInput } from '../components/chat/ChatInput';
import { useQueue } from '../context/QueueContext';
import { Barber, QueueClient } from '../data/mockData';

type ChatStep =
  | 'welcome'
  | 'select-barber'
  | 'confirm-join'
  | 'select-notification'
  | 'enter-phone'
  | 'enter-email'
  | 'verify-code'
  | 'duplicate-confirm'
  | 'check-start'
  | 'check-phone'
  | 'check-email'
  | 'leave-start'
  | 'leave-phone'
  | 'leave-email'
  | 'leave-confirm'
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
    services,
    barbers,
    queue,
    getQueueCount,
    getEstimatedWaitTime,
    addToQueue,
    removeClient
  } = useQueue();
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<ChatStep>('welcome');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [joinMethod, setJoinMethod] = useState<'phone' | 'email' | null>(null);
  const [joinedClientId, setJoinedClientId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<'phone' | 'email' | null>(null);
  const [verificationTarget, setVerificationTarget] = useState<string>('');
  const [pendingJoinContact, setPendingJoinContact] = useState<{
    method: 'phone' | 'email';
    value: string;
  } | null>(null);
  const [pendingLeaveMatches, setPendingLeaveMatches] = useState<QueueClient[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [inputType, setInputType] = useState<'tel' | 'email' | 'text'>('text');
  const [inputPlaceholder, setInputPlaceholder] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const didInitRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
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

  const sendVerificationCode = (method: 'phone' | 'email', destination: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationMethod(method);
    setVerificationTarget(destination);
    setVerificationCode(code);
    console.info(`Verification code for ${method} ${destination}: ${code}`);
    return code;
  };

  const formatJoinMethod = (method: 'phone' | 'email') =>
    method === 'phone' ? 'phone number' : 'email';

  const getServiceName = (serviceKey: string) =>
    services.find(service => service.key === serviceKey)?.name ?? serviceKey;

  const getProviderLabels = () => {
    if (salon.businessType === 'general_practitioner') {
      return { singular: 'doctor', plural: 'doctors' };
    }
    if (salon.businessType === 'barbershop') {
      return { singular: 'barber', plural: 'barbers' };
    }
    return { singular: 'provider', plural: 'providers' };
  };

  const { singular: providerLabel, plural: providerLabelPlural } = getProviderLabels();
  const providerLabelTitle = providerLabel[0].toUpperCase() + providerLabel.slice(1);

  const startVerification = (method: 'phone' | 'email', value: string) => {
    const code = sendVerificationCode(method, value);
    if (method === 'phone') {
      setClientPhone(value);
    } else {
      setClientEmail(value);
    }
    setJoinMethod(method);
    addBotMessage(
      `We've sent a 6-digit code to ${value}.\n\nEnter it below to confirm.\n\nDemo code: ${code}`
    );
    setShowInput(true);
    setInputType('tel');
    setInputPlaceholder('6-digit code');
    setStep('verify-code');
  };

  const showWelcomeOptions = (intro?: string) => {
    const serviceOptions = services.map(service => ({
      label: service.ctaLabel ?? service.name,
      value: service.key
    }));

    addBotMessage(
      intro ?? `Welcome to ${salon.name}!\n\nHow can we help you today?`,
      [
        ...serviceOptions,
        { label: 'Check my queue position', value: 'check-position' },
        { label: 'Leave the queue', value: 'leave-queue' }
      ]
    );
    setStep('welcome');
  };

  const handleInputCancel = () => {
    setShowInput(false);
    setInputType('text');
    setInputPlaceholder('');
    setPendingJoinContact(null);
    setPendingLeaveMatches([]);

    if (step === 'enter-phone' || step === 'enter-email' || step === 'verify-code') {
      setClientPhone('');
      setClientEmail('');
      setVerificationCode(null);
      setVerificationMethod(null);
      setVerificationTarget('');
      if (!joinedClientId) {
        setJoinMethod(null);
      }
    }

    showWelcomeOptions('No problem. What would you like to do next?');
  };

  const handleOptionClick = (value: string, label: string) => {
    addClientMessage(label);
    setShowInput(false);

    setTimeout(() => {
      switch (step) {
        case 'welcome':
          if (services.some(service => service.key === value)) {
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
              `Great choice! ${barber?.name} is ready for you.

` +
                `Current wait: ~${waitTime} minutes
` +
                `People in queue: ${queueCount}

` +
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

        case 'verify-code':
          if (value === 'resend-code') {
            if (!verificationMethod || !verificationTarget) {
              addBotMessage('We need your contact details first.', [
                { label: 'Start over', value: 'restart' }
              ]);
              setStep('cancelled');
              return;
            }
            const code = sendVerificationCode(verificationMethod, verificationTarget);
            addBotMessage(
              `A new code has been sent to ${verificationTarget}.

Enter it below to continue.

Demo code: ${code}`
            );
            setShowInput(true);
            setInputType('tel');
            setInputPlaceholder('6-digit code');
            setStep('verify-code');
          } else if (value === 'restart') {
            resetChat();
          }
          break;

        case 'duplicate-confirm':
          if (!pendingJoinContact) {
            showWelcomeOptions();
            break;
          }
          if (value === 'duplicate-join') {
            const { method, value: contactValue } = pendingJoinContact;
            setPendingJoinContact(null);
            startVerification(method, contactValue);
          } else if (value === 'duplicate-check') {
            const { method, value: contactValue } = pendingJoinContact;
            setPendingJoinContact(null);
            handleCheckPositionLookup(contactValue, method);
          } else if (value === 'never-mind') {
            setPendingJoinContact(null);
            showWelcomeOptions('No problem. What would you like to do next?');
          }
          break;

        case 'check-start':
          if (value === 'back') {
            showWelcomeOptions();
            return;
          }
          if (joinMethod && value !== joinMethod) {
            addBotMessage(
              `Please use the same ${formatJoinMethod(joinMethod)} you used to join the queue.`,
              [
                {
                  label: joinMethod === 'phone' ? 'Use phone number' : 'Use email',
                  value: joinMethod
                },
                { label: 'Go back', value: 'back' }
              ]
            );
            setStep('check-start');
            return;
          }
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
          if (value === 'back') {
            showWelcomeOptions();
            return;
          }
          if (joinMethod && value !== joinMethod) {
            addBotMessage(
              `Please use the same ${formatJoinMethod(joinMethod)} you used to join the queue.`,
              [
                {
                  label: joinMethod === 'phone' ? 'Use phone number' : 'Use email',
                  value: joinMethod
                },
                { label: 'Go back', value: 'back' }
              ]
            );
            setStep('leave-start');
            return;
          }
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

        case 'leave-confirm':
          if (value === 'confirm-leave') {
            if (pendingLeaveMatches.length > 0) {
              void confirmLeaveMatches();
            } else {
              void handleLeaveCurrentQueue();
            }
          } else if (value === 'never-mind') {
            if (pendingLeaveMatches.length > 0) {
              setPendingLeaveMatches([]);
              addBotMessage("No problem. You're still in the queue.", [
                { label: 'Start over', value: 'restart' }
              ]);
              setStep('cancelled');
            } else {
              addBotMessage("No problem. You're still in the queue.", [
                { label: 'Leave the queue', value: 'leave-queue' },
                { label: 'Start over', value: 'restart' }
              ]);
              setStep('joined-success');
            }
          }
          break;

        case 'cancelled':
        case 'joined-success':
          if (value === 'restart') {
            resetChat();
          } else if (value === 'leave-queue') {
            setPendingLeaveMatches([]);
            if (joinedClientId) {
              addBotMessage('Are you sure you want to leave the queue?', [
                { label: 'Yes, leave the queue', value: 'confirm-leave' },
                { label: 'Never mind', value: 'never-mind' }
              ]);
              setStep('leave-confirm');
            } else {
              promptForLookup('leave');
            }
          }
          break;
      }
    }, 500);
  };

  const promptForLookup = (mode: 'check' | 'leave') => {
    if (mode === 'leave') {
      setPendingLeaveMatches([]);
    }
    const base =
      mode === 'check'
        ? 'How would you like to look up your spot in line?'
        : 'How would you like to find your queue entry?';
    const hint = joinMethod
      ? `

Please use the same ${formatJoinMethod(joinMethod)} you used to join the queue.`
      : '';
    const options = joinMethod
      ? [
          {
            label: joinMethod === 'phone' ? 'Use phone number' : 'Use email',
            value: joinMethod
          },
          { label: 'Go back', value: 'back' }
        ]
      : [
          { label: 'Use phone number', value: 'phone' },
          { label: 'Use email', value: 'email' },
          { label: 'Go back', value: 'back' }
        ];

    addBotMessage(`${base}${hint}`, options);
    setStep(mode === 'check' ? 'check-start' : 'leave-start');
  };

  const resetChat = () => {
    setMessages([]);
    setStep('welcome');
    setSelectedService(null);
    setSelectedBarber(null);
    setClientPhone('');
    setClientEmail('');
    setJoinMethod(null);
    setJoinedClientId(null);
    setVerificationCode(null);
    setVerificationMethod(null);
    setVerificationTarget('');
    setPendingJoinContact(null);
    setPendingLeaveMatches([]);
    setShowInput(false);
    showWelcomeOptions();
  };

  const barberSupportsService = (barber: Barber, service: string) =>
    !barber.services || barber.services.includes(service);

  const showBarberSelection = (service: string) => {
    const serviceLabel = getServiceName(service).toLowerCase();
    const registeredBarbers = barbers.filter(b => barberSupportsService(b, service));
    const availableBarbers = registeredBarbers.filter(b => b.isAvailable);

    if (registeredBarbers.length === 0) {
      addBotMessage(`Sorry, there is no one registered to provide ${serviceLabel} right now.`, [
        { label: 'Go back', value: 'back' }
      ]);
      setStep('select-barber');
      return;
    }

    if (availableBarbers.length === 0) {
      addBotMessage(
        `Sorry, no ${providerLabelPlural} are available for ${serviceLabel} right now.`,
        [
          { label: 'Go back', value: 'back' }
        ]
      );
      setStep('select-barber');
      return;
    }

    const barberOptions = availableBarbers.map(b => ({
      label: b.name,
      sublabel: `~${getEstimatedWaitTime(b.id)} min wait - ${getQueueCount(b.id)} in queue`,
      value: b.id
    }));

    addBotMessage(
      `Here are our available ${providerLabelPlural} for ${serviceLabel}:

` +
        `Please select who you'd like to see:`,
      [...barberOptions, { label: 'Go back', value: 'back' }]
    );
    setStep('select-barber');
  };

  const handleInputSubmit = (value: string) => {
    addClientMessage(value);
    setShowInput(false);

    setTimeout(() => {
      if (step === 'enter-phone' || step === 'enter-email') {
        const method: 'phone' | 'email' = step === 'enter-phone' ? 'phone' : 'email';
        const matches = findMatches(value, method);
        if (matches.length > 0) {
          const contactLabel = method === 'phone' ? 'phone number' : 'email';
          setPendingJoinContact({ method, value });
          addBotMessage(
            `That ${contactLabel} is already on the waiting list. Would you like to join again for someone else?`,
            [
              { label: 'Yes, join for someone else', value: 'duplicate-join' },
              { label: 'No, check my position', value: 'duplicate-check' },
              { label: 'Never mind', value: 'never-mind' }
            ]
          );
          setStep('duplicate-confirm');
          return;
        }
        startVerification(method, value);
      } else if (step === 'verify-code') {
        const sanitized = value.replace(/\D/g, '');
        if (!verificationCode) {
          addBotMessage('We need to send you a code first.', [
            { label: 'Resend code', value: 'resend-code' },
            { label: 'Start over', value: 'restart' }
          ]);
          setStep('verify-code');
          return;
        }
        if (sanitized !== verificationCode) {
          addBotMessage("That code doesn't match. Try again or request a new one.", [
            { label: 'Resend code', value: 'resend-code' },
            { label: 'Start over', value: 'restart' }
          ]);
          setShowInput(true);
          setInputType('tel');
          setInputPlaceholder('6-digit code');
          setStep('verify-code');
          return;
        }
        void completeQueueJoin();
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

  const handleCheckPositionLookup = (value: string, kind: 'phone' | 'email') => {
    const matches = findMatches(value, kind);

    if (matches.length === 0) {
      addBotMessage(
        "We could not find an active queue entry with that contact. Want to try again?",
        [{ label: 'Start over', value: 'restart' }]
      );
      setStep('cancelled');
      return;
    }

    const details = matches.map(match => {
      const barber = barbers.find(b => b.id === match.barberId);
      const activeQueue = queue
        .filter(client => client.barberId === match.barberId && isActiveClient(client))
        .sort((a, b) => a.visibleId - b.visibleId);
      const position = activeQueue.findIndex(client => client.id === match.id) + 1;
      const waitMinutes = Math.max(
        5,
        Math.round((match.estimatedTime.getTime() - Date.now()) / 60000)
      );
      return {
        barberName: barber?.name ?? 'Unknown',
        position,
        waitMinutes
      };
    });

    const summaries = details.map(
      detail =>
        `${providerLabelTitle}: ${detail.barberName} | Position: #${detail.position} | Est wait: ~${detail.waitMinutes} min`
    );
    const shouldHeadToShop = details.some(
      detail => detail.waitMinutes < 50 || detail.position === 3
    );
    const headNote = shouldHeadToShop
      ? `\n\nIt's almost your turn. Start heading to the shop at ${salon.address}, ${salon.city}.`
      : '';

    addBotMessage(
      `Here is your latest queue status:\n\n${summaries.join('\n')}\n\n` +
        `We will notify you about 45 minutes before your turn.${headNote}`,
      [{ label: 'Start over', value: 'restart' }]
    );
    setStep('cancelled');
  };

  const handleCheckPosition = (value: string) => {
    const kind = step === 'check-phone' ? 'phone' : 'email';
    handleCheckPositionLookup(value, kind);
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
    setPendingLeaveMatches(matches);
    const entryLabel = matches.length === 1 ? 'entry' : 'entries';
    addBotMessage(`We found ${matches.length} active queue ${entryLabel}. Leave the queue?`, [
      { label: 'Yes, leave the queue', value: 'confirm-leave' },
      { label: 'Never mind', value: 'never-mind' }
    ]);
    setStep('leave-confirm');
  };

  const confirmLeaveMatches = async () => {
    if (pendingLeaveMatches.length === 0) {
      addBotMessage("We couldn't find your queue entry.", [
        { label: 'Start over', value: 'restart' }
      ]);
      setStep('cancelled');
      return;
    }

    await Promise.all(pendingLeaveMatches.map(match => removeClient(match.id)));
    setPendingLeaveMatches([]);

    addBotMessage(
      "Sorry to see you go! We'll be here when you're ready.\n\nThanks for stopping by.",
      [{ label: 'Start over', value: 'restart' }]
    );
    setStep('cancelled');
  };

  const handleLeaveCurrentQueue = async () => {
    if (!joinedClientId) {
      addBotMessage("We couldn't find your queue entry.", [
        { label: 'Start over', value: 'restart' }
      ]);
      setStep('cancelled');
      return;
    }

    await removeClient(joinedClientId);
    setJoinedClientId(null);
    setPendingLeaveMatches([]);

    addBotMessage("You've been removed from the queue. See you next time!", [
      { label: 'Start over', value: 'restart' }
    ]);
    setStep('cancelled');
  };

  const completeQueueJoin = async () => {
    if (!selectedBarber || !selectedService) {
      showWelcomeOptions();
      return;
    }

    const barber = barbers.find(b => b.id === selectedBarber);
    const waitTime = getEstimatedWaitTime(selectedBarber);
    const queuePosition = getQueueCount(selectedBarber) + 1;

    const newClientId = await addToQueue({
      barberId: selectedBarber,
      service: selectedService,
      name: 'Guest',
      phone: clientPhone || undefined,
      email: clientEmail || undefined
    });
    if (newClientId) {
      setJoinedClientId(newClientId);
    }
    setVerificationCode(null);
    setVerificationMethod(null);
    setVerificationTarget('');
    setPendingJoinContact(null);

    addBotMessage(
      `You're in the queue!

` +
        `${providerLabelTitle}: ${barber?.name}
` +
        `Service: ${selectedService ? getServiceName(selectedService) : 'Service'}
` +
        `Position: #${queuePosition}
` +
        `Estimated wait: ~${waitTime} minutes

` +
        `We'll notify you 45 minutes before your turn.

` +
        `Address: ${salon.address}, ${salon.city}`,
      [
        { label: 'Leave the queue', value: 'leave-queue' },
        { label: 'Start over', value: 'restart' }
      ]
    );
    setStep('joined-success');
  };

  const latestOptionsMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].options?.length) return messages[i].id;
    }
    return null;
  }, [messages]);
  const latestMessageId = messages[messages.length - 1]?.id ?? null;

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

export default Chat;
