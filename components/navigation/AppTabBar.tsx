import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  explore: 'Explore',
  'ai-tools': 'AI Tools',
  profile: 'Profile',
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function getIconName(routeName: string, focused: boolean): IoniconName {
  switch (routeName) {
    case 'index':
      return focused ? 'home' : 'home-outline';
    case 'explore':
      return focused ? 'search' : 'search-outline';
    case 'ai-tools':
      return focused ? 'sparkles' : 'sparkles-outline';
    case 'profile':
      return focused ? 'person' : 'person-outline';
    default:
      return 'ellipse-outline';
  }
}

function TabIcon({ routeName, focused }: { routeName: string; focused: boolean }) {
  const color = focused ? Brand.primary : Brand.tabInactive;
  return <Ionicons name={getIconName(routeName, focused)} size={24} color={color} />;
}

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  return (
    <View style={[styles.bar, { paddingBottom: bottomPad }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const label = TAB_LABELS[route.name] ?? route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={label}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
          >
            <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
              <TabIcon routeName={route.name} focused={isFocused} />
            </View>
            <Text style={[styles.label, isFocused ? styles.labelActive : styles.labelInactive]}>
              {label}
            </Text>
            <View style={[styles.indicator, !isFocused && styles.indicatorHidden]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Brand.tabBarBg,
    borderTopWidth: 1,
    borderTopColor: Brand.tabBarBorder,
    paddingTop: 8,
    minHeight: 60,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  iconWrapActive: {
    backgroundColor: Brand.tabActiveTint,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
  labelActive: {
    color: Brand.primary,
    fontWeight: '700',
  },
  labelInactive: {
    color: Brand.tabInactive,
    fontWeight: '500',
  },
  indicator: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: Brand.primary,
    marginTop: 2,
  },
  indicatorHidden: {
    opacity: 0,
  },
});
