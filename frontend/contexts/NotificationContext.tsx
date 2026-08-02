import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ─── Bildirim Tipi ───
export interface AppNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
  icon?: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  panelVisible: boolean;
  addNotification: (message: string, type?: 'success' | 'error' | 'info', icon?: string) => void;
  togglePanel: () => void;
  closePanel: () => void;
  clearAll: () => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  panelVisible: false,
  addNotification: () => {},
  togglePanel: () => {},
  closePanel: () => {},
  clearAll: () => {},
  markAllRead: () => {},
});

const MAX_NOTIFICATIONS = 50;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelVisible, setPanelVisible] = useState(false);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', icon?: string) => {
    const newNotif: AppNotification = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      message,
      type,
      timestamp: new Date(),
      icon,
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS));
    setUnreadCount((prev) => prev + 1);
  }, []);

  const togglePanel = useCallback(() => {
    setPanelVisible((prev) => !prev);
  }, []);

  const closePanel = useCallback(() => {
    setPanelVisible(false);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        panelVisible,
        addNotification,
        togglePanel,
        closePanel,
        clearAll,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
