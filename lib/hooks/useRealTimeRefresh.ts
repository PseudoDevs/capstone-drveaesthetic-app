import { useState, useCallback } from 'react';

export interface UseRealTimeRefreshOptions {
  onRefresh: () => Promise<void>;
  showSuccessMessage?: boolean;
  successMessage?: string;
}

export function useRealTimeRefresh({
  onRefresh,
  showSuccessMessage = false,
  successMessage = 'Data updated successfully!'
}: UseRealTimeRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefreshTime(new Date());

      if (showSuccessMessage && successMessage) {
        // Could integrate with toast/alert system here
      }
    } catch (error) {
      // Silent error handling - keep existing data if refresh fails
      console.warn('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, showSuccessMessage, successMessage]);

  const formatLastRefreshTime = useCallback(() => {
    if (!lastRefreshTime) return null;
    return lastRefreshTime.toLocaleTimeString();
  }, [lastRefreshTime]);

  return {
    isRefreshing,
    lastRefreshTime,
    formatLastRefreshTime,
    refresh,
  };
}