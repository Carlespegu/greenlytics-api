import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';

interface ActiveClientState {
  clientId: string | null;
  clientName: string | null;
}

interface ActiveClientContextValue extends ActiveClientState {
  setActiveClient: (client: ActiveClientState) => void;
  resetActiveClient: () => void;
}

const ActiveClientContext = createContext<ActiveClientContextValue | null>(null);

function getStorageKey(userId: string) {
  return `greenlytics:active-client:${userId}`;
}

export function ActiveClientProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [state, setState] = useState<ActiveClientState>({ clientId: null, clientName: null });

  useEffect(() => {
    if (!user) {
      setState({ clientId: null, clientName: null });
      return;
    }

    const storageKey = getStorageKey(user.userId);
    const savedValue = window.localStorage.getItem(storageKey);

    if (user.roleCode === 'ADMIN' && savedValue) {
      try {
        const parsed = JSON.parse(savedValue) as ActiveClientState;

        if (parsed.clientId) {
          setState({
            clientId: parsed.clientId,
            clientName: parsed.clientName ?? null,
          });
          return;
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    setState({
      clientId: user.clientId,
      clientName: user.clientName ?? null,
    });
  }, [user]);

  function setActiveClient(client: ActiveClientState) {
    if (!user) {
      return;
    }

    setState(client);

    if (user.roleCode === 'ADMIN') {
      window.localStorage.setItem(getStorageKey(user.userId), JSON.stringify(client));
    }
  }

  function resetActiveClient() {
    if (!user) {
      return;
    }

    const fallback = {
      clientId: user.clientId,
      clientName: user.clientName ?? null,
    };

    setState(fallback);
    window.localStorage.removeItem(getStorageKey(user.userId));
  }

  return (
    <ActiveClientContext.Provider value={{ ...state, setActiveClient, resetActiveClient }}>
      {children}
    </ActiveClientContext.Provider>
  );
}

export function useActiveClient() {
  const context = useContext(ActiveClientContext);

  if (!context) {
    throw new Error('useActiveClient must be used within ActiveClientProvider');
  }

  return context;
}
