import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const HERO_GRADIENT_COLORS = ['#FFFBFF', '#F5F3FF', '#EEF2FF', '#ECFEFF'] as const;

type HeroBackButtonProps = {
  onPress?: () => void;
};

export function HeroBackButton({ onPress }: HeroBackButtonProps) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.heroBack}
      onPress={onPress ?? (() => router.back())}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Ionicons name="chevron-back" size={24} color="#334155" />
    </TouchableOpacity>
  );
}

type ScreenHeroHeaderProps = {
  title: string;
  eyebrow?: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  hint?: string;
  gradient?: boolean;
  style?: ViewStyle;
};

export function ScreenHeroHeader({
  title,
  eyebrow,
  onBack,
  rightSlot,
  hint,
  gradient = true,
  style,
}: ScreenHeroHeaderProps) {
  const content = (
    <SafeAreaView edges={['top']}>
      <View style={styles.heroRow}>
        <HeroBackButton onPress={onBack} />
        <View style={styles.heroTitleBlock}>
          {eyebrow ? <Text style={styles.heroEyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.heroTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {rightSlot ?? <View style={styles.heroRightSpacer} />}
      </View>
      {hint ? <Text style={styles.heroHint}>{hint}</Text> : null}
    </SafeAreaView>
  );

  if (!gradient) {
    return <View style={[styles.plainHeader, style]}>{content}</View>;
  }

  return (
    <LinearGradient
      colors={[...HERO_GRADIENT_COLORS]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.heroGradient, style]}
    >
      {content}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  heroGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  plainHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 18,
    gap: 12,
  },
  heroBack: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  heroTitleBlock: { flex: 1, minWidth: 0 },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  heroRightSpacer: {
    width: 44,
  },
  heroHint: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: -8,
  },
});
