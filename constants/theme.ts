/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

/** BookMyVendors brand palette (login / headers) */
export const Brand = {
  navy: '#050A30',
  blue: '#2196F3',
  primary: '#004A7C',
  purple: '#9C27B0',
  mutedBlueGrey: '#5C6BC0',
  tabInactive: '#70758F',
  tabActiveTint: 'rgba(0, 74, 124, 0.12)',
  tabBarBg: '#F8F9FC',
  tabBarBorder: '#E8EAF0',
  labelPurple: '#9575CD',
  screenBg: '#EEF1F8',
  cardBorder: '#E8EAF6',
  lightPurpleBg: '#EDE7F6',
  white: '#FFFFFF',
};

const tintColorLight = Brand.primary;
const tintColorDark = Brand.blue;

export const Colors = {
  light: {
    text: Brand.navy,
    background: Brand.white,
    tint: tintColorLight,
    icon: Brand.mutedBlueGrey,
    tabIconDefault: Brand.tabInactive,
    tabIconSelected: tintColorLight,
    tabBarBackground: Brand.tabBarBg,
    tabBarBorder: Brand.tabBarBorder,
  },
  dark: {
    text: '#ECEDEE',
    background: Brand.navy,
    tint: tintColorDark,
    icon: 'rgba(255,255,255,0.55)',
    tabIconDefault: 'rgba(255,255,255,0.55)',
    tabIconSelected: tintColorDark,
    tabBarBackground: '#0c1240',
    tabBarBorder: 'rgba(156, 39, 176, 0.25)',
  },
};

export function getTabBarStyle(colorScheme: 'light' | 'dark' | null | undefined) {
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = Colors[scheme];

  return {
    backgroundColor: palette.tabBarBackground,
    borderTopColor: palette.tabBarBorder,
    borderTopWidth: 1,
    paddingTop: 6,
    elevation: 16,
    shadowColor: Brand.navy,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: scheme === 'light' ? 0.1 : 0.35,
    shadowRadius: 10,
  } as const;
}

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
