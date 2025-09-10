import type { LucideIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';

export function iconWithClassName(icon: LucideIcon) {
  if (!icon) {
    console.warn('iconWithClassName received undefined icon');
    return icon;
  }
  
  // Ensure the icon has a displayName
  if (!icon.displayName && icon.name) {
    icon.displayName = icon.name;
  }
  
  cssInterop(icon, {
    className: {
      target: 'style',
      nativeStyleToProp: {
        color: true,
        opacity: true,
      },
    },
  });
  
  return icon;
}
