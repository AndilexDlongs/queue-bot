import React, { useEffect, useState } from 'react';
import ChatPage from '../features/chat/ChatPage';
import ManagerPage from '../features/manager/ManagerPage';
import { QueueProvider } from '../context/QueueContext';

type Route = 'chat' | 'manager';

const getRouteFromHash = (): Route => {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'manager') return 'manager';
  return 'chat';
};

const getBusinessIdFromPath = () => {
  const segment = window.location.pathname.split('/').filter(Boolean)[0];
  if (segment) return segment;
  return import.meta.env.VITE_BUSINESS_ID ?? 'business-1';
};

const App: React.FC = () => {
  const [route, setRoute] = useState<Route>(getRouteFromHash());
  const [businessId, setBusinessId] = useState(getBusinessIdFromPath());

  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash());
    const onPathChange = () => setBusinessId(getBusinessIdFromPath());
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onPathChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onPathChange);
    };
  }, []);

  return (
    <QueueProvider businessId={businessId}>
      {route === 'manager' ? <ManagerPage /> : <ChatPage />}
    </QueueProvider>
  );
};

export default App;
