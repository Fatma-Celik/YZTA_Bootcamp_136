import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlert, { AlertOptions } from '@/components/CustomAlert';

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
  hideAlert: () => {},
});

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alertOptions, setAlertOptions] = useState<AlertOptions | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertOptions(options);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setAlertOptions(null);
    }, 200);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert visible={visible} options={alertOptions} onClose={hideAlert} />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}
