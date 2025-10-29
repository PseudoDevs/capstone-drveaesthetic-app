import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface ChevronRightProps {
  className?: string;
}

export function ChevronRight({ className }: ChevronRightProps) {
  return (
    <Svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <Path d="m9 18 6-6-6-6" />
    </Svg>
  );
}