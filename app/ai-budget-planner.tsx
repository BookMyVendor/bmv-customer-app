import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '@/context/AuthContext';
import { getWeddingBudgetPlanCategories, createWeddingBudgetPlan, listWeddingBudgetPlans } from '@/services/weddingBudgetService';
import { WeddingBudgetPlanCategory, WeddingBudgetPlanCategoryInput } from '@/types/weddingBudget.types';

const TIPS = [
  { icon: 'calendar-clock', text: 'Book venues during off-season for up to 30% savings' },
  { icon: 'camera-plus-outline', text: 'Bundle photography & videography for package deals' },
  { icon: 'account-group-outline', text: 'Confirm catering headcount 2 weeks before the event' },
];

const DEFAULT_CATEGORIES = [
  { name: 'Venue', percentage: 40 },
  { name: 'Catering', percentage: 25 },
  { name: 'Photography', percentage: 10 },
  { name: 'Decoration', percentage: 10 },
  { name: 'Entertainment', percentage: 5 },
  { name: 'Makeup & Beauty', percentage: 3 },
  { name: 'Transportation', percentage: 2 },
  { name: 'Miscellaneous', percentage: 5 },
];

const getIconForCategory = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('venue')) return 'castle';
  if (n.includes('catering') || n.includes('food')) return 'food-fork-drink';
  if (n.includes('photo') || n.includes('video') || n.includes('camera')) return 'camera-outline';
  if (n.includes('decor') || n.includes('party')) return 'party-popper';
  if (n.includes('entertainment') || n.includes('music')) return 'music';
  if (n.includes('makeup') || n.includes('beauty')) return 'face-woman-outline';
  if (n.includes('transport') || n.includes('car')) return 'car-outline';
  if (n.includes('miscellaneous') || n.includes('buffer')) return 'dots-horizontal-circle-outline';
  if (n.includes('guest')) return 'account-group-outline';
  if (n.includes('gift')) return 'gift-outline';
  if (n.includes('dress') || n.includes('attire')) return 'tshirt-crew-outline';
  return 'dots-horizontal-circle-outline';
};

const getColorForCategory = (index: number) => {
  const colors = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#F97316'];
  return colors[index % colors.length];
};

const BudgetItem = ({ item, index, isGlobalEditMode, onAmountChange, onNameChange }: { item: WeddingBudgetPlanCategory, index: number, isGlobalEditMode: boolean, onAmountChange: (id: string, amount: string) => void, onNameChange: (id: string, name: string) => void }) => {
  const color = getColorForCategory(index);
  const icon = getIconForCategory(item.category_name);

  return (
    <View style={styles.budgetRow}>
      <View style={[styles.itemIconBg, { backgroundColor: color + '18' }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemTopRow}>
          {isGlobalEditMode && item.is_custom ? (
            <TextInput
              style={[styles.itemTitleInput, { color: '#1A1A1A' }]}
              value={item.category_name}
              onChangeText={(text) => onNameChange(item.id, text)}
            />
          ) : (
            <Text style={styles.itemTitle}>{item.category_name}</Text>
          )}

          {isGlobalEditMode ? (
            <TextInput
              style={[styles.itemAmountInput, { color }]}
              value={item.amount.toString()}
              onChangeText={(text) => onAmountChange(item.id, text)}
              keyboardType="numeric"
            />
          ) : (
            <Text style={styles.itemAmount}>₹{parseFloat(item.amount.toString() || '0').toLocaleString('en-IN')}</Text>
          )}
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${item.percentage || 0}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.itemPct}>{Math.round(item.percentage || 0)}% of total</Text>
      </View>
    </View>
  );
};

