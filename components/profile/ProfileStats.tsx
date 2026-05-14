import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

export interface ProfileStat {
  icon: keyof typeof Ionicons.glyphMap;
  value: number | string;
  label: string;
  tint: string;
  iconBg: string;
  href?: string;
}

interface ProfileStatsRowProps {
  stats: ProfileStat[];
}

export const ProfileStatsRow: React.FC<ProfileStatsRowProps> = ({ stats }) => {
  return (
    <View style={styles.row}>
      {stats.map((s, i) => {
        const inner = (
          <View style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: s.iconBg }]}>
              <Ionicons name={s.icon} size={18} color={s.tint} />
            </View>
            <Text style={styles.value}>{s.value}</Text>
            <Text style={styles.label} numberOfLines={1}>{s.label}</Text>
          </View>
        );

        if (s.href) {
          return (
            <Link key={i} href={s.href as any} asChild>
              <TouchableOpacity activeOpacity={0.85} style={styles.cardWrap}>{inner}</TouchableOpacity>
            </Link>
          );
        }
        return (
          <View key={i} style={styles.cardWrap}>{inner}</View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginTop: 14,
    gap: 10,
  },
  cardWrap: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F2F4',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  label: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
