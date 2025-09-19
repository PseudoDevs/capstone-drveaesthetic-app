import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Text } from '~/components/ui/text';

interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RefreshButton({
  onRefresh,
  isRefreshing,
  disabled = false,
  size = 'md'
}: RefreshButtonProps) {
  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <TouchableOpacity
      onPress={onRefresh}
      disabled={isRefreshing || disabled}
      className={`${sizeClasses[size]} rounded-full bg-primary/10`}
    >
      <Text className={`${iconSizes[size]} ${isRefreshing || disabled ? 'opacity-50' : ''}`}>
        {isRefreshing ? '⏳' : '🔄'}
      </Text>
    </TouchableOpacity>
  );
}