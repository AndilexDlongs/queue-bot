import React, { useEffect, useState } from 'react';
import AppManager from './pages/AppManager';
import Chat from './pages/Chat';
import { QueueProvider } from './context/QueueContext';

type Route = 'chat' | 'manager';

const getRouteFromHash = (): Route => {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'manager') return 'manager';
  return 'chat';
};

const App: React.FC = () => {
  const [route, setRoute] = useState<Route>(getRouteFromHash());

  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <QueueProvider>
      {route === 'manager' ? <AppManager /> : <Chat />}
    </QueueProvider>
  );
};

export default App;
