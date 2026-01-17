import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueue } from '../../../context/QueueContext';
import type { QueueClient } from '../../../data/mockData';
import type { ChatStep, ContactMethod, Message, StoredContact } from '../types';
import { loadStoredContact, saveStoredContact } from '../utils/contactStorage';
import {
  barberSupportsService,
  copyTextToClipboard,
  formatJoinMethod,
  formatStoredContactLabel,
  formatWaitTime,
  isActiveClient,
  normalizePhone
} from '../utils/chatUtils';

type PendingContact = {
  method: ContactMethod;
  value: string;
};

export const useChatFlow = () => {
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
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [joinMethod, setJoinMethod] = useState<ContactMethod | null>(null);
  const [joinedClientId, setJoinedClientId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<ContactMethod | null>(null);
  const [verificationTarget, setVerificationTarget] = useState('');
  const [pendingJoinContact, setPendingJoinContact] = useState<PendingContact | null>(null);
  const [pendingDuplicateMatches, setPendingDuplicateMatches] = useState<QueueClient[]>([]);
  const [pendingLeaveMatches, setPendingLeaveMatches] = useState<QueueClient[]>([]);
  const [savedContact, setSavedContact] = useState<StoredContact | null>(null);
  const [offDutyMatches, setOffDutyMatches] = useState<QueueClient[]>([]);
  const [pendingOffDutyEntry, setPendingOffDutyEntry] = useState<QueueClient | null>(null);
  const [pendingOffDutyMode, setPendingOffDutyMode] = useState<'auto' | 'choose' | null>(null);
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

  useEffect(() => {
    const stored = loadStoredContact();
    if (stored) {
      setSavedContact(stored);
    }
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

  const sendVerificationCode = (method: ContactMethod, destination: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationMethod(method);
    setVerificationTarget(destination);
    setVerificationCode(code);
    console.info(`Verification code for ${method} ${destination}: ${code}`);
    return code;
  };

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
  const fullAddress = `${salon.address}, ${salon.city}`;

  const rememberContact = (method: ContactMethod, value: string) => {
    const normalized = method === 'phone' ? normalizePhone(value) : value.trim().toLowerCase();
    if (!normalized) return;
    const stored = { method, value: normalized, storedAt: Date.now() };
    saveStoredContact(stored);
    setSavedContact(stored);
  };

  const resetOffDutyState = () => {
    setOffDutyMatches([]);
    setPendingOffDutyEntry(null);
    setPendingOffDutyMode(null);
  };

  const handleCopyAddress = async () => {
    const didCopy = await copyTextToClipboard(fullAddress);
    addBotMessage(
      didCopy
        ? 'Address copied to clipboard.'
        : 'Unable to copy the address automatically. Please select it to copy manually.',
      [
        { label: 'Leave the queue', value: 'leave-queue' },
        { label: 'Start over', value: 'restart' }
      ]
    );
  };

  const getQueuePosition = (match: QueueClient) => {
    const activeQueue = queue
      .filter(client => client.barberId === match.barberId && isActiveClient(client))
      .sort((a, b) => a.visibleId - b.visibleId);
    return activeQueue.findIndex(client => client.id === match.id) + 1;
  };

  const getAvailableProvidersForService = (service: string) =>
    barbers.filter(barber => barber.isAvailable && barberSupportsService(barber, service));

  const getMostAvailableProvider = (service: string) => {
    const available = getAvailableProvidersForService(service);
    if (available.length === 0) return null;
    return available.reduce((best, candidate) => {
      const bestWait = getEstimatedWaitTime(best.id);
      const candidateWait = getEstimatedWaitTime(candidate.id);
      if (candidateWait < bestWait) return candidate;
      if (candidateWait > bestWait) return best;
      return getQueueCount(candidate.id) < getQueueCount(best.id) ? candidate : best;
    });
  };

  const startVerification = (method: ContactMethod, value: string) => {
    rememberContact(method, value);
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

    addBotMessage(intro ?? `Welcome to ${salon.name}!\n\nHow can we help you today?`, [
      ...serviceOptions,
      { label: 'Check my queue position', value: 'check-position' },
      { label: 'Leave the queue', value: 'leave-queue' }
    ]);
    setStep('welcome');
  };

  const handleInputCancel = () => {
    setShowInput(false);
    setInputType('text');
    setInputPlaceholder('');
    setPendingJoinContact(null);
    setPendingDuplicateMatches([]);
    setPendingLeaveMatches([]);
    resetOffDutyState();

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
      if (value === 'copy-address') {
        void handleCopyAddress();
        return;
      }
      if (value === 'use-different-contact-check') {
        promptForLookup('check', { preferSavedContact: false });
        return;
      }
      if (value === 'use-different-contact-leave') {
        promptForLookup('leave', { preferSavedContact: false });
        return;
      }

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
              `Great choice! ${barber?.name} is ready for you.\n\n` +
                `Current wait: ~${formatWaitTime(waitTime)}\n` +
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
            addBotMessage("How would you like to be notified when it's almost your turn?", [
              { label: 'Text message (SMS)', value: 'phone' },
              { label: 'Email', value: 'email' }
            ]);
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
              `A new code has been sent to ${verificationTarget}.\n\nEnter it below to continue.\n\nDemo code: ${code}`
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
            setPendingDuplicateMatches([]);
            startVerification(method, contactValue);
          } else if (value === 'duplicate-leave-join') {
            void handleDuplicateLeaveAndJoin();
          } else if (value === 'duplicate-check') {
            const { method, value: contactValue } = pendingJoinContact;
            setPendingJoinContact(null);
            setPendingDuplicateMatches([]);
            handleCheckPositionLookup(contactValue, method);
          } else if (value === 'never-mind') {
            setPendingJoinContact(null);
            setPendingDuplicateMatches([]);
            showWelcomeOptions('No problem. What would you like to do next?');
          }
          break;

        case 'off-duty':
          if (value === 'off-duty-choose') {
            handleOffDutyReassignment('choose');
          } else if (value === 'off-duty-auto') {
            handleOffDutyReassignment('auto');
          } else if (value === 'restart') {
            resetChat();
          }
          break;

        case 'off-duty-entry':
          if (value === 'back') {
            showOffDutyPrompt();
            break;
          }
          handleOffDutyEntrySelection(value);
          break;

        case 'off-duty-provider':
          if (value === 'back') {
            if (pendingOffDutyEntry && offDutyMatches.length <= 1) {
              showOffDutyPrompt();
            } else {
              showOffDutyEntrySelection(pendingOffDutyMode ?? 'choose');
            }
            break;
          }
          void handleManualReassignment(value);
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

  const promptForLookup = (
    mode: 'check' | 'leave',
    options?: { preferSavedContact?: boolean }
  ) => {
    if (mode === 'leave') {
      setPendingLeaveMatches([]);
    }

    const canUseSaved =
      options?.preferSavedContact !== false &&
      savedContact &&
      (!joinMethod || savedContact.method === joinMethod);

    if (canUseSaved && savedContact) {
      addBotMessage(
        `Using your saved ${formatJoinMethod(savedContact.method)} ${formatStoredContactLabel(
          savedContact
        )}.`
      );
      if (mode === 'check') {
        handleCheckPositionLookup(savedContact.value, savedContact.method);
      } else {
        handleLeaveQueueLookup(savedContact.value, savedContact.method);
      }
      return;
    }

    const base =
      mode === 'check'
        ? 'How would you like to look up your spot in line?'
        : 'How would you like to find your queue entry?';
    const hint = joinMethod
      ? `\n\nPlease use the same ${formatJoinMethod(joinMethod)} you used to join the queue.`
      : '';
    const lookupOptions = joinMethod
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

    addBotMessage(`${base}${hint}`, lookupOptions);
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
    setPendingDuplicateMatches([]);
    setPendingLeaveMatches([]);
    resetOffDutyState();
    setShowInput(false);
    showWelcomeOptions();
  };

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
        [{ label: 'Go back', value: 'back' }]
      );
      setStep('select-barber');
      return;
    }

    const barberOptions = availableBarbers.map(b => ({
      label: b.name,
      sublabel: `~${formatWaitTime(getEstimatedWaitTime(b.id))} wait - ${getQueueCount(
        b.id
      )} in queue`,
      value: b.id
    }));

    addBotMessage(
      `Here are our available ${providerLabelPlural} for ${serviceLabel}:\n\n` +
        `Please select who you'd like to see:`,
      [...barberOptions, { label: 'Go back', value: 'back' }]
    );
    setStep('select-barber');
  };

  const buildQueueDetails = (match: QueueClient) => {
    const barber = barbers.find(b => b.id === match.barberId);
    const position = getQueuePosition(match);
    const waitMinutes = Math.max(
      5,
      Math.round((match.estimatedTime.getTime() - Date.now()) / 60000)
    );
    return {
      match,
      barber,
      position,
      waitMinutes
    };
  };

  const showOffDutyPrompt = (matches = offDutyMatches, onDutySummaries: string[] = []) => {
    if (matches.length === 0) {
      showWelcomeOptions();
      return;
    }
    const names = Array.from(
      new Set(
        matches.map(match => barbers.find(b => b.id === match.barberId)?.name ?? providerLabel)
      )
    );
    const verb = names.length === 1 ? 'is' : 'are';
    const apology = `We apologize, ${names.join(', ')} ${verb} now off duty.`;
    const onDutyNote = onDutySummaries.length
      ? `\n\nCurrent on-duty queues:\n${onDutySummaries.join('\n')}`
      : '';

    addBotMessage(
      `${apology}${onDutyNote}\n\nWould you like to choose a different ${providerLabel} or should we assign you the most available ${providerLabel}?`,
      [
        { label: `Choose a different ${providerLabel}`, value: 'off-duty-choose' },
        { label: `Assign the most available ${providerLabel}`, value: 'off-duty-auto' },
        { label: 'Use a different contact', value: 'use-different-contact-check' },
        { label: 'Start over', value: 'restart' }
      ]
    );
    setStep('off-duty');
  };

  const showOffDutyEntrySelection = (mode: 'auto' | 'choose') => {
    if (offDutyMatches.length === 0) {
      showWelcomeOptions();
      return;
    }
    setPendingOffDutyMode(mode);
    const entryOptions = offDutyMatches.map(match => {
      const barberName = barbers.find(b => b.id === match.barberId)?.name ?? providerLabelTitle;
      const serviceName = getServiceName(match.service);
      const position = getQueuePosition(match);
      return {
        label: `${providerLabelTitle}: ${barberName}`,
        sublabel: `${serviceName} - Position #${position}`,
        value: match.id
      };
    });

    addBotMessage('We found multiple off-duty queue entries. Which one should we move?', [
      ...entryOptions,
      { label: 'Go back', value: 'back' }
    ]);
    setStep('off-duty-entry');
  };

  const handleOffDutyReassignment = (mode: 'auto' | 'choose') => {
    if (offDutyMatches.length === 0) {
      showWelcomeOptions();
      return;
    }
    if (offDutyMatches.length === 1) {
      const entry = offDutyMatches[0];
      setPendingOffDutyEntry(entry);
      if (mode === 'auto') {
        void handleAutoReassignment(entry);
      } else {
        showOffDutyProviderSelection(entry);
      }
      return;
    }
    showOffDutyEntrySelection(mode);
  };

  const handleOffDutyEntrySelection = (entryId: string) => {
    const entry = offDutyMatches.find(match => match.id === entryId);
    if (!entry) {
      showWelcomeOptions();
      return;
    }
    setPendingOffDutyEntry(entry);
    if (pendingOffDutyMode === 'auto') {
      void handleAutoReassignment(entry);
    } else {
      showOffDutyProviderSelection(entry);
    }
  };

  const showOffDutyProviderSelection = (entry: QueueClient) => {
    const serviceName = getServiceName(entry.service);
    const availableProviders = getAvailableProvidersForService(entry.service);
    if (availableProviders.length === 0) {
      addBotMessage(
        `Sorry, no ${providerLabelPlural} are on duty for ${serviceName} right now.`,
        [{ label: 'Start over', value: 'restart' }]
      );
      setStep('cancelled');
      return;
    }

    const providerOptions = availableProviders.map(barber => ({
      label: barber.name,
      sublabel: `~${formatWaitTime(getEstimatedWaitTime(barber.id))} wait - ${getQueueCount(
        barber.id
      )} in queue`,
      value: barber.id
    }));

    addBotMessage(`Select a different ${providerLabel} for ${serviceName}:`, [
      ...providerOptions,
      { label: 'Go back', value: 'back' }
    ]);
    setStep('off-duty-provider');
  };

  const handleManualReassignment = async (providerId: string) => {
    if (!pendingOffDutyEntry) {
      showWelcomeOptions();
      return;
    }
    await reassignQueueEntry(pendingOffDutyEntry, providerId);
  };

  const handleAutoReassignment = async (entry: QueueClient) => {
    const provider = getMostAvailableProvider(entry.service);
    if (!provider) {
      addBotMessage(
        `Sorry, no ${providerLabelPlural} are on duty for ${getServiceName(entry.service)} right now.`,
        [{ label: 'Start over', value: 'restart' }]
      );
      setStep('cancelled');
      return;
    }
    await reassignQueueEntry(entry, provider.id);
  };

  const handleDuplicateLeaveAndJoin = async () => {
    if (!pendingJoinContact) {
      showWelcomeOptions();
      return;
    }

    const { method, value } = pendingJoinContact;
    if (pendingDuplicateMatches.length > 0) {
      await Promise.all(pendingDuplicateMatches.map(match => removeClient(match.id)));
    }

    setPendingDuplicateMatches([]);
    setPendingJoinContact(null);
    startVerification(method, value);
  };

  const reassignQueueEntry = async (entry: QueueClient, providerId: string) => {
    const provider = barbers.find(barber => barber.id === providerId);
    if (!provider) {
      addBotMessage("We couldn't find that service provider.", [
        { label: 'Start over', value: 'restart' }
      ]);
      setStep('cancelled');
      return;
    }

    const queuePosition = getQueueCount(providerId) + 1;
    const waitTime = getEstimatedWaitTime(providerId);
    const payload = {
      barberId: providerId,
      service: entry.service,
      name: entry.name,
      phone: entry.phone ?? (savedContact?.method === 'phone' ? savedContact.value : undefined),
      email: entry.email ?? (savedContact?.method === 'email' ? savedContact.value : undefined)
    };

    const newClientId = await addToQueue(payload);
    if (!newClientId) {
      addBotMessage("We couldn't move you to a new queue. Please try again.", [
        { label: 'Start over', value: 'restart' }
      ]);
      setStep('cancelled');
      return;
    }

    await removeClient(entry.id);
    setJoinedClientId(newClientId);
    resetOffDutyState();

    addBotMessage(
      `You're now in the queue!\n\n` +
        `${providerLabelTitle}: ${provider.name}\n` +
        `Service: ${getServiceName(entry.service)}\n` +
        `Position: #${queuePosition}\n` +
        `Estimated wait: ~${formatWaitTime(waitTime)}\n\n` +
        `We'll notify you 45 minutes before your turn.\n\n` +
        `Address: ${fullAddress}`,
      [
        { label: 'Copy address', value: 'copy-address' },
        { label: 'Leave the queue', value: 'leave-queue' },
        { label: 'Start over', value: 'restart' }
      ]
    );
    setStep('joined-success');
  };

  const handleInputSubmit = (value: string) => {
    addClientMessage(value);
    setShowInput(false);

    setTimeout(() => {
      if (step === 'enter-phone' || step === 'enter-email') {
        const method: ContactMethod = step === 'enter-phone' ? 'phone' : 'email';
        rememberContact(method, value);
        const matches = findMatches(value, method);
        if (matches.length > 0) {
          const contactLabel = method === 'phone' ? 'phone number' : 'email';
          setPendingJoinContact({ method, value });
          setPendingDuplicateMatches(matches);
          const details = matches.map(buildQueueDetails);
          const summaries = details.map(detail => {
            const barberName = detail.barber?.name ?? providerLabelTitle;
            return `${providerLabelTitle}: ${barberName} | Service: ${getServiceName(
              detail.match.service
            )} | Position: #${detail.position}`;
          });

          addBotMessage(
            `That ${contactLabel} is already on the waiting list.\n\n${summaries.join(
              '\n'
            )}\n\nWould you like to leave that queue and join another, or join again for someone else?`,
            [
              { label: 'Leave that queue and join another', value: 'duplicate-leave-join' },
              { label: 'Join again for someone else', value: 'duplicate-join' },
              { label: 'Check my position', value: 'duplicate-check' },
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
        const kind: ContactMethod = step === 'check-phone' ? 'phone' : 'email';
        handleCheckPositionLookup(value, kind);
      } else if (step === 'leave-phone' || step === 'leave-email') {
        const kind: ContactMethod = step === 'leave-phone' ? 'phone' : 'email';
        handleLeaveQueueLookup(value, kind);
      }
    }, 500);
  };

  const findMatches = (value: string, kind: ContactMethod) => {
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

  const handleCheckPositionLookup = (value: string, kind: ContactMethod) => {
    rememberContact(kind, value);
    const matches = findMatches(value, kind);

    if (matches.length === 0) {
      resetOffDutyState();
      addBotMessage(
        'We could not find an active queue entry with that contact. Want to try again?',
        [
          { label: 'Use a different contact', value: 'use-different-contact-check' },
          { label: 'Start over', value: 'restart' }
        ]
      );
      setStep('cancelled');
      return;
    }

    const details = matches.map(buildQueueDetails);
    const offDutyDetails = details.filter(detail => !detail.barber?.isAvailable);
    const onDutyDetails = details.filter(detail => detail.barber?.isAvailable);

    if (offDutyDetails.length > 0) {
      const offDutyEntries = offDutyDetails.map(detail => detail.match);
      setOffDutyMatches(offDutyEntries);
      setPendingOffDutyEntry(null);
      setPendingOffDutyMode(null);

      const onDutySummaries = onDutyDetails.map(detail => {
        const barberName = detail.barber?.name ?? providerLabelTitle;
        return `${providerLabelTitle}: ${barberName} | Position: #${detail.position} | Est wait: ~${formatWaitTime(
          detail.waitMinutes
        )}`;
      });

      showOffDutyPrompt(offDutyEntries, onDutySummaries);
      return;
    }

    resetOffDutyState();

    const summaries = details.map(detail => {
      const barberName = detail.barber?.name ?? providerLabelTitle;
      return `${providerLabelTitle}: ${barberName} | Position: #${detail.position} | Est wait: ~${formatWaitTime(
        detail.waitMinutes
      )}`;
    });
    const shouldHeadToShop = details.some(
      detail => detail.waitMinutes < 50 || detail.position === 3
    );
    const headNote = shouldHeadToShop
      ? `\n\nIt's almost your turn. Start heading to the shop at ${fullAddress}.`
      : '';
    const statusOptions = [
      ...(shouldHeadToShop ? [{ label: 'Copy address', value: 'copy-address' }] : []),
      { label: 'Use a different contact', value: 'use-different-contact-check' },
      { label: 'Start over', value: 'restart' }
    ];

    addBotMessage(
      `Here is your latest queue status:\n\n${summaries.join('\n')}\n\n` +
        `We will notify you about 45 minutes before your turn.${headNote}`,
      statusOptions
    );
    setStep('cancelled');
  };

  const handleLeaveQueueLookup = (value: string, kind: ContactMethod) => {
    rememberContact(kind, value);
    const matches = findMatches(value, kind);

    if (matches.length === 0) {
      resetOffDutyState();
      addBotMessage('We could not find an active queue entry with that contact.', [
        { label: 'Use a different contact', value: 'use-different-contact-leave' },
        { label: 'Start over', value: 'restart' }
      ]);
      setStep('cancelled');
      return;
    }

    resetOffDutyState();
    setPendingLeaveMatches(matches);
    const entryLabel = matches.length === 1 ? 'entry' : 'entries';
    const details = matches.map(buildQueueDetails);
    const summaries = details.map(detail => {
      const barberName = detail.barber?.name ?? providerLabelTitle;
      return `${providerLabelTitle}: ${barberName} | Service: ${getServiceName(
        detail.match.service
      )} | Position: #${detail.position} | Est wait: ~${formatWaitTime(detail.waitMinutes)}`;
    });

    addBotMessage(
      `We found ${matches.length} active queue ${entryLabel}.\n\nQueue details:\n${summaries.join(
        '\n'
      )}\n\nLeave the queue?`,
      [
        { label: 'Yes, leave the queue', value: 'confirm-leave' },
        { label: 'Never mind', value: 'never-mind' },
        { label: 'Use a different contact', value: 'use-different-contact-leave' }
      ]
    );
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
      `You're in the queue!\n\n` +
        `${providerLabelTitle}: ${barber?.name}\n` +
        `Service: ${selectedService ? getServiceName(selectedService) : 'Service'}\n` +
        `Position: #${queuePosition}\n` +
        `Estimated wait: ~${formatWaitTime(waitTime)}\n\n` +
        `We'll notify you 45 minutes before your turn.\n\n` +
        `Address: ${fullAddress}`,
      [
        { label: 'Copy address', value: 'copy-address' },
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

  return {
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
  };
};
