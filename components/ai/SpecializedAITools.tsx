import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';

export const QuickToolCard = ({ icon, value, label, actionText, href }: any) => (
  <Link href={href || "#"} asChild>
    <TouchableOpacity style={styles.quickCard}>
      <View style={styles.quickIconCircle}>
        <Ionicons name={icon} size={24} color="#003366" />
      </View>
      <Text style={styles.quickValue}>{value}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
      <View style={styles.quickAction}>
        <Text style={styles.quickActionText}>{actionText}</Text>
        <Ionicons name="chevron-forward" size={14} color="#003366" />
      </View>
    </TouchableOpacity>
  </Link>
);

export const AIVendorMatchCard = ({ vendorCount = 0 }: { vendorCount?: number }) => {
  return (
    <View style={styles.vendorMatchCard}>
      <View style={styles.vendorMatchHeader}>
        <View style={styles.vendorMatchTitles}>
          <Text style={styles.vendorMatchTitle}>AI Vendor Match</Text>
          <Text style={styles.vendorMatchSubtitle}>{vendorCount > 0 ? `${vendorCount} Top picks for your style` : 'Top picks for your style'}</Text>
        </View>
        <TouchableOpacity style={styles.expandButton}>
          <Ionicons name="expand-outline" size={20} color="#003366" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.vendorImageRow}>
        <View style={styles.vendorImageContainer}>
          <Image 
            source="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400"
            style={styles.vendorImage}
          />
          <View style={styles.matchBadge}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.matchBadgeText}>98% Match</Text>
          </View>
        </View>
        <View style={styles.vendorImageContainer}>
          <Image 
            source="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=400"
            style={styles.vendorImage}
          />
        </View>
      </View>


      <Link href="/ai-vendor-match" asChild>
        <TouchableOpacity style={styles.analysisButton}>
          <Text style={styles.analysisButtonText}>Start Side-by-Side Analysis</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

export const AIBudgetPlannerCard = ({ totalBudget = 0, allocation = 0, label = "Catering Allocation" }: { totalBudget?: number, allocation?: number, label?: string }) => {
  return (
    <Link href="/ai-budget-planner" asChild>
      <TouchableOpacity style={styles.budgetCard}>
        <View style={styles.budgetHeader}>
          <View style={styles.budgetTitleRow}>
            <View style={styles.budgetIconCircle}>
              <Ionicons name="wallet-outline" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.budgetTitle}>Budget Planner</Text>
              {totalBudget > 0 && <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Total: ₹{totalBudget.toLocaleString('en-IN')}</Text>}
            </View>
          </View>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>
        
        <View style={styles.budgetProgressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{label}</Text>
            <Text style={styles.progressValue}>{allocation}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${allocation}%` }]} />
          </View>
        </View>


        <View style={styles.budgetFooter}>
          <Text style={styles.budgetFooterText}>Optimized for local market</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </View>
      </TouchableOpacity>
    </Link>
  );
};

export const AIToolLinkCard = ({ title, description, icon, linkText, href }: any) => (
  <View style={styles.linkCard}>
    <View style={styles.linkIconCircle}>
      <Ionicons name={icon} size={24} color="#003366" />
    </View>
    <View style={styles.linkContent}>
      <Text style={styles.linkTitle}>{title}</Text>
      <Text style={styles.linkDescription}>{description}</Text>
      <Link href={href || "#"} asChild>
        <TouchableOpacity style={styles.linkAction}>
          <Text style={styles.linkActionText}>{linkText}</Text>
          <Ionicons name="chevron-forward" size={16} color="#003366" />
        </TouchableOpacity>
      </Link>
    </View>
  </View>
);

const styles = StyleSheet.create({
  // Quick Tool Card
  quickCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  quickIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  quickLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#003366',
  },

  // AI Vendor Match Card
  vendorMatchCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  vendorMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  vendorMatchTitles: {
    flex: 1,
  },
  vendorMatchTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  vendorMatchSubtitle: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  expandButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorImageRow: {
    flexDirection: 'row',
    gap: 1,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  vendorImageContainer: {
    flex: 1,
    height: '100%',
  },
  vendorImage: {
    width: '100%',
    height: '100%',
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003366',
  },
  analysisButton: {
    backgroundColor: '#003366',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  analysisButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  // Budget Planner Card
  budgetCard: {
    backgroundColor: '#003366',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  budgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  liveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
  },
  budgetProgressSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetFooterText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },

  // Link Cards (keep for now)
  linkCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    gap: 16,
  },
  linkIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  linkDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  linkAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#003366',
  },
});
