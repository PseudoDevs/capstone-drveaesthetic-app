import * as React from 'react';
import { View, Pressable } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { HomeIcon } from '~/lib/icons/Home';
import { Info } from '~/lib/icons/Info';
import { UserIcon } from '~/lib/icons/User';
import { ScissorsIcon } from '~/lib/icons/Scissors';
import { CalendarIcon } from '~/lib/icons/Calendar';
import { MessageCircle } from '~/lib/icons/MessageCircle';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  label: string;
}

const navItems: NavItem[] = [
  {
    name: 'home',
    path: '/home',
    icon: HomeIcon,
    label: 'Home'
  },
  {
    name: 'about',
    path: '/about',
    icon: Info,
    label: 'About'
  },
  {
    name: 'profile',
    path: '/profile',
    icon: UserIcon,
    label: 'Profile'
  },
  {
    name: 'services',
    path: '/services',
    icon: ScissorsIcon,
    label: 'Services'
  },
  {
    name: 'appointments',
    path: '/appointments',
    icon: CalendarIcon,
    label: 'Appointment'
  },
  {
    name: 'chat',
    path: '/chat',
    icon: MessageCircle,
    label: 'Chat'
  }
];

export function BottomNavigation() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const handleNavPress = (path: string) => {
    router.push(path as any);
  };

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border">
      <View 
        className="flex-row justify-around items-center pt-3 px-4"
        style={{ paddingBottom: Math.max(insets.bottom + 12, 20) }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.path || 
            (item.path === '/home' && pathname === '/') ||
            (item.path === '/chat' && pathname.startsWith('/chat'));
          
          const IconComponent = item.icon;
          
          return (
            <Pressable
              key={item.name}
              onPress={() => handleNavPress(item.path)}
              className="flex-1 items-center py-2 active:opacity-70"
            >
              <IconComponent 
                size={24} 
                className={`mb-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <Text 
                className={`text-xs font-medium ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}