/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(StorageService.isOnline());
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(
    StorageService.isOfflineSimulation()
  );

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(StorageService.isOnline());
      setIsSimulatedOffline(StorageService.isOfflineSimulation());
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    window.addEventListener('transafrica-offline-mode-change', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      window.removeEventListener('transafrica-offline-mode-change', updateStatus);
    };
  }, []);

  const toggleSimulatedOffline = () => {
    const nextVal = !isSimulatedOffline;
    StorageService.setOfflineSimulation(nextVal);
    setIsSimulatedOffline(nextVal);
    setIsOnline(StorageService.isOnline());
  };

  return {
    isOnline,
    isSimulatedOffline,
    toggleSimulatedOffline,
  };
}