export default function AIBudgetPlannerScreen() {
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();
  const [budget, setBudget] = useState('500000');
  const [categories, setCategories] = useState<WeddingBudgetPlanCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isGlobalEditMode, setIsGlobalEditMode] = useState(false);
  
  // Custom Expense Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState('');

  useEffect(() => {
    checkExistingPlan();
  }, []);

  const checkExistingPlan = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const response = await listWeddingBudgetPlans(accessToken);
      if (response.success && response.plans && response.plans.length > 0) {
        const plan = response.plans[0];
        const totalBudget = plan.total_budget || 0;
        setBudget(totalBudget.toString());
        
        // If the plan has categories, use them
        let planCategories = plan.categories || [];
        if (planCategories.length === 0) {
          const catResponse = await getWeddingBudgetPlanCategories({ plan_id: plan.id }, accessToken);
          if (catResponse.success) {
            planCategories = catResponse.categories;
          }
        }

        // Ensure all categories have a percentage for dynamic allocation
        const processedCategories = planCategories.map(cat => ({
          ...cat,
          percentage: cat.percentage || (totalBudget > 0 ? (cat.amount / totalBudget) * 100 : 0)
        }));
        
        setCategories(processedCategories);
      } else {
        // No existing plan, fetch default categories
        await fetchDefaultCategories();
      }
    } catch (err) {
      console.error('Failed to check existing plans:', err);
      await fetchDefaultCategories();
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaultCategories = async () => {
    // If we have default categories provided by API, use them, otherwise use our hardcoded list
    const totalBudget = parseFloat(budget.replace(/[^0-9]/g, '')) || 0;
    
    const initialized = DEFAULT_CATEGORIES.map((cat, idx) => ({
      id: `def-${idx}`,
      plan_id: '',
      category_name: cat.name,
      amount: Math.round((cat.percentage / 100) * totalBudget),
      is_custom: false,
      display_order: idx + 1,
      percentage: cat.percentage
    }));
    setCategories(initialized);
  };

  const handleBudgetChange = (val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    setBudget(cleanVal); // Store raw digits
    
    const totalBudget = parseFloat(cleanVal) || 0;
    
    // Recalculate all non-custom amounts based on percentages
    setCategories(prev => prev.map(cat => {
      if (cat.is_custom) return cat; 
      const pct = cat.percentage || 0;
      return {
        ...cat,
        amount: Math.round((pct / 100) * totalBudget)
      };
    }));
  };

  const getFormattedBudget = (val: string) => {
    if (!val) return '';
    const num = parseFloat(val) || 0;
    return num.toLocaleString('en-IN');
  };

  const handleAmountChange = (id: string, amountStr: string) => {
    const amount = parseFloat(amountStr.replace(/[^0-9]/g, '')) || 0;
    const totalBudget = parseFloat(budget) || 0;
    
    setCategories(prev => prev.map(cat => {
      if (cat.id === id) {
        return {
          ...cat,
          amount,
          percentage: totalBudget > 0 ? (amount / totalBudget) * 100 : 0
        };
      }
      return cat;
    }));
  };

  const handleNameChange = (id: string, name: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === id) {
        return {
          ...cat,
          category_name: name
        };
      }
      return cat;
    }));
  };

  const addCustomExpense = () => {
    if (!customName || !customAmount) {
      Alert.alert('Error', 'Please enter both name and amount');
      return;
    }
    
    const amount = parseFloat(customAmount.replace(/[^0-9]/g, '')) || 0;
    const totalBudget = parseFloat(budget.replace(/,/g, '')) || 0;
    
    const newCategory: WeddingBudgetPlanCategory = {
      id: Math.random().toString(36).substr(2, 9), // Temporary ID
      plan_id: '',
      category_name: customName,
      amount: amount,
      is_custom: true,
      display_order: categories.length + 1,
      percentage: totalBudget > 0 ? (amount / totalBudget) * 100 : 0
    };
    
    setCategories([...categories, newCategory]);
    setIsModalVisible(false);
    setCustomName('');
    setCustomAmount('');
  };

  const handleSavePlan = async () => {
    if (!accessToken) return;
    try {
      setSaving(true);
      const totalBudget = parseFloat(budget.replace(/,/g, '')) || 0;
      
      const categoryInputs: WeddingBudgetPlanCategoryInput[] = categories.map(c => ({
        category_name: c.category_name,
        amount: c.amount,
        is_custom: c.is_custom,
        display_order: c.display_order,
        percentage: c.percentage
      }));

      const response = await createWeddingBudgetPlan({
        name: `Wedding Plan - ${new Date().toLocaleDateString()}`,
        total_budget: totalBudget,
        categories: categoryInputs
      }, accessToken);

      if (response.success) {
        Alert.alert('Success', 'Budget plan saved successfully!');
        await checkExistingPlan(); // Refresh data from backend after save
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const totals = useMemo(() => {
    const totalBudget = parseFloat(budget) || 0;
    const allocated = categories.reduce((sum, cat) => sum + (parseFloat(cat.amount?.toString() || '0')), 0);
    const balance = totalBudget - allocated;
    const allocatedPct = totalBudget > 0 ? (allocated / totalBudget) * 100 : 0;
    
    return {
      total: totalBudget,
      allocated,
      balance,
      allocatedPct,
      isOverBudget: balance < 0
    };
  }, [budget, categories]);

  const formatCurrency = (num: number) => {
    return '₹' + num.toLocaleString('en-IN');
  };

  const handleExportPDF = async () => {
    console.log('PDF Export started...');
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Load local logo and convert to base64
      let logoBase64 = '';
      try {
        const asset = Asset.fromModule(require('../assets/images/bmv_internal_logo.png'));
        await asset.downloadAsync();
        logoBase64 = await FileSystem.readAsStringAsync(asset.localUri || '', {
          encoding: 'base64',
        });
      } catch (err) {
        console.warn('Could not load local logo:', err);
      }

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; color: #1a1a1a; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
              .header-info h1 { font-size: 28px; margin: 0; color: #003366; }
              .header-info p { font-size: 12px; color: #666; margin-top: 5px; }
              .logo { width: 100px; height: auto; }
              
              .summary-card { background: #f8f9fb; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
              .summary-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; }
              .summary-grid { display: flex; justify-content: space-between; }
              .summary-label { font-size: 10px; color: #666; margin-bottom: 5px; text-transform: uppercase; }
              .summary-value { font-size: 16px; font-weight: bold; }
              
              .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-left: 4px solid #003366; padding-left: 10px; }
              
              .breakdown-item { background: #fff; border: 1px solid #f0f0f0; border-radius: 10px; padding: 12px; margin-bottom: 12px; display: flex; align-items: center; }
              .item-color-bar { width: 5px; height: 50px; border-radius: 2px; margin-right: 12px; }
              .item-content { flex: 1; }
              .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
              .item-name { font-size: 14px; font-weight: bold; }
              .item-pct { font-size: 10px; color: #999; }
              .item-amount { font-size: 14px; font-weight: bold; }
              
              .progress-track { height: 6px; background: #f0f2f5; border-radius: 3px; overflow: hidden; }
              .progress-fill { height: 100%; border-radius: 3px; }
              
              .custom-title { font-size: 16px; font-weight: bold; color: #EC4899; margin-top: 30px; margin-bottom: 15px; }
              
              .footer { text-align: center; font-size: 10px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-info">
                <h1>Budget Plan</h1>
                <p>Generated: ${new Date().toLocaleDateString('en-GB')}</p>
              </div>
              ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" class="logo" />` : ''}
            </div>

            <div class="summary-card">
              <div class="summary-title">Budget Summary</div>
              <div class="summary-grid">
                <div>
                  <div class="summary-label">Total</div>
                  <div class="summary-value">Rs. ${totals.total.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div class="summary-label">Allocated</div>
                  <div class="summary-value">Rs. ${totals.allocated.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div class="summary-label">Balance</div>
                  <div class="summary-value" style="color: ${totals.isOverBudget ? '#EF4444' : '#10B981'}">Rs. ${totals.balance.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            <div class="section-title">Breakdown</div>
            ${categories.filter(c => !c.is_custom).map((c, i) => `
              <div class="breakdown-item">
                <div class="item-color-bar" style="background-color: ${getColorForCategory(i)};"></div>
                <div class="item-content">
                  <div class="item-header">
                    <span class="item-name">${c.category_name} <span class="item-pct">(${Math.round(c.percentage || 0)}%)</span></span>
                    <span class="item-amount">Rs. ${c.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" style="width: ${c.percentage}%; background-color: ${getColorForCategory(i)};"></div>
                  </div>
                </div>
              </div>
            `).join('')}

            ${categories.some(c => c.is_custom) ? `
              <div class="custom-title">Custom Expenses</div>
              ${categories.filter(c => c.is_custom).map((c, i) => `
                <div class="breakdown-item">
                  <div class="item-color-bar" style="background-color: #64748b;"></div>
                  <div class="item-content">
                    <div class="item-header">
                      <span class="item-name">${c.category_name} <span class="item-pct">(${Math.round(c.percentage || 0)}%)</span></span>
                      <span class="item-amount">Rs. ${c.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div class="progress-track">
                      <div class="progress-fill" style="width: ${c.percentage}%; background-color: #64748b;"></div>
                    </div>
                  </div>
                </div>
              `).join('')}
            ` : ''}

            <div class="footer">
              <p>BookMyVendors - Your Personalized Budget Plan</p>
            </div>
          </body>
        </html>
      `;

      console.log('Generating PDF file...');
      const { uri } = await Print.printToFileAsync({ html });
      console.log('PDF generated at:', uri);
      
      await Sharing.shareAsync(uri, { 
        UTI: '.pdf', 
        mimeType: 'application/pdf',
        dialogTitle: 'Download Budget Plan'
      });
    } catch (err: any) {
      console.error('PDF Export failed:', err);
      Alert.alert('PDF Export Error', err.message || 'Failed to generate PDF');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#003366" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>AI Budget Planner</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >

        {/* Budget Input */}
        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>TOTAL BUDGET</Text>
          <View style={styles.budgetInputContainer}>
            <View style={styles.currencyCircle}>
              <Text style={styles.currencyText}>₹</Text>
            </View>
            <TextInput
              style={styles.budgetInput}
              value={getFormattedBudget(budget)}
              onChangeText={handleBudgetChange}
              keyboardType="numeric"
              placeholderTextColor="#BBB"
            />
          </View>
        </View>

        {/* Summary Stats */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL BUDGET</Text>
            <Text style={styles.statValue}>{formatCurrency(totals.total)}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '100%', backgroundColor: '#003366' }]} />
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ALLOCATED</Text>
            <Text style={[styles.statValue, { color: '#4F46E5' }]}>{formatCurrency(totals.allocated)}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(totals.allocatedPct, 100)}%`, backgroundColor: '#4F46E5' }]} />
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{totals.isOverBudget ? 'OVER BUDGET' : 'BALANCE'}</Text>
            <Text style={[styles.statValue, { color: totals.isOverBudget ? '#EF4444' : '#10B981' }]}>
              {formatCurrency(Math.abs(totals.balance))}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(0, 100 - totals.allocatedPct)}%`, backgroundColor: totals.isOverBudget ? '#EF4444' : '#10B981' }]} />
            </View>
          </View>
        </ScrollView>

        {/* Breakdown Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="sparkles" size={16} color="#003366" />
            <Text style={styles.sectionTitle}>AI Suggested Breakdown</Text>
          </View>
          <TouchableOpacity onPress={() => setIsGlobalEditMode(!isGlobalEditMode)}>
            <Text style={styles.editLink}>{isGlobalEditMode ? 'Done' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        {/* Budget Items */}
        <View style={styles.listBlock}>
          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color="#003366" />
            </View>
          ) : categories.length > 0 ? (
            categories.map((item, idx) => (
              <View key={item.id}>
                <BudgetItem 
                  item={item} 
                  index={idx} 
                  isGlobalEditMode={isGlobalEditMode}
                  onAmountChange={handleAmountChange} 
                  onNameChange={handleNameChange}
                />
                {idx < categories.length - 1 && <View style={styles.separator} />}
              </View>
            ))
          ) : (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: '#999' }}>No categories found</Text>
            </View>
          )}
        </View>

        {/* Add Expense */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setIsModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#003366" />
          <Text style={styles.addBtnText}>Add Custom Expense</Text>
        </TouchableOpacity>

        {/* Smart Tips */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Smart Save Tips</Text>
          </View>
        </View>

        <View style={styles.listBlock}>
          {TIPS.map((tip, idx) => (
            <View key={idx}>
              <View style={styles.tipRow}>
                <View style={styles.tipIconBg}>
                  <MaterialCommunityIcons name={tip.icon} size={18} color="#003366" />
                </View>
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
              {idx < TIPS.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Footer — pad bottom for Android nav bar / gesture inset */}
      <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
        <TouchableOpacity 
          style={[styles.primaryBtn, saving && { opacity: 0.7 }]} 
          onPress={handleSavePlan}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Save Plan</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleExportPDF}>
          <Ionicons name="download-outline" size={18} color="#003366" style={{ marginRight: 8 }} />
          <Text style={styles.secondaryBtnText}>Export PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Expense Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Expense</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>EXPENSE NAME</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Jewelry, Gifts, etc."
                  value={customName}
                  onChangeText={setCustomName}
                />
              </View>
              
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>AMOUNT (₹)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0.00"
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  keyboardType="numeric"
                />
              </View>
              
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={addCustomExpense}>
                <Text style={styles.modalSubmitText}>Add to Budget</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFC' },

  // Header
  header: { backgroundColor: '#F9FAFC' },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  backButton: { padding: 4 },
  headerTitles: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },


  scrollContent: { paddingTop: 0 },

  // Budget Input
  inputBlock: { marginHorizontal: 16, marginBottom: 24, marginTop: 0 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#999', letterSpacing: 0.6, marginBottom: 8, marginLeft: 4 },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    height: 60,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  currencyCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currencyText: { fontSize: 18, fontWeight: '700', color: '#003366' },
  budgetInput: { flex: 1, fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  itemAmountInput: { fontSize: 14, fontWeight: '700', borderBottomWidth: 1, borderBottomColor: '#003366', padding: 0, minWidth: 80, textAlign: 'right' },
  itemTitleInput: { fontSize: 14, fontWeight: '700', borderBottomWidth: 1, borderBottomColor: '#003366', padding: 0, flex: 1 },

  // Stats
  statsRow: { paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  statCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, width: 150,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statLabel: { fontSize: 9, fontWeight: '700', color: '#999', marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  progressTrack: { height: 3, backgroundColor: '#F0F2F5', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  editLink: { fontSize: 13, fontWeight: '700', color: '#003366' },

  // List Block (card wrapper)
  listBlock: {
    marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  separator: { height: 1, backgroundColor: '#F4F4F6', marginLeft: 60 },

  // Budget Row
  budgetRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  itemIconBg: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  itemBody: { flex: 1 },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  itemAmount: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  barTrack: { height: 4, backgroundColor: '#F0F2F5', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: '100%', borderRadius: 2 },
  itemPct: { fontSize: 10, color: '#999', fontWeight: '600' },

  // Add Button
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#003366', borderStyle: 'dashed',
    paddingVertical: 13, borderRadius: 12, gap: 8, marginHorizontal: 16, marginBottom: 24,
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#003366' },

  // Tips
  tipRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  tipIconBg: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  tipText: { flex: 1, fontSize: 13, color: '#444', lineHeight: 19, fontWeight: '500' },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#F0F0F0', flexDirection: 'row', gap: 12,
  },
  primaryBtn: {
    flex: 1, backgroundColor: '#003366', paddingVertical: 14, borderRadius: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#003366', paddingVertical: 14, borderRadius: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  secondaryBtnText: { color: '#003366', fontSize: 15, fontWeight: '700' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalBody: {
    padding: 20,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E6E8EC',
  },
  modalSubmitBtn: {
    backgroundColor: '#003366',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
