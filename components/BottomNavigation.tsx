import * as React from 'react';
import { View, Pressable } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { useAuth } from '~/lib/context/AuthContext';
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
    label: ''
  },
  {
    name: 'about',
    path: '/about',
    icon: Info,
    label: ''
  },
  {
    name: 'chat',
    path: '/chat',
    icon: MessageCircle,
    label: ''
  },
  {
    name: 'services',
    path: '/services',
    icon: ScissorsIcon,
    label: ''
  },
  {
    name: 'appointments',
    path: '/appointments',
    icon: CalendarIcon,
    label: ''
  },
  {
    name: 'profile',
    path: '/profile',
    icon: UserIcon,
    label: ''
  },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useAuth();

  const handleNavPress = (path: string) => {
    try {
      router.push(path as any);
    } catch (error) {
      // Navigation context may not be ready yet, this is acceptable during app startup
    }
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
              <View className="relative">
                <IconComponent
                  size={24}
                  className={`mb-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                />
                {item.name === 'chat' && unreadCount > 0 && (
                  <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center">
                    <Text className="text-white text-xs font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'
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